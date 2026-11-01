# audio8: Audio8-TTS-Realistic-0.6B on an NVIDIA GPU, your own voice

    docker compose --profile audio8 up -d voice-audio8
    docker compose run --rm media tts episodes/my-episode

Answers as `voice` (`VOICE_URL` unchanged). Same routes and output as the Chatterbox lane (`POST /v1/audio/speech/clone`, `GET /health`;
24 kHz mono 16-bit WAV; one request at a time), with two differences: the clone route REQUIRES `ref_text`, the exact words spoken in the
reference clip (`tts` sends `VOICE_REF_TEXT`; a missing one is refused with HTTP 400), and there is NO watermark (see NOTICE).

Settings (in `.env`): `AUDIO8_TEMPERATURE` (0.8); `VOICE_SEED` (unset = random; leave it unset for `besttake`). `/health` reports the lane, the
weights pin and the sampling values, so `tts` re-makes takes when any of them changes. The pin `AUDIO8_REVISION` in the Dockerfile covers
the weights AND the Python the model runs (`trust_remote_code`): bump it only after reading the new files. The server fetches the public repo
without a token. The first start downloads the weights into the `audio8-models` volume.

Measured once (2026-11-01, RTX 3090, bf16): 2.7 GB VRAM peak; an 8 s sentence took 7.8 s and a 4.4 s sentence 2.9 s. Quality was judged by
one listener on one clip. Tests: `python -m unittest discover docker/audio8` (stub model; needs torch).
