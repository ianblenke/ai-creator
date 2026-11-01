# When a take sounds wrong: stalls, best of N, retakes and the voice-stage order

The voice model is random: the same sentence comes out a little different every time, and now and then with a stall, a choppy run, a
mumbled word or an extra syllable. This page is the order of the voice stages and the rules for retaking. The checks themselves, the
lively-reference advice and the calibration limits are in `docs/narration-quality.md`; the commands in full are in
`docs/tutorial/full-run.md`.

## The order, and why

    tts -> align -> besttake (flagged scenes) -> tighten -> align -> desniff -> align -> asr -> takedefects -> fixaudio (only if something is flagged) -> voicereview

- `align` comes before `besttake` because the stall check runs inside `align`: that is how you know which scenes to retake. `besttake`
  runs `align` itself after every take.
- `desniff` comes after the last retake. It quiets sniffs and breaths in the gaps between words of the audio that is there now. A retake
  writes a fresh take with its own sniffs, so **retaking a scene after desniff brings its sniffs back**.
- `align` again after `desniff`: lengths do not change, but `audio/narration.wav` is rebuilt from the scene files.
- `tighten` shortens pauses that sound odd: 0.25 s cap inside a phrase, 0.4 s before a conjunction, 0.6 s after a comma; sentence pauses are never touched. It changes scene lengths, so `align` runs after it, and it runs BEFORE `desniff` (cutting the middle of a gap leaves the edge stretches that desniff leaves alone, so desniff must see the shortened gaps). Originals: `audio/pre-tighten/`.
- `fixaudio` keeps the order by itself: it retakes, then runs `desniff`, `align` and `asr` at the end.

## Retaking one scene after desniff
`desniff` keeps the FIRST original of each scene in `audio/pre-desniff/` and never overwrites it, so after a retake that backup holds
the old take, and `desniff --restore` would put the old take back. For scene 05:

    rm episodes/my-kettle/audio/pre-desniff/05-*.wav
    docker compose run --rm media desniff episodes/my-kettle 05
    docker compose run --rm media align episodes/my-kettle

`fixaudio` clears `audio/pre-desniff/` itself before its own `desniff` run.

## The checks, and their limits

| check | what it flags | limit (source) |
|---|---|---|
| stall (`align`) | a silence inside a phrase, with no punctuation | 0.35 s; it was 0.55 s until 2026-10-18, which let heard stalls through (`tools/audio-check.js`) |
| long pause (`align`) | a silence after a comma or colon, or after a sentence | 1.3 s after a clause, 1.8 s after a sentence |
| choppy (`align`) | several short breaks close together | 2 breaks of 0.25 s or more within 3 s |
| fused word (`align`) | a word that starts within 0.05 s of the next word's start (swallowed into it) | 0.05 s |
| transcript (`asr`) | a changed, missing or extra word against the script; phrases in `must-hear.txt` | Whisper `small.en` |
| dropout (`takedefects`) | a word 25 dB or more under the scene's speech median | `DROPOUT_DB` in `tools/take_defects.py` |
| extra syllable (`takedefects`) | speech-level sound (within 10 dB of the median, at least 0.08 s) between two words | `EXTRA_OVER_DB`, `EXTRA_MIN` |

Every limit was set on one voice (the author's) with OmniVoice, and none has been re-derived on Chatterbox output: tune them on your
own voice (`docs/narration-quality.md`, "Tune the checks on your own voice").

## Best of N, not blind retakes
Leave `VOICE_SEED` unset: with a seed, the Chatterbox server reseeds before every request, so every take of a scene is the same or nearly so (read from the code, not run) and
best of N has nothing to choose from. `besttake` and `tts --retake` print a warning when `VOICE_SEED` is set.

A blind retake is as likely to add a new hesitation as to remove one. `besttake` (a stage:
`docker compose run --rm media besttake episodes/<id> 03 05 --takes 8`; the same as `node tools/besttake.js` with those arguments)
makes up to `--takes N` takes of each named
scene (default 8, stopping early at a take with nothing flagged), scores each by the summed silence of its flagged gaps plus 0.3 per
choppy run, and keeps the lowest score. `fixaudio` does the same across every check, with a cost per problem (a dropout costs 5; an
extra syllable, a changed word or a missing word 3; a flagged pause 0.5 plus its length, at most 1.5; anything else 1), over at most
8 rounds (`tools/stages/fixaudio.js`).

Add `--keep-takes` to `besttake` to make all N takes (no early stop) and keep every one in `episodes/<id>/audio/takes/` as `NN-i.final.wav` and `NN-i.raw.wav`,
for example to find a real slip to show. These are voice audio: the folder is gitignored and never committed. It refuses to run if `audio/takes/` already exists.

## When every take fails, reword
If one phrase is flagged on every take, the voice cannot say it the way it is written. Reword it, respell it with
`{{spoken: ...|...}}`, or split it with a comma or a `{{pause: 0.8}}` (`docs/script-format.md`), then run `check-anchors` (a reworded
line can break a cue anchored on the old words) and retake that scene.
