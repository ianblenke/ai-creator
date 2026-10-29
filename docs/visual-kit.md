# Visual kit v2 (`import { ... } from 'kit'`)

Source: `tools/stage/kit.js`. It sits next to `style` (palette, font, easing, `el`, `set`). Everything is a pure function of the time you give it.
Check a scene with `node tools/layout-check.js <episode-dir> <scene-prefix> --step 0.1` (must be "clean": no overlaps, nothing under 36 px,
nothing outside the frame or in the subtitle strip; a 0.5 s step has let real overlaps through) (`node tools/...` is the host form; in a Docker-only setup see the README, "Host commands and container commands".)

## Rules this kit exists to enforce
1. **Big, sparse, readable.** Nothing on screen is smaller than `type.note` (38 px). Primary labels `type.label` (48), titles `type.title` (72).
   Fewer words per screen: if a label needs more than about 5 words, split it or drop it.
2. **One focus at a time.** The element being spoken is bright; everything else is pushed back (`item.dim(0.3)`). Use `dimAfter(t, cueTime)`.
3. **Move the camera, not just the elements.** Content lives in `world`; glide to what matters with `makeStage(...).camera(t)`.
4. **Show flow.** Use `flow(...)` for data moving along a path, `arrow().draw(p)` to draw connections, `countTo` for numbers.
5. **Use the frame.** Compose across the whole 1920x1080 (inside `FRAME`: x 120..1800, y 90..920). Zoom into detail instead of shrinking it.

## API
- `type`, `MIN_TEXT`, `FRAME` - type scale and the allowed area.
- `measure(text, size)`, `fitSize(text, maxW)`, `wrap(text, maxW, size)` - real text widths (same font as drawn).
- `Item` (returned by every shape): `.show(a)` fade 0..1, `.dim(d)` spotlight 0..1, `.at(x, y, scale, rot)` center it, `.w .h`, `.box()`, `.g` (the SVG group).
- `label(parent, text, {size, color, weight})`, `chip(parent, text, {size, color, fill, dashed})` (pill that fits its text),
  `card(parent, title, lines[], {color, w})`, `toolIcon(parent, {color, size})` (generic tool card, never a real tool).
- `arrow(parent, x1, y1, x2, y2, {color, dashed})` -> `{ g, draw(p, a) }`; `flow(parent, [[x,y],...], {n, color, period})` -> `{ g, update(t, a) }`.
- `countTo(p, to, from, fmt)` - text of a number counting up.
- `makeStage(ctx.svg, moves)` -> `{ world, hud, camera(t) }`. `moves = [{ t, dur, x, y, z }]`: at time t glide to look at world point (x, y) at zoom z.
  Put diagrams in `world`; put anything that must stay fixed on screen (a persistent title) in `hud`. `camera(t)` returns {x, y, z}.
- `paintBackground(ctx, t, particles, cam)` + `makeParticles(ctx.rand(7))` - the series background with a little parallax.
- Camera moves can follow the narration: `makeStage(ctx.svg, [{ cue: 'name', delay: 0.2, dur: 1.4, x, y, z }], ctx.cue)`.
- `fadeBetween(t, inT, outT)` fade in at one time/cue, out at another. `glow(parent, {r | rx, ry, color})` -> Item with `.pulse(t, a)`. `item.raise()` draws an item above later-created panels.
- `curve(parent, x1, y1, x2, y2, {bend})` curved arrow with `.draw(p, a)` and `.point(q)` (position along it, for dots that follow it). `lines(parent, ['a','b'], {size})` -> Item with `.reveal(k)` (shows k lines, fractional fades the next).
- Layout gate extra: nothing may be cut by the frame edge (the checker flags any visible shape that is half inside the frame): fade it out or reframe.
- `reveal(t, cue, dur)` eased 0..1 fade-in progress; `dimAfter(t, cue, floor, dur)` spotlight-dim after a cue.

## Skeleton
```js
import { palette as P, prog, ease } from 'style';
import { type, chip, card, arrow, flow, makeStage, paintBackground, makeParticles, reveal, dimAfter } from 'kit';
export const meta = { cues: [ { name: 'a', at: 'a phrase from the narration' } ] };
let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)), stage: makeStage(ctx.svg, [{ t: 12, dur: 1.6, x: 600, y: 480, z: 1.5 }]) };
  S.box = chip(S.stage.world, 'the prompt', { color: P.cool }).at(960, 540);
}
export function render(ctx, t) {
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  S.box.show(reveal(t, ctx.cue('a')));
}
```
