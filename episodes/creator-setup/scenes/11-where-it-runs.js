// 11 - where it runs: the cloud (violet, the agent with its pencil) writes a page of the scenes; the computer on the left
// (ink screen on a stand) holds the voice, which needs the card (cool slab with fan). The cloud's card is only a dashed dim
// outline ("far more involved than you would think"). Three keepsakes (a voice clip, a names list, a key) appear inside the computer's screen and
// stay there; a dashed line joins the two sides but nothing crosses it. The hedge "my judgement, not a test" is a dashed
// note; the untried sandbox is a dashed dim chip with no tick. Ends wide on the note.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, glow, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'cloud', at: 'model in the cloud' },
    { name: 'writes', at: 'writes the scenes' },
    { name: 'why', at: 'why the rest' },
    { name: 'rest', at: 'the rest does' },
    { name: 'run', at: 'run in the cloud' },
    { name: 'voice', at: 'The voice I use' },
    { name: 'card', at: 'graphics card' },
    { name: 'session', at: 'coding agent' },
    { name: 'none', at: 'than you would think' },
    { name: 'recording', at: 'Your recording' },
    { name: 'list', at: 'list of names' },
    { name: 'signin', at: 'your sign-in' },
    { name: 'yours', at: 'are yours' },
    { name: 'places', at: 'more places' },
    { name: 'judgement', at: 'my judgement' },
    { name: 'sandbox', at: 'a sandbox' },
    { name: 'comes', at: 'cloud comes in' },
  ],
};

const CX = 520, SY = 380;              // the computer: screen centre
const CL = [1400, 300], PG = [1360, 520]; // the cloud and its page
const SLOTS = [430, 520, 610];         // keepsake slots inside the screen
const LAB_Y = 760;                     // the one label slot under the computer
const stroke = (color, w = 5) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

