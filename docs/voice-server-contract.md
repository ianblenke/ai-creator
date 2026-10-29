# Voice server contract

Every voice lane is a separate HTTP server that answers on the compose network as `voice` (port 8080), so `VOICE_URL`
(default `http://voice:8080`) never changes when you switch lanes. The `tts` stage (`tools/stages/tts.js`, `httpTransport`) is the only
client. This page says exactly what it sends and what each server does with it, read from the code on 2026-10-29
(`tools/stages/tts.js`, `docker/chatterbox/server.py`, `docker/cpu-clone/README.md`, `docker/kokoro/README.md`).
To add an engine, implement the two POST routes and `/health` below.

## Which route `tts` uses
- `VOICE_TRANSPORT=fixture`: no server at all; silent scene audio sized from the episode's `timeline.json`. An episode with none (a new
  topic) gets an estimated one from the script first (marked `"estimated": true`); a real timeline from `align` is never rewritten.
- `VOICE_REF` set: the clone route, once per scene (or once per pause segment). `tts` first checks that `voice/CONSENT.md` exists and is
  not an unedited copy of the example.
- `VOICE_REF` unset: the voice-name route with `VOICE_NAME`.

Before the first request `tts` polls `GET /health` until the server is ready (below). Requests run one at a time; `tts` waits up to
600 s for each. A reply that is not HTTP 2xx, is shorter than 44 bytes or does not start with `RIFF` fails the stage with
`voice server request failed (status N, B bytes)`, followed by the server's error detail when it sent one. A refused connection is
`voice server unreachable at <url>: <reason>`, and a timeout says so.

## `POST /v1/audio/speech/clone` (clone route)
`multipart/form-data` with these fields:

| field | type | value `tts` sends |
|---|---|---|
| `input` | text | the scene's spoken text (pause markers split it into several requests) |
| `ref_text` | text | `VOICE_REF_TEXT`, the exact words spoken in the reference clip |
| `language` | text | `en` |
| `num_step` | text (an integer) | `VOICE_NUM_STEP`, default `24` |
| `ref_audio` | file, `audio/wav`, filename `ref.wav` | the bytes of the file at `VOICE_REF` |

Reply: a WAV file (`audio/wav`). Chatterbox and the OmniVoice CPU server both return 24 kHz mono 16-bit PCM. `tts` normalizes every
scene to -16 LUFS afterwards, so the server's own level does not matter.

Per engine:
- **Chatterbox** (`docker/chatterbox/server.py`): uses `input` and `ref_audio` only. `ref_text`, `language` and `num_step` are accepted and
  ignored. It reads the clip with Python's `wave` module: a clip that module cannot read (not a PCM WAV, or truncated) gives HTTP 400
  `ref_audio is not a readable PCM WAV file (convert it: ffmpeg -i in.m4a -ac 1 -ar 24000 ref.wav)`, which `tts` prints; a readable clip
  under 5 s or over 40 s only logs a warning. Empty `input` gives HTTP 400 `empty input`. Delivery settings come from the server's environment, not the request:
  `CHATTERBOX_EXAGGERATION` (0.6), `CHATTERBOX_CFG_WEIGHT` (0.3), `CHATTERBOX_TEMPERATURE` (0.9), `CHATTERBOX_SEED` (unset = random; a set seed reseeds before every request, so every retake of the same text is the same or nearly so (read from the code, not run); the
  seed path is not covered by a test).
  With compose you set them as `VOICE_EXAGGERATION`, `VOICE_CFG_WEIGHT`, `VOICE_TEMPERATURE` and `VOICE_SEED` in `.env` (not `.env.local`);
  compose.yaml passes the same values to the voice server and to the `media` container, where `tts` puts them in its cache key. Restart
  the voice service after changing them.
- **OmniVoice on CPU** (`docker/cpu-clone/server.py`): uses all five fields; `ref_text` is required there, and `num_step` 0 means the
  server's `NUM_STEPS`. `ref_text` must match the clip, or short replies speak extra words.
