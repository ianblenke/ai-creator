# Hardware, sizes and models

Only measured numbers are given, each with where it was measured. "Not measured" means nobody has measured it yet; it does not mean
small. Speeds per voice lane are in the README's speed table.

## What has been tested
- **OS:** Linux on x86_64 only (one machine is recorded as CachyOS in `docs/m5-voice-server-log.md`). macOS, Windows/WSL2 and arm64 are
  not tested. The OmniVoice `gpu` image is amd64 only; the GPU profiles need an NVIDIA GPU and the NVIDIA Container Toolkit.
- **Docker:** Docker 29.8 and 29.9 with Compose 5.1 and 5.6. Compose v2.24 or newer is required (`env_file` with `required:`).
- **Machines the numbers come from** (one run each unless a range is given):

| machine | used for | source |
|---|---|---|
| 2x RTX 3090 (24 GB each), driver 615.78, NVIDIA Container Toolkit 1.20.1 | the OmniVoice `gpu` image: about 2.4 GB VRAM after warm-up, 0.3 to 0.6 s per 2 to 5 s sentence | `docs/m5-voice-server-log.md` |
| an NVIDIA GPU: card model and driver NOT recorded (noted only as "4 GB VRAM", not saying whether that is the card or the memory used) | Chatterbox, real-time factor about 0.43 | `docs/voice-engine-bakeoff.md` |
| a CPU, model not recorded, 8 threads | Chatterbox, real-time factor about 3.5, 7.3 GB RAM peak, 18 s model load | `docs/voice-engine-bakeoff.md` |
| 16-core x86_64, 92 GB RAM, no GPU | OmniVoice on CPU (`cpu-clone`), Kokoro (`cpu`); an earlier draft render of the example, about 9 min with 4 workers (superseded by the next row; the reason for the difference was not investigated) | `docker/cpu-clone/README.md`, `docker/kokoro/README.md`, `docs/claims.md` |
| 24-core x86_64, no GPU, Docker 29.9.2, Compose 5.6.1 (2026-10-29) | the example from a fresh clone: draft render 59 s and 123 s (default 6 workers, two runs), 60 fps render about 150 s, the whole `pipeline.sh` 549 s; Chatterbox CPU through compose: first request 54 s including the weight download, 4.1 GiB server memory afterwards; the image sizes below | `docs/claims.md` |
| two AMD integrated GPUs (780M, 890M) | OmniVoice on ROCm: one hung, one ran at about CPU speed | `docs/rocm-notes.md` |

None of these is a 12 GB card or a laptop; no claim about either is made here.

**GPU assumptions, untested:** the Chatterbox GPU image installs torch 2.6.0 with CUDA 12.4 wheels (chatterbox-tts 0.1.7 requires
torch 2.6.0). Those wheels are believed, not tested, to lack support for RTX 50-series (Blackwell) cards and to need a recent NVIDIA
driver. If the server finds no usable GPU it runs on the CPU without an error: only its log line `model loaded on cpu` shows it
(`docker compose logs voice-chatterbox`).

## Disk and memory

| item | disk | memory | source |
|---|---|---|---|
| tools image (`docker compose build`) | 8.09 GB (2026-10-29, two builds; a clean-clone build took about 20 min once, 110 s with the apt and Node layers cached) | not measured | review runs, `docs/claims.md` |
| inside it: the Python environment of `requirements-align.txt` | about 2.5 GB (the author's working environment, 2026-10-26). A clean build from the file worked on 2026-10-29 (torch 2.8.0+cpu, no `nvidia-*` packages). `numpy` and `soundfile` are unpinned (numpy 2.5.4 and pandas 3.1.0 were resolved that day), and whisperx pulls in `triton` 3.9.0 (285.7 MB) | not measured | `requirements-align.txt` |
| inside it: Node packages | 41 MB (2026-10-26) | | the author's machine |
| inside it: Playwright Chromium (part of the base image) | 681 MB (2026-10-26) | | the author's machine |
| Chatterbox CPU image (`chatterbox-cpu`) and its weights | image 2.67 GB, weights 3.19 GB in the `chatterbox-models` volume (2026-10-29) | 4.1 GiB after one short sentence through compose; 7.3 GB peak in the bake-off | `docs/claims.md`, `docs/voice-engine-bakeoff.md` |
| Chatterbox GPU image (`chatterbox`) | not measured | not measured | |
| OmniVoice `gpu` image | 27.7 GB | about 2.4 GB VRAM after warm-up | `docs/m5-voice-server-log.md` |
| OmniVoice `cpu-clone` image | 2.5 GB, plus 3.1 GB of weights | 1.3 GB RAM idle | `docker/cpu-clone/README.md` |
| Kokoro `cpu` image | 2.2 GB, plus about 330 MB of weights | about 2 GB RAM | `docker/kokoro/README.md` |
| an episode's generated files (`audio/`, `out/`) | not measured | | |

Docker memory: the Chatterbox CPU server alone peaked at 7.3 GB, so a Docker VM with a smaller memory limit (Docker Desktop sets one)
will not hold it. Rendering runs Chromium workers in the tools container; its memory use was not measured. Stop the voice server
before rendering (`docker compose --profile chatterbox-cpu down`).

## Models downloaded at first use
The tools container sets `XDG_CACHE_HOME=/work/.cache`, so downloaded models land in `.cache/` in your checkout (gitignored) and are
reused by later runs. The first `align`, `asr`, `desniff` and `voicereview` therefore need the network; later runs do not.

| model | used by | from | revision recorded on 2026-10-28 | size |
|---|---|---|---|---|
| wav2vec2 base 960h (English alignment) | `align` (WhisperX loads it through torchaudio) | download.pytorch.org (file `wav2vec2_fairseq_base_ls960_asr_ls960.pth`); licence row from huggingface.co/facebook/wav2vec2-base-960h | `22aad52d` (the Hugging Face page) | 361 MB (2026-10-26) |
| Whisper `small.en`, faster-whisper conversion | `asr`, `finalcheck`, `voicereview` | huggingface.co/Systran/faster-whisper-small.en | `d1d751a5` | not measured |
| AST AudioSet tagger | `desniff`, `voicereview` | huggingface.co/MIT/ast-finetuned-audioset-10-10-0.4593 | `f826b80d` | not measured |
| Chatterbox original (500M) | the voice server (`chatterbox` profiles) | huggingface.co/ResembleAI/chatterbox | `5bb1f6ee` (pinned in `docker/chatterbox/Dockerfile`) | 3.19 GB |
| OmniVoice | the voice server (`gpu`, `cpu-clone`) | huggingface.co/k2-fsa/OmniVoice | code `08be0b4c` | 3.1 GB (`cpu-clone`) |
| Kokoro-82M v1.0 | the voice server (`cpu`) | huggingface.co/hexgrad/Kokoro-82M | weights SHA-256 `496dba11…ad1e4` | about 330 MB |

The revisions are what each page showed when its licence was read (`docs/licences.md`). Except for Chatterbox, the code does NOT pin them yet: each tool
downloads the current revision, so a later download can differ from the one recorded here.

## Accounts
- A paid hosted-model account with a coding agent, for writing and reviewing scenes and scripts (the series uses Claude Code). Cost per
  episode: not measured.
- A Google account and a Google Cloud project with the YouTube Data API v3, only for uploading.
- Chatterbox's weights download without signing in (`docs/voice-engine-bakeoff.md`). For the other models this was not
  checked; a model page can also become gated later.
