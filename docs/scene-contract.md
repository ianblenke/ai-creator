# Scene module contract

(`node tools/...` is the host form; in a Docker-only setup see the README, "Host commands and container commands".)

One file per scene: `episodes/<id>/scenes/<scene-id>.js` (ES module). Worked examples: `examples/ep01-kettle/scenes/`.

```js
import { palette, font, prog, ease, lerp, el, set, rng, SAFE } from 'style';
import { type, label, chip, makeStage, reveal } from 'kit';   // optional: the visual kit (docs/visual-kit.md)

export const meta = {
  cues: [                                   // every visual change, tied to the narration
    { name: 'card', at: 'single GPU' },     // `at`: anchor phrase, a word index, or 't=1.5' (scene-local seconds)
  ],
};

export function setup(ctx, tl) {}           // optional: create SVG nodes once
export function render(ctx, t, tl) {}       // draw the frame for scene-local time t (seconds)
```

`ctx`: `width`=1920, `height`=1080, `svg` (root `<svg viewBox="0 0 1920 1080">`), `c2d` (2D context on a canvas cleared before each
render), `three()` (async: `{THREE, renderer}` on a WebGL canvas below the 2D canvas), `rand(seed)` seeded RNG, `cue(name)` cue time,
`duration`, `palette`.

Rules (enforced by the linter, `tools/lint-scene.js`):
- Output depends only on `t`, the timeline, and `ctx.rand(seed)`. No `Date`, `Math.random`, `fetch`, timers, `requestAnimationFrame`.
- `render` must set every time-dependent attribute/pixel from `t`, because frames may be rendered in any order.
- No external URLs or fonts. Use `font.sans` / `font.mono`. Imports: relative (`./_shared.js`), `style`, `kit`, `three` only.
- Keep text inside `SAFE` margins (120 px x, 90 px y; the kit's `FRAME` is the same area: x 120 to 1800, y 90 to 920). Subtitles may be
  burned into the bottom 140 px, so keep it clear.
- Use SVG for diagrams and text, Canvas 2D for particles/flows, Three.js only for hero shots.
- Hold the final state after `ctx.duration`: `t` can exceed it by up to 0.6 s (the inter-scene pad).
- Never show hostnames, IPs, ports, paths, or device/room/person names.

## The visual kit (`kit`)
`tools/stage/kit.js` builds on `style`: a type scale (`type.note` 38 px is the smallest text), shapes that return an `Item` you can
fade, dim and place (`label`, `chip`, `card`, `arrow`, `curve`, `flow`, `glow`, `lines`), a cue-driven camera (`makeStage`) and the
series background. Every function is a pure function of the time you pass it, so the rules above still hold. The full API and the
rules it enforces (big sparse text, one focus at a time, move the camera): `docs/visual-kit.md`. The kettle scenes use it.

A scene's render-cache key includes `kit.js` only when the scene imports it, so a kit change re-renders only kit scenes.

## Gates a scene must pass
- `node tools/lint-scene.js <scene.js>` (also run by `keyframes`): the purity and import rules above.
- `node tools/check-anchors.js <episode-dir>`: every cue anchor still matches the narration.
- `keyframes <episode-dir>`: still frames at the start, middle, each cue and the end; on-screen text safety and pacing (a change at
  least every 4 s).
- `node tools/layout-check.js <episode-dir> --step 0.1`: no overlapping text, nothing under 36 px, nothing outside the frame or in the
  subtitle strip, no shape cut by the frame edge. Run it yourself at `--step 0.1`; a coarser step has let real overlaps through.
- `render <episode-dir> --check --step 1`: a frame rendered after the others must equal a fresh render of the same instant.
