"""Adversarial review of the narration audio: finds the things that make synthesized speech sound off even when the words are right.

Detectors (each yields findings with a severity 0..1):
  gap-noise     short noisy bursts in the silence between words (sniffs, breaths, clicks, mouth noise), from frame energy and spectrum
  tagged        the same gaps classified by an AudioSet model (AST): Sniff, Breathing, Gasp, Cough, Throat clearing, ... (optional, needs a download)
  loud-word / pitch-spike / drawn-out / pitch-jump   prosody outliers against the rest of the scene (loudness, pitch, duration, pitch resets)
  low-confidence   words the recognizer transcribed correctly but with low confidence (mumbles, odd pronunciations) (optional)

stdin : {"items": [{"id": "04-the-gate", "file": "audio/04-the-gate.wav", "words": [{"text": "The", "start": 0.66, "end": 0.76}, ...]}],
         "options": {"ast": true, "whisper": true, "clips": "audio/review", "min_severity": 0.2}}
stdout: {"04-the-gate": {"findings": [{"kind", "t0", "t1", "severity", "detail", "between"}], "penalty": 1.7, "stats": {...}}}
Times are scene-local seconds. The numeric core needs only numpy and scipy; models load lazily and are skipped if they cannot.
"""
import json
import math
import os
import re
import sys

import numpy as np

SR = 16000
HOP = 0.01
WIN = 0.025
WEIGHTS = {"sniff-or-breath": 1.0, "gap-sound": 0.3, "tagged": 1.0, "loud-word": 0.4, "pitch-spike": 0.4, "drawn-out": 0.5,
           "pitch-jump": 0.4, "low-confidence": 0.3}
TAG_LABELS = {"Sniff", "Breathing", "Gasp", "Pant", "Cough", "Throat clearing", "Sneeze", "Snort", "Wheeze", "Hiccup", "Burping, eructation", "Click"}


