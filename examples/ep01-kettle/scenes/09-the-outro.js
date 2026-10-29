// Outro: the shared kettle at rest; its sensor disc grows into a close-up that bends and snaps on "snaps" ("decision made by
// metal alone"), then the kettle fades to a soft outline and is fully gone before an unlabeled toaster silhouette slides in
// and settles centre with only the series tag "AI Creator" below (bible: nothing else). Kettle parts come only from ./_kettle.js.
import { palette as P, ease, prog, lerp, el } from 'style';
import { type, Item, label, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';
import { kettle, sensorDisc, KETTLE, bendCurl, flipCurl } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'disc', at: 'A disc that bends' },
    { name: 'bends', at: 'bends' },
    { name: 'snaps', at: 'snaps' },
    { name: 'made', at: 'decision made by metal alone' },
    { name: 'objects', at: 'everyday objects' },
    { name: 'next', at: 'the next part' },
    { name: 'series', at: 'series' },
    { name: 'see', at: 'See you there' },
  ],
};

const STROKE = { fill: 'none', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
const KX = 660, KY = 470, DISC = [1330, 400];
let S;

function toaster(parent) {
  const it = new Item(parent, 400, 290);
  const s = { ...STROKE, stroke: P.ink };
  el(it.g, 'rect', { ...s, x: -170, y: -100, width: 340, height: 220, rx: 60 });
  el(it.g, 'line', { ...s, x1: -110, y1: -70, x2: -25, y2: -70 });
  el(it.g, 'line', { ...s, x1: 25, y1: -70, x2: 110, y2: -70 });
  el(it.g, 'path', { ...s, d: 'M 170 -10 L 192 -10 L 192 30 L 170 30' });
  el(it.g, 'line', { ...s, x1: -120, y1: 120, x2: -120, y2: 138 });
  el(it.g, 'line', { ...s, x1: 120, y1: 120, x2: 120, y2: 138 });
  return it;
}

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'objects', delay: 0.1, dur: 1.6, x: 900, y: 520, z: 1.04 },
    { cue: 'next', delay: 0, dur: 1.2, x: 960, y: 540, z: 1 },
    { cue: 'see', delay: 0, dur: 0.9, x: 960, y: 540, z: 1.05 },
  ], ctx.cue);
  const w = stage.world;
  S = { stage, parts: makeParticles(ctx.rand(7)) };
  // the same kettle as every scene, at rest (cold, power OFF, no steam), as scene 08 left it
  S.k = kettle(w).at(KX, KY);
  S.disc = sensorDisc(w, { w: 320 });
  S.toaster = toaster(w);
  S.made = label(stage.hud, 'decision made by metal alone', { size: type.title }).at(960, 800);
  S.title = label(stage.hud, 'AI Creator', { size: type.hero, color: P.accent }).at(960, 790);
}

export function render(ctx, t) {
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const c = (n) => ctx.cue(n);

  // the disc: cold dish, slow bend toward the trip point, then one 0.15 s flip landing on the onset of "snaps"
  // (starts 0.1 s early so the flip is complete 0.05 s into the word); the kettle's own sensor follows
  const snap = c('snaps') - 0.1;
  const curl = t < snap ? bendCurl(t, c('bends'), snap - c('bends')) : flipCurl(t, snap);
  S.k.sensor.curl(curl);
  S.disc.curl(curl);

  // kettle: on screen from the first frame, a soft outline on "everyday objects", fully gone 0.15 s before the next object
  S.k.show(1 - ease.inOut(prog(t, c('next') - 0.75, 0.6))).dim(dimAfter(t, c('objects'), 0.35, 1.0));

  // close-up disc grows out of the sensor housing, leaves on "everyday objects"
  const grow = ease.out(prog(t, c('disc'), 0.5));
  const [sx, sy] = S.k.toWorld(KETTLE.sensor);
  S.disc.at(lerp(sx, DISC[0], grow), lerp(sy, DISC[1], grow), lerp(60 / 320, 1, grow))
    .show(reveal(t, c('disc'), 0.3) * (1 - ease.inOut(prog(t, c('objects'), 0.6))));

  // the point, in the narration's words; gone before the series tag arrives
  S.made.show(fadeBetween(t, c('made'), c('objects'), 0.5));

  // the next object slides in from the right on "the next part", unlabeled, only after the kettle has gone
  const slide = ease.out(prog(t, c('next'), 1.2));
  S.toaster.at(lerp(1500, 960, slide), 470).show(slide);
  S.title.show(reveal(t, c('series'), 0.7));
}
