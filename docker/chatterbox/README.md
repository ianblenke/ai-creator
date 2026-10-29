# chatterbox: Chatterbox (original) on CPU or NVIDIA GPU, your own voice

    docker compose --profile chatterbox-cpu up -d voice-chatterbox-cpu     # CPU
    docker compose --profile chatterbox up -d voice-chatterbox             # NVIDIA GPU (CUDA wheels via TORCH_INDEX)
    mkdir -p episodes && cp -r examples/ep01-kettle episodes/my-kettle   # never synthesize into the shipped example
    docker compose run --rm media tts episodes/my-kettle

Answers as `voice` (`VOICE_URL` unchanged). Routes: `POST /v1/audio/speech/clone` (multipart `input`, `ref_audio`; `ref_text`, `language` and `num_step`
are accepted and ignored), `POST /v1/audio/speech` (400 "clone-only" unless `CHATTERBOX_DEFAULT_REF` names a mounted reference file), `GET /health`.
Output: 24 kHz mono 16-bit WAV. One request at a time. A reference that Python's `wave` module cannot read (not a PCM WAV, or a
truncated file) is refused with HTTP 400 `ref_audio is not a readable PCM WAV file (convert it: ...)`; convert it as in
`docs/voice-reference.md`. A readable reference under 5 s or over 40 s is accepted with a log warning.

Before `tts`, set in `.env.local` (tool settings): `VOICE_TRANSPORT=http`, `VOICE_REF` and `VOICE_REF_TEXT`, and fill in `voice/CONSENT.md`.

Settings go in `.env` (compose settings, not `.env.local`): `VOICE_EXAGGERATION` (0.6), `VOICE_CFG_WEIGHT` (0.3), `VOICE_TEMPERATURE` (0.9),
`VOICE_SEED` (unset = random; a set seed makes every retake the same or nearly so (read from the code, not run), so leave it unset for `besttake` and `fixaudio`). Compose passes them to this server (as its `CHATTERBOX_*` variables) and to the media container, where they
are part of the tts cache key; restart the voice service after changing them. `CHATTERBOX_REVISION` (weights commit) is pinned in the
Dockerfile; `THREADS` sets the CPU threads (unset: all cores; compose does not set it).

The server loads the model when it starts, in a background thread, not on the first request. On the first start that means
downloading about 3.19 GB of weights into the `chatterbox-models` volume; later starts reuse them. Until the model has loaded,
`GET /health` reports `"ready": false` (and an `error` if loading failed), and `tts` waits for `"ready"` before its first request (up to
`VOICE_READY_WAIT` seconds, default 1800). `/health` also reports `engine` (`VOICE_ENGINE_TAG` from compose, `chatterbox-gpu` or
`chatterbox-cpu`, the `chatterbox-tts` version and the weights pin); `tts` puts it in its cache key (`docs/voice-server-contract.md`). Follow the download with `docker compose logs -f voice-chatterbox-cpu`. Measured once
(2026-10-29, CPU, before the load moved to startup): the first request took 54 s including the download, and the server held
4.1 GiB afterwards. With no usable GPU the `chatterbox` profile runs on the CPU without an error; the log line `model loaded on cpu`
shows it.

The Perth watermark that the library applies to every output is kept (NOTICE). Tests: `python -m unittest discover docker/chatterbox`.