// THE AGENT (CANON): violet cloud, largest circle r 38, 3 px outline, pencil attached at its lower right
function agent(parent) {
  const it = new Item(parent, 128, 82);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  const pen = el(it.g, 'g', { transform: 'translate(40 40) rotate(-35)' });
  el(pen, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, fill: P.bg, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return it;
}
// THE CARD (CANON II): 320 x 120 cool slab, fan cx -90 r 34, 6 fins x -20+28k y +-26; slab, fan and fins dashed (10 8, fill 0.06) when not in use
function gpuCard(parent, { dashed = false } = {}) {
  const it = new Item(parent, 320, 120);
  const d = dashed ? { 'stroke-dasharray': '10 8' } : {};
  el(it.g, 'rect', { x: -160, y: -60, width: 320, height: 120, rx: 16, fill: P.cool, 'fill-opacity': dashed ? 0.06 : 0.15, stroke: P.cool, 'stroke-width': 4, ...d });
  el(it.g, 'circle', { cx: -90, cy: 0, r: 34, fill: 'none', stroke: P.cool, 'stroke-width': 4, ...d });
  for (let k = 0; k < 6; k++) el(it.g, 'line', { x1: -20 + k * 28, y1: -26, x2: -20 + k * 28, y2: 26, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7, ...d });
  return it;
}
// THE VOICE (CANON II): 9 rounded bars, 12 px wide, pitch 34 (gap 22), centred, fixed height pattern up to 60 px
function waveform(parent) {
  const it = new Item(parent, 284, 60);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((k, i) => {
    const h = 60 * k;
    el(it.g, 'rect', { x: -142 + i * 34, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent });
  });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 1250, y: 450, z: 1.12 },              // close on the cloud
    { cue: 'why', delay: -0.3, dur: 1.4, x: 960, y: 540, z: 1 },   // wide: the computer joins
    { cue: 'recording', dur: 1.4, x: 900, y: 520, z: 1.06 },      // lean toward the keepsakes
    { cue: 'judgement', delay: -0.3, dur: 1.4, x: 960, y: 540, z: 1 }, // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // the glow that says "these stay here" (behind the computer)
  S.glow = glow(W, { rx: 260, ry: 240, color: P.cool, strength: 0.35 }).at(CX, 470);

  // THE COMPUTER
  S.comp = new Item(W);
  el(S.comp.g, 'rect', { x: CX - 150, y: SY - 95, width: 300, height: 190, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(S.comp.g, 'rect', { x: CX - 12, y: SY + 95, width: 24, height: 38, fill: P.ink });
  el(S.comp.g, 'rect', { x: CX - 70, y: SY + 133, width: 140, height: 14, rx: 7, fill: P.ink });
  S.wave = waveform(W);
  S.clip = new Item(W);
  el(S.clip.g, 'rect', { x: SLOTS[0] - 38, y: SY - 32, width: 76, height: 64, rx: 12, ...stroke(P.accent, 4) });
  S.card = gpuCard(W).at(CX, 640);

  // keepsake 2: the names list (a page of bars, one ringed hot); keepsake 3: a key
  S.names = new Item(W);
  el(S.names.g, 'rect', { x: SLOTS[1] - 35, y: SY - 45, width: 70, height: 90, rx: 8, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
  [-22, 0, 22].forEach((dy, i) => el(S.names.g, 'rect', { x: SLOTS[1] - 22, y: SY + dy - 3, width: i === 1 ? 30 : 44, height: 6, rx: 3, fill: P.ink }));
  el(S.names.g, 'ellipse', { cx: SLOTS[1] - 7, cy: SY, rx: 22, ry: 10, fill: 'none', stroke: P.hot, 'stroke-width': 3 });
  S.key = new Item(W);
  el(S.key.g, 'circle', { cx: SLOTS[2] - 16, cy: SY, r: 16, ...stroke(P.ink, 5) });
  el(S.key.g, 'path', { d: `M ${SLOTS[2]} ${SY} L ${SLOTS[2] + 36} ${SY} M ${SLOTS[2] + 24} ${SY} L ${SLOTS[2] + 24} ${SY + 12} M ${SLOTS[2] + 34} ${SY} L ${SLOTS[2] + 34} ${SY + 10}`, ...stroke(P.ink, 5) });

  // one label at a time under the computer
  S.labs = [['card', 'graphics card', P.cool], ['recording', 'your voice', P.accent], ['list', 'names to block', P.hot], ['signin', 'sign-in', P.ink], ['yours', 'yours', P.ink]]
    .map(([cue, text, color]) => ({ cue, it: label(W, text, { size: type.label, color }).at(CX, LAB_Y) }));

  // the dashed line between the two sides, and the question
  S.line = el(W, 'line', { x1: 690, y1: 330, x2: 690, y2: 330, ...stroke(P.dim, 4), 'stroke-dasharray': '14 12' });
  S.why = new Item(W);
  // A QUESTION BUBBLE (CANON): bg2 fill, violet 4 px, pill radius h/2, tail at the lower left (drawn first, the pill covers its root)
  el(S.why.g, 'path', { d: 'M 905 236 L 892 268 L 935 240 Z', fill: P.bg2, stroke: P.violet, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  el(S.why.g, 'rect', { x: 870, y: 160, width: 180, height: 86, rx: 43, fill: P.bg2, stroke: P.violet, 'stroke-width': 4 });
  label(S.why.g, 'why', { size: type.label, color: P.ink }).at(960, 203).show(1);

  // THE AGENT: the violet cloud with its pencil, writing one page beside it
  S.agent = new Item(W);
  agent(S.agent.g).at(CL[0], CL[1], 1.3).show(1);
  el(S.agent.g, 'rect', { x: PG[0] - 75, y: PG[1] - 95, width: 150, height: 190, rx: 10, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
  S.bars = [0, 1, 2, 3].map((i) => el(S.agent.g, 'rect', { x: PG[0] - 52, y: PG[1] - 60 + i * 38, width: 0, height: 10, rx: 5, fill: P.ink }));
  S.barW = [0.8, 0.6, 0.75, 0.45].map((f) => 104 * f);
  S.sessLab = label(W, 'coding session', { size: type.label, color: P.violet }).at(CL[0], 160);

  // the cloud's card: only a dashed dim outline, "none"
  S.noCard = gpuCard(W, { dashed: true }).at(1360, 700, 0.75);
  S.noneLab = label(W, 'none', { size: type.label, color: P.dim }).at(1600, 700);
  S.sandbox = chip(W, 'sandbox', { size: type.label, color: P.dim, dashed: true }).at(1380, 700);

  const note = 'my judgement, not a test';
  S.note = chip(S.stage.hud, note, { size: 60, color: P.dim, dashed: true, textColor: P.ink }).at(960, 845);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const END = 99;
  const fin = reveal(t, c('judgement') + 0.2, 0.6);

  // the agent writes its page: four bars fill in, one after another
  const wq = prog(t, c('writes'), 2.0) * 4;
  S.bars.forEach((b, i) => set(b, { width: (S.barW[i] * ease.inOut(Math.min(1, Math.max(0, wq - i)))).toFixed(1) }));
  S.agent.show(reveal(t, c('cloud'), 0.6));
  S.agent.dim(Math.max(spot(t, -1, c('voice')), spot(t, c('session'), c('recording')), spot(t, c('comes'), END)));
  S.sessLab.show(fadeBetween(t, c('session'), c('recording')));

  // the question, then the computer and the dashed line between
  S.why.show(fadeBetween(t, c('why'), c('voice')));
  S.comp.show(reveal(t, c('rest'), 0.6));
  S.comp.dim(Math.max(spot(t, c('rest'), c('session')), spot(t, c('recording'), END, 0.35) * (1 - 0.3 * fin)));
  const lp = ease.inOut(prog(t, c('run'), 0.9));
  set(S.line, { x2: lerp(690, 1250, lp).toFixed(1), opacity: +(reveal(t, c('run'), 0.2) * lerp(0.9, 0.5, reveal(t, c('places'), 0.6))).toFixed(3) });

  // the voice: big in the screen, then it shrinks into the first keepsake slot
  const shrink = ease.inOut(prog(t, c('recording'), 0.9));
  S.wave.show(reveal(t, c('voice'), 0.6)).at(lerp(CX, SLOTS[0], shrink), SY, lerp(0.9, 0.22, shrink));
  const ks = (k) => lerp(spot(t, k[0], k[1]), 1, reveal(t, c('yours'), 0.5));
  S.wave.dim(t < c('recording') ? spot(t, c('voice'), c('session'), 0.35) : ks([c('recording'), c('list')]));
  S.clip.show(reveal(t, c('recording') + 0.6, 0.4)).dim(S.wave.dimv);
  S.names.show(reveal(t, c('list'), 0.5)).dim(ks([c('list'), c('signin')]));
  S.key.show(reveal(t, c('signin'), 0.5)).dim(ks([c('signin'), c('yours')]));
  S.card.show(reveal(t, c('card'), 0.6)).dim(spot(t, c('card'), c('session')));

  // one label at a time under the computer: each fades out fully before the next fades in
  S.labs.forEach(({ cue, it }, i) => {
    const nxt = i + 1 < S.labs.length ? c(S.labs[i + 1].cue) - 0.5 : c('judgement') - 0.5;
    it.show(fadeBetween(t, c(cue), nxt, 0.45));
  });
  S.labs[0].it.dim(spot(t, c('card'), c('session')));  // dims with the card it names

  // these stay here
  S.glow.at(CX, 470);
  S.glow.pulse(t, fadeBetween(t, c('places'), c('judgement') + 1.0, 0.8));

  // the cloud's card: assumed, not checked (dashed, dim); then the untried sandbox, dashed and with no tick
  const nc = fadeBetween(t, c('none') + 0.2, c('judgement'));
  const ncDim = spot(t, c('none'), c('recording'));  // spotlight moves to the keepsakes
  S.noCard.show(nc * 0.7).dim(ncDim);
  S.noneLab.show(nc).dim(ncDim);
  S.sandbox.show(reveal(t, c('sandbox'), 0.5) * 0.8);

  S.note.show(fin);
}
