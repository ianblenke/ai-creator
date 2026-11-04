# Series bible: "One Problem per Episode: Specs, Facts and What Never Goes on Screen" (AI Creator, part 4)

Look: AI Creator "Signal": near-black background, acid green and magenta accents, big type, flat shapes, generous space. Use `palette` from "style" (already Signal) and the kit from `docs/visual-kit.md` / `tools/stage/kit.js`. Calm, ONE idea per scene. This part is about paper and checks, not hardware: show pages, tags, shields and folders. It may show the SHORT words the narration says (a label of at most 4 words, at least 38 px), but NEVER an address, machine name, path, file name or command the narration does not say, and never a real name: the planted "leak" is drawn as three small hot marks with generic labels (an address, a machine name, a port), never as text that looks like one.

## Shared vocabulary (the same colour and shape mean the same thing in EVERY scene; draw each with the same proportions)
- A PAGE = a flat rounded portrait rectangle 360 x 470, rx 24, `bg2` fill, 4 px `dim` outline, holding short `ink` bars (lines of text). THE PLAN, THE FACT SHEET and THE SCRIPT are all this same page, distinguished only by what is on them: the plan holds five bars (thesis, viewer, facts, a crossed-out list, a column of scene dots); the fact sheet holds three tagged rows; the script holds headings (wider, brighter bars) with paragraph bars under them.
- THE TAGS (fact markers, 56 x 56 rounded squares with a tiny drawn icon, no letters): CITED = a link (two chained loops) in `accent`; MEASURED = a ruler with ticks in `ink`; ESTIMATED = a tilde wave in `dim`. A LEAD (snippet, forum post, model answer) = a small `dim` speech bubble drawn at 0.35 opacity, never lit.
- A DATE STAMP = a small `accent` rounded rectangle (about 200 x 64) with the words "measured on" and a tiny calendar mark, never real date digits. A NOT-CLAIMED list = a short column of `dim` bars crossed by one thin `dim` line.
- THE SHIELD (the safety check) = a flat shield outline, 6 px `accent` stroke, about 260 px tall, with a short list (3 to 4 `ink` bars) inside it; it is the hero shape of scenes 07, 08, 09 and 10. THE DENYLIST = that list of bars. A NAME THAT IS BLOCKED = a bar ringed in `hot` (3 px circle outline). A name shown on purpose = a plain `ink` bar with a small `dim` cross over the shield.
- A FINDING = a thin `accent` scan line that sweeps down a page, then a `hot` RING (3 px circle outline) closes around what it found, with a short label bar; magenta is small and only for the thing found. THE MASKED SAMPLE = two `ink` blocks then a row of `dim` dots. THE WARNING BANNER = a row of small `hot` marks across the top of the page, rising, then fading.
- A LOCKED FOLDER (private notes) = a flat folder with a padlock, `hot` outline, 5 px. It always sits OUTSIDE the episode folder: draw the EPISODE FOLDER as a rounded folder outline in `ink` and keep the locked folder beside it, not inside.
- THE HOOKS = two small gates drawn as short `accent` bars across a path into a COMMIT BOX (a flat rounded box, `ink` outline); the first gate stops a locked folder and a film strip (a small rectangle with sprocket dots, `ink`), and lets a script page through; the second removes one bar from a message (a small `bg2` card of three bars) and leaves the others.
- THE PIPELINE = five rounded stops in a row joined by a line (voice, scenes, frames, render, encode), each drawn with a tiny icon, the shield in front of each; the upload is a sixth stop on a second row. THE LISTENER = ONE plain neutral figure (`dim` circle head over a rounded body); THE WAVEFORM = 9 bars, 12 px wide, pitch 34 px, heights [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6] x 60 px, `accent` (a flat 4 px `dim` line when silent).
- Colours are semantic and fixed: `accent` = checked, safe, the check and the voice; `hot` = a thing found, blocked or to watch (a name, an address, a private file); `ink` = text and the author; `dim` = unverified, optional or unfinished; `violet` and `cool` are not used in this part; `warm` is not used.

## Continuity addendum (cross-scene)
- The page keeps the same size (360 x 470) in every scene it appears in; when a scene needs two pages, both are this size. The page centre is x 960 when alone.
- The shield keeps the same drawing and size in scenes 07, 08, 09 and 10; scenes 02 and 06 show it small (a stop icon). In scene 10 it gains four small gaps in its outline, never a different shape.
- The episode folder (rounded `ink` folder outline) appears in scenes 03 and 06 and 09; the locked folder never sits inside it.
- Scenes 01 and 10 are calm and sparse; 03, 06, 08 have the most going on. Do not add decorative clutter.

