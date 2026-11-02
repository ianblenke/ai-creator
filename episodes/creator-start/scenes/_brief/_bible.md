# Series bible: "Start Here: How One Person Makes an AI-Narrated Series" (AI Creator, introduction video)

Look: AI Creator "Signal": near-black background, acid green and magenta accents, big type, flat shapes, generous space. Use `palette` from "style" (already Signal) and the kit from `docs/visual-kit.md` / `tools/stage/kit.js`. Calm, ONE idea per scene. This is an introduction: it shows the WHYS and the shape of the pipeline, never details, so nothing on screen is a number, a file name, a command, a model name, a brand or a place. Labels are the narration's own words, at most 4 words, at least 38 px.

## Shared vocabulary (the same colour and shape mean the same thing in EVERY scene; draw each with the same proportions)
- THE VOICE = an acid-green (`accent`) WAVEFORM: a horizontal line of rounded vertical bars of varying height, centred on a baseline. It is the one hero shape of the video; it appears in most scenes. Playing it means a soft left-to-right highlight, never a cursor line.
- A SLIP / A DEFECT / A GHOST = `hot` (magenta), always small: a bar that is out of place, a blip, a leftover copy. Magenta never means "the whole thing"; it means "the spot that was caught".
- THE CHECK = a thin `accent` scan line that sweeps, then a magenta RING (circle outline, 3 px) closes around the spot it found. The ring is the only way a catch is drawn.
- THE SCRIPT = a flat page (rounded rectangle, `bg2` fill, `dim` outline) with 4 to 6 short `ink` text-lines (just bars, no letters); a SOURCE TICK is a small `accent` check mark at a line's left.
- THE PERSON = ONE small `ink` dot with a ring around it (the lone author); never a human figure.
- THE COMPUTER = a flat rounded screen with a stand; THE CARD = a slab with a fan circle, drawn as a flat `cool` shape beside or inside the computer; same drawing in every scene it appears.
- THE CLOUD = three overlapping circles in `violet`; its jobs are drawn as a small bracket sign (code) or a pencil, never as text.
- THE PICTURE (a video frame) = a 16:9 rounded rectangle, `bg2` fill, `ink` outline, with a simple abstract shape inside.
- THE TRACK (the four acts) = four rounded stops in a row joined by a line: plan (script page icon), voice (waveform icon), pictures (frame icon), ship (arrow icon). Same positions and order wherever it appears; the lit stop is `accent`, others `dim`.
- Colours are semantic and fixed: `accent` = voice and "good/checked", `hot` = slip caught, `cool` = hardware, `violet` = cloud, `warm` = the cost bar only, `ink` = the author and script text.

## Scene rules
- Every scene carries ONE sentence of its idea as its LAST frame in at least 56 px type (the narration's own words, a phrase from its text), held through the 0.6 s tail, and ends wide.
- Sync: an element appears when its word is spoken (within 0.5 s); the thing being spoken is bright, earlier things dim to about 0.35, not removed abruptly. No stretch longer than 4 s without a change.
- Scenes 01 and 09 are calm and sparse; 03, 05 and 07 have the most going on. Do not add decorative clutter.
- Continuity between scenes: the waveform keeps its baseline at about y = 540 when it is the only subject, and the author dot sits at the left margin whenever the person is shown.

## Hard rules
- Show only what the scene's narration and visual notes say. Every cue anchor must be a phrase that appears VERBATIM in the scene's narration (verify with `node tools/check-anchors.js episodes/creator-start`).
- Scenes are pure functions of t: no Date, Math.random (use `ctx.rand(seed)`), fetch, timers, CSS/SMIL animation. No text over text (fade one fully out before the next in). Keep content above y = 900 (subtitle strip). No serif font.
- Calm background: use `paintBackground` + `makeParticles` from the kit.
- The last frame restates the scene's point in one big phrase (at least 56 px) and is held through the 0.6 s tail; end wide.
- NOTHING may be cut by the frame edge at ANY time (even dimmed): fade items out or reframe.

## VISUAL KIT V2 (read docs/visual-kit.md and tools/stage/kit.js)
- Import `{ ... } from 'kit'` and `style`. NOTHING under 38 px. Compose across the whole frame; about four elements at once. Use `makeStage` with cue-driven camera moves (scenes of 40 s or more: at least three glides; shorter: at least one gentle move).
- SPOTLIGHT: the thing being spoken is bright; earlier things dim to about 0.35 (`dimAfter`, `item.dim`), not removed abruptly. SYNC: an element appears when its word is spoken (within 0.5 s). No dead stretch: something visibly changes at least every 4 s.
- Gates you must run yourself from the repo root before finishing: `node tools/check-anchors.js episodes/creator-start`, `node tools/lint-scene.js episodes/creator-start/scenes/<your file>`, and `node tools/layout-check.js episodes/creator-start <scene number> --step 0.1` which MUST report "layout clean". Do NOT run keyframes, render or tts.

