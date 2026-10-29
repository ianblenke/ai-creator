# Tutorial pages, in watch order

Pages are named by topic, not by number, so the order of the videos can change without renaming files. Each row is one part of the
series, in the order the parts are meant to be watched, with the pages that carry its commands and constants. "Not written yet" means
the part's own page does not exist yet; the related reference pages already do.

| part | topic | pages |
|---|---|---|
| Start here | what the pipeline is and why | the README |
| It said "red" | what a speech checker cannot hear | `docs/narration-quality.md`, `docs/script-format.md` (words the voice reads wrongly, word-ending slips) |
| Sniffs and breaths | cleaning the gaps between words | `docs/narration-quality.md`; its own page: not written yet |
| The cast | which model does which job | `docs/hardware-and-models.md`, `docs/licences.md`, `docs/voice-engine-bakeoff.md` |
| Setup and the first render | what you need, the offline run, the full run | `docs/hardware-and-models.md`, `examples/ep01-kettle/README.md`, `docs/tutorial/full-run.md` |
| Specs and facts | one problem per episode, facts, what never goes on screen | `docs/fact-sheets.md`, `docs/safety.md` |
| Writing for the ear | the script, the flow review and the critic | `docs/script-format.md`, `prompts/flow-review.md`, `prompts/script-critic.md` |
| The law and the licence | cloning a voice, licences, disclosure (not legal advice) | `docs/voice-cloning-law.md`, `docs/licences.md`, `NOTICE` |
| Cloning your own voice | the reference clip, synthesis, alignment, subtitles | `docs/voice-reference.md`, `docs/voice-server-contract.md` |
| When a take sounds wrong | stalls, best of N, retakes, the voice-stage order | `docs/tutorial/takes.md` |
| Scenes as functions of time | the scene contract and the visual kit | `docs/scene-contract.md`, `docs/visual-kit.md` |
| Authors and adversarial reviews | a hosted model writes and reviews the scenes | `prompts/scene-author.md`, `prompts/keyframe-review.md`, `prompts/continuity-review.md` |
| Renders you can trust | ghost frames, determinism, checking what ships | `docs/tutorial/full-run.md` (section 5) |
| Shipping | upload, captions, corrections | `docs/upload.md`, `docs/tutorial/full-run.md` (section 6) |

Every number a video or page states is listed, with its source, date and sample size, in `docs/claims.md`.
