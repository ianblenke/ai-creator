"""Forced alignment: known text + audio -> per-word times. stdin/stdout JSON.

stdin:  [{"id": "01-x", "file": "path.wav", "text": "spoken text"}]
stdout: {"01-x": [{"word": "hello", "start": 0.1, "end": 0.4}, ...]}
Words whisperx cannot time (None) are interpolated between their neighbours.
"""
import json
import sys

real_stdout = sys.stdout
sys.stdout = sys.stderr  # library chatter must not corrupt the JSON result

import whisperx

items = json.load(sys.stdin)
device = "cpu"
model, meta = whisperx.load_align_model(language_code="en", device=device)
out = {}
for it in items:
    audio = whisperx.load_audio(it["file"])
    dur = len(audio) / 16000.0
    res = whisperx.align([{"text": it["text"], "start": 0.0, "end": dur}], model, meta, audio, device,
                         return_char_alignments=False)
    words = res["word_segments"]
    ws = [{"word": w["word"], "start": w.get("start"), "end": w.get("end")} for w in words]
    # interpolate untimed words
    for i, w in enumerate(ws):
        if w["start"] is None:
            j = i
            while j < len(ws) and ws[j]["start"] is None:
                j += 1
            lo = ws[i - 1]["end"] if i > 0 else 0.0
            hi = ws[j]["start"] if j < len(ws) else dur
            n = j - i
            for k in range(n):
                ws[i + k]["start"] = lo + (hi - lo) * k / n
                ws[i + k]["end"] = lo + (hi - lo) * (k + 1) / n
    out[it["id"]] = ws
json.dump(out, real_stdout)
