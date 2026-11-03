# Series bible: "What You Need, and Your First Render" (AI Creator, part 3)

Look: AI Creator "Signal": near-black background, acid green and magenta accents, big type, flat shapes, generous space. Use `palette` from "style" (already Signal) and the kit from `docs/visual-kit.md` / `tools/stage/kit.js`. Calm, ONE idea per scene. This part is hands-on: it MAY show short commands, file names and dated notes, but ONLY the ones the scene's narration or visual notes name, as monospace-looking chips, never a number the narration does not say. Labels are the narration's own words, at most 4 words, at least 38 px. A command line on screen must be at least 38 px and no longer than about 38 characters (use the short forms given in the brief).

## Shared vocabulary (the same colour and shape mean the same thing in EVERY scene; draw each with the same proportions)
- THE COMPUTER = a flat rounded screen on a stand, `ink` outline (about 300 px wide); THE CARD = a flat `cool` slab with a round fan circle (drawn dashed when optional); THE PROCESSOR = a flat `cool` square chip with pins on four sides.
- THE TERMINAL = a flat rounded panel (`bg2` fill, `dim` outline) holding short command lines as `ink` text on one line each; a finished line gets a small acid-green (`accent`) check mark at its left. Typing a line means the characters appear left to right with the speech.
- THE TRACK (the stages) = rounded stops in a row joined by a line; the lit stop is `accent`, others `dim`. Same positions wherever it appears.
- THE NAMES LIST = a flat page (`bg2` fill, `dim` outline) of short `ink` bars (the example, invented names); YOUR names are bars ringed in `hot` (3 px circle outlines); THE GATE = a thin `accent` bar across a path that stops a magenta line; THE WARNING BANNER = a row of small `hot` marks across the top of the page.
- THE CONTAINER BOX = a flat rounded box that fills with stacked `cool` layers; THE DISK = a flat `cool` slab that grows; THE CLOCK = a circle with one slow hand, `dim`.
- THE TEST SQUARES = a row of small rounded squares that turn `accent`; a failing one is `hot` and ringed; THE BIG OK = one large `accent` "OK" (at least 96 px).
- THE AGENT = a small flat `violet` cloud with a pencil (the hosted coding agent); THE PROMPT CARD = a flat rounded card (`bg2` fill, `violet` outline) with short chips as lines; THE READ-ONLY LOCK = a small `dim` padlock with the label "read-only" (38 px).
- THE VOICE = an acid-green (`accent`) waveform of rounded vertical bars; a SILENT voice is the same line drawn flat (no bars) in `dim`.
- A QUESTION BUBBLE = a rounded bubble, `violet` outline, holding one short word; a STOP = a small `hot` octagon.
- Colours are semantic and fixed: `accent` = voice, checked and ticked; `hot` = a thing to watch out for (a name to block, a failure, a stop); `cool` = your hardware; `violet` = the cloud and the agent; `ink` = text and the author; `warm` is not used.

## Continuity addendum (cross-scene)
- The terminal sits at the same place and size (about 1100 x 520, centred at x 960) in scenes 04, 05 and 12 so the viewer reads one continuing session; it is the SAME panel, just different lines.
- The silent line keeps its baseline at about y 540 in scenes 01 and 13; the dim waveform that fades in at the end of 13 is the same waveform from the cast scenes.
- A figure or icon keeps the same size and colour in every scene it appears in. Scene 02 introduces the six-stop row; later scenes reuse its icons small.

