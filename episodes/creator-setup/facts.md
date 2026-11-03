# What You Need, and Your First Render: facts (every line dated; sources are the repo's own docs and measured runs)

## Platform and requirements (README "Before you start", docs/claims.md; checked 2026-11-02)
- Only Linux on x86_64 is tested. macOS, Windows/WSL2 and arm64 are NOT tested. Docker Engine with Compose v2.24 or newer; tested with Docker 29.8 and 29.9.
- A GPU is optional: an NVIDIA GPU speeds up the voice; every stage also has a CPU lane.
- Every stage runs in the tools container; host Node is needed only for the YouTube sign-in, the git hooks and the OCR scan.
## Safety setup (docs/safety.md)
- `cp safety/denylist.example.txt safety/denylist.txt`, then your own private names. Until filled in, every gated command prints a banner of `!` characters (MISSING, EMPTY or EXAMPLE); the gate still runs with its generic patterns.
- Git hooks: `sh tools/hooks/install.sh` (sets core.hooksPath).
## Build and tests (docs/claims.md, docs/tutorial/full-run.md)
- Tools image: 8.09 GB (2026-10-29, two builds). The 2026-10-29 record says a clean-clone build took about 20 min once; the clean-clone run below is the current figure.
- Test suite in the container: ends with OK (the Python tests); 4.8 s once.
## First render (examples/ep01-kettle/README.md)
- Offline lane steps: tts (fixture, silent), align, scenes, keyframes, render --draft, encode --draft. Draft render 59 s with 6 workers on a 24-core machine with no GPU (2026-10-29). Final audio check, asr, besttake, desniff, voicereview and finalcheck REFUSE to run on silence.
## Later needs
- align, asr, desniff and voicereview download their models at first use into .cache/; the voice server downloads its weights at first start (Chatterbox: about 3.19 GB).
- Scene authoring, critique and reviews use a hosted model through a coding agent (paid account). NOT measured: the cost of an episode.
## Where it runs (docs/tutorial/where-it-runs.md, decided 2026-11-02)
- Author's judgement, nothing tested in a sandbox: voice needs a GPU and a hosted coding sandbox has none (general understanding); the reference clip, the private names list and the upload sign-in stay local.
## NOT measured / not claimed
- macOS, Windows, WSL2, arm64; a hosted sandbox run; episode cost or time; exact test count.

## Clean-clone run (M6 for this part, 2026-11-02, our own run)
- Fresh `git clone` of the public repository at commit 7d71206, separate compose project, `docker compose build --no-cache`: 201 s (a 24-core x86_64 Linux machine with a fast connection; Docker 29.9.2, Compose 5.6.1), image `ai-creator-media:local` 8.07 GB. Then the offline kettle steps, each exit 0: tts 8 s, align 1 s, scenes 1 s, keyframes 16 s, render --draft 68 s, encode --draft 2 s (draft video 183.4 s, 30 fps 1920x1080). Whole run 297 s. Build time depends on the connection; the 2026-10-29 run took about 20 min.
- Not run in this check: the test suite, `sh tools/hooks/install.sh`, the 60 fps run, any non-Linux system.
- Test suite in the clean clone (2026-11-02): Node summary with zero failures, then the Python tests ending OK, 8 s wall including container start; npm then prints upgrade notices after it.