- **OmniVoice on GPU** (`gpu` image, third-party): has this route, but cloning through it is NOT tested (`docs/m5-voice-server-log.md`).
- **Kokoro** (`docker/kokoro`): HTTP 501, it cannot clone.
- **Stub** (`tools/voice-stub.js`, profile `stub`): only the voice-name route exists (a quiet sine tone sized to the
  word count); the clone route and `/health` answer 404. A transport test only, run with `VOICE_TRANSPORT=http` and `VOICE_NAME=stub`;
  it is not a first-run path (that is `VOICE_TRANSPORT=fixture`, `examples/ep01-kettle/README.md`).

## `POST /v1/audio/speech` (voice-name route)
JSON body: `{"input": "<text>", "voice": "<VOICE_NAME>", "num_step": <VOICE_NUM_STEP as a number>}`. Reply: a WAV file.

- **Chatterbox**: HTTP 400 ("this lane is clone-only ...") unless the server's `CHATTERBOX_DEFAULT_REF` names a reference file mounted
  inside the voice container; then it speaks `input` in that voice and ignores `voice` and `num_step`. compose.yaml does not set
  `CHATTERBOX_DEFAULT_REF`, so on this lane always set `VOICE_REF`.
- **OmniVoice**: `voice` is a preset name (`GET /v1/voices`) or, on the CPU server, `male_en` / `female_en` or a voice-design string.
- **Kokoro**: `voice` is a preset id such as `af_heart` (`GET /v1/voices`); `num_step` is ignored.

## `GET /health`
HTTP 200 when the server is up. Reply: `{"ok": true, "ready": ..., "error": ..., "engine": "..."}`.

- **Chatterbox** starts the HTTP server at once and loads its model in a background thread. `ready` is false until the model has
  loaded (the first start downloads about 3.19 GB of weights first), then true; a failed load sets `error` (the exception's type and
  text) and `ready` stays false.
- **OmniVoice CPU** and **Kokoro** load their model before the server starts listening, so whenever `/health` answers it says
  `"ready": true` (no `error` field).
- `engine` names the lane: `VOICE_ENGINE_TAG` as compose sets it per service (`chatterbox-gpu`, `chatterbox-cpu`, `omnivoice-cpu`,
  `kokoro-cpu`), the package version, and the weights pin or model id, for example
  `chatterbox-cpu chatterbox-tts==0.1.7 weights@<commit>`.

What `tts` does with it (`waitForServer` in `tools/stages/tts.js`), with `VOICE_TRANSPORT=http`:
- it polls every 5 s while `ready` is false, up to `VOICE_READY_WAIT` seconds (default 1800), printing once that the server is still
  loading; after that it stops with `voice server still loading its model after N s (VOICE_READY_WAIT)`;
- it stops at once on an `error`: `voice server could not load its model: <error>`;
- a refused connection is retried for 30 s (the container may still be starting), then reported;
- a server whose `/health` has no `ready` field (a 404, a plain `ok`) counts as ready.

The engine is part of the `tts` cache key, so switching lanes, upgrading the package or changing the weights pin re-synthesizes
instead of reusing another engine's takes. Two consequences:
- Takes cached before the engine joined the key do not match any more: the first `tts` run after updating re-makes every scene
  once (and `besttake` picks need redoing on those scenes).
- With the http transport, `tts` asks `/health` before anything else, so it needs a reachable voice server even when every scene
  is already cached.

Engine name, in order: `VOICE_ENGINE_TAG` in `.env.local` (overrides everything; set it after changing `VOICE_IMAGE`), else the
`engine` the server reports, else `unreported:<hash of VOICE_URL>` (the third-party `gpu` image names no engine), and for the ssh
transport `ssh:<VOICE_CONTAINER>`. The Chatterbox image's `HEALTHCHECK` and the `voice-cpu` compose healthcheck call this route.

## The ssh transport
`VOICE_TRANSPORT=ssh` does not use the routes above from your machine: it runs `curl` inside `VOICE_CONTAINER` on `VOICE_SSH_HOST` and posts the
voice-name JSON to that container's own port 8000. It cannot clone.

## Testing a server without the model
`docker/chatterbox/test_server.py` runs the Chatterbox server with a stub model:
`pip install fastapi==0.162.0 httpx python-multipart==0.0.32 numpy && python -m unittest discover docker/chatterbox` (also run in CI).
