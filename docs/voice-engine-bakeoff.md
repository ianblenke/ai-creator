# Voice engine bake-off, 2026-10-28 to 2026-10-29

Goal: a cloned-voice lane that sounds like the author and runs without a big GPU. One reference clip of the author's own voice was used
throughout; the same kettle-episode hook paragraph was the test text. Speeds are real-time factor (RTF) = seconds of compute per second of audio
(below 1 is faster than real time). The author's own listening is the quality verdict; no automatic score was used for "sounds like".

| Engine | Result | Speed measured | Checks run | Author's listening verdict |
|---|---|---|---|---|
| Chatterbox Nano | tried on CPU | CPU about 0.65 to 0.71 (3 paragraphs) | transcript and silence checks | caricature of the voice |
| Chatterbox Turbo | tried on CPU | CPU about 1.6 to 1.95 (3 paragraphs), 7 GB RAM peak | transcript and silence checks | caricature of the voice |
| Qwen3-TTS 0.6B | tried on CPU | not recorded here | transcript and silence checks | caricature of the voice |
| Qwen3-TTS 1.7B | tried | not recorded here | transcript and silence checks | good, but too fast and higher-pitched than the author |
| Chatterbox original (500M), exaggeration 0.7, cfg 0.3 | tried | CPU about 3.5 | transcript and silence checks | better than the above at pacing, pitch and expression |
| **Chatterbox original, settings "F"** (exaggeration 0.6, cfg 0.3, temperature 0.9) | **chosen** | NVIDIA GPU, card model not recorded ("4 GB VRAM" as written down; whether that is the card's size or the memory used was not recorded) about 0.43; CPU 8 threads about 3.5, 7.3 GB RAM peak, 18 s load | transcript and silence checks | the one the author liked best by ear, judged better than Qwen3-TTS and Nano/Turbo on pacing, pitch and expression, and better than the 0.7 run on pitch and speed. Measured on its output: 129 Hz and 3.4 words/s, against the author's own recording at 125 Hz and 2.64 words/s, so F speaks about 29 % faster than the author. No other engine's pitch or rate was recorded, so these numbers do not show that F is the closest. |
| Pocket TTS | blocked | n/a | n/a | not heard: weights are behind gated access |
| TADA 1B | not tested | n/a | n/a | not heard: weights are under the Llama 3.2 licence with gated access |
| OpenVoice, Dia, Zonos, MOSS, dots.tts | rejected before testing | n/a | n/a | not heard; the reasons for each rejection are not recorded in this file |

**OmniVoice**, the engine used before this bake-off, has no row: it was not run on the same paragraph, so how Chatterbox compares
with it on speed, pitch, rate or by ear was **not measured** here (OmniVoice's own CPU timings are in `docker/cpu-clone/README.md`).

"Caricature of the voice" is the author's word for a clone that exaggerates the voice's traits. Hz is the output's typical speaking
pitch (how it was averaged was not recorded); "words/s" is words spoken per second of audio.

Qwen3-TTS speeds were not kept in a form this document can quote, so none are given. Nano, Turbo and Chatterbox original rows are single runs
on one machine each, not averages.

## Why Chatterbox original
Code MIT, weights tagged MIT, anonymous download, no reference transcript needed, and the listening verdict above. The catches: a fixed
Perth watermark on every output (kept; see NOTICE) and an undisclosed training set (see docs/licences.md).

## Watermark and disclosure (unresolved, not legal advice)
- **Watermark:** every Chatterbox output carries Resemble's Perth implicit watermark, applied inside the library's `generate()` (read
  from the code of the pinned version). This project keeps it on and never patches it; you cannot set its payload. No detection run
  on this project's output exists, so whether it survives your editing and upload chain was not tested (see below).
- **Telling viewers:** the author's rule for this series is that every description says the narration is a cloned copy of the author's
  voice and names the voice model, and every upload sets YouTube's altered-or-synthetic content flag (see the README).
- **EU AI Act, Article 50(4):** whether that article's disclosure duty for synthetic audio applies to narration cloned from your own
  voice, and what form of disclosure it would need, is UNRESOLVED here. No legal source was read for this page and nobody has reviewed
  it; this is not legal advice. A plain spoken or on-screen line saying the voice is a clone is the cautious choice for EU viewers.
  Background and sources: `docs/voice-cloning-law.md`.

## What the switch from OmniVoice leaves untested
The take thresholds in `tools/take_defects.py`, the desniff constants in `tools/desniff.py` and the narration checks in
`docs/narration-quality.md` were tuned on OmniVoice output of the author's voice. They have not been re-derived on Chatterbox output.

## NOT measured
- A second speaker's voice: only the author's own clip was used.
- Long-form drift: only paragraph-length outputs were generated, never a full episode in one run.
- Training-data provenance: the model card says only "0.5M hours of cleaned data".
- Whether the watermark survives your particular editing and upload chain (the vendor says it survives MP3; not tested here).
- Speaker similarity by any automatic metric.
