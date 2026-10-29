"""Find defects the transcript check cannot see, from a scene's audio and its word times.

  dropout         a word spoken far quieter than the rest (the voice model mumbled or skipped it): "that." at -61 dB in a -20 dB voice
  extra-syllable  speech-level sound sitting in the gap between two words (an inserted "sa" after "so")

Both are measured against the scene's own speech level, so no absolute thresholds depend on the recording.
stdin : {"items": [{"id", "file", "words": [{"text","start","end"}]}]}        (times in seconds, relative to the file)
stdout: {"scene id": [{"kind", "t0", "t1", "detail"}]}
"""
import json
import sys

import numpy as np
import soundfile as sf

FRAME = 0.01
WORD_MARGIN = 0.04    # alignment error: a word's sound starts a little before and ends a little after its times
DROPOUT_DB = 25.0     # a word this far under the scene's speech median is a dropout
EXTRA_OVER_DB = 10.0  # gap sound within this of the speech median counts as speech-level
EXTRA_MIN = 0.08      # and must last this long (shorter is a click or a word-edge error)


def frame_db(y, sr):
    h = int(sr * FRAME)
    n = len(y) // h
    f = y[: n * h].reshape(n, h)
    return 20 * np.log10(np.sqrt((f ** 2).mean(axis=1)) + 1e-9)


def _runs(mask):
    i = 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j < len(mask) and mask[j]:
                j += 1
            yield i, j
            i = j
        else:
            i += 1


def find(y, sr, words):
    db = frame_db(y, sr)
    n = len(db)
    if not words or n < 10:
        return []
    inside = np.zeros(n, bool)
    for w in words:
        inside[max(0, int((w["start"] - WORD_MARGIN) / FRAME)): int((w["end"] + WORD_MARGIN) / FRAME) + 1] = True
    level = [float(db[int(w["start"] / FRAME): max(int(w["start"] / FRAME) + 1, int(w["end"] / FRAME))].mean()) for w in words]
    med = float(np.median(level))
    out = []
    for w, lv in zip(words, level):
        if lv < med - DROPOUT_DB:
            out.append({"kind": "dropout", "t0": w["start"], "t1": w["end"], "detail": f'"{w["text"]}" is {med - lv:.0f} dB under the speech level'})
    # only the gap BETWEEN two words: lead-in and tail are gated by desniff
    first, last = words[0]["start"], words[-1]["end"]
    for a, b in _runs(~inside & (db > med - EXTRA_OVER_DB)):
        t0, t1 = a * FRAME, b * FRAME
        if t0 > first and t1 < last and t1 - t0 >= EXTRA_MIN:
            before = max((w for w in words if w["end"] <= t0 + WORD_MARGIN), key=lambda w: w["end"], default=None)
            after = min((w for w in words if w["start"] >= t1 - WORD_MARGIN), key=lambda w: w["start"], default=None)
            out.append({"kind": "extra-syllable", "t0": round(t0, 2), "t1": round(t1, 2),
                        "detail": f'{1000 * (t1 - t0):.0f} ms of speech-level sound between "{before["text"] if before else ""}" and "{after["text"] if after else ""}"'})
    return out


def main():
    req = json.load(sys.stdin)
    res = {}
    for it in req["items"]:
        y, sr = sf.read(it["file"], dtype="float32")
        res[it["id"]] = find(y if y.ndim == 1 else y.mean(axis=1), sr, it["words"])
    json.dump(res, sys.stdout)


if __name__ == "__main__":
    main()
