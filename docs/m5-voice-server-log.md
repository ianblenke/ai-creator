# Voice server test log (M5), 2026-10-26

Machine: x86_64 Linux (CachyOS), 2x GeForce RTX 3090 (24 GB), driver 615.78.08, Docker 29.9.2, NVIDIA Container Toolkit 1.20.1.
Steps that were needed on a fresh Docker host: install the toolkit (`pacman -S nvidia-container-toolkit`; other distros differ), `sudo nvidia-ctk runtime configure --runtime=docker`, restart Docker, check `docker run --rm --gpus all ubuntu:24.04 nvidia-smi -L`.
Before the toolkit: `docker run --gpus all` failed with "failed to discover GPU vendor from CDI: no known GPU vendor found".

Image: `ghcr.io/hsiang-han/omnivoice-triton-api:latest` (third-party, Apache-2.0, amd64, 27.7 GB on disk; compose pins digest `sha256:541b1fcc…1205b`, built 2026-06-10, checked 2026-10-28).
Start: `docker compose --profile gpu up -d voice`. First start downloads the model (about 13 files, 12 s here); healthy within ~45 s.
Result: OpenAI-style `POST /v1/audio/speech` returns a 24 kHz WAV. Built-in preset voices only (`/v1/voices`); cloning is a separate upload route (`/v1/audio/speech/clone`), NOT yet tested.
Speed (triton runner, num_step 24): 0.3 to 0.6 s per sentence of 2 to 5 s of audio. VRAM in use after warm-up: about 2.4 GB.
`tools/stages/tts.js` `httpTransport` verified against it.

Not yet done: voice cloning from a reference clip, a 12 GB card, WSL2 or other distros, the full pipeline run (align/asr/render) on this machine. (The image digest has been pinned since 2026-10-28, as above.)

## Affect (2026-10-26): the preset voice is flat
Author feedback on the first example render: "dry with no affect, leaving the video bland". The server's voice design accepts ONLY this vocabulary (error text from the server): american/australian/british/canadian/chinese/indian/japanese/korean/portuguese/russian accent, child, teenager, young adult, middle-aged, elderly, female, male, very low/low/moderate/high/very high pitch, whisper. "warm", "expressive" etc. are rejected (HTTP 500). So there is NO emotion control in design mode; the other levers are `guidance_scale`, `num_step`, the text itself, and above all the REFERENCE CLIP when cloning (cloning copies its delivery). Tutorial consequence: the series part on cloning your own voice must teach how to record an expressive reference (energy, as if explaining to a friend), and the example must not be judged on a preset voice.
