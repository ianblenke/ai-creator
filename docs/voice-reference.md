# Record your voice reference

A cloned voice copies its delivery from one short recording of you: pace, pitch movement, energy. This page covers what the voice
servers need, a reading text to record, the commands to turn the recording into a reference clip, and a check that the clone works.
Only clone your own voice, or one you have written permission to clone (`voice/CONSENT.example.md`). Never commit the audio:
`voice/` is gitignored and blocked by the repo check. For delivery and the defects to listen for, see `docs/narration-quality.md`.

## What was tested (2026-10-29)
| lane | clone route | status |
|---|---|---|
| `chatterbox` (NVIDIA GPU) and `chatterbox-cpu` | `/v1/audio/speech/clone` | cloning measured in the bake-off on one reference clip of one voice (`docs/voice-engine-bakeoff.md`); a full `tts` run of the example through these compose services is NOT recorded |
| `cpu-clone` (OmniVoice, CPU) | same route | returned audio for single sentences (timings in `docker/cpu-clone/README.md`); output not checked by ear or by `asr`; the full `tts` stage not run on it |
| `gpu` (OmniVoice image) | same route | NOT tested: only preset voices were run (`docs/m5-voice-server-log.md`) |

## The clip
- **Format:** WAV, 16-bit PCM, mono. 24 kHz is what the commands below produce; the Chatterbox server checks the length with Python's
  `wave` module, so use plain PCM WAV (not MP3, not 32-bit float). Anything that module cannot read (another format, or a truncated
  file) is refused with HTTP 400 `ref_audio is not a readable PCM WAV file (convert it: ...)`, and `tts` stops with that text; convert
  the clip with the commands below. The OmniVoice CPU server does not make this check.
- **Length:** 10 to 30 seconds of continuous speech. The Chatterbox server warns below 5 s and above 40 s.
- **Level:** no clipping; peaks no higher than about -3 dBFS; speech around -20 LUFS (the commands below set it). The level of the clip does
  not set the level of the narration: `tts` normalizes every scene to -16 LUFS. What matters is a quiet background: the room noise
  between sentences ends up in the clone.
- **Room:** quiet, soft furnishings, no music, no fan noise; keep the same microphone distance for every later recording.
- **Delivery:** as if explaining something to a friend, not reading aloud. The clone copies a flat reading as faithfully as a lively one.

## Reading text (about one minute, 170 words)
Read it two or three times, then keep the liveliest 15 to 25 second stretch. You can also record your own text: it only needs questions,
a few stressed words, and a mix of short and long sentences.

> Have you ever noticed that toast seems to land butter side down? It doesn't, not every time. But it happens just often enough that
> we remember it, and that is the interesting part. Memory keeps the surprising moments and quietly throws the boring ones away.
>
> Here is a small test you can try this week. Every time a traffic light turns red right as you arrive, make a note. Then, and this is
> the part people skip, make a note every time it stays green. After seven days, count both lists. Most people expect the red list to
> be longer. It almost never is.
>
> So why does it feel unlucky? Because waiting is annoying, and annoyance is easy to remember. A green light costs you nothing, so
> nothing sticks.
>
> I find that oddly comforting. The world is not out to get you. The moments that bother you shout, and the moments that help you
> whisper. Listen for the whispers, and the week looks a lot kinder.

