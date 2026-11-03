// 03 - what you need: a short checklist of four columns that tick on as they are spoken. THE COMPUTER (Linux, x86_64),
// with dim untested systems crossed out beside it (never ticked); a CONTAINER BOX (Docker, Compose 2.24 or newer) that
// fills with stacked layers and swallows Python and the audio tools; THE CARD drawn dashed (optional, NVIDIA) with the
// voice waveform over it; THE PROCESSOR. Ends wide on "every stage also has a processor-only version".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'short', at: 'short list' },
    { name: 'machine', at: 'the machine' },
    { name: 'everything', at: 'everything else' },
    { name: 'tested', at: 'I tested' },
    { name: 'linux', at: 'is Linux' },
    { name: 'intel', at: 'ordinary Intel' },
    { name: 'apple', at: 'Apple machines' },
    { name: 'windows', at: 'Windows machines' },
    { name: 'other', at: 'other kinds of chip' },
    { name: 'untested', at: 'are untested' },
    { name: 'promise', at: 'not promise' },
    { name: 'docker', at: 'need Docker' },
    { name: 'compose', at: 'with Compose' },
    { name: 'newer', at: 'or newer' },
    { name: 'stage', at: 'pipeline stage' },
    { name: 'container', at: 'a container' },
    { name: 'python', at: 'install Python' },
    { name: 'audio', at: 'the audio tools' },
    { name: 'yourself', at: 'tools yourself' },
    { name: 'graphics', at: 'A graphics card' },
    { name: 'optional', at: 'is optional' },
    { name: 'nvidia', at: 'an NVIDIA one' },
    { name: 'voice', at: 'the voice is faster' },
    { name: 'every', at: 'but every stage' },
    { name: 'proc', at: 'processor-only version' },
  ],
};

const X = [330, 750, 1170, 1590];          // the four checklist columns
const IY = 440, LY = 620, CY = 705, NY = 780; // icon centre, label, chip, note rows
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
// bright inside [a, b), `floor` outside, smooth edges
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

