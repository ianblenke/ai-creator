"""Rebuild the before/after listening reel for ALL desniff changes by comparing audio/pre-desniff/ (the originals) with the current scene audio.
Usage (in .venv-align): python tools/desniff_reel.py <episode-dir>  ->  audio/review/desniff-reel.wav and .txt"""
import json
import os
import sys

import numpy as np
import soundfile as sf

ep = sys.argv[1]
audio, back = os.path.join(ep, "audio"), os.path.join(ep, "audio", "pre-desniff")
tl = json.load(open(os.path.join(ep, "timeline.json")))
start = {s["id"]: s["start"] for s in tl["scenes"]}
mm = lambda t: f"{int(t // 60)}:{int(t % 60):02d}"
parts, lines, sr_out = [], [], None
n = 0
for f in sorted(os.listdir(back)):
    if not f.endswith(".wav"):
        continue
    a, sr = sf.read(os.path.join(back, f), dtype="float32")
    b, _ = sf.read(os.path.join(audio, f), dtype="float32")
    d = np.abs(a - b) > 0 if a.ndim == 1 else (np.abs(a - b) > 0).any(axis=1)
    idx = np.flatnonzero(d)
    if not len(idx):
        continue
    runs, s0, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > 0.05 * sr:
            runs.append((s0, prev)); s0 = i
        prev = i
    runs.append((s0, prev))
    sid = f[:-4]
    for r0, r1 in runs:
        lo, hi = max(0, int(r0 - 0.9 * sr)), min(len(a), int(r1 + 0.9 * sr))
        x = a[lo:hi] if a.ndim == 1 else a[lo:hi, 0]
        y = b[lo:hi] if b.ndim == 1 else b[lo:hi, 0]
        sr_out = sr_out or sr
        t = np.arange(int(0.15 * sr)) / sr
        beep = (0.2 * np.sin(2 * np.pi * 880 * t) * np.minimum(1, np.minimum(t, 0.15 - t) / 0.01)).astype(np.float32)
        sil = np.zeros(int(0.35 * sr), np.float32)
        parts += [beep, sil, x, sil, y, np.zeros(int(0.6 * sr), np.float32)]
        n += 1
        lines.append(f"{n}. {mm(start[sid] + r0 / sr)} in the video ({sid}, {r0 / sr:.2f} to {r1 / sr:.2f} s): BEFORE then AFTER")
os.makedirs(os.path.join(audio, "review"), exist_ok=True)
sf.write(os.path.join(audio, "review", "desniff-reel.wav"), np.concatenate(parts), sr_out)
open(os.path.join(audio, "review", "desniff-reel.txt"), "w").write("\n".join(lines) + "\n")
print(n, "changed stretches")
