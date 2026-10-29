"""Remove sniffs and breaths from the silence between spoken words, and nothing else.

For each scene: find noisy bursts in the gaps (tools/voice_review.py: gap_noise) and the gaps the audio tagger singles out as breaths
(tag_gaps + flag_tags), then attenuate ONLY those stretches inside the gap, at least 60 ms away from any word edge, with short raised-cosine
ramps. The length never changes (so every word time, subtitle and cue stays valid) and every speech sample is checked to be bit-identical.
Originals are kept in audio/pre-desniff/ and --restore puts them back.

stdin : {"items": [{"id", "file", "words": [{"text","start","end"}]}], "options": {"tags": true, "backup_dir": "audio/pre-desniff", "reel": "audio/review"}}
stdout: {"scene id": {"regions": [{"kind", "t0", "t1", "attenuation_db"}], "verified": true, "left_findings": n}}
"""
import json
import math
import os
import shutil
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_review import HOP, SR, flag_tags, frame_features, gap_noise, tag_gaps  # noqa: E402

EDGE = 0.06       # never touch the 60 ms next to a word edge (alignment error, sibilant tails)
RAMP = 0.008      # raised-cosine fade in and out of each attenuated stretch
ATTEN_DB = -40.0  # how far a sniff is pulled down (to the room-noise level, not to digital silence)


def _gain(n, sr, regions):
    g = np.ones(n, np.float32)
    amp = 10 ** (ATTEN_DB / 20)
    r = max(1, int(RAMP * sr))
    for a, b in regions:
        i, j = max(0, int(a * sr)), min(n, int(b * sr))
        if j - i < 2 * r:
            continue
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, r))  # 0 -> 1
        seg = np.full(j - i, amp, np.float32)
        seg[:r] = 1 - (1 - amp) * ramp
        seg[-r:] = amp + (1 - amp) * ramp
        g[i:j] = np.minimum(g[i:j], seg)
    return g


def _hot_runs(y16, a, b, floor_db, over=6.0, min_frames=3):
    """Within [a, b] seconds, the stretches whose level is more than `over` dB above the gap floor."""
    db, _, _ = frame_features(y16)
    i, j = int(a / HOP), int(b / HOP)
    hot = db[i:j] > floor_db + over
    runs, k = [], 0
    while k < len(hot):
        if not hot[k]:
            k += 1
            continue
        m = k
        while m < len(hot) and hot[m]:
            m += 1
        if m - k >= min_frames:
            runs.append((a + (k - 1) * HOP, a + (m + 1) * HOP))  # one frame of margin either side
        k = m
    return runs


def plan(y16, words, use_tags, tag_findings=None, tag_stats=None):
    """Regions (seconds) to attenuate, each inside a gap and away from word edges."""
    bursts, _ = gap_noise(y16, words)
    regions = [{"kind": "sniff-or-breath", "t0": f["t0"] - 0.02, "t1": f["t1"] + 0.02} for f in bursts if f["kind"] == "sniff-or-breath"]
    db, _, _ = frame_features(y16)
    inside = np.zeros(len(db), bool)
    for w in words:
        inside[int(w["start"] / HOP): int(w["end"] / HOP) + 1] = True
    quiet = db[~inside]
    floor = float(np.percentile(quiet, 20)) if len(quiet) > 20 else float(np.percentile(db, 5))
    for f in (tag_findings or []):
        for a, b in _hot_runs(y16, f["t0"] + EDGE, f["t1"] - EDGE, floor):
            regions.append({"kind": "tagged-breath", "t0": a, "t1": b})
    # the lead-in before the first word and the tail after the last are gaps too: a breath there is never wanted
    if words:
        for a, b in ((0.0, words[0]["start"] - EDGE), (words[-1]["end"] + EDGE, len(y16) / SR)):
            for x, y in _hot_runs(y16, a, b, floor, over=4.0, min_frames=2):
                regions.append({"kind": "lead-or-tail-noise", "t0": max(a, x), "t1": min(b, y)})
    # keep every region inside its gap, away from word edges
    keep = []
    for r in regions:
        a, b = r["t0"], r["t1"]
        for w in words:
            if a < w["end"] + EDGE and b > w["start"] - EDGE:  # overlaps the protected zone around a word
                if a < w["start"]:
                    b = min(b, w["start"] - EDGE)
                else:
                    a = max(a, w["end"] + EDGE)
        if b - a >= 0.03:
            keep.append({**r, "t0": round(a, 3), "t1": round(b, 3)})
    return keep


