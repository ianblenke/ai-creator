# Example episode: how a kettle knows when to switch off

A complete 3-minute episode you can render with no GPU, no voice server and no network: the fixture lane writes silent
narration sized from the committed `timeline.json`, so every step after the voice runs exactly as it would with a real voice.

## Run it offline

Once, from the repository root (needs Docker Compose v2.24 or newer):

    cp .env.example .env.local    # tool settings; VOICE_TRANSPORT=fixture is the default there
    printf 'HOST_UID=%s\nHOST_GID=%s\n' "$(id -u)" "$(id -g)" > .env    # compose settings: run the container as you
    docker compose build

Then one command per step (`docker compose run --rm media` is shortened to `media` here):

| step | command | last line you should see |
|---|---|---|
| silent narration | `media tts examples/ep01-kettle` | `fixture audio written (silence: no loudness check); next: align` |
| narration track | `media align examples/ep01-kettle` | `timeline: kept the committed timeline.json (fixture mode), 9 scenes, 182.8 s` |
| scene briefs | `media scenes examples/ep01-kettle` | `wrote 9 briefs and scenes/_inputs.json` |
| keyframes | `media keyframes examples/ep01-kettle` | `09-the-outro: 11 keyframes (round 3/3)` (the three authoring rounds are counted in the committed `rounds.json`; a rerun on unchanged scene code is not a new round) |
| draft render | `media render examples/ep01-kettle --draft` | `09-the-outro: ... frames @ 30 fps (... s elapsed)` (the order of scenes varies) |
| draft video | `media encode examples/ep01-kettle --draft` | `examples/ep01-kettle/out/ep01-kettle-draft.mp4  183.4 s  (verified 30 fps 1920x1080 h264/aac)` |

The draft render took 59 s with the default 6 workers on a 24-core machine with no GPU (2026-10-29; 123 s on a second run of a
copy). The full 60 fps run with every check is one script; on the same machine it took 549 s, of which the 60 fps render was about
150 s (one run each, `docs/claims.md`). The CI workflow is set up to run it too, but CI has not run yet (the repository has no remote):

    docker compose run --rm -e MEDIA_DETERMINISM_DB=44 --entrypoint bash media tools/pipeline.sh examples/ep01-kettle

It ends with `PIPELINE-DONE-ep01-kettle (exit 0)`. `MEDIA_DETERMINISM_DB=44` is needed for this example: its glows differ by
58.6 to 59.9 dB between a swept and a fresh frame, just under the 60 dB default and far above a real ghost (about 30 dB). The
failure message of `render --check` explains how to confirm that before you relax the check. Clip verification passed with its worst sampled
frame at 36.7 dB against the 36 dB threshold, so only 0.7 dB to spare: another encoder or CPU may flip a frame under it. Look at
any frame it lists before you dismiss it. The final audio check is skipped,
and `asr`, `besttake`, `desniff`, `voicereview` and `finalcheck` refuse to run: there is no voice in silence to check.

`align` in fixture mode never rewrites `timeline.json`. With a real voice (`VOICE_TRANSPORT=http`) the first `align` REPLACES it
with your narration's timing, which is what you want; `git checkout examples/ep01-kettle/timeline.json` brings the original back.
Fixture mode refuses to overwrite real narration in `audio/`.

## What is in this folder

| file | kind | notes |
|---|---|---|
| `script.md`, `facts.md`, `must-hear.txt`, `youtube-description.md` | input | you write these for your own episode. The description's voice line is a neutral synthetic-voice line and its `Voice model:` credit is a `[fill in: ...]` placeholder, because the voice behind `timeline.json` is not recorded; the upload dry run reports it until you fill it in with the lane you render with (`docs/upload.md`) |
| `scenes/*.js`, `scenes/_kettle.js` | input | the animation code (authored by a model from the briefs, then reviewed) |
| `scenes/_brief/_bible.md` | input | the look and cast every scene follows |
| `timeline.json` | generated, committed | made by `align`, recorded from a prior run, voice not recorded (which engine or preset spoke it is unknown); the clock for the offline lane |
| `scenes/_brief/NN-*.md`, `scenes/_inputs.json` | generated, committed | `scenes` rewrites them; with the committed inputs the result is identical |
| `subs/episode.vtt`, `subs/episode.srt` | generated, committed | from `timeline.json` |
| `keyframes/` | generated, committed | still frames to review; `keyframes` rewrites them, and counts a new round in `rounds.json` only when the scene file changed |
| `thumbnail/`, `thumbnail.png` | input and output | the thumbnail page and its rendered image |
| `audio/`, `out/` | generated, not committed | narration, clips, the video, `out/pipeline.log` |

No reference reports (takes, sniff removal, transcript checks, voice review, determinism, clip verification) are shipped yet, and
no audio of any voice is: the repository never contains voice recordings.
