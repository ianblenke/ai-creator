# Series bible: "Writing for the Ear: The Flow Review and the Critic" (AI Creator, part 5)

Look: AI Creator "Signal": near-black background, acid green and magenta accents, big type, flat shapes, generous space. Use `palette` from "style" (already Signal) and the kit from `docs/visual-kit.md` / `tools/stage/kit.js`. Calm, ONE idea per scene. This part is about WORDS and LISTENING, not hardware: show pages, tags, planks, figures with ears and magnifiers. It may show the SHORT words the narration says (a label of at most 4 words, at least 38 px); never a number, file name or command the narration does not say.

## Shared vocabulary (the same colour and shape mean the same thing in EVERY scene; draw each with the same proportions)
- THE KETTLE (a made-up example, in scenes 01, 03, 04 and 05 only) = a flat rounded kettle silhouette, `ink` outline 5 px, with a small switch dot (`accent` when "the switch" is the subject) and a handle arc; it faces right, never mirrored; about 240 px wide. A THERMOSTAT TAG, A STEEL-BASE TAG and A LOCKED-LID TAG = three small rounded tags (`dim` outline, a tiny drawn icon, no letters) that appear unconnected in the "list" version.
- A PAGE = a flat rounded portrait rectangle 360 x 470, rx 24, `bg2` fill, 4 px `dim` outline, holding short `ink` bars. THE SCRIPT = this page with three HEADING bars down its left edge (short thick `ink` bars) and text bars to their right. THE PLAN and THE FACT SHEET = the same page: the plan holds a thesis bar, a viewer icon and a column of scene dots; the fact sheet holds three tagged rows (a link tag, a ruler tag, a tilde tag). Drawn at the same size wherever they appear.
- A LISTENER = ONE plain neutral figure: a `dim` circle head over a rounded body about 220 px tall, with TWO small ear arcs; the ears light `accent` when it is listening. It is never colourful and never has a pencil.
- A REVIEWER = the same neutral figure with a MAGNIFIER (circle plus handle) and NO pencil (it is read-only); the CRITIC reviewer's magnifier is `hot`-ringed only when it circles a claim; the FLOW-REVIEW reviewer is a LISTENER with ears lit AND a magnifier. A WRITER or THE AUTHOR = a figure with a pencil, `ink`.
- A GAP = a visible empty space between two topic blocks on the page, with a small magenta question mark over it; magenta is small and only for what is wrong. A BRIDGE = a plank spanning a gap, lit `accent`, with the word "because" on it; a FALSE BRIDGE = a `dim` plank with a cross over it (a bare question mark, a megaphone, the words "now let's talk").
- A SEVERITY CHIP = a small rounded chip: `hot` (high), `ink`-outlined (medium) and `dim` (low), each with the word spelled out.
- A VERDICT STAMP = a rounded stamp, `ink` outline, with the words "fix first" or "ready to record"; a THESIS BAR = a long `accent` bar.
- THE ROUTE = a row of stepping stones, each a rounded square, lit `accent` as named, earlier ones dim to about 0.35.
- Colours are semantic and fixed: `accent` = good, linked, listening; `hot` = something wrong, small; `cool` = never used here; `violet` = never used here; `ink` = text and the author.

## CANON (continuity rulings; these OVERRIDE anything above where they differ)
- The same listener figure, drawn the same, in every scene (about 220 px tall); the ears are lit only while it listens.
- The script page always has its three heading bars on the left; when "headings" are hidden they are crossed out, not removed.
- THE END PHRASE of every scene: `ink`, 64 px, one line, centred near y 840, held through the tail; it is a phrase from that scene's own narration.
- Scenes 01 and 10 are calm and sparse; 05, 06 and 07 have the most going on.

## Scene rules
- Every scene carries ONE sentence of its idea as its LAST frame in at least 56 px type (the narration's own words, a phrase from its text), held through the 0.6 s tail, and ends wide.
- Sync: an element appears when its word is spoken (within 0.5 s); the thing being spoken is bright, earlier things dim to about 0.35, not removed abruptly. No stretch longer than 4 s without a change.
- Do not claim more than the narration does: where it hedges ("my judgement, not a test", "untested", "not measured") the picture must show a dashed, dim or crossed-out item, never a tick.

## Hard rules
- Show only what the scene's narration and visual notes say. Every cue anchor must be a phrase that appears VERBATIM in the scene's narration (verify with `node tools/check-anchors.js episodes/creator-writing`).
- Scenes are pure functions of t: no Date, Math.random (use `ctx.rand(seed)`), fetch, timers, CSS/SMIL animation. No text over text (fade one fully out before the next in). Keep content above y = 900 (subtitle strip). No serif font.
- Calm background: use `paintBackground` + `makeParticles` from the kit.
- NOTHING may be cut by the frame edge at ANY time (even dimmed): fade items out or reframe.

## VISUAL KIT V2 (read docs/visual-kit.md and tools/stage/kit.js)
- Import `{ ... } from 'kit'` and `style`. NOTHING under 38 px. Compose across the whole frame; about four elements at once. Use `makeStage` with cue-driven camera moves (scenes of 40 s or more: at least three glides; shorter: at least one gentle move).
- SPOTLIGHT: the thing being spoken is bright; earlier things dim to about 0.35 (`dimAfter`, `item.dim`), not removed abruptly. SYNC: an element appears when its word is spoken (within 0.5 s). No dead stretch: something visibly changes at least every 4 s.
- Gates you must run yourself from the repo root before finishing: `node tools/check-anchors.js episodes/creator-writing`, `node tools/lint-scene.js episodes/creator-writing/scenes/<your file>`, and `node tools/layout-check.js episodes/creator-writing <scene number, two digits> --step 0.1` which MUST report "layout clean". Do NOT run keyframes, render or tts.

