# Series bible: "The Cast: Which AI Model Does Which Job" (AI Creator, part 2)

Look: AI Creator "Signal": near-black background, acid green and magenta accents, big type, flat shapes, generous space. Use `palette` from "style" (already Signal) and the kit from `docs/visual-kit.md` / `tools/stage/kit.js`. Calm, ONE idea per scene. Unlike the introduction, this video DOES name models and dates, because the narration does: you may show a model name, a license word (Apache, BSD, MIT) or a date, but ONLY when the scene's narration says it, never a number, file name, command or place the narration does not say. Labels are the narration's own words, at most 4 words, at least 38 px.

## Shared vocabulary (the same colour and shape mean the same thing in EVERY scene; draw each with the same proportions)
- THE VOICE = an acid-green (`accent`) WAVEFORM: a horizontal line of rounded vertical bars of varying height, centred on a baseline; plus THE CARD = a flat `cool` slab with a round fan circle (same drawing wherever it appears). The waveform is the hero shape of the video.
- THE PROCESSOR = a flat `cool` square chip with short pins on all four sides (same drawing every time). THE CLOUD = three overlapping circles in `violet`.
- THE EARS (two checkers) = THE ALIGNER: a horizontal ruler with tick marks and word blocks (rounded rectangles) snapped to it, in `accent`; THE RECOGNIZER: a strip of `ink` text-bars (a "heard text" line) with a small compare mark (two short bars with an equals-like sign) against a flat script page (`bg2` fill, `dim` outline, 4 short `ink` bars).
- A LISTENER / JUDGE = ONE plain neutral figure: a `dim` circle head over a rounded-rectangle body, a bit larger than the author dot; its verdict is a small speech bubble with the word "yes" in `hot`. Judges are always `dim`, never lit, never colourful. THE METER = a flat horizontal bar with a marker; a flat meter is the same height for every clip.
- A SLIP / A DEFECT / A SNIFF = `hot` (magenta), always small: one bar that is out of place. Magenta never means "the whole thing". THE CATCH = a thin `accent` scan line that sweeps, then a magenta RING (circle outline, 3 px) closes around what it found; a stray ring beside it is a FALSE ALARM, drawn dashed-free but `dim`.
- THE WRITER = a figure with a pencil; a SCENE CARD = a 16:9 rounded rectangle with a small code bracket "{ }" shape (bars, no letters). OPUS = the LARGE `violet` figure; SONNET = the SMALLER `violet` figure drawn at 0.6 of its size and a slightly dimmer violet. A REVIEWER = a figure with a magnifier (circle plus handle) and an eye; it is read-only, so it has no pencil.
- THE PRODUCER = a figure seated at a flat desk, `ink`, drawn on THE COMPUTER side (a screen with a stand); lines from it rise to clouds. It hands small FILE squares (four of them) to an author and an eye-only line to a reviewer.
- A LICENSE TAG = a small rounded tag with an `ink` outline holding the license word; a DATE STAMP = a small `accent` rounded rectangle with the date words; a NO-WATERMARK note is `hot`; a SYNTHETIC label is `dim`.
- THE ZONES: "on your machine" = the left half, `cool` outline; "a paid plan" = the right half, `violet` outline. The same split wherever it appears.
- THE CAST ICONS (scene 09, and small in other scenes): voice = a short waveform; ears = two small arcs; writer = a pencil; producer = a desk with one line up; and a faded (0.35) listener icon off to one side.
- Colours are semantic and fixed: `accent` = voice and "good/checked", `hot` = slip caught or a false verdict, `cool` = hardware, `violet` = cloud models, `warm` = never used here, `ink` = text and the author.

## Continuity addendum (cross-scene)
- The waveform keeps its baseline at about y = 540 when it is the only subject; the card sits on the left and the waveform runs right when both are shown.
- A figure keeps the same height in every scene it appears in (judge about 220 px tall, writer about 260 px, Opus about 300 px, Sonnet about 180 px, producer about 260 px). A figure that was lit in one scene is not recoloured in the next.
- Scene 09 closes by fading the five cast icons in a calm row, each on the word that names it; nothing else.

## Scene rules
- Every scene carries ONE sentence of its idea as its LAST frame in at least 56 px type (the narration's own words, a phrase from its text), held through the 0.6 s tail, and ends wide.
- Sync: an element appears when its word is spoken (within 0.5 s); the thing being spoken is bright, earlier things dim to about 0.35, not removed abruptly. No stretch longer than 4 s without a change.
- Scenes 01 and 09 are calm and sparse; 04, 05 and 07 have the most going on. Do not add decorative clutter.
- Do not claim more than the narration does: where the narration hedges ("in my test", "what is promising"), the picture must not show a certainty (no trophy, no winner banner). The only measured comparisons are those the narration states.

## Hard rules
- Show only what the scene's narration and visual notes say. Every cue anchor must be a phrase that appears VERBATIM in the scene's narration (verify with `node tools/check-anchors.js episodes/creator-cast`).
- Scenes are pure functions of t: no Date, Math.random (use `ctx.rand(seed)`), fetch, timers, CSS/SMIL animation. No text over text (fade one fully out before the next in). Keep content above y = 900 (subtitle strip). No serif font.
- Calm background: use `paintBackground` + `makeParticles` from the kit.
- NOTHING may be cut by the frame edge at ANY time (even dimmed): fade items out or reframe.

## VISUAL KIT V2 (read docs/visual-kit.md and tools/stage/kit.js)
- Import `{ ... } from 'kit'` and `style`. NOTHING under 38 px. Compose across the whole frame; about four elements at once. Use `makeStage` with cue-driven camera moves (scenes of 40 s or more: at least three glides; shorter: at least one gentle move).
- SPOTLIGHT: the thing being spoken is bright; earlier things dim to about 0.35 (`dimAfter`, `item.dim`), not removed abruptly. SYNC: an element appears when its word is spoken (within 0.5 s). No dead stretch: something visibly changes at least every 4 s.
- Gates you must run yourself from the repo root before finishing: `node tools/check-anchors.js episodes/creator-cast`, `node tools/lint-scene.js episodes/creator-cast/scenes/<your file>`, and `node tools/layout-check.js episodes/creator-cast <scene number> --step 0.1` which MUST report "layout clean". Do NOT run keyframes, render or tts.
