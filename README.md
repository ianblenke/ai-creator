# AI Creator

Make your own AI-narrated 2D YouTube series: you write a spec and facts, an AI voice in YOUR cloned voice narrates, AI models author the
animations, and a deterministic pipeline renders, checks and packages the video. Companion to the YouTube series "AI Creator".

STATUS: under construction. Nothing here is a finished tutorial yet.

## The pipeline
The whole run, from a copied episode to MP4 to upload, in order, with the expected last line, runtime and output files of each step:
`docs/tutorial/full-run.md`. Every step is `docker compose run --rm media <step> episodes/<id>`; the voice-stage order and retake rules
are in `docs/tutorial/takes.md`, and all tutorial pages in watch order in `docs/tutorial/README.md`.

    new | validate -> lint-endings -> safety -> tts -> align -> besttake -> desniff -> align -> asr -> takedefects -> fixaudio (if flagged)
    -> voicereview -> scenes -> check-anchors* -> keyframes -> layout-check* --step 0.1 -> render --draft -> encode --draft
    -> render --check --step 1 -> render -> verifyclips --step 0.35 -> encode -> encode --burn -> finalcheck -> thumbnail* -> youtube* upload
    (* = a script: docker compose run --rm --entrypoint node media tools/<name>.js ...; render --check to finalcheck in one go:
     docker compose run --rm --entrypoint bash media tools/pipeline.sh episodes/<id>)

## Before you start
| need | what | notes |
|---|---|---|
| OS | Linux on x86_64 | the only OS tested. macOS, Windows/WSL2 and arm64: not tested; the GPU images are amd64 and NVIDIA only |
| Docker | Docker Engine with Compose v2.24 or newer | tested with Docker 29.8 and 29.9, Compose 5.1 |
| GPU | optional | an NVIDIA GPU with the NVIDIA Container Toolkit speeds up the voice; every step also has a CPU lane. Which cards work is not tested: the one Chatterbox GPU run did not record its card model, and the image's torch 2.6.0 CUDA 12.4 wheels are believed (not tested) to lack RTX 50-series (Blackwell) support and to need a recent driver. With no usable GPU the server silently runs on the CPU (only its log line `model loaded on cpu` says so) |
| RAM | more than 7.3 GB free for the Chatterbox CPU lane | its measured peak in the bake-off, for that server alone (4.1 GiB after one short sentence through compose); other lanes: see `docs/hardware-and-models.md` |
| disk | the tools image plus one voice lane | measured: tools image 8.09 GB; Chatterbox CPU image 2.67 GB + 3.19 GB weights; OmniVoice `gpu` image 27.7 GB; `cpu-clone` image 2.5 GB + 3.1 GB weights; Kokoro `cpu` image 2.2 GB + about 330 MB weights. Not measured: the Chatterbox GPU image |
| hosted model | a paid coding-agent account | the scene animations, script critique and reviews are written by a hosted model through a coding agent (the series uses Claude Code); the cost per episode is not measured yet. See `docs/agent-layer.md` |
| accounts | Google account and a Google Cloud project | only for uploading (YouTube Data API v3): `docs/upload.md` |
| host Node | Node 22.23.4 or newer on your own machine, and a browser | only for two things: signing in to YouTube (`tools/youtube.js auth`, `check` and the real upload run on the host; the dry run and `status` may also run in the container, `docs/upload.md`), the git hooks (`tools/hooks/` call `node`; without it every commit is blocked), and the OCR frame scan (also needs `tesseract-ocr` and ffmpeg on the host) |
| your voice | a 10 to 30 s recording of yourself | `docs/voice-reference.md`; only ever clone your own voice, or one you have written permission to clone |
| network | for the build and the first run of each check | `align`, `asr`, `desniff` and `voicereview` download their models at first use into `.cache/`; a voice server downloads its weights on its first start (Chatterbox: about 3.19 GB) |

Sizes, the models downloaded at first use and their recorded revisions, and the machines behind every measured number:
`docs/hardware-and-models.md`. Every number in these docs with its source, date and sample size: `docs/claims.md`.

## Quickstart (no GPU, offline)
    cp .env.example .env.local                                          # tool settings; VOICE_TRANSPORT=fixture is the default
    printf 'HOST_UID=%s\nHOST_GID=%s\n' "$(id -u)" "$(id -g)" > .env    # compose settings: run the container as you
    docker compose build