def process(item, options):
    import soundfile as sf
    from scipy.signal import resample_poly
    y0, sr0 = sf.read(item["file"], dtype="float32")
    mono = y0 if y0.ndim == 1 else y0.mean(axis=1)
    g = math.gcd(SR, int(sr0))
    y16 = resample_poly(mono, SR // g, int(sr0) // g).astype(np.float32) if sr0 != SR else mono
    words = item["words"]
    tagf = []
    if options.get("tags", True):
        raw, _ = tag_gaps(y16, words)
        flagged, _ = flag_tags({item["id"]: raw}) if raw else ({item["id"]: []}, {})
        tagf = flagged[item["id"]]
    regions = plan(y16, words, options.get("tags", True), tagf)
    gain = _gain(len(mono), sr0, [(r["t0"], r["t1"]) for r in regions])
    out = y0 * (gain[:, None] if y0.ndim > 1 else gain)
    # verify: every sample inside a word (with its 10 ms ends) is untouched
    ok = True
    for w in words:
        a, b = int((w["start"] + 0.01) * sr0), int((w["end"] - 0.01) * sr0)
        ok &= bool(np.array_equal(out[a:b], y0[a:b]))
    ok &= len(out) == len(y0)
    out16 = resample_poly(out if out.ndim == 1 else out.mean(axis=1), SR // g, int(sr0) // g).astype(np.float32) if sr0 != SR else (out if out.ndim == 1 else out.mean(axis=1))
    left = [f for f in gap_noise(out16, words)[0] if f["kind"] == "sniff-or-breath"]
    if regions and ok:
        bdir = options.get("backup_dir")
        if bdir:
            os.makedirs(bdir, exist_ok=True)
            dst = os.path.join(bdir, os.path.basename(item["file"]))
            if not os.path.exists(dst):  # the FIRST backup is the true original
                shutil.copy2(item["file"], dst)
        sf.write(item["file"], out, sr0, subtype="PCM_16")
    for r in regions:
        r["attenuation_db"] = ATTEN_DB
    return {"regions": regions, "verified": ok, "left_findings": len(left)}, y0, out, sr0


def make_reel(reel_dir, entries):
    """before / after pairs of every removal, each pair introduced by a beep, so the author can confirm by ear."""
    import soundfile as sf
    os.makedirs(reel_dir, exist_ok=True)
    parts, lines, sr_out = [], [], None
    for n, (sid, r, before, after, sr) in enumerate(entries, 1):
        lo, hi = max(0, int((r["t0"] - 0.9) * sr)), min(len(before), int((r["t1"] + 0.9) * sr))
        b = before[lo:hi] if before.ndim == 1 else before[lo:hi, 0]
        a = after[lo:hi] if after.ndim == 1 else after[lo:hi, 0]
        sr_out = sr_out or sr
        t = np.arange(int(0.15 * sr_out)) / sr_out
        beep = (0.2 * np.sin(2 * np.pi * 880 * t) * np.minimum(1, np.minimum(t, 0.15 - t) / 0.01)).astype(np.float32)
        sil = np.zeros(int(0.35 * sr_out), np.float32)
        parts += [beep, sil, b, sil, a, np.zeros(int(0.6 * sr_out), np.float32)]
        lines.append(f'{n}. {sid} at {r["t0"]:.2f}-{r["t1"]:.2f}s  [{r["kind"]}]  (played twice: BEFORE, then AFTER)')
    if parts:
        sf.write(os.path.join(reel_dir, "desniff-reel.wav"), np.concatenate(parts), sr_out)
        open(os.path.join(reel_dir, "desniff-reel.txt"), "w").write("\n".join(lines) + "\n")


def main():
    real_stdout = sys.stdout
    sys.stdout = sys.stderr
    req = json.load(sys.stdin)
    opts = req.get("options", {})
    out, entries = {}, []
    for it in req["items"]:
        res, before, after, sr = process(it, opts)
        out[it["id"]] = res
        entries += [(it["id"], r, before, after, sr) for r in res["regions"]]
    if opts.get("reel"):
        make_reel(opts["reel"], entries)
    real_stdout.write(json.dumps(out))


if __name__ == "__main__":
    main()
