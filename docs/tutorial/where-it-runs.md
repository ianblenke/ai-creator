# Where it runs: local first, and why

Decision (2026-11-02): this pipeline runs on your own machines. The reasoning is written down here because the setup part of the series
explains it, and so you can decide differently for your own case. These are the author's judgements and a general understanding of the
hosted tools, not tested measurements; where something is untested it says so.

## The split

| Step | Where | Why |
|---|---|---|
| Writing, fact sheets, critique, scene authoring and review | a hosted model (Claude) | it needs a strong model, not a GPU |
| Voice synthesis | your own GPU | the voice model needs a GPU; a hosted coding sandbox has none (general understanding, not tested) |
| Alignment, transcript checks, audio checks | your machine (CPU is enough) | could run in a sandbox too; untested there |
| Keyframes, render, encode | your machine | Chromium and ffmpeg; a sandbox could run them, slower; untested there |
| YouTube upload | your machine | the sign-in lapses every seven days and needs you at the keyboard |

## Why not run all of it in a cloud sandbox from the repository

1. **The GPU step cannot move.** Voice cloning is the one step a hosted sandbox cannot do, so a fully cloud run is not possible while the
   model needs a GPU. A rented GPU is a separate choice about cost.
2. **Your reference clip stays with you.** It is a recording of your own voice, kept outside the repository on purpose (nothing of your
   voice is ever committed). A cloud session is not the place for it.
3. **Private names stay private.** The safety gate uses a private list of names that must never appear in a script, scene or subtitle.
   Putting that list into more places widens where it can leak. The public repository carries only the generic checks.
4. **The upload credentials are yours.** They live in a gitignored folder and are never shared with a cloud session.

## What a hosted session is still good for

Scene authoring and reviews, which need only text and the repository, can be done from a hosted session when you are away from your
machine. Nothing in this series requires it.

## Claude Projects versus a coding session

A Claude Project (chat with files from a repository) can hold the plan and docs for planning conversations, but it cannot run
commands, so it cannot run this pipeline. A cloud coding session can run commands but has no GPU. Neither replaces the local machine.

Not legal advice; the voice and license questions are in `docs/voice-cloning-law.md`.
