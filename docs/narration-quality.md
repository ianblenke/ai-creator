# Narration quality

The voice model is good, not perfect. This page covers how to get a lively delivery, what goes wrong, which checks catch it, and which
defects only a human ear finds. Commands run as `docker compose run --rm media <stage> examples/ep01-kettle`.

## 1. Make the delivery lively: record the reference with energy

Preset voices sound flat. The voice server has no emotion control: delivery (pace, pitch movement, emphasis) is copied from the cloned
reference clip. So the clip is where you put the performance.

- Record it as if explaining something to a friend, not reading. Smile. Move your hands.
- Use a reading text with questions, a few stressed words, and some short and some long sentences.
- Quiet room, same microphone distance you will use for any later clip, no music, no clipping.
- The reference text must be an EXACT, proofread transcript of what you said. A mismatch makes short replies speak extra words.
- Only clone your own voice, or one you have written permission to clone. Never commit the audio (`voice/` is blocked by the repo check).
- Chatterbox has delivery settings on the server (`VOICE_EXAGGERATION` 0.6, `VOICE_CFG_WEIGHT` 0.3, `VOICE_TEMPERATURE` 0.9 in `.env`,
  chosen by ear on one voice; see `docs/voice-server-contract.md`); the reference clip still matters most.

## 2. Switch the tts stage to cloning

The clip format, a reading text, the ffmpeg commands and a test are in `docs/voice-reference.md`. In short, in `.env.local`:

    VOICE_REF=voice/ref.wav
    VOICE_REF_TEXT=the exact words spoken in the recording, on one line

With `VOICE_REF` set, the `tts` stage posts to `/v1/audio/speech/clone` with your clip and its text instead of using `VOICE_NAME`
(the request is described in `docs/voice-server-contract.md`). `tts` refuses to start if `VOICE_REF_TEXT` is missing or `voice/CONSENT.md` is absent or unedited. The cache key
includes the clip, its text and the engine the server names on `/health` (or `VOICE_ENGINE_TAG`), so changing any of them
re-synthesizes. `tts` sends one request at a time.

## 3. Three failures the transcript check cannot see

`asr` transcribes each scene and diffs it against the script, and `align` reports stalls and choppy delivery. A take can pass both
and still sound wrong:

| Kind | What you hear | How it is found |
|---|---|---|
| dropout | a word mumbled, about 40 dB under the speech level (the transcript still has it) | `takedefects` |
| extra-syllable | a speech-level sound between two words ("so-sa how") | `takedefects` |
| lead/tail noise | sniffs or noise before the first word or after the last word of a scene | `desniff` quiets them |

`tools/take_defects.py` measures every word and every gap against that scene's own speech level, so no absolute thresholds depend on
your microphone. Run it alone with `takedefects <ep>`: it prints the scene, the time range and a one-line reason.

`desniff <ep>` removes sniffs and breaths in the silence around words, and now also the lead-in and tail of each scene. Lengths never
change, so the timeline stays valid, but run `align` afterwards. Originals are kept in `audio/pre-desniff/`; `--restore` puts them back.

## 4. Retake the cleanest take: `fixaudio`

A blind retake is random and can be worse than the take it replaces. `fixaudio <ep> [scene...]` therefore:

1. runs `asr`, then collects every problem (stalls, wrong words, dropouts, extra syllables), each with a cost
   (a dropout or changed word costs more than a long pause);
2. retakes the flagged scenes, re-aligns, re-checks, and scores each take, up to 9 takes per scene;
3. puts the lowest-scoring take of every scene back;
4. runs `align`, `desniff`, `align`, `asr` itself and reports what is still flagged.

If one phrase is flagged on every take, reword it (or respell it with a pause) instead of retaking again.

ORDER MATTERS (the same order in every page; why: `docs/tutorial/takes.md`):

    tts -> align -> besttake (flagged scenes) -> desniff -> align -> asr -> takedefects -> fixaudio (only if flagged) -> voicereview

- Retaking a scene AFTER desniff brings its sniffs back. Run `desniff` again, then `align`.
- If you render on another machine, do not copy a stale `timeline.json` over the host's: it overwrites the new word times. Run `align` again.
- After any audio change, check that `narration.wav` still matches each scene's own audio.

## 5. What the checks do not catch (calibration honesty)

Every number below comes from ONE voice: the author's (a man's voice, pitch tracked in the 75 to 300 Hz range), synthesized by
OmniVoice. The thresholds have not been re-derived on Chatterbox output, on any other speaker, or on a noisy recording.

Measured against five defects a human heard in a real episode:

- the detector flagged 3 of the 5;
- the other 2 were sniffs at the start or end of a scene, now handled by the lead/tail gate;
- quiet breaths between sentences remain by design: they are natural, and removing all of them makes speech sound clipped;
- there is a faint room-noise floor (about -46 dB) between sentences, against digital silence between scenes. It is measured but not
  removed; if it bothers you, record the reference in a quieter room.

On two sets of planted defects (18 clips each, `docs/pitch-replacement.md`, measured 2026-10-28 with the current pitch tracker), the
voice review caught 5 of 8 planted sniffs and 7 of 8 planted loud words, with 3 false loud-word alarms in 28 clean cases.

Treat every flag as a candidate: listen to it. A clean report means "nothing the detectors know about", not "good".

### Tune the checks on your own voice
Do this once for a new voice or a new engine, before trusting a clean report:

1. Make a short episode in your own voice (`tts`, `align`), then run `voicereview <ep> --reel 12`. It writes clips and a listening reel
   to `audio/review/` (`reel.wav`, with `reel.txt` listing each clip).
2. Listen to every clip in the reel and to the whole narration once. Note which flags are real and which defects nobody flagged.
3. Too many false alarms: raise `--min` (default 0.3). Missed defects: lower it. For take defects, the cutoffs are the constants at
   the top of `tools/take_defects.py` (`DROPOUT_DB`, `EXTRA_OVER_DB`, `EXTRA_MIN`); for desniff, `ATTEN_DB` and `EDGE` in `tools/desniff.py`.
4. A voice that is much higher or lower than a man's speaking voice may fall outside the pitch tracker's range: `fmin` and `fmax` in
   `tools/pitch.py` (75 and 300 Hz).
5. Write down what you changed and what you heard, and re-run `npm test` and the Python tests next to each file you changed
   (`tools/take_defects_test.py`, `tools/desniff_test.py`, `tools/pitch_test.py`; they need numpy).

## 6. Only a human approves delivery

Audio-judging models (large audio-language models and a speech-quality predictor) were tried on planted defects and failed: they said
"unnatural" for every clip or gave the same score for clean and broken audio. Do not rely on them.

Before you publish: listen to the whole narration once at normal speed, and listen again at every flagged time and every phrase that
was reworded. Add phrases that must be pronounced correctly (product names, homophones such as "read") to `must-hear.txt` so `asr`
checks them on every run.