## Scene rules
- Every scene carries ONE sentence of its idea as its LAST frame in at least 56 px type (the narration's own words, a phrase from its text), held through the 0.6 s tail, and ends wide.
- Sync: an element appears when its word is spoken (within 0.5 s); the thing being spoken is bright, earlier things dim to about 0.35, not removed abruptly. No stretch longer than 4 s without a change.
- Scenes 01 and 13 are calm and sparse; 04, 05 and 06 have the most going on. Do not add decorative clutter.
- Do not claim more than the narration does: where it hedges ("my judgement, not a test", "untested", "not measured") the picture must show a dashed, dim or crossed-out item, never a tick.

## Hard rules
- Show only what the scene's narration and visual notes say. Every cue anchor must be a phrase that appears VERBATIM in the scene's narration (verify with `node tools/check-anchors.js episodes/creator-setup`).
- Scenes are pure functions of t: no Date, Math.random (use `ctx.rand(seed)`), fetch, timers, CSS/SMIL animation. No text over text (fade one fully out before the next in). Keep content above y = 900 (subtitle strip). No serif font.
- Calm background: use `paintBackground` + `makeParticles` from the kit.
- NOTHING may be cut by the frame edge at ANY time (even dimmed): fade items out or reframe.
- Never show a real hostname, IP, path or person's name; the only address allowed is the public repository address in the "Get the project" scene.

## VISUAL KIT V2 (read docs/visual-kit.md and tools/stage/kit.js)
- Import `{ ... } from 'kit'` and `style`. NOTHING under 38 px. Compose across the whole frame; about four elements at once. Use `makeStage` with cue-driven camera moves (scenes of 40 s or more: at least three glides; shorter: at least one gentle move).
- SPOTLIGHT: the thing being spoken is bright; earlier things dim to about 0.35 (`dimAfter`, `item.dim`), not removed abruptly. SYNC: an element appears when its word is spoken (within 0.5 s). No dead stretch: something visibly changes at least every 4 s.
- Gates you must run yourself from the repo root before finishing: `node tools/check-anchors.js episodes/creator-setup`, `node tools/lint-scene.js episodes/creator-setup/scenes/<your file>`, and `node tools/layout-check.js episodes/creator-setup <scene number, two digits> --step 0.1` which MUST report "layout clean". Do NOT run keyframes, render or tts.

## CANON (round-1 continuity decisions; these override anything above and any individual scene's own drawing)
Draw each of these exactly this way in EVERY scene it appears (scale uniformly where a scene needs it smaller; never change proportions, stroke widths relative to size, or colours):
- THE TERMINAL: panel rect x 410, y 280, 1100 x 520, rx 28, `bg2` fill, 4 px `dim` stroke; three window dots (r 7, `dim`) at the top-left inside the panel; command rows start at y 380, 38 px monospace-looking, each row begins with a dim 38 px "$" then `ink` text; a finished row gets the small `accent` check at its left; a block cursor in `accent`. Scenes 04, 05 and 12 all show this SAME panel at this SAME place, full opacity at the start of the scene (the camera starts at x 960, zoom 1.0) and 04 must END with the camera wide at x 960, zoom 1.0 so the cut into 05 is continuous.
- THE TRACK: stops are circles R 72 with a small icon inside, centred on y 560, six stops spaced evenly from x 260 to x 1676, joined by a thin `dim` line; the lit stop has an `accent` ring (6 px), the others `dim`. Scene 02's track holds the six SETUP steps; scene 09's track holds the six PIPELINE stages; the same geometry and styling in both.
- THE CONTAINER BOX: a TALL rounded box 360 x 420, rx 28, 4 px `ink` outline, holding up to 8 stacked translucent `cool` layers (each 40 px high, `cool` stroke 2 px, fill-opacity 0.18). Scenes 02, 03, 07, 08, 10 draw this same box (scaled), and scene 08 opens with the FINISHED full box (all layers) as scene 07 ended.
- THE CARD: a slab 320 x 120 with a round fan circle on the left and 6 fins on the right, `cool`; DASHED (stroke-dasharray 10 8, fill-opacity 0.06) whenever it is optional or not in use (scenes 01, 02, 03), SOLID when the voice runs on it (scene 11), struck through only where the narration says it is absent. Never ticked as if required.
- THE AGENT: the violet cloud (largest circle r 38, two smaller circles, 3 px `violet` outline) with the pencil attached at its lower right (`violet` outline, `bg` fill, ferrule line); the same drawing scaled in scenes 02, 04, 05, 06, 10, 11, 12.
- THE VOICE waveform: 9 rounded bars, 12 px wide, gap 22 px, heights following one fixed pattern, up to 60 px tall, `accent`; a SILENT voice is the same 9 positions flat at 4 px high in `dim`. Scaled uniformly where needed.
- THE GATE: ONE thin `accent` bar, 14 x 260 px, with a soft glow, used in scenes 06 and 12 (in 12 it carries the label "approve first").
- PLAY and PROGRESS marks (video frame progress fill, play triangle, the draft video file) are `ink`, never `accent`; `accent` is only for ticks, checks, the lit stop ring and the voice.

## CANON II (round-2 decisions; exact values, override CANON where they differ)
- TERMINAL inner layout (04, 05, 12 identical): window dots at cx 450, 480, 510 and cy 314 (r 7, `dim`); the "$" glyph at x 500 and the command text from x 546; the block cursor 20 x 38, rx 2, its top at (row baseline - 16). The panel and its first "$" are fully visible from t = 0 in every scene that shows the terminal (04 has no fade-in of the panel).
- VOICE waveform (all scenes): 9 bars, 12 px wide, pitch 34 px (gap 22), centred on the object's x, heights = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6] x 60 px; a silent voice = the same 9 positions at 4 px high in `dim`; uniform scale only.
- CARD (all scenes): slab 320 x 120, fan circle cx -90 r 34 (relative to the slab centre), 6 fins at x = -20 + 28k (k = 0..5), y from -26 to 26, fin opacity 0.7. When the card is optional or unused, the slab, the fan AND the fins are all dashed (10 8); when the voice runs on it, all solid. Scale uniformly.