Then the offline steps in `examples/ep01-kettle/README.md` (`tts`, `align`, `scenes`, `keyframes`, `render --draft`,
`encode --draft`), each with the line it should print. The fixture lane (silent narration sized from the example's committed
`timeline.json`) is the only first-run path: it needs no voice server, no voice name and no network after the build. It also runs on a
new topic made with `new`: with no `timeline.json` there, `tts` writes an estimated one from the script (marked `"estimated": true`,
rebuilt on the next fixture `tts`; a real timeline is never rewritten), so scenes can be drafted before any voice exists
(`docs/tutorial/full-run.md`, section 1). The `stub`
compose profile is a transport test (a tone, not speech) that needs `VOICE_TRANSPORT=http` and `VOICE_NAME=stub`; it is not a first run.

## Safety setup
Before your first episode: copy `safety/denylist.example.txt` to `safety/denylist.txt` and put your own private names in it, and run
`sh tools/hooks/install.sh` to enable the git hooks (they run `node` on the host: install Node 22.23.4 or newer first, or every
commit is blocked with `node: command not found`). What the gate catches and what it cannot catch: `docs/safety.md`.

## Host commands and container commands
The docs write some commands as `node tools/<name>.js ...` (the form a coding agent on the host uses). In a Docker-only setup run
`docker compose run --rm --entrypoint node media tools/<name>.js ...` instead, and `node tools/cli.js <stage> <episode>` is
`docker compose run --rm media <stage> <episode>`. Only the YouTube sign-in, the git hooks and the OCR frame scan (tesseract is not in the tools image: `docs/safety.md`) need
Node on the host.

## Tests in a container
    docker compose run --rm --entrypoint npm media test

The Node tests (including `tools/docs-links.test.js`, which fails on any doc that names a missing file) and the Python tests that need
no numpy. All the Python tests, including the ones that need numpy (they run in the tools image, not on a bare host):

    docker compose run --rm --entrypoint npm media run test:py

## Voice lanes
Every lane answers on the compose network as `voice`, so `VOICE_URL` stays `http://voice:8080`. Run one voice profile at a time.
Licence lines below say what each page said when read; they are not legal advice (`NOTICE`, `docs/licences.md`).

1. **Chatterbox original, your own voice (recommended).** Profiles `chatterbox` (NVIDIA GPU) and `chatterbox-cpu` (docker/chatterbox).
   Code MIT, weights tagged MIT; training data not disclosed. Not tested end to end: no full `tts` run through these compose services
   is recorded (one clone request through `chatterbox-cpu` was, 2026-10-29). Every output carries Resemble's Perth watermark, which stays on and is
   never patched. Settings "F": exaggeration 0.6, cfg_weight 0.3, temperature 0.9, chosen by the author's ear in `docs/voice-engine-bakeoff.md`.
2. **OmniVoice, your own voice (optional, non-commercial).** Profiles `gpu` (NVIDIA GPU, third-party image) and `cpu-clone` (docker/cpu-clone).
   The weights are CC-BY-NC: if your channel is or becomes monetized, or a sponsor or client is involved, that licence may not allow it.
   Cloning on the `gpu` image is NOT tested.
3. **Kokoro presets, no cloning.** Profile `cpu` (docker/kokoro), `VOICE_NAME=af_heart`. Apache-2.0 code and weights per the model page;
   its training data includes CC BY sources that ask for credit, and the image installs espeak-ng (GPL-3.0-or-later). Clear but flat:
   good for learning the pipeline and drafts.
4. **A rented NVIDIA GPU:** run lane 1's or 2's image there and set `VOICE_URL` to it (not tested).

AMD GPUs are not a lane: OmniVoice on ROCm hung one integrated Radeon tested (780M) and ran on another (890M) at about CPU speed,
so there is no `rocm` profile. Use a CPU lane or a rented NVIDIA GPU. Details: `docs/rocm-notes.md`.

Speed, each measured once on one machine (real-time factor = seconds of compute per second of audio; below 1 is faster than real time):

| lane | hardware | settings | measured | real-time factor |
|---|---|---|---|---|
| Chatterbox | an NVIDIA GPU, model not recorded (noted as "4 GB VRAM") | F | 2026-10-29, bake-off paragraphs | about 0.43 |
| Chatterbox | a CPU, model not recorded, 8 threads | F | 2026-10-29, bake-off paragraphs; 7.3 GB RAM peak, 18 s model load | about 3.5 |
| OmniVoice clone | CPU, 16 cores | 24 steps | 2026-10-27, one 4.7 s sentence | 8.4 |
| Kokoro preset | CPU, 16 cores | n/a | 2026-10-27, one 5.5 s sentence | about 0.14 |

