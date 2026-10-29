# Claims ledger

Every number the docs or the videos state, with where it comes from. Before a number goes into a script, its row must be here.

Rules:
- A video states a number only if its row says **measured on the example** (`examples/ep01-kettle`) or **measured** with a sample size
  and the hardware named on screen. An **estimate** is said as an estimate; a **superseded** row is never used.
- "n" is how many runs, clips or sentences the number rests on. n = 1 is one run on one machine.
- When a number changes, add the new row and mark the old one superseded; do not edit it in place.

Status values: measured on the example, measured (elsewhere), planted defects (not human ears), estimate, superseded, not measured (a known gap:
no number may be quoted for it).

## Voice speed and size

| claim | value | source | date | n | status |
|---|---|---|---|---|---|
| Chatterbox F on an NVIDIA GPU (card model not recorded; noted as "4 GB VRAM"), real-time factor | about 0.43 | `docs/voice-engine-bakeoff.md` | 2026-10-29 | bake-off paragraphs, one run | measured |
| Chatterbox F on 8 CPU threads (CPU model not recorded), real-time factor | about 3.5 | `docs/voice-engine-bakeoff.md` | 2026-10-29 | bake-off paragraphs, one run | measured |
| Chatterbox CPU server RAM peak, model load | 7.3 GB, 18 s | `docs/voice-engine-bakeoff.md` | 2026-10-29 | 1 | measured |
| Chatterbox Nano / Turbo on CPU, real-time factor | 0.65 to 0.71 / 1.6 to 1.95 | `docs/voice-engine-bakeoff.md` | 2026-10-28 to 29 | 3 paragraphs each | measured |
| Chatterbox F pitch and pace against the author's own | 129 Hz, 3.4 words/s against 125 Hz, 2.64 words/s (about 29 % faster); no other engine measured, so not "closest" | `docs/voice-engine-bakeoff.md` | 2026-10-29 | bake-off paragraphs, one speaker | measured |
| Chatterbox CPU through compose, first clone request | 54 s for "The kettle clicks off." including the 3.19 GB weight download; server memory 4.1 GiB afterwards | runner review, `docker compose --profile chatterbox-cpu` | 2026-10-29 | 1 request, 24-core x86_64, no GPU | measured |
| Chatterbox F at the compose default (all cores, no `THREADS`) | not measured | | | | not measured |
| Chatterbox against OmniVoice on the same text | not measured | `docs/voice-engine-bakeoff.md` | | | not measured |
| OmniVoice clone on 16 CPU cores, 24 steps, real-time factor | 8.4 | `docker/cpu-clone/README.md` | 2026-10-27 | one 4.7 s sentence | measured |
| OmniVoice clone on CPU, 32 / 16 steps | 11 / 5.8 | `docker/cpu-clone/README.md` | 2026-10-27 | one sentence (32 steps: a range, more than one run) | measured |
| OmniVoice preset on CPU, 32 steps | 6.5 | `docker/cpu-clone/README.md` | 2026-10-27 | 1 | measured |
| OmniVoice on an RTX 3090, 24 steps | 0.3 to 0.6 s per sentence of 2 to 5 s; about 2.4 GB VRAM | `docs/m5-voice-server-log.md` | 2026-10-26 | several sentences, not counted | measured |
| OmniVoice on an AMD 890M (ROCm) | 33, 34 and 51 s for 3.9 to 4.4 s sentences | `docs/rocm-notes.md` | 2026-10-28 | 3 | measured |
| Kokoro preset on 16 CPU cores | 0.75 s for a 5.5 s sentence (real-time factor about 0.14) | `docker/kokoro/README.md` | 2026-10-27 | 1 | measured |
| the example synthesized on the Chatterbox CPU lane | roughly 13 min, before retakes (used validate's 3.8 min, not the timeline) | README | 2026-10-29 | none | superseded |
| the example synthesized on the Chatterbox CPU lane, 8 threads | roughly 11 min, before retakes (182.8 s x 3.5) | README | 2026-10-29 | none | estimate |
| the example cloned on `cpu-clone` at 24 steps | roughly 30 min (from a 3.5 min length) | `docker/cpu-clone/README.md` | 2026-10-27 | none | superseded |
| the example cloned on `cpu-clone` at 24 steps | roughly 26 min (182.8 s x 8.4) | `docker/cpu-clone/README.md` | 2026-10-29 | none | estimate |
| image and weight sizes | see `docs/hardware-and-models.md` | each row's own source | 2026-10-26 to 29 | 1 | measured |
| tools image | 8.09 GB | `docker image ls` after `docker compose build` | 2026-10-29 | 2 builds, x86_64 | measured |
| Chatterbox CPU image, its weights | 2.67 GB, 3.19 GB | `docker image ls`; the `chatterbox-models` volume after the first request | 2026-10-29 | 1 | measured |

## The example episode

What ships in `examples/ep01-kettle`: the inputs, `timeline.json`, the briefs and `scenes/_inputs.json`, the subtitles and the
keyframe PNGs with their `rounds.json`. No report file ships: `audio/` and `out/` (logs, determinism and clip checks, the videos) are
not committed, and no narration audio of any voice is. So the rows below were read off one run's printed output and recorded in the
example's README; rerun the step to reproduce them.

| claim | value | source | date | n | status |
|---|---|---|---|---|---|
| validate's length estimate | 3.8 min (9 scenes, 160 words per minute) | `docker compose run --rm media validate examples/ep01-kettle` | 2026-10-29 | 1 | measured on the example |
| narration length in the committed timeline | 182.8 s | `examples/ep01-kettle/README.md` (`align` in fixture mode) | 2026-10-29 | recorded from a prior run, voice not recorded | measured on the example |
| draft render | about 9 min, 4 workers, 16 cores | an earlier version of `examples/ep01-kettle/README.md` | 2026-10-29 | 1 | superseded |
| draft render (`render --draft`, default 6 workers) | 59 s for the example, 123 s for a copy in `episodes/` | runner review from a fresh clone | 2026-10-29 | 2 runs, 24-core x86_64, no GPU | measured on the example |
| 60 fps render inside `pipeline.sh` | about 150 s | runner review | 2026-10-29 | 1 run, same machine | measured on the example |
| whole `tools/pipeline.sh` (determinism, render, clip check, both encodes, loudness) | 549 s | runner review, `MEDIA_DETERMINISM_DB=44` | 2026-10-29 | 1 run, same machine | measured on the example |
| clip verification margin | worst of 517 sampled frames 36.7 dB against the 36 dB threshold (0.7 dB to spare) | runner review, `pipeline.sh` | 2026-10-29 | 1 run, same machine | measured on the example |
| keyframes on the committed scenes | 15 s; 1 min 19 s on another run | runner and newcomer reviews | 2026-10-29 | 2 runs, machines differ | measured on the example |
| `layout-check --step 0.1` | 63 s, `layout clean` | runner review | 2026-10-29 | 1 run, 24-core x86_64 | measured on the example |
| the voice behind the committed timeline | not recorded | | | | not measured |
| scene lengths in an estimated fixture timeline (a new topic, `VOICE_TRANSPORT=fixture`) | each scene's word count at `VOICE_WPM` (default 160 words a minute), at least 1 s | `estimatedTimeline` in `tools/stages/tts.js` | 2026-10-29 | none | estimate (never quote; real narration and `align` replace it) |
| determinism of its glows (swept against fresh frame) | 58.6 to 59.9 dB, under the 60 dB default | `examples/ep01-kettle/README.md` | 2026-10-29 | 1 | measured on the example |
| a rerun of `scenes` and `keyframes` on the committed files | no file changes (`git status` clean) | `tools/stages/rerun.test.js` and one local run outside the container | 2026-10-29 | 1 | measured on the example |
| cue anchors | 112, 0 unresolved | `node tools/check-anchors.js examples/ep01-kettle` | 2026-10-29 | 1 | measured on the example |

## Checks and their calibration

| claim | value | source | date | n | status |
|---|---|---|---|---|---|
| voice review on planted sniffs | 5 of 8 caught | `docs/pitch-replacement.md` | 2026-10-28 | 2 sets of 18 clips, one voice | planted defects |
| voice review on planted loud words | 7 of 8 caught, 3 false alarms in 28 clean cases | `docs/pitch-replacement.md` | 2026-10-28 | 2 sets of 18 clips, one voice | planted defects |
| "4 of 4 planted sniffs" | 4 of 4 | an earlier detector, before the pitch tracker was replaced | before 2026-10-28 | 18 clips | superseded |
| defects a human heard in a real episode, flagged by the detector | 3 of 5 | `docs/narration-quality.md` | not recorded | 5 defects, one voice | measured |
| pitch tracker against Praat on real narration | about 95 % of frames within 1 semitone | `docs/pitch-replacement.md` | 2026-10-28 | 4,965 frames | measured |
| room-noise floor between sentences | about -46 dB | `docs/narration-quality.md` | not recorded | one voice | measured |
| stall limit inside a phrase | 0.35 s (0.55 s until 2026-10-18) | `tools/audio-check.js` | 2026-10-18 | set by ear on one voice | measured |
| speaking rate used by validate | 160 words per minute (about 163 measured) | `tools/script.js` | not recorded | the author's cloned voice, OmniVoice era | measured |
| a real ghost frame against a fresh render | about 30 dB; healthy clips 36 dB or more | `tools/stages/render.js`, `tools/stages/verifyclips.js` | not recorded in this repo | not recorded | measured |

Every check threshold above was set on one voice (the author's) with OmniVoice; none has been re-derived on Chatterbox output.