## Capture and convert
Record on your own machine with any recorder (Audacity, your phone's voice memo app, or ffmpeg). The containers have no microphone.
With ffmpeg on Linux (PulseAudio or PipeWire), into the repo's `voice/` folder; stop with `q`:

    ffmpeg -f pulse -i default -ac 1 -ar 48000 voice/take.wav
    # macOS: ffmpeg -f avfoundation -i ":0" -ac 1 -ar 48000 voice/take.wav

The capture lines were not run for this page. The two commands below were run on a synthetic test tone on 2026-10-29 with ffmpeg on the
host; in the tools image the same arguments go after `docker compose run --rm --entrypoint ffmpeg media`.

Cut the chosen stretch (here 12.0 to 32.0 s; find yours by listening), remove rumble, set the level, and write 24 kHz 16-bit mono:

    docker compose run --rm --entrypoint ffmpeg media -i voice/take.wav -ss 12.0 -to 32.0 \
      -af "highpass=f=70,loudnorm=I=-20:TP=-3:LRA=11" -ar 24000 -ac 1 -c:a pcm_s16le voice/ref.wav

Check the result: the first command prints `mean_volume` and `max_volume` (the peak, which should be below about -3 dB), the second
the format (`pcm_s16le`, 24000 Hz, 1 channel) and the length:

    docker compose run --rm --entrypoint ffmpeg media -hide_banner -i voice/ref.wav -af volumedetect -f null -
    docker compose run --rm --entrypoint ffprobe media -hide_banner voice/ref.wav

## Configure `tts`
In `.env.local`:

    VOICE_TRANSPORT=http
    VOICE_REF=voice/ref.wav
    VOICE_REF_TEXT=Here is a small test you can try this week. Every time a traffic light turns red right as you arrive, make a note.

- `VOICE_REF` is read by the `tts` stage inside the `media` container, whose working directory is the repo mounted at `/work`. So it is a
  path inside that container: `voice/ref.wav` (or `/work/voice/ref.wav`) works; a path on your own machine outside the repo does not.
  `tts` uploads the file's bytes to the voice server, which never sees the path.
- `VOICE_REF_TEXT` is ONE line: the exact words of the clip you kept, proofread against the recording, including every "and" and
  restart. `tts` refuses to start without it. Chatterbox ignores it; OmniVoice uses it, and a wrong transcript makes short replies speak
  extra words.
- `VOICE_NAME` is not needed when `VOICE_REF` is set. `VOICE_TRANSPORT` must be `http` (the example file starts at `fixture`).
- Before it clones, `tts` checks for `voice/CONSENT.md`: copy `voice/CONSENT.example.md` there and fill it in. This is a speed bump,
  not proof that the voice is yours.
- The `tts` cache key includes the clip and its text, so changing either re-synthesizes every scene. It also includes the engine the
  server names on `/health` (`docs/voice-server-contract.md`), so switching lanes re-synthesizes too.

## Check the clone: a pangram and the transcript check
Make a one-scene test episode (do not commit it):

    mkdir -p episodes/voicetest
    printf '# Voice test\n\n## The test\n\nThe quick brown fox jumps over the lazy dog. Did anyone see that? Then it ran, very fast, back into the woods.\n\n> VISUAL: none\n' > episodes/voicetest/script.md

Start one voice lane (for example `docker compose --profile chatterbox-cpu up -d voice-chatterbox-cpu`), then:

    docker compose run --rm media tts episodes/voicetest
    docker compose run --rm media asr episodes/voicetest

`asr` ends with `narration transcript check: 1 scene(s) match the script`, or lists each word it heard differently. Then listen to
`episodes/voicetest/audio/01-the-test.wav` yourself: the transcript check does not judge whether it sounds like you. If it does not, try a
livelier or cleaner stretch of your take before changing any engine setting. Delete `episodes/voicetest/` when you are done.

## GPU lanes: prerequisites and sizes
The `chatterbox` and `gpu` profiles need an NVIDIA GPU, its driver, and the NVIDIA Container Toolkit. On the one machine where this was set
up (`docs/m5-voice-server-log.md`): install the toolkit with your distribution's package, run `sudo nvidia-ctk runtime configure
--runtime=docker`, restart Docker, and check with `docker run --rm --gpus all ubuntu:24.04 nvidia-smi -L`. Without the toolkit,
`docker run --gpus all` fails with "failed to discover GPU vendor from CDI: no known GPU vendor found".

Sizes measured so far: the OmniVoice `gpu` image is 27.7 GB on disk; the `cpu-clone` image is 2.5 GB plus 3.1 GB of weights; the Kokoro
`cpu` image is 2.2 GB plus about 330 MB of weights. The Chatterbox CPU image is 2.67 GB plus 3.19 GB of weights; its server
peaked at 7.3 GB of RAM in the bake-off. Hardware and model sizes in one place: `docs/hardware-and-models.md`.