function tick(parent) {
  const it = new Item(parent, 56, 56);
  el(it.g, 'circle', { cx: 0, cy: 0, r: 26, fill: P.accent, 'fill-opacity': 0.14, stroke: P.accent, 'stroke-width': 4 });
  el(it.g, 'path', { d: 'M -12 1 L -3 10 L 13 -10', ...stroke(P.accent, 6) });
  return it;
}
// THE COMPUTER: a rounded screen on a stand, ink outline, about 300 px wide
function computer(parent) {
  const it = new Item(parent, 300, 240);
  el(it.g, 'rect', { x: -150, y: -120, width: 300, height: 190, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(it.g, 'rect', { x: -12, y: 70, width: 24, height: 38, fill: P.ink });
  el(it.g, 'rect', { x: -70, y: 106, width: 140, height: 14, rx: 7, fill: P.ink });
  return it;
}
// THE CONTAINER BOX (canon): tall 360 x 420, rx 28, 4 px ink outline, up to 8 translucent cool layers 40 px high
function containerBox(parent) {
  const it = new Item(parent, 360, 420);
  el(it.g, 'rect', { x: -180, y: -210, width: 360, height: 420, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  it.layers = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => el(it.g, 'rect', { x: -158, y: 148 - k * 48, width: 316, height: 40, rx: 10, fill: P.cool, 'fill-opacity': 0.18, stroke: P.cool, 'stroke-width': 2, opacity: 0 }));
  return it;
}
// THE CARD (canon): a cool slab, fan circle left, 6 fins right; slab, fan and fins dashed because it is optional
function card(parent) {
  const it = new Item(parent, 320, 120);
  const d = { 'stroke-dasharray': '10 8' };
  el(it.g, 'rect', { x: -160, y: -60, width: 320, height: 120, rx: 16, fill: P.cool, 'fill-opacity': 0.06, stroke: P.cool, 'stroke-width': 4, ...d });
  el(it.g, 'circle', { cx: -90, cy: 0, r: 34, fill: 'none', stroke: P.cool, 'stroke-width': 4, ...d });
  for (let k = 0; k < 6; k++) el(it.g, 'line', { x1: -20 + k * 28, y1: -26, x2: -20 + k * 28, y2: 26, ...stroke(P.cool, 4), ...d, opacity: 0.7 });
  return it;
}
// THE VOICE (canon): 9 rounded accent bars, 12 px wide, pitch 34 (gap 22), up to 60 px tall
function wave(parent) {
  const it = new Item(parent, 300, 64);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((k, i) => {
    const h = 60 * k;
    el(it.g, 'rect', { x: -136 + i * 34 - 6, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent });
  });
  return it;
}
// THE PROCESSOR: a cool square chip with pins on four sides
function processor(parent) {
  const it = new Item(parent, 142, 142);
  el(it.g, 'rect', { x: -55, y: -55, width: 110, height: 110, rx: 12, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  for (let k = -1.5; k <= 1.5; k++) {
    const o = k * 24;
    [[o, -55, o, -71], [o, 55, o, 71], [-55, o, -71, o], [55, o, 71, o]].forEach(([x1, y1, x2, y2]) => el(it.g, 'line', { x1, y1, x2, y2, ...stroke(P.cool, 4) }));
  }
  el(it.g, 'rect', { x: -26, y: -26, width: 52, height: 52, rx: 6, fill: 'none', stroke: P.cool, 'stroke-width': 3 });
  return it;
}
// an untested system: a dim chip with a strike line through it (never ticked)
function struck(parent, text) {
  const it = new Item(parent);
  const c = chip(it.g, text, { size: type.label, color: P.dim, textColor: P.dim }).show(1);
  it.w = c.w; it.h = c.h;
  it.line = el(it.g, 'line', { x1: -c.w / 2 + 14, y1: 0, x2: -c.w / 2 + 14, y2: 0, ...stroke(P.dim, 5) });
  return it;
}
// a column label with its tick at the left
function rowLabel(parent, text, x) {
  const l = label(parent, text, { size: type.label }).at(x, LY);
  return { l, tk: tick(parent).at(x - l.w / 2 - 44, LY) };
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 560, y: 480, z: 1.15 },                    // close on the machine
    { cue: 'apple', delay: -0.4, dur: 1.4, x: 960, y: 500, z: 1 },    // wide: the untested systems beside it
    { cue: 'docker', delay: -0.4, dur: 1.4, x: 800, y: 480, z: 1.08 }, // lean in on Docker
    { cue: 'graphics', delay: -0.3, dur: 1.4, x: 960, y: 500, z: 1 }, // wide for the card and the processor
    { cue: 'proc', delay: -0.2, dur: 1.2, x: 960, y: 520, z: 0.98 },  // settle for the close
  ], ctx.cue);
  const W = S.stage.world;

  S.title = label(S.stage.hud, 'The short list', { size: type.title }).at(960, 150);

  // column 1: the machine, with what runs on top of it, then Linux on x86_64
  S.comp = computer(W).at(X[0], IY);
  S.stack = [0, 1, 2].map((k) => el(W, 'rect', { x: X[0] - 120 + k * 15, y: 286 - k * 40, width: 240 - k * 30, height: 28, rx: 10, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0 }));
  S.linux = rowLabel(W, 'Linux', X[0]);
  S.x86 = chip(W, 'x86_64', { color: P.cool }).at(X[0], CY);

  // the untested systems, dim and crossed out, gone before Docker arrives
  S.untested = [['Apple', 700, 'apple'], ['Windows', 1010, 'windows'], ['other kinds of chip', 1450, 'other']].map(([s, x, cue]) => ({ it: struck(W, s).at(x, IY), cue }));
  S.untestedLab = label(W, 'untested', { size: type.label, color: P.dim }).at(1075, LY);

  // column 2: Docker with Compose
  S.box = containerBox(W).at(X[1], 430, 0.55);
  S.docker = rowLabel(W, 'Docker', X[1]);
  S.compose = chip(W, 'Compose 2.24 or newer', { color: P.cool }).at(X[1], CY);
  S.python = chip(W, 'Python', { color: P.dim });
  S.audio = chip(W, 'audio tools', { color: P.dim });

  // column 3: the optional card
  S.card = card(W).at(X[2], IY);
  S.wave = wave(W).at(X[2], 330);
  S.gpu = rowLabel(W, 'graphics card', X[2]);
  S.nvidia = chip(W, 'NVIDIA', { color: P.cool, dashed: true }).at(X[2], CY);
  S.optional = label(W, 'optional', { size: type.note, color: P.dim }).at(X[2], NY);

  // column 4: the processor
  S.cpu = processor(W).at(X[3], IY, 1.3);
  S.proc = rowLabel(W, 'processor', X[3]);

  const fin = 'every stage also has a processor-only version';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56) }).at(960, 840);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const END = 99;
  const fin = reveal(t, c('proc') + 0.1, 0.5);
  const close = (d) => lerp(d, 0.75, fin);   // the wide close lifts every column back to a readable level

  S.title.show(reveal(t, c('short') - 0.2, 0.6)).dim(lerp(1, 0.35, ease.inOut(prog(t, c('machine'), 0.6))));

  // column 1: bright on the machine, pushed back while the untested systems are named, bright again on "not promise"
  const d1 = close(Math.max(spot(t, c('machine'), c('apple')), spot(t, c('promise'), c('docker'))));
  S.comp.show(reveal(t, c('machine'), 0.6)).dim(d1);
  S.stack.forEach((r, k) => set(r, { opacity: +(fadeBetween(t, c('everything') + k * 0.35, c('tested') - 0.4) * 0.8).toFixed(3) }));
  S.linux.l.show(reveal(t, c('linux'), 0.5)).dim(d1);
  S.linux.tk.show(reveal(t, c('linux') + 0.3, 0.4)).dim(d1);
  S.x86.show(reveal(t, c('intel'), 0.5)).dim(d1);

  // the untested systems: each appears on its word, a strike line draws through it; dim further on "not promise"
  const gone = c('docker') - 0.9;
  const ud = lerp(1, 0.6, ease.inOut(prog(t, c('promise'), 0.6)));
  S.untested.forEach(({ it, cue }) => {
    const q = ease.inOut(prog(t, c(cue) + 0.3, 0.5));
    set(it.line, { x2: (-it.w / 2 + 14 + q * (it.w - 28)).toFixed(1) });
    it.show(fadeBetween(t, c(cue), gone)).dim(Math.min(ud, 0.7)); // never brighter than the ticked Linux
  });
  S.untestedLab.show(fadeBetween(t, c('untested'), gone)).dim(Math.min(ud, 0.7));

  // column 2: Docker; the box fills with layers on "pipeline stage ... container"
  const d2 = close(spot(t, c('docker'), c('graphics')));
  S.box.show(reveal(t, c('docker'), 0.6)).dim(d2);
  // three layers on "pipeline stage ... container", one more as Python and the audio tools each land inside
  const lay = [c('stage'), c('stage') + 0.5, c('stage') + 1, c('python') + 1.2, c('audio') + 1.2];
  S.box.layers.forEach((r, k) => set(r, { opacity: k < lay.length ? +reveal(t, lay[k], 0.4).toFixed(3) : 0 }));
  S.docker.l.show(reveal(t, c('docker'), 0.5)).dim(d2);
  S.docker.tk.show(reveal(t, c('newer'), 0.4)).dim(d2);
  S.compose.show(reveal(t, c('compose'), 0.5)).dim(d2);
  // Python and the audio tools drop into the box: you do not install them yourself
  // each drops in on its own word, dim from the start so it never reads as one more thing to install
  [[S.python, 620, 'python'], [S.audio, 900, 'audio']].forEach(([ch, x0, cue]) => {
    const q = ease.inOut(prog(t, c(cue) + 0.3, 0.9));
    ch.at(lerp(x0, X[1], q), lerp(250, 420, q), lerp(1, 0.9, q)).show(reveal(t, c(cue), 0.4) * (1 - ease.in(prog(t, c(cue) + 0.8, 0.5)))).dim(0.6);
  });

  // column 3: the optional card, NVIDIA, the voice is faster on it
  const d3 = close(spot(t, c('graphics'), c('every')));
  S.card.show(reveal(t, c('graphics'), 0.6)).dim(d3);
  S.gpu.l.show(reveal(t, c('graphics'), 0.5)).dim(d3);
  S.optional.show(reveal(t, c('optional'), 0.5) * (1 - reveal(t, c('every'), 0.5))).dim(d3);
  S.nvidia.show(reveal(t, c('nvidia'), 0.5)).dim(d3);
  S.wave.show(reveal(t, c('voice'), 0.5)).dim(close(spot(t, c('voice'), c('every'), 0.5) * d3));

  // column 4: the processor, every stage also runs on it
  const d4 = close(spot(t, c('every'), END));
  S.cpu.show(reveal(t, c('every'), 0.6)).dim(d4);
  S.proc.l.show(reveal(t, c('proc'), 0.5)).dim(d4);
  S.proc.tk.show(reveal(t, c('proc') + 0.3, 0.4)).dim(d4);

  S.final.show(fin);
}
