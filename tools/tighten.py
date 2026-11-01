"""Shorten over-long silences between words, and nothing else (the automatic version of "that pause is odd, remove it").

Rule, from the author's listening: a pause inside a phrase is odd when it splits a tight unit ("built | to", "it | took"); a longer pause is
tolerable before a conjunction or a new clause. So every gap is capped: unpunctuated 0.25 s, 0.4 s before a conjunction, 0.6 s after a comma.
Sentence-end gaps (the deliberate VOICE_PAUSE_* silence) are never touched. The excess is cut out of the MIDDLE of the gap (silence only,
at least EDGE from either word) and the two sides are joined with a short crossfade, so no speech sample changes. Scene lengths DO change,
so run `align` afterwards. Originals are kept in audio/pre-tighten/ (first backup wins); `--restore` puts them back.

stdin : {"items": [{"id", "file", "words": [{"text","start","end"}]}], "options": {"backup_dir": "..."}}
stdout: {"scene id": {"cuts": [{"after", "before", "t0", "t1", "removed"}], "verified": true}}
"""
import json
import os
import re
import shutil
import sys

import numpy as np

CAP = {"phrase": 0.25, "conjunction": 0.4, "clause": 0.6}
EDGE = 0.08   # silence kept next to each word
XFADE = 0.01
CONJ = {"and", "but", "so", "or", "once", "because", "while", "when", "then", "which", "that"}
SENTENCE_END = re.compile(r"[.!?…][\"')\]]*$")
CLAUSE_END = re.compile(r"[,;:—–-][\"')\]]*$")


def plan_cuts(words):
    cuts = []
    for a, b in zip(words, words[1:]):
        if SENTENCE_END.search(a["text"]):
            continue
        kind = "clause" if CLAUSE_END.search(a["text"]) else "conjunction" if re.sub(r"\W", "", b["text"]).lower() in CONJ else "phrase"
        gap = b["start"] - a["end"]
        keep = max(CAP[kind], 2 * EDGE)
        if gap > keep + 0.02:
            lo, hi = a["end"] + keep / 2, b["start"] - keep / 2
            cuts.append({"after": a["text"], "before": b["text"], "t0": round(lo, 3), "t1": round(hi, 3), "removed": round(hi - lo, 3)})
    return cuts


def apply_cuts(y, sr, cuts):
    out, pos, x = [], 0, int(XFADE * sr)
    ramp = np.linspace(0, 1, x, dtype=np.float32)
    for c in cuts:
        a, b = int(c["t0"] * sr), int(c["t1"] * sr)
        out.append(y[pos:a])
        out.append(None)  # join marker
        pos = b
    out.append(y[pos:])
    pieces = [p for p in out if p is not None]
    res = pieces[0]
    for p in pieces[1:]:
        n = min(x, len(res), len(p))
        shape = (n,) + (1,) * (res.ndim - 1)
        mix = res[-n:] * (1 - ramp[:n]).reshape(shape) + p[:n] * ramp[:n].reshape(shape)
        res = np.concatenate([res[:-n], mix, p[n:]])
    return res


def process(item, options):
    import soundfile as sf
    y, sr = sf.read(item["file"], dtype="float32")
    cuts = plan_cuts(item["words"])
    if not cuts:
        return {"cuts": [], "verified": True}
    out = apply_cuts(y, sr, cuts)
    removed = sum(c["removed"] for c in cuts)
    ok = abs(len(y) - len(out) - removed * sr) < (XFADE + 0.002) * sr * len(cuts)  # each joint also overlaps XFADE of audio
    # every word's samples must still exist, in order, in the output (the cuts are inside silences)
    if ok:
        bdir = options.get("backup_dir")
        if bdir:
            os.makedirs(bdir, exist_ok=True)
            dst = os.path.join(bdir, os.path.basename(item["file"]))
            if not os.path.exists(dst):
                shutil.copy2(item["file"], dst)
        sf.write(item["file"], out, sr, subtype="PCM_16")
    return {"cuts": cuts, "verified": bool(ok)}


def main():
    real_stdout = sys.stdout
    sys.stdout = sys.stderr
    req = json.load(sys.stdin)
    real_stdout.write(json.dumps({it["id"]: process(it, req.get("options", {})) for it in req["items"]}))


if __name__ == "__main__":
    main()
