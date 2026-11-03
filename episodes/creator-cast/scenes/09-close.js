// 09 - close: the cast as small icons in one calm row, each fading in on the word that names it (voice, two ears, writer,
// producer), a faded listener off to the right side, then an unlabeled arrow pointing right and the next step in big type.
import { palette as P, el, lerp } from 'style';
import { type, Item, label, arrow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'cast', at: 'the cast' },
    { name: 'voice', at: 'one voice' },
    { name: 'ears', at: 'two ears' },
    { name: 'writer', at: 'a writer' },
    { name: 'producer', at: 'a producer' },
    { name: 'listeners', at: 'set of listeners' },
    { name: 'next', at: 'Next' },
    { name: 'setup', at: 'set up your machine' },
    { name: 'render', at: 'first render' },
  ],
};

const ROW_Y = 430, LAB_Y = 570;
const XS = [330, 610, 890, 1170], LX = 1560;      // the four cast icons, then the listener set apart on the right
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  // one gentle move: a slight settle back as the row completes, then a drift toward the arrow on "Next"
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 520, z: 1.03 },
    { cue: 'next', dur: 1.6, x: 980, y: 540, z: 1 },
  ], ctx.cue);
  const W = S.stage.world;

  // voice: a short waveform (12 px bars on a 24 px pitch)
  const voice = new Item(W, 7 * 24, 120);
  for (let i = 0; i < 7; i++) {
    const h = 120 * (0.3 + 0.7 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    el(voice.g, 'rect', { x: (i - 3) * 24 - 6, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent });
  }
  // ears: two small arcs (the aligner in accent, the recognizer in ink)
  const ears = new Item(W, 150, 120);
  el(ears.g, 'path', { d: 'M -20 -45 A 45 45 0 0 0 -20 45', ...stroke(P.accent, 7) });
  el(ears.g, 'path', { d: 'M 20 -45 A 45 45 0 0 1 20 45', ...stroke(P.ink, 7) });
  // writer: a pencil, tilted
  const writer = new Item(W, 140, 140);
  const pg = el(writer.g, 'g', { transform: 'rotate(-35)' });
  el(pg, 'rect', { x: -60, y: -14, width: 96, height: 28, rx: 5, fill: P.violet, 'fill-opacity': 0.2, stroke: P.violet, 'stroke-width': 5 });
  el(pg, 'path', { d: 'M 36 -14 L 66 0 L 36 14', ...stroke(P.violet, 5) });
  el(pg, 'line', { x1: -40, y1: -14, x2: -40, y2: 14, ...stroke(P.violet, 5) });
  // producer: a flat desk with a screen on it and one line rising
  const producer = new Item(W, 160, 140);
  el(producer.g, 'line', { x1: -70, y1: 50, x2: 70, y2: 50, ...stroke(P.ink, 6) });
  el(producer.g, 'line', { x1: -55, y1: 50, x2: -55, y2: 66, ...stroke(P.ink, 6) });
  el(producer.g, 'line', { x1: 55, y1: 50, x2: 55, y2: 66, ...stroke(P.ink, 6) });
  el(producer.g, 'rect', { x: -40, y: -6, width: 64, height: 40, rx: 6, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(producer.g, 'line', { x1: -8, y1: 34, x2: -8, y2: 50, ...stroke(P.ink, 5) });
  el(producer.g, 'line', { x1: 44, y1: 20, x2: 44, y2: -64, ...stroke(P.violet, 5) });
  // listener: the plain dim figure, kept faded
  // the judge figure of every scene (head r36, body 120x146, dim fill), drawn at 0.45 to match the icon row
  const listener = new Item(W, 120, 226);
  const js = { fill: P.dim, 'fill-opacity': 0.22, stroke: P.dim, 'stroke-width': 4 / 0.45 };   // 4 px on screen after scaling
  el(listener.g, 'circle', { cx: 0, cy: -77, r: 36, ...js });
  el(listener.g, 'rect', { x: -60, y: -33, width: 120, height: 146, rx: 30, ...js });

  S.icons = [voice, ears, writer, producer];
  S.icons.forEach((it, i) => it.at(XS[i], ROW_Y));
  S.listener = listener.at(LX, ROW_Y, 0.45);
  const LABS = ['voice', 'two ears', 'writer', 'producer'];
  const COLS = [P.accent, P.ink, P.violet, P.ink];
  S.labs = LABS.map((s, i) => label(W, s, { size: type.label, color: COLS[i] }).at(XS[i], LAB_Y));
  S.lLab = label(W, 'listeners', { size: type.label, color: P.dim }).at(LX, LAB_Y);

  S.title = label(W, 'that is the cast', { size: type.title }).at(960, 200);
  // the arrow sits on the caption's line and points into the next step
  S.final = label(W, 'set up your machine', { size: type.title, color: P.ink }).at(1080, 740);
  const fl = S.final.box().l;
  S.arrow = arrow(W, fl - 330, 740, fl - 50, 740, { color: P.accent, width: 6, head: 26 });
  S.final2 = label(W, 'first render', { size: type.label, color: P.accent }).at(1080, 840);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  S.title.show(fadeBetween(t, c('cast'), c('next'), 0.6));

  // each icon fades in on its word, stays bright while spoken, then sits back; on "Next" the row settles at half
  const on = ['voice', 'ears', 'writer', 'producer'].map(c);
  const offs = [on[1], on[2], on[3], c('listeners')];
  const settle = reveal(t, c('next'), 0.8);
  S.icons.forEach((it, i) => {
    // while the listeners are spoken the row drops further so the faded listener is the focus
    const d = lerp(dimAfter(t, offs[i], 0.45) * lerp(1, 0.55, fadeBetween(t, c('listeners'), c('next'))), 0.5, settle);
    it.show(reveal(t, on[i], 0.5)).dim(d);
    S.labs[i].show(reveal(t, on[i], 0.5)).dim(d);
  });
  // the listeners that did not make it: faded, off to one side
  // a short lift to 0.6 when named, then back to the judges' 0.35 (never lit)
  const la = (0.35 + 0.25 * (1 - reveal(t, c('listeners') + 0.6, 0.8))) * reveal(t, c('listeners'), 0.6);
  S.listener.show(la);
  S.lLab.show(la);

  // next: an unlabeled arrow pointing right, then the next step
  S.arrow.draw(reveal(t, c('next'), 0.9), reveal(t, c('next'), 0.2));
  S.final.show(reveal(t, c('setup'), 0.6));
  S.final2.show(reveal(t, c('render'), 0.5));
}
