# Series bible: "[episode title]"

Every scene author reads this file, and it overrides the briefs. Fill in the bracketed parts, delete what does not apply, and keep it
short: an author follows ten clear rules better than forty vague ones. The example episode in `examples/` has a filled-in bible (`scenes/_brief/_bible.md`).

Look: [one line: background, accent colours, type, mood]. Use `palette` and `font` from `style` and the kit from `docs/visual-kit.md`
(`tools/stage/kit.js`). Calm, one idea per scene.

## The cast (the same thing looks the same in every scene)
- [MAIN OBJECT] = [shape, outline colour, orientation: for example "faces right, never mirrored"].
- [PART OR STATE] = [shape and colour; what changes and how fast].
- [INDICATOR, for example power or status] = [shape; the colour for each state].
- [HEAT / DANGER / ERROR] = [one colour, used for nothing else].
- If an object appears in more than two scenes, put it in a shared module (`scenes/_cast.js`) and require every scene to draw it only
  with that module; describe its functions here.

## Labels
- The narration's own words only, at most 5 words, at least 38 px (kit `type`).
- No brand, number or place on screen that the narration does not say. [Any number you do allow on screen: list it here.]

## Hard rules
- Show only what the scene's narration and visual notes say. Every cue anchor is a phrase that appears VERBATIM in the narration.
- Scenes are pure functions of t: no Date, Math.random (use `ctx.rand(seed)`), fetch, timers, CSS or SMIL animation.
- No text over text: fade one fully out before the next comes in. Keep content above the subtitle strip (bottom 140 px).
- NOTHING may be cut by the frame edge at ANY time, even dimmed: fade items out or reframe.
- Background: `paintBackground` and `makeParticles` from the kit.
- The last frame restates the scene's point in one big phrase (at least 56 px), held through the 0.6 s tail; end wide.
- The intro and outro are calm and short. The outro shows [series title] in [colour] and [what else, if anything].
- Never a hostname, IP address, port, path, user name, device, room, place or person's name, including in comments.

## Visual kit v2 (read docs/visual-kit.md)
- Import `{ ... } from 'kit'` and `style`. Nothing under 38 px. About four elements on screen at once, composed across the whole frame.
- `makeStage` with cue-driven camera moves: scenes of 40 s or more get at least three glides, shorter scenes at least one gentle move.
- Spotlight: the thing being spoken is bright; earlier things dim to about 0.35 instead of disappearing.
- Sync: an element appears when its word is spoken (within 0.5 s). Something visibly changes at least every 4 s.

## Continuity addendum
(Empty at first. Paste the rules from each continuity review here, newest last; they override everything above.)