## Scene rules
- Every scene carries ONE sentence of its idea as its LAST frame in at least 56 px type (the narration's own words, a phrase from its text), held through the 0.6 s tail, and ends wide.
- Sync: an element appears when its word is spoken (within 0.5 s); the thing being spoken is bright, earlier things dim to about 0.35, not removed abruptly. No stretch longer than 4 s without a change.
- Scenes 01 and 13 are calm and sparse; 04, 05 and 06 have the most going on. Do not add decorative clutter.
- Do not claim more than the narration does: where it hedges ("my judgement, not a test", "untested", "not measured") the picture must show a dashed, dim or crossed-out item, never a tick.

## Hard rules
- Show only what the scene's narration and visual notes say. Every cue anchor must be a phrase that appears VERBATIM in the scene's narration (verify with `node tools/check-anchors.js episodes/creator-spec`).
- Scenes are pure functions of t: no Date, Math.random (use `ctx.rand(seed)`), fetch, timers, CSS/SMIL animation. No text over text (fade one fully out before the next in). Keep content above y = 900 (subtitle strip). No serif font.
- Calm background: use `paintBackground` + `makeParticles` from the kit.
- NOTHING may be cut by the frame edge at ANY time (even dimmed): fade items out or reframe.
- Never show a real hostname, IP, path or person's name; the planted leak is only ever three generic hot marks.

## VISUAL KIT V2 (read docs/visual-kit.md and tools/stage/kit.js)
- Import `{ ... } from 'kit'` and `style`. NOTHING under 38 px. Compose across the whole frame; about four elements at once. Use `makeStage` with cue-driven camera moves (scenes of 40 s or more: at least three glides; shorter: at least one gentle move).
- SPOTLIGHT: the thing being spoken is bright; earlier things dim to about 0.35 (`dimAfter`, `item.dim`), not removed abruptly. SYNC: an element appears when its word is spoken (within 0.5 s). No dead stretch: something visibly changes at least every 4 s.
- Gates you must run yourself from the repo root before finishing: `node tools/check-anchors.js episodes/creator-spec`, `node tools/lint-scene.js episodes/creator-spec/scenes/<your file>`, and `node tools/layout-check.js episodes/creator-spec <scene number, two digits> --step 0.1` which MUST report "layout clean". Do NOT run keyframes, render or tts.

## CANON (round-1 continuity rulings; these OVERRIDE anything above where they differ)
- THE PLAN always shows, top to bottom: a thesis bar, a viewer icon with "?", a row of the three tags, a crossed-out list, and a column of scene dots with bars on the LEFT (exactly as drawn in scene 03). This holds in every scene and at every scale.
- THE PAGE is drawn at the full 360 x 470 when it is the subject. Only as a stop icon (scene 02) or a prop passing through a gate (scene 09) may it be scaled, to 0.5 to 0.6, with the stroke scaled back to about 4 px. Scene 10's recap draws three pages at full size.
- THE SHIELD has one outline in every scene it appears (06 full size, 08, 09, 10 hero; 02 as a stop icon at stop scale; 07 has no shield): scene 08's `SHIELD_D` path, fill `bg2` at 0.7, 6 px `accent` stroke, about 220 x 260. The denylist inside is always 4 centred bars (120, 96, 120, 80 wide x 18 high). Scenes 06, 09 and 10 change to match scene 08.
- FOLDERS share ONE silhouette: scene 03's notched-tab path with a 5 px stroke, scaled uniformly. The episode folder is `ink` (scenes 03, 06, 08); the locked folder is that same silhouette in `hot` plus the padlock from scene 06 (scenes 06 and 09). The locked folder never sits inside the episode folder.
- THE FACT SHEET always has exactly 3 tagged rows (a fourth idea goes on a second line of an existing row).
- A HOT RING is a 3 px `hot` ellipse hugging the bar it marks (a circle only where it rings a small round mark, as in scene 01).
- A LEAD (snippet, forum post, model answer) is never lit: opacity at most 0.35 including its label.
- THE NOT-CLAIMED list is a column of `dim` bars crossed by ONE thin `dim` line across the whole column.
- A VIDEO (scene 05) = a square card with a play mark, `ink` outline; it is the only non-page object that carries a fact.
- THE END PHRASE of every scene: `ink`, 64 px, one line, centred near y 840, held through the tail (scene 01 may keep its title position).
- Scenes 01 and 10 are calm and sparse; 03, 06 and 08 have the most going on.
