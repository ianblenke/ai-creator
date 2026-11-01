# The full run: from a copied episode to an uploaded video

Every command below, in order, in the exact form you type it from the repository root. Each step says what it prints last when it
went right, how long it takes (a class, not a promise: most steps were not timed), and what it writes.

Runtime classes: **seconds** (under a minute), **minutes**, **long** (tens of minutes or more), **hosted** (a hosted model through a
coding agent; time and cost not measured), **you** (a person listens, reads or decides). A measured time is given only where one exists.

Want to try the pipeline first with no voice, no GPU and no network? Run the offline lane in `examples/ep01-kettle/README.md`. This
page is the real run with your own cloned voice.

Some tools are scripts rather than pipeline stages; they run with `--entrypoint node` instead of the default `node tools/cli.js`.
`docker compose run --rm media` with no command prints the stage list and the pipeline order.

## 0. Once per machine

| command | last line | runtime | writes |
|---|---|---|---|
| `cp .env.example .env.local` | (nothing) | seconds | the tool settings file |
| `printf 'HOST_UID=%s\nHOST_GID=%s\n' "$(id -u)" "$(id -g)" > .env` | (nothing) | seconds | the compose settings file |
| `cp safety/denylist.example.txt safety/denylist.txt`, then add your own names (`docs/safety.md`) | (nothing) | you | the names the safety gate blocks |
| `docker compose build` | build output that ends without an error (the image is `ai-creator-media:local`) | long: about 20 min from a clean clone (one run, 2026-10-29); image 8.09 GB | the tools image |
| `docker compose --profile chatterbox-cpu build voice-chatterbox-cpu` (or `--profile chatterbox build voice-chatterbox` on an NVIDIA GPU) | build output that ends without an error | long, not timed; CPU image 2.67 GB | the voice server image |
| `docker compose run --rm --entrypoint npm media test` | `OK` (the Python tests), after the Node summary: `# fail 0` without a terminal (TAP output), `ℹ fail 0` in a terminal; npm may print upgrade notices after it | seconds (4.8 s once) | nothing (the test suite in the tools image) |