So the example (182.8 s of narration in its committed timeline) would take roughly 11 minutes to synthesize on the Chatterbox CPU
lane at 8 threads, before retakes: an estimate (182.8 s x 3.5), not a timed run. Compose sets no `THREADS`, so the server uses every
core by default; at that default no speed was measured. More rows: `docker/cpu-clone/README.md`, `docs/voice-engine-bakeoff.md`.

To clone your voice with Chatterbox: record a clip (`docs/voice-reference.md`), fill in `voice/CONSENT.md` (copy `voice/CONSENT.example.md`),
then in `.env.local` set `VOICE_TRANSPORT=http`, `VOICE_REF` and `VOICE_REF_TEXT` (required by `tts`; Chatterbox ignores it), and:

    docker compose --profile chatterbox-cpu up -d voice-chatterbox-cpu   # or --profile chatterbox up -d voice-chatterbox on an NVIDIA GPU
    mkdir -p episodes && cp -r examples/ep01-kettle episodes/my-kettle   # never synthesize into the shipped example
    docker compose run --rm media tts episodes/my-kettle

A real `align` replaces the copy's `timeline.json` with your narration's timing; run against the shipped example, it would rewrite
tracked files and the fixture lane would then refuse to run there.

Settings go in `.env` (compose settings, not `.env.local`): `VOICE_EXAGGERATION`, `VOICE_CFG_WEIGHT`, `VOICE_TEMPERATURE`, `VOICE_SEED`
(unset = random; with a seed set, every retake of a sentence comes out the same or nearly so (read from the code, not run), so `besttake` and `fixaudio` cannot improve it). The request format of every lane: `docs/voice-server-contract.md`. `tts` keys its cached takes on the engine each server
names on `/health` (lane, package version, weights pin), so switching lanes re-synthesizes; `VOICE_ENGINE_TAG` in `.env.local`
overrides that name (set it after changing `VOICE_IMAGE`, whose server names none). A flat voice makes a bland video: read
`docs/narration-quality.md` on delivery and the defects to check for.

Offline server tests (stub model), in a virtual environment (a bare `pip install` fails on distributions that follow PEP 668;
`httpx` and `numpy` are unpinned here):

    python3 -m venv .venv-test && .venv-test/bin/pip install fastapi==0.162.0 httpx python-multipart==0.0.32 numpy
    .venv-test/bin/python -m unittest discover docker/chatterbox

The CI workflow runs these too, but it has not run yet (the repository has no remote).

## Disclose the cloned voice
Every video description says that the narration is synthetic and names the voice model. The upload dry run checks for two lines
(patterns in `docs/upload.md`). Write the first one that is true: your own clone ("a cloned copy of my own voice"), someone else's
voice used with their written permission ("a cloned copy of <name>'s voice, used with their written permission"), or a preset voice
with no cloning ("a synthetic preset voice (<voice id>)"), each followed by "generated with <model>". For example:

    The narration is a cloned copy of my own voice, generated with Chatterbox.
    Voice model: Chatterbox by Resemble AI; code MIT licence, weights tagged MIT on the model page (licence read 2026-10-29): https://huggingface.co/ResembleAI/chatterbox

Every upload sets YouTube's altered-or-synthetic content flag (`docs/upload.md`). Unresolved, not legal advice: whether the EU AI
Act's Article 50(4) disclosure duty (applying from 2 August 2026, per the pages read) covers narration cloned from your own voice,
and in what form; a spoken or on-screen line saying the voice is a clone is the cautious choice (`docs/voice-cloning-law.md`).

## Read first
- `docs/tutorial/README.md`: the tutorial pages in watch order (`full-run.md`, `takes.md`).
- `docs/upload.md`: the YouTube upload setup checklist.
- `docs/agent-layer.md`: what the hosted model writes (scenes, critique, reviews) and the prompts it gets.
- `docs/hardware-and-models.md`: sizes, the models downloaded at first use, and the machines behind every number.
- `docs/voice-cloning-law.md`: cloning a voice for content, with its sources and who read them; not legal advice.
- `docs/safety.md`: what the content-safety gate catches and what it misses.
- `NOTICE` and `docs/licences.md`: model licences, what each page said, the read date and who read it.
- `docs/narration-quality.md`: a lively cloned voice, the defects the transcript check misses, and how `fixaudio` retakes them.
- Only ever clone your own voice, or one you have written permission to clone. Never commit voice audio (`voice/` is blocked by the repo check).
