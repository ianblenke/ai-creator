"""Transcribe each scene's narration and diff it against the script, to catch TTS repeats, skips and garbling.

stdin:  [{"id": "02-cold-open", "file": "audio/raw.wav", "text": "spoken text"}]
stdout: {"02-cold-open": {"issues": [{"kind": "repeated|extra|missing", "time": 21.4, "script": "...", "heard": "..."}], "heard": "full transcript"}}
Only blocks of several words are reported, so number/acronym spelling differences ("3090" vs "thirty ninety") are ignored.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr_diff import canon, diff_issues, join_letters, norm  # noqa: E402

real_stdout = sys.stdout
sys.stdout = sys.stderr
import whisperx  # noqa: E402  (ffmpeg-based loader: faster-whisper's own decoder breaks with some PyAV versions)
from faster_whisper import WhisperModel  # noqa: E402

def _names():
    # project/names.txt: one name per line that the recognizer should spell (empty by default)
    f = os.path.join(os.getcwd(), "project", "names.txt")
    return ", ".join(l.strip() for l in open(f) if l.strip()) + "." if os.path.exists(f) else ""


NAMES_PROMPT = _names()
items = json.load(sys.stdin)
model = WhisperModel("small.en", device="cpu", compute_type="int8")


out = {}
for it in items:
    audio = whisperx.load_audio(it["file"])
    # Priming with the project's own names lets the recognizer spell them, so a real mispronunciation shows up as a difference
    # instead of every occurrence failing ("cloud code", "0 claw").
    segs, _ = model.transcribe(audio, language="en", word_timestamps=True, beam_size=5, vad_filter=False,
                               condition_on_previous_text=False, initial_prompt=NAMES_PROMPT)
    # Whisper returns words one at a time ("48", ",000"); rebuild the text first so numbers and decimals are intact, then canonicalize.
    raw = []
    for sg in segs:
        for w in sg.words or []:
            raw.append((w.word, w.start))
    text = "".join(w for w, _ in raw)
    heard = canon(join_letters(norm(text)))
    script = canon(join_letters(norm(it["text"])))
    starts = [t for _, t in raw] or [0.0]
    # approximate time per canonical token: proportional position in the transcript
    words = [(h, starts[min(int(i * len(starts) / max(len(heard), 1)), len(starts) - 1)]) for i, h in enumerate(heard)]
    issues = []
    for d in diff_issues(script, heard):
        t = words[min(d["hi"], len(words) - 1)][1] if words else 0.0
        issues.append({"kind": d["kind"], "time": round(float(t), 2), "script": d["script"], "heard": d["heard"]})
    # phrases that must be pronounced correctly: every one present in the script must appear verbatim in the transcript
    heard_s = " " + " ".join(heard) + " "
    script_s = " " + " ".join(script) + " "
    for phrase in it.get("must", []):
        p = " ".join(norm(phrase))
        if p and f" {p} " in script_s and p.replace(" ", "") not in heard_s.replace(" ", ""):
            pos = script_s.find(f" {p} ") / max(len(script_s), 1)
            near = " ".join(heard[max(0, int(pos * len(heard)) - 2): int(pos * len(heard)) + len(p.split()) + 2])
            issues.append({"kind": "mispronounced", "time": round(pos * (words[-1][1] if words else 0.0), 2), "script": p, "heard": near})
    # Whisper on a long clip sometimes skips or garbles a word that it hears fine on a short window. Before an issue triggers a retake,
    # re-transcribe a short window around it; if the script words appear there in order, it was a recognizer slip, not the voice.
    def slice_confirms(issue):
        if issue["kind"] not in ("missing", "word", "mispronounced", "garbled", "number"):
            return False
        # a number issue is only excused if the short window has the SAME numbers in order (a dropped "seven" must still fail)
        want = [w for w in canon(join_letters(norm(issue["script"]))) if issue["kind"] == "number" or not w.startswith("#")]
        if not want:
            return False
        a0 = max(0.0, issue["time"] - 6.0)
        a1 = issue["time"] + 12.0
        seg, _ = model.transcribe(audio[int(a0 * 16000): int(a1 * 16000)], language="en", beam_size=5, vad_filter=False,
                                  condition_on_previous_text=False, initial_prompt=NAMES_PROMPT)
        got = canon(join_letters(norm("".join(sg.text for sg in seg))))
        i = 0
        for g in got:
            if i < len(want) and (g == want[i] or g.replace("'", "") == want[i].replace("'", "")):
                i += 1
        return i == len(want)

    issues = [x for x in issues if not slice_confirms(x)]
    out[it["id"]] = {"issues": issues, "heard": " ".join(heard)}
json.dump(out, real_stdout)