Your voice: record the reference clip and fill in the consent note as `docs/voice-reference.md` describes, then set in `.env.local`:
`VOICE_TRANSPORT=http`, `VOICE_REF=voice/ref.wav`, `VOICE_REF_TEXT=` the exact words of the clip on one line. Optional:
`VOICE_WPM=` your measured speaking rate in words per minute, so `validate` estimates your length (default 160, the author's rate).

## 1. Start an episode

| command | last line | runtime | writes |
|---|---|---|---|
| `mkdir -p episodes && cp -r examples/ep01-kettle episodes/my-kettle && rm -rf episodes/my-kettle/keyframes episodes/my-kettle/out` (a fresh clone has no `episodes/` folder) | (nothing) | seconds | your episode folder (the copied `keyframes/` carry the example's review rounds, so drop them) |
| or, for your own topic: `docker compose run --rm media new episodes/my-topic` | `next: fill in plan.md, then facts.md (docs/fact-sheets.md), then script.md; run validate and safety` | seconds | `plan.md`, `facts.md`, `script.md`, `must-hear.txt`, `youtube-description.md`, `scenes/_brief/_bible.md`, `thumbnail/thumb.html` from `templates/` (no scenes, no timeline) |

The folder name becomes the video's file name (`out/my-kettle.mp4`). A new topic needs its plan, facts (`docs/fact-sheets.md`) and
script (`docs/script-format.md`) written before the steps below, and its scenes authored in section 4. The rest of this page uses the
copied kettle, `episodes/my-kettle`.

A topic made with `new` has no `timeline.json` yet. The offline fixture lane still runs on it: `tts` with `VOICE_TRANSPORT=fixture`
first writes an ESTIMATED `timeline.json` from the script (each scene as long as its word count at `VOICE_WPM`, default 160 words a
minute, its words spread evenly, marked `"estimated": true`) and its subtitles, and prints `timeline.json: ESTIMATED from the script
(... s at VOICE_WPM or 160 words a minute); real narration and align replace it`. Run it again after a script edit and the estimate is
rebuilt; a real timeline (from `align` with a voice) is never rewritten by the fixture lane. That is enough to author and render scenes
offline, but cue times are guesses until real narration replaces them: re-run `check-anchors`, `layout-check` and `render --check`
after the real `align`. (Covered by a unit test in `tools/stages/tts.test.js`; not run end to end on a new topic for this page.)
`new` also copies a generic `thumbnail/thumb.html` to edit before section 6.

## 2. The script

| command | last line | runtime | writes |
|---|---|---|---|
| `docker compose run --rm media validate episodes/my-kettle` | `9 scenes, estimated 3.8 min`, then `warning: estimated 3.8 min is under the 5-8 min target` for the example (it has no `Duration:` line) | seconds | nothing |
| `docker compose run --rm media lint-endings episodes/my-kettle` | `word-ending lint: 0 known slip(s), 0 warning(s): run ...` | seconds | nothing |
| flow review and script critique: `prompts/flow-review.md`, `prompts/script-critic.md` | the reviewer's list; fix every HIGH and MEDIUM | hosted, then you | your edits to `script.md` |
| `docker compose run --rm media safety episodes/my-kettle` | `content-safety: clean` | seconds | nothing |

`tts`, `fixaudio`, `asr`, `scenes`, `keyframes`, `render`, `verifyclips` and `encode` run the same safety scan first and stop on a finding.

## 3. The voice

Order matters (the same order in every page; `docs/tutorial/takes.md` explains it):

    tts -> align -> besttake (flagged scenes) -> tighten -> align -> desniff -> align -> asr -> takedefects -> fixaudio (only if flagged) -> voicereview

`align` comes first because it is what flags the scenes to retake. Every retake replaces a scene's audio with a fresh take that still
has its sniffs and breaths, so a retake after `desniff` undoes it for that scene; `fixaudio` runs `desniff`, `align` and `asr` itself
at the end. `align` asks for `fixaudio` when it finds stalls; on a first pass use `besttake` on those scenes instead, as below.

| command | last line | runtime | writes |
|---|---|---|---|
| `docker compose --profile chatterbox-cpu up -d voice-chatterbox-cpu` | a `Started` line for the container | seconds to start; the first start then downloads about 3.19 GB of weights before the model loads (`docker compose logs -f voice-chatterbox-cpu`); `tts` waits until `/health` reports ready | a running voice server, reachable as `voice` |
| `docker compose run --rm media tts episodes/my-kettle` | one line per scene, the last `09-the-outro: synthesized` | long: roughly 11 min for the example's 182.8 s on 8 CPU threads (an estimate from the measured real-time factor 3.5, not a timed run; compose uses all cores by default, not measured) | `audio/NN-*.wav`, `audio/raw/`, `audio/manifest.json` |
| `docker compose run --rm media align episodes/my-kettle` | `narration check: no stalls or unnatural pauses`, or a list of flagged scenes | minutes, not timed | `timeline.json`, `subs/episode.vtt`, `subs/episode.srt`, `audio/narration.wav` |
| `docker compose run --rm media besttake episodes/my-kettle 03 05 --takes 8` (the scenes `align` flagged) | `scene 05: kept take N (... flagged gap(s), score ...)` | long: up to 8 `tts` and `align` runs per scene | the kept take of each scene, then a fresh `timeline.json` |
| `docker compose run --rm media desniff episodes/my-kettle` | `before/after reel: episodes/my-kettle/audio/review/desniff-reel.wav` | minutes, not timed | cleaned `audio/NN-*.wav`; originals in `audio/pre-desniff/`; `audio/desniff-report.json` |
| `docker compose run --rm media align episodes/my-kettle` | `narration check: no stalls or unnatural pauses` | minutes, not timed | `timeline.json`, subtitles, `audio/narration.wav` from the cleaned audio |
| `docker compose run --rm media asr episodes/my-kettle` | `narration transcript check: 9 scene(s) match the script` | minutes, not timed | `audio/asr-report.json` |
| `docker compose run --rm media takedefects episodes/my-kettle` | `take defects: none` | minutes, not timed | nothing (prints each defect) |
| only if `asr` or `takedefects` flagged something: `docker compose run --rm media fixaudio episodes/my-kettle` | `narration is clean` (or `still flagged ...`: reword those lines) | long: up to 8 retake rounds | the cleanest take per scene; it runs `desniff`, `align` and `asr` itself at the end |
| `docker compose run --rm media voicereview episodes/my-kettle` | `penalty per scene: 01=... 02=...` | minutes, not timed | `audio/voice-review.json`, `audio/review/reel.wav`, `audio/review/reel.txt` |
| listen to `audio/review/reel.wav` and once to all of `audio/narration.wav` | | you | |
| `docker compose --profile chatterbox-cpu down` | | seconds | frees the server's memory (it peaked at 7.3 GB) before rendering |

## 4. The pictures

| command | last line | runtime | writes |
|---|---|---|---|
| `docker compose run --rm media scenes episodes/my-kettle` | `wrote 9 briefs and scenes/_inputs.json` | seconds | `scenes/_brief/NN-*.md` (with your word times), `scenes/_inputs.json` |
| scene authoring and keyframe review: `prompts/scene-author.md`, `prompts/keyframe-review.md`, `prompts/continuity-review.md` (skip for the copied kettle: its scenes exist) | the reviewer's list | hosted, then you | `scenes/NN-*.js` |
| `docker compose run --rm --entrypoint node media tools/check-anchors.js episodes/my-kettle` | `episodes/my-kettle: 112 cue anchors, 0 unresolved` (for the kettle) | seconds | nothing |
| `docker compose run --rm media keyframes episodes/my-kettle` (it also runs `lint-scene` on each scene and prints `pacing gaps > 4 s` where nothing changes on screen for over 4 s) | `09-the-outro: N keyframes (round 1/3)` | seconds to minutes (15 s and 79 s on two machines) | `keyframes/NN-*/*.png`, `keyframes/NN-*/rounds.json` |
| `docker compose run --rm --entrypoint node media tools/layout-check.js episodes/my-kettle --step 0.1` | `layout clean` | about a minute (63 s once) | nothing |
| optional scrub preview: `EPISODE=episodes/my-kettle docker compose --profile preview up preview`, then open the address it prints | `scrub preview: http://127.0.0.1:8765/...` | until Ctrl+C | nothing |
| `docker compose run --rm media render episodes/my-kettle --draft` | `NN-...: N frames @ 30 fps (N s elapsed)` (scene order varies) | minutes: 123 s for this copy, 59 s for the example itself, default 6 workers on 24 cores (2026-10-29) | `out/clips-draft/NN-*.mp4` |
| `docker compose run --rm media encode episodes/my-kettle --draft` | `episodes/my-kettle/out/my-kettle-draft.mp4  N s  (verified 30 fps 1920x1080 h264/aac)` | minutes, not timed | the draft video; watch it |

## 5. The final render and its checks

One script runs all of section 5 and prints a summary (`out/pipeline.log` keeps the full output):

    docker compose run --rm -e MEDIA_DETERMINISM_DB=44 --entrypoint bash media tools/pipeline.sh episodes/my-kettle

It ends with `PIPELINE-DONE-my-kettle (exit 0)`; for the example it took 549 s on 24 cores (once, 2026-10-29). `MEDIA_DETERMINISM_DB=44` is for the kettle's glows (`examples/ep01-kettle/README.md`
explains why and how to confirm it first); leave it out for scenes without glows. The same steps one by one:

| command | last line | runtime | writes |
|---|---|---|---|
| `docker compose run --rm -e MEDIA_DETERMINISM_DB=44 media render episodes/my-kettle --check --step 1` | `determinism check passed: every swept frame matches a pure render of the same instant` | minutes, not timed | nothing |
| `docker compose run --rm media render episodes/my-kettle` (add `--workers N` to set the worker count) | `NN-...: N frames @ 60 fps (N s elapsed)`, or `up to date` for unchanged scenes | minutes: about 150 s for the kettle on 24 cores (once) | `out/clips/NN-*.mp4` |
| `docker compose run --rm media verifyclips episodes/my-kettle --step 0.35` | `all sampled frames match a fresh render` | long, not timed | nothing (look at every frame it lists under 36 dB) |
| `docker compose run --rm media encode episodes/my-kettle` | `episodes/my-kettle/out/my-kettle.mp4  N s  (verified 60 fps 1920x1080 h264/aac)` | minutes, not timed | `out/my-kettle.mp4`, `out/my-kettle.srt` |
| `docker compose run --rm media encode episodes/my-kettle --burn` | `episodes/my-kettle/out/my-kettle-subtitled.mp4  N s  (verified 60 fps ...)` | minutes, not timed | the burned-in subtitle version |
| `docker compose run --rm media finalcheck episodes/my-kettle` | `FINAL AUDIO CHECK: issues 0 \| words heard N` | minutes, not timed | nothing (the delivered file's own audio against the whole script) |

## 6. Thumbnail and upload

| command | last line | runtime | writes |
|---|---|---|---|
| `docker compose run --rm --entrypoint node media tools/thumbnail.js episodes/my-kettle a b` | `episodes/my-kettle/thumbnail/thumb-b.png  N MiB` | seconds | `thumbnail/thumb-a.png`, `thumb-b.png` from `thumbnail/thumb.html` |
| copy the chosen files where the upload tool looks: `mkdir -p episodes/my-kettle/out/final && cp episodes/my-kettle/out/my-kettle.mp4 episodes/my-kettle/out/final/my-kettle-final.mp4 && cp episodes/my-kettle/out/my-kettle.srt episodes/my-kettle/out/final/my-kettle-final.srt && cp episodes/my-kettle/thumbnail/thumb-a.png episodes/my-kettle/out/final/my-kettle-thumbnail.png` | (nothing) | seconds | `out/final/` |
| fill in `youtube-description.md` (title options, description, chapters, the synthetic-voice line that is true for your voice (own clone, a voice used with permission, or a preset: `docs/upload.md`) and the voice model credit) | | you | |
| on the host: `node tools/youtube.js auth --manual` (once per sign-in; the Google Cloud setup, and why this runs on the host, are in `docs/upload.md`) | `node tools/youtube.js auth --finish '<paste the address here>'` | seconds, then you | `.secrets/pending-auth.json` |
| on the host: `node tools/youtube.js auth --finish '<the address>'` (within 10 minutes; run `--manual` only once) | `Next: node tools/youtube.js check` | seconds | `.secrets/token.json` |
| on the host: `node tools/youtube.js check` | `If that is the right channel, you are ready: ...` | seconds | nothing |
| `docker compose run --rm --entrypoint node media tools/youtube.js upload episodes/my-kettle` (dry run; also works on the host as `node tools/youtube.js upload ...`) | `Dry run only. Everything above is valid; re-run with --yes to upload.` | seconds | nothing |
| on the host: `node tools/youtube.js upload episodes/my-kettle --yes` | `It is private. When it looks right, set the visibility to Public there.` | minutes (the upload) | the private video, marked as synthetic media, with thumbnail and captions |
| `docker compose run --rm --entrypoint node media tools/youtube.js status episodes/my-kettle` (or `node tools/youtube.js status ...` on the host) | `description: N characters` | seconds | nothing |

The upload rows need Node 22.23.4 or newer and a browser on the host (README, "Before you start"); the real upload was not run on the
kettle. The tool never publishes and never deletes: you switch the video to Public in YouTube Studio.

## Other tools, not part of the run above
- `docker compose run --rm media subs <ep>`: rewrites `subs/episode.vtt` and `.srt` from `timeline.json` (`align` already does this).
- `docker compose run --rm media check-audio <ep>`: the stall and pause check of `align`, on the current `timeline.json`, without aligning again.
- `docker compose run --rm media music <ep> <track> [--lufs -28]`: a music bed looped to the narration length, in `audio/` (any music
  needs its own licence).
- `docker compose run --rm --entrypoint node media tools/make-short.js <ep> <start-s> <end-s> <out.mp4>`: a vertical Short cut
  from the final video.
- `docker compose run --rm --entrypoint node media tools/debug-determinism.js <ep> <scene-id> <t>`: prints every SVG attribute that
  differs between a fresh frame and a swept one, when `render --check` fails.
- `RENDER_HOST` and `RENDER_DIR` in `.env.local`: run `keyframes`, `render`, `encode` and the audio stages on another machine over
  ssh. Only for a host install of the tools: compose sets `MEDIA_LOCAL=1`, so the container ignores them. Not run for these docs.

## What this page has not been checked against
Written from the code on 2026-10-29. The last lines come from each tool's own messages. Run on 2026-10-29 from a fresh clone, CPU
only, with the fixture lane: the commands of sections 0 and 2 (not the hosted reviews), section 1's copy, and for `episodes/my-kettle` `tts`, `align`, `scenes`,
`keyframes`, `check-anchors`, `render --draft` and `encode --draft`; section 5's `pipeline.sh` on the example; the upload dry runs.
NOT run: any step with a real voice (section 3 beyond one clone request), `finalcheck`, a sign-in or a real upload.