def _frames(y, win=WIN, hop=HOP, sr=SR):
    w, h = int(win * sr), int(hop * sr)
    n = 1 + max(0, (len(y) - w) // h)
    idx = np.arange(w)[None, :] + h * np.arange(n)[:, None]
    return y[idx] if len(y) >= w else np.zeros((1, w))


def frame_features(y, sr=SR):
    """Per 10 ms frame: rms in dBFS, spectral flatness (300-7000 Hz), share of energy above 2 kHz."""
    fr = _frames(y, sr=sr)
    rms = np.sqrt(np.mean(fr ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    spec = np.abs(np.fft.rfft(fr * np.hanning(fr.shape[1])[None, :], axis=1)) ** 2 + 1e-14
    freqs = np.fft.rfftfreq(fr.shape[1], 1 / sr)
    band = (freqs >= 300) & (freqs <= 7000)
    sb = spec[:, band]
    flat = np.exp(np.mean(np.log(sb), axis=1)) / np.mean(sb, axis=1)
    hf = spec[:, freqs >= 2000].sum(axis=1) / spec.sum(axis=1)
    return db, flat, hf


def _gaps(words, dur, edge=0.08, min_len=0.06):
    out = []
    prev = 0.0
    prev_w = None
    for w in words:
        out.append((prev, w["start"], prev_w, w))
        prev, prev_w = w["end"], w
    out.append((prev, dur, prev_w, None))
    return [(a + edge, b - edge, pw, nw) for a, b, pw, nw in out if b - a - 2 * edge >= min_len]


def _between(pw, nw):
    return f'"{pw["text"] if pw else "start"}" and "{nw["text"] if nw else "end"}"'


def gap_noise(y, words, sr=SR, above_floor=10.0, min_abs_db=-58.0, min_frames=5, max_rel_speech=-8.0):
    """Noisy bursts in the gaps between words. Returns (findings, stats)."""
    db, flat, hf = frame_features(y, sr)
    dur = len(y) / sr
    inside = np.zeros(len(db), bool)
    for w in words:
        inside[int(w["start"] / HOP): int(w["end"] / HOP) + 1] = True
    speech_db = float(np.median(db[inside])) if inside.any() else float(np.median(db))
    gaps = _gaps(words, dur)
    gap_idx = [(int(a / HOP), int(b / HOP), pw, nw) for a, b, pw, nw in gaps]
    pool = np.concatenate([db[a:b] for a, b, _, _ in gap_idx]) if gap_idx else db
    floor = float(np.percentile(pool, 20)) if len(pool) >= 20 else float(np.percentile(db, 5))
    thresh = max(floor + above_floor, min_abs_db)
    findings = []
    for a, b, pw, nw in gap_idx:
        hot = db[a:b] > thresh
        i = 0
        while i < len(hot):
            if not hot[i]:
                i += 1
                continue
            j = i
            while j < len(hot) and hot[j]:
                j += 1
            if j - i >= min_frames and float(db[a + i:a + j].max()) - speech_db <= max_rel_speech:
                sl = slice(a + i, a + j)
                peak = float(db[sl].max())
                fl, h = float(np.mean(flat[sl])), float(np.mean(hf[sl]))
                noisy = fl >= 0.08 and h >= 0.25
                rel = peak - speech_db
                sev = float(np.clip((rel + 40) / 20, 0.05, 1.0))
                findings.append({"kind": "sniff-or-breath" if noisy else "gap-sound", "t0": round((a + i) * HOP, 2), "t1": round((a + j) * HOP, 2),
                                 "severity": round(sev, 2), "between": _between(pw, nw),
                                 "detail": f"{(j - i) * 10} ms, peak {peak:.0f} dBFS ({rel:+.0f} dB vs speech), flatness {fl:.2f}, hf {h:.2f}"})
            i = j
    return findings, {"speech_db": round(speech_db, 1), "gap_floor_db": round(floor, 1), "gaps": len(gap_idx)}


def _syllables(t):
    return max(1, len(re.findall(r"[aeiouy]+", t.lower())))


def prosody(y, words, sr=SR, loud_db=5.5, pitch_st=8.0, slow_ratio=2.2, jump_st=10.0, phrase_gap=0.25):
    """Loudness, pitch and duration outliers per word, and pitch resets between close words. Pitch and intensity come from tools/pitch.py (numpy only)."""
    from pitch import intensity, pitch
    ft, f0 = pitch(y, sr, HOP)
    it, iv = intensity(y, sr, HOP)
    feats = []
    for w in words:
        m = (ft >= w["start"]) & (ft <= w["end"]) & (f0 > 0)
        mi = (it >= w["start"]) & (it <= w["end"])
        feats.append({"w": w, "f0": f0[m], "int": float(iv[mi].max()) if mi.any() else None,
                      "dur": w["end"] - w["start"], "syl": _syllables(w["text"])})
    voiced = [f for f in feats if len(f["f0"]) >= 3]
    if len(voiced) < 8:
        return [], {"prosody": "too little voiced speech"}
    med_f0 = float(np.median(np.concatenate([f["f0"] for f in voiced])))
    # a phrase is a run of words with no pause of 250 ms or more; pitch is judged against its own phrase, because natural pitch falls over a sentence
    phrase, k0 = [None] * len(feats), 0
    for k in range(1, len(feats) + 1):
        if k == len(feats) or feats[k]["w"]["start"] - feats[k - 1]["w"]["end"] >= phrase_gap:
            fs = [f for f in feats[k0:k] if len(f["f0"]) >= 3]
            base = float(np.median(np.concatenate([f["f0"] for f in fs]))) if len(fs) >= 3 else med_f0
            for q in range(k0, k):
                phrase[q] = base
            k0 = k
    ints = [f["int"] for f in feats if f["int"] is not None]
    med_int = float(np.median(ints))
    sylsec = [f["dur"] / f["syl"] for f in feats if f["dur"] >= 0.08]
    med_syl = float(np.median(sylsec)) if sylsec else 0.2
    findings = []
    for k, f in enumerate(feats):
        w = f["w"]
        pw, nw = (feats[k - 1]["w"] if k else None), (feats[k + 1]["w"] if k + 1 < len(feats) else None)
        where = _between(pw, nw)
        if f["int"] is not None and f["int"] - med_int > loud_db and f["dur"] >= 0.08:
            ex = f["int"] - med_int
            findings.append({"kind": "loud-word", "t0": round(w["start"], 2), "t1": round(w["end"], 2), "severity": round(float(np.clip((ex - loud_db) / 6 + 0.3, 0.2, 1)), 2),
                             "between": where, "detail": f'"{w["text"]}" is {ex:.1f} dB louder than the scene median'})
        if len(f["f0"]) >= 6:
            st = 12 * math.log2(float(np.median(f["f0"])) / phrase[k])
            octave = min(abs(st - 12), abs(st - 24)) < 1.8  # about one or two octaves up is a tracking error, not emphasis
            if st > pitch_st and not octave:
                findings.append({"kind": "pitch-spike", "t0": round(w["start"], 2), "t1": round(w["end"], 2), "severity": round(float(np.clip((st - pitch_st) / 10 + 0.3, 0.2, 0.7)), 2),
                                 "between": where, "detail": f'"{w["text"]}" is {st:.1f} semitones above its phrase (median pitch)'})
        sps = f["dur"] / f["syl"]
        if f["dur"] >= 0.45 and sps > slow_ratio * med_syl:
            findings.append({"kind": "drawn-out", "t0": round(w["start"], 2), "t1": round(w["end"], 2), "severity": round(float(np.clip(sps / (slow_ratio * med_syl) - 0.5, 0.2, 1)), 2),
                             "between": where, "detail": f'"{w["text"]}" lasts {f["dur"]:.2f} s ({sps / med_syl:.1f}x the usual time per syllable)'})
        if nw is not None and len(f["f0"]) >= 5 and len(feats[k + 1]["f0"]) >= 5 and nw["start"] - w["end"] < 0.12:
            a = float(np.median(f["f0"][-3:]))
            b = float(np.median(feats[k + 1]["f0"][:3]))
            st = abs(12 * math.log2(b / a))
            octave = min(abs(st - 12), abs(st - 24)) < 1.5  # a jump of about one or two octaves is almost always a tracking error
            if st > jump_st and not octave:
                findings.append({"kind": "pitch-jump", "t0": round(w["end"], 2), "t1": round(nw["start"], 2), "severity": round(float(np.clip((st - jump_st) / 10 + 0.3, 0.2, 0.7)), 2),
                                 "between": _between(w, nw), "detail": f"pitch jumps {st:.1f} semitones between two words with no pause"})
    return findings, {"median_f0_hz": round(med_f0, 1), "median_word_db": round(med_int, 1), "median_sec_per_syllable": round(med_syl, 3)}


def penalty(findings):
    return round(sum(WEIGHTS.get(f["kind"], 0.3) * f["severity"] for f in findings), 2)


# ---- optional model-based detectors -------------------------------------------------------------------------------------------------

_AST = None


def _ast():
    global _AST
    if _AST is None:
        import torch
        from transformers import ASTForAudioClassification, AutoFeatureExtractor
        name = "MIT/ast-finetuned-audioset-10-10-0.4593"
        _AST = (AutoFeatureExtractor.from_pretrained(name), ASTForAudioClassification.from_pretrained(name).eval(), torch)
    return _AST


def tag_gaps(y, words, sr=SR, min_gap=0.2):
    """Score a short window around every gap of 200 ms or more with an AudioSet model for breath/sniff-like classes. Returns every gap's best
    score; the caller flags the outliers (this voice breathes between most sentences, so a fixed cutoff would flag them all)."""
    try:
        fe, model, torch = _ast()
    except Exception as e:  # no network, no model: skip quietly
        return [], {"ast": f"skipped ({type(e).__name__})"}
    dur = len(y) / sr
    cand = [(a, b, pw, nw) for a, b, pw, nw in _gaps(words, dur, edge=0.0, min_len=min_gap)]
    labels = model.config.id2label
    keep = [i for i, l in labels.items() if l in TAG_LABELS]
    findings = []
    for s in range(0, len(cand), 8):
        batch = cand[s:s + 8]
        clips = []
        for a, b, _, _ in batch:
            c = (a + b) / 2
            lo, hi = max(0, int((c - 1.0) * sr)), min(len(y), int((c + 1.0) * sr))
            clips.append(y[lo:hi])
        if any(len(c) < 1600 for c in clips):  # a gap at the very end leaves an empty window
            clips = [c if len(c) >= 1600 else np.pad(c, (0, 1600 - len(c))) for c in clips]
        inputs = fe(clips, sampling_rate=sr, return_tensors="pt")
        with torch.no_grad():
            p = torch.sigmoid(model(**inputs).logits).numpy()
        for (a, b, pw, nw), row in zip(batch, p):
            best = max(keep, key=lambda i: row[i])
            findings.append({"kind": "tagged", "t0": round(a, 2), "t1": round(b, 2), "prob": float(row[best]), "label": labels[best],
                             "between": _between(pw, nw)})
    return findings, {"ast_gaps": len(cand)}


def flag_tags(items_findings, floor=0.4, sigmas=1.5):
    """Keep the tagged gaps that stand out from this episode's own baseline of breaths; set severity from how far they stand out."""
    probs = [f["prob"] for fl in items_findings.values() for f in fl if f["kind"] == "tagged"]
    if len(probs) < 5:
        return {k: [] for k in items_findings}, {}
    mu, sd = float(np.mean(probs)), float(np.std(probs)) or 1e-6
    cut = max(floor, mu + sigmas * sd)
    out = {}
    for k, fl in items_findings.items():
        out[k] = []
        for f in fl:
            if f["kind"] == "tagged" and f["prob"] >= cut:
                z = (f["prob"] - mu) / sd
                out[k].append({"kind": "tagged", "t0": f["t0"], "t1": f["t1"], "severity": round(float(np.clip(0.4 + 0.2 * (z - sigmas), 0.3, 1.0)), 2),
                               "between": f["between"], "detail": f'AudioSet "{f["label"]}" {f["prob"]:.2f} (episode average {mu:.2f}) around a {f["t1"] - f["t0"]:.2f} s gap'})
    return out, {"tag_mean": round(mu, 2), "tag_cut": round(cut, 2)}


_WH = None


def _names_prompt():
    f = os.path.join(os.getcwd(), "project", "names.txt")
    return ", ".join(l.strip() for l in open(f) if l.strip()) + "." if os.path.exists(f) else None


def low_confidence(path, words, prob=0.35):
    """Words the recognizer heard with low confidence even when the transcript matched the script."""
    global _WH
    try:
        import whisperx
        from faster_whisper import WhisperModel
        if _WH is None:
            _WH = WhisperModel("small.en", device="cpu", compute_type="int8")
        audio = whisperx.load_audio(path)
        segs, _ = _WH.transcribe(audio, language="en", word_timestamps=True, beam_size=5, vad_filter=False, condition_on_previous_text=False,
                                 initial_prompt=_names_prompt())
    except Exception as e:
        return [], {"whisper": f"skipped ({type(e).__name__})"}
    findings = []
    for sg in segs:
        for w in sg.words or []:
            t = re.sub(r"[^a-z']", "", w.word.lower())
            if len(t) >= 4 and w.probability < prob:
                findings.append({"kind": "low-confidence", "t0": round(w.start, 2), "t1": round(w.end, 2), "severity": round(float(np.clip((prob - w.probability) / prob + 0.2, 0.2, 1)), 2),
                                 "between": f'"{w.word.strip()}"', "detail": f'recognizer confidence {w.probability:.2f} for "{w.word.strip()}"'})
    return findings, {}


def analyze(item, options):
    """Per-scene detectors. Returns (findings, stats, tag_candidates, audio, sr)."""
    import soundfile as sf
    from scipy.signal import resample_poly
    y0, sr0 = sf.read(item["file"], dtype="float32")
    if y0.ndim > 1:
        y0 = y0.mean(axis=1)
    g = math.gcd(SR, int(sr0))
    y = resample_poly(y0, SR // g, int(sr0) // g).astype(np.float32) if sr0 != SR else y0
    words = item["words"]
    findings, stats, tags = [], {}, []
    for fn in (lambda: gap_noise(y, words), lambda: prosody(y, words)):
        f, st = fn()
        findings += f
        stats.update(st)
    if options.get("ast", True):
        tags, st = tag_gaps(y, words)
        stats.update(st)
    if options.get("whisper", True):
        f, st = low_confidence(item["file"], words)
        findings += f
        stats.update(st)
    return findings, stats, tags, y0, sr0


def write_clips(item, findings, y0, sr0, clips, min_sev=0.3):
    import soundfile as sf
    os.makedirs(clips, exist_ok=True)
    for f in findings:
        if f["severity"] >= min_sev:
            lo, hi = max(0, int((f["t0"] - 0.8) * sr0)), min(len(y0), int((f["t1"] + 0.8) * sr0))
            name = f'{item["id"]}_{f["t0"]:07.2f}_{f["kind"]}.wav'
            sf.write(os.path.join(clips, name), y0[lo:hi], sr0)
            f["clip"] = name


REEL_MIX = {"sniff-or-breath": 0.35, "tagged": 0.25, "pitch-spike": 0.15, "pitch-jump": 0.1, "low-confidence": 0.1, "loud-word": 0.025, "drawn-out": 0.025}


def make_reel(rows, clips, n):
    """One audio file of n candidates, a mix across the detector kinds (worst of each first) so a listener can judge every detector, each
    preceded by a short beep, plus reel.txt that names them in order."""
    import soundfile as sf
    rows = [r for r in rows if r.get("clip")]
    picked, seen = [], set()
    for kind, share in REEL_MIX.items():
        for r in [r for r in rows if r["kind"] == kind][:max(1, round(n * share))]:
            picked.append(r)
            seen.add(id(r))
    picked += [r for r in rows if id(r) not in seen][:max(0, n - len(picked))]
    rows = picked[:n]
    if not rows:
        return None
    parts, lines, sr_out = [], [], None
    for k, r in enumerate(rows, 1):
        y, sr = sf.read(os.path.join(clips, r["clip"]), dtype="float32")
        sr_out = sr_out or sr
        t = np.arange(int(0.18 * sr_out)) / sr_out
        beep = (0.2 * np.sin(2 * np.pi * 880 * t) * np.minimum(1, np.minimum(t, 0.18 - t) / 0.01)).astype(np.float32)
        parts += [beep, np.zeros(int(0.25 * sr_out), np.float32), y[:int(2.6 * sr_out)] if y.ndim == 1 else y[:int(2.6 * sr_out), 0], np.zeros(int(0.5 * sr_out), np.float32)]
        lines.append(f'{k}. {r["scene"]} at {r["t0"]}s  [{r["kind"]}, severity {r["severity"]}]  {r["between"]}: {r["detail"]}')
    sf.write(os.path.join(clips, "reel.wav"), np.concatenate(parts), sr_out)
    with open(os.path.join(clips, "reel.txt"), "w") as fh:
        fh.write("\n".join(lines) + "\n")
    return lines


def review_all(items, options):
    res = {it["id"]: analyze(it, options) for it in items}
    flagged, tstats = flag_tags({k: v[2] for k, v in res.items()}) if options.get("ast", True) else ({k: [] for k in res}, {})
    out, rows = {}, []
    for it in items:
        findings, stats, _, y0, sr0 = res[it["id"]]
        findings = sorted((f for f in findings + flagged[it["id"]] if f["severity"] >= options.get("min_severity", 0.3)), key=lambda f: f["t0"])
        if options.get("clips"):
            write_clips(it, findings, y0, sr0, options["clips"])
        out[it["id"]] = {"findings": findings, "penalty": penalty(findings), "stats": {**stats, **tstats}}
        rows += [{"scene": it["id"], **f} for f in findings]
    rows.sort(key=lambda r: -r["severity"])
    if options.get("clips") and options.get("reel"):
        make_reel(rows, options["clips"], options["reel"])
    return out


if __name__ == "__main__":
    real_stdout = sys.stdout
    sys.stdout = sys.stderr
    req = json.load(sys.stdin)
    real_stdout.write(json.dumps(review_all(req["items"], req.get("options", {}))))
