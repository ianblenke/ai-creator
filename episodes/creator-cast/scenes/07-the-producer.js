// 07 - the producer: "those models" are the whole cast, each in its zone colour (the voice on its card and the ears on a
// processor, both cool hardware; the Claude models as the violet cloud). They bob out of step in a row, then part: the
// hardware settles under the desk, the cloud rises to the top, and the producer (Claude Code, an ink figure at a desk with a
// screen, on my machine) takes the middle, above them. Its lines rise only to the cloud. Its screen runs four stages in order,
// then the picture author (violet Opus figure with pencil) and the reviewer (violet figure with an eye, separate magnifier, no
// pencil) appear. The author's scene cards arrive with its own dim "clean" claim; the producer re-runs the check itself (a
// tick on its screen, a scan down the cards, a tick by each). Four files go to the author (its own brief first), an eye-only
// dashed line goes to the reviewer. Ends wide on "an author does not review its own scenes".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, arrow, flow, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'models', at: 'Those models' },
    { name: 'program', at: 'one more program' },
    { name: 'above', at: 'sits above' },
    { name: 'cc', at: 'Claude Code' },
    { name: 'machine', at: 'on my machine' },
    { name: 'calls', at: 'calls Claude' },
    { name: 'cloud', at: 'in the cloud' },
    { name: 'stages', at: 'the stages' },
    { name: 'authors', at: 'picture authors' },
    { name: 'reviewers', at: 'the reviewers' },
    { name: 'then', at: 'Then it runs' },
    { name: 'layout', at: 'layout check' },
    { name: 'itself', at: 'itself again' },
    { name: 'confirm', at: 'confirm' },
    { name: 'trusting', at: 'instead of trusting' },
    { name: 'clean', at: 'is clean' },
    { name: 'each', at: 'Each author' },
    { name: 'brief', at: 'own brief' },
    { name: 'refs', at: 'reference files' },
    { name: 'reviewer', at: 'each reviewer' },
    { name: 'read', at: 'only read' },
    { name: 'so', at: 'so an author' },
    { name: 'review', at: 'review its own' },
  ],
};

// the cast row at the start, and where each model settles: [row x, row y, row scale, home x, home y, home scale]
const VOICE = [620, 540, 0.9, 880, 660, 0.55], EARS = [960, 540, 1.1, 1075, 648, 0.55], CLOUD = [1300, 540, 1.3, 960, 175, 1.4];
const AU = [330, 520], RV = [1520, 520], LAB_Y = 720;      // author and reviewer (300 px figures), their labels' y
const CARDS = [440, 545, 650], CX = 600;                   // the author's scene cards (a column between author and producer)
const FILES = [235, 315, 360, 405], FY = 320;              // where the files land: the brief, a gap, then the three reference files
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// THE CLOUD: three overlapping translucent violet circles
function cloud(parent) {
  const it = new Item(parent, 128, 82);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 4 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  return it;
}
// THE VOICE on THE CARD: a short accent waveform over the cool slab with its fan circle
function voiceCard(parent) {
  const it = new Item(parent, 320, 180);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35].forEach((k, i) => {
    const h = 50 * k;
    el(it.g, 'rect', { x: -90 + i * 24, y: -66 - h / 2, width: 12, height: h, rx: 6, fill: P.accent });
  });
  el(it.g, 'rect', { x: -160, y: -42, width: 320, height: 84, rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(it.g, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  for (let k = 0; k < 8; k++) el(it.g, 'line', { x1: -30 + k * 22, y1: -22, x2: -30 + k * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
  return it;
}
// THE EARS on THE PROCESSOR: the cool chip with pins, two small accent arcs on it
function earsChip(parent) {
  const it = new Item(parent, 142, 142);
  el(it.g, 'rect', { x: -55, y: -55, width: 110, height: 110, rx: 12, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  for (let k = -1.5; k <= 1.5; k++) {
    const o = k * 24;
    [[o, -55, o, -71], [o, 55, o, 71], [-55, o, -71, o], [55, o, 71, o]].forEach(([x1, y1, x2, y2]) => el(it.g, 'line', { x1, y1, x2, y2, ...stroke(P.cool, 4) }));
  }
  el(it.g, 'path', { d: 'M -14 -22 Q 6 0 -14 22 M 8 -32 Q 36 0 8 32', ...stroke(P.accent, 6) });
  return it;
}
// the producer's figure: a plain ink head over a rounded body that ends behind the desk top, centred on x
function inkFigure(g, x) {
  el(g, 'circle', { cx: x, cy: 440, r: 34, fill: 'none', stroke: P.ink, 'stroke-width': 6 });
  el(g, 'rect', { x: x - 45, y: 484, width: 90, height: 104, rx: 36, fill: P.ink, 'fill-opacity': 0.1, stroke: P.ink, 'stroke-width': 6 });
}
// scene 06's figure: circle head over a rounded body, drawn at 300 px and scaled to H; optional pencil (writer) or eye (reviewer)
function figure(parent, H, color, { pencil = false, eye = false } = {}) {
  const it = new Item(parent, 0.5 * H, H);
  const s = H / 300, sw = 5 / s;
  const g = el(it.g, 'g', { transform: `scale(${s})` });
  const st = { fill: color, 'fill-opacity': 0.18, stroke: color, 'stroke-width': sw };
  el(g, 'circle', { cx: 0, cy: -112, r: 38, ...st });
  el(g, 'rect', { x: -70, y: -62, width: 140, height: 212, rx: 50, ...st });
  if (pencil) {
    it.pencil = el(g, 'g', { transform: 'translate(64 -10) rotate(-35)' });
    // the series pencil: a violet outline with a ferrule, at -35 deg
    el(it.pencil, 'rect', { x: 0, y: -8, width: 70, height: 16, rx: 3, fill: P.bg, stroke: color, 'stroke-width': 4 / s });
    el(it.pencil, 'line', { x1: 14, y1: -8, x2: 14, y2: 8, stroke: color, 'stroke-width': 4 / s });
    el(it.pencil, 'path', { d: 'M 70 -8 L 90 0 L 70 8 Z', fill: P.bg, stroke: color, 'stroke-width': 4 / s, 'stroke-linejoin': 'round' });
  }
  if (eye) {
    el(g, 'path', { d: 'M -24 -112 Q 0 -130 24 -112 Q 0 -94 -24 -112 Z', fill: P.bg, stroke: P.ink, 'stroke-width': 4 / s });
    el(g, 'circle', { cx: 0, cy: -112, r: 7, fill: P.ink });
  }
  return it;
}
// scene 06's SCENE CARD: a 16:9 rounded frame with a code bracket "{ }" (bars, no letters) and n code bars
function sceneCard(parent, w, h, color, n) {
  const it = new Item(parent, w, h);
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(22, h * 0.14), fill: P.bg2, stroke: color, 'stroke-width': 4 });
  const bx = w * 0.41, bh = h * 0.33, bw = w * 0.04, sw = Math.max(3, w * 0.009);
  el(it.g, 'path', { d: `M ${-bx + bw} ${-bh} L ${-bx} ${-bh} L ${-bx} ${-bw} L ${-bx - bw} 0 L ${-bx} ${bw} L ${-bx} ${bh} L ${-bx + bw} ${bh}`, ...stroke(color, sw) });
  el(it.g, 'path', { d: `M ${bx - bw} ${-bh} L ${bx} ${-bh} L ${bx} ${-bw} L ${bx + bw} 0 L ${bx} ${bw} L ${bx} ${bh} L ${bx - bw} ${bh}`, ...stroke(color, sw) });
  const fr = [0.46, 0.36, 0.54, 0.29, 0.41], bar = Math.max(8, h * 0.045);
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : -h * 0.25 + (i * h * 0.5) / (n - 1);
    el(it.g, 'rect', { x: -w * 0.32, y: y - bar / 2, width: fr[i] * w, height: bar, rx: bar / 2, fill: P.ink });
  }
  return it;
}
function tick(parent, s = 1) {
  const it = new Item(parent, 34 * s, 26 * s);
  el(it.g, 'path', { d: 'M -15 0 L -4 11 L 16 -12', ...stroke(P.accent, 7), transform: `scale(${s})` });
  return it;
}
// a FILE square with a folded corner
function file(parent, color) {
  const it = new Item(parent, 40, 48);
  el(it.g, 'path', { d: 'M -20 -24 L 8 -24 L 20 -12 L 20 24 L -20 24 Z', ...stroke(color, 4), fill: color, 'fill-opacity': 0.15 });
  el(it.g, 'path', { d: 'M 8 -24 L 8 -12 L 20 -12', ...stroke(color, 4) });
  return it;
}
// bright inside [a, b), `floor` outside, smooth edges
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 500, z: 1.12 },                  // close on the cast and the producer
    { cue: 'authors', delay: -1.7, dur: 1.4, x: 960, y: 540, z: 1 }, // wide: authors and reviewers join
    { cue: 'each', dur: 1.4, x: 880, y: 540, z: 1.05 },             // lean toward the author for its brief
    { cue: 'reviewer', dur: 1.4, x: 960, y: 540, z: 1 },            // wide again for the reviewer and the close
  ], ctx.cue);
  const W = S.stage.world;

  // those models: the whole cast, in its zone colours
  S.cast = [[voiceCard(W), VOICE], [earsChip(W), EARS], [cloud(W), CLOUD]];
  S.cloudLab = label(W, 'in the cloud', { size: type.label, color: P.violet }).at(1260, 175);
  // the producer's line rises only to the cloud models
  S.up = arrow(W, 1040, 402, 990, 236, { color: P.violet, width: 4 });
  S.upDots = flow(W, [[1040, 398], [992, 242]], { n: 3, r: 8, color: P.violet, period: 1.6 });

  // THE PRODUCER at its desk, on the computer side
  S.prod = new Item(W);
  const pg = S.prod.g;
  inkFigure(pg, 850);
  el(pg, 'path', { d: 'M 882 528 L 948 572', ...stroke(P.ink, 6) });                  // arm to the desk
  el(pg, 'rect', { x: 740, y: 588, width: 460, height: 18, rx: 6, fill: P.ink });      // desk top
  el(pg, 'path', { d: 'M 772 606 L 772 680 M 1168 606 L 1168 680', ...stroke(P.ink, 6) });
  S.screen = el(pg, 'rect', { x: 950, y: 410, width: 180, height: 120, rx: 12, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(pg, 'rect', { x: 1030, y: 530, width: 20, height: 58, fill: P.ink });              // stand
  S.blocks = [0, 1, 2, 3].map((k) => el(pg, 'rect', { x: 976 + k * 38, y: 445, width: 26, height: 50, rx: 6, fill: P.dim, opacity: 0.4 }));
  S.scrTick = tick(pg, 1.8).at(1040, 470);
  S.ccLab = label(W, 'Claude Code', { size: type.label }).at(960, 720);
  S.machLab = label(W, 'on my machine', { size: type.note, color: P.cool }).at(960, 790);

  // the picture author (scene 06's violet Opus figure with its pencil) and its scene cards
  S.author = new Item(W);
  figure(S.author.g, 300, P.violet, { pencil: true }).at(...AU).show(1);
  label(S.author.g, 'picture authors', { size: fitSize('picture authors', 360, type.label), color: P.violet }).at(AU[0], LAB_Y).show(1);
  S.cards = CARDS.map((y) => {
    const c = new Item(W);
    sceneCard(c.g, 150, 84, P.violet, 3).at(CX, y).show(1);
    c.tk = tick(c.g, 1).at(CX + 100, y);
    return c;
  });
  S.scan = el(W, 'line', { x1: CX - 88, x2: CX + 88, y1: 0, y2: 0, ...stroke(P.accent, 4), opacity: 0 });
  // the author's own report: a dim bubble
  S.bubble = new Item(W);
  el(S.bubble.g, 'rect', { x: AU[0] - 85, y: 282, width: 170, height: 64, rx: 32, fill: 'none', stroke: P.dim, 'stroke-width': 3 });
  el(S.bubble.g, 'path', { d: `M ${AU[0] - 10} 346 L ${AU[0] - 2} 364 L ${AU[0] + 12} 346`, ...stroke(P.dim, 3) });
  label(S.bubble.g, 'clean', { size: type.note, color: P.dim }).at(AU[0], 314).show(1);

  // the four files the producer hands the author: its own brief (bright ink) and three reference files (dim)
  S.files = FILES.map((x, i) => file(W, i === 0 ? P.ink : P.dim));
  S.briefLab = label(W, 'own brief', { size: type.note, color: P.ink }).at(FILES[0], 250);   // labels the brief only

  // the reviewer: scene 06's violet figure with an eye on its head, a separate ink magnifier, and no pencil
  S.rev = new Item(W);
  figure(S.rev.g, 300, P.violet, { eye: true }).at(...RV).show(1);
  el(S.rev.g, 'circle', { cx: RV[0] - 110, cy: 560, r: 35, fill: P.ink, 'fill-opacity': 0.06, stroke: P.ink, 'stroke-width': 6 });
  el(S.rev.g, 'line', { x1: RV[0] - 135, y1: 585, x2: RV[0] - 162, y2: 612, ...stroke(P.ink, 9) });
  label(S.rev.g, 'reviewers', { size: type.label, color: P.violet }).at(RV[0], LAB_Y).show(1);
  // the eye-only line from the producer to the reviewer
  S.eyeLine = el(W, 'line', { x1: 1136, y1: 470, x2: 1370, y2: 470, ...stroke(P.ink, 4), 'stroke-dasharray': '12 12', opacity: 0 });
  S.eye = new Item(W, 60, 30);
  el(S.eye.g, 'path', { d: 'M -30 0 Q 0 -24 30 0 Q 0 24 -30 0 Z', fill: P.bg, ...stroke(P.ink, 4) });
  el(S.eye.g, 'circle', { cx: 0, cy: 0, r: 7, fill: P.ink });
  S.readLab = label(W, 'only read', { size: type.note, color: P.ink }).at(RV[0], 330);

  const fin = 'an author does not review its own scenes';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56), color: P.ink }).at(960, 860);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const END = 99;
  const back = lerp(1, 0.35, ease.inOut(prog(t, c('stages'), 0.6)));   // the models step back once the stages run

  // those models: the cast appears in a row, bobbing out of step (they do not coordinate); then they part:
  // the hardware settles under the desk, the cloud rises to the top, and the producer takes the middle
  const part = ease.inOut(prog(t, c('program') - 0.2, 1.2));
  S.cast.forEach(([it, [rx, ry, rs, hx, hy, hs]], i) => {
    const bob = 9 * Math.sin(t * (1.1 + i * 0.37) + i * 2.1) * (1 - part);
    it.show(reveal(t, c('models') + i * 0.3, 0.6)).at(lerp(rx, hx, part), lerp(ry, hy, part) + bob, lerp(rs, hs, part));
    // the cloud is spoken again on "calls Claude models", the hardware on "my machine"
    const lit = i === 2 ? spot(t, c('calls'), c('stages'), 0.6) : spot(t, c('machine'), c('calls'), 0.6);
    it.dim(t < c('above') ? 1 : lit * back);
  });
  S.cloudLab.show(reveal(t, c('cloud'), 0.5)).dim(back);
  S.up.draw(ease.inOut(prog(t, c('calls'), 0.7)), reveal(t, c('calls'), 0.2) * back);
  S.upDots.update(t, reveal(t, c('calls') + 0.7, 0.5) * 0.9 * back);

  // the producer: appears low on "one more program", rises above the hardware on "sits above"
  const rise = ease.out(prog(t, c('above'), 0.8));
  // it fades in after the cast has mostly parted, so the ears chip does not cross its screen
  S.prod.show(reveal(t, c('program') + 0.8, 0.5)).at(0, lerp(50, 0, rise));
  S.prod.dim(Math.max(spot(t, -1, c('authors'), 0.4), spot(t, c('then'), c('each'), 0.4)));
  S.ccLab.show(reveal(t, c('cc'), 0.5)).dim(S.prod.dimv);
  S.machLab.show(reveal(t, c('machine') + 0.3, 0.5)).dim(S.prod.dimv);
  set(S.screen, { stroke: reveal(t, c('machine') + 0.3, 0.5) > 0.5 ? P.cool : P.ink });
  // the stages run in order on its screen, then they step back for its own check
  const blk = 1 - 0.75 * reveal(t, c('itself'), 0.4);
  S.blocks.forEach((b, k) => {
    const on = reveal(t, c('stages') + 0.35 + k * 0.3, 0.25);
    set(b, { fill: on > 0.5 ? P.accent : P.dim, opacity: +(lerp(0.4, 1, on) * blk).toFixed(3) });
  });
  S.scrTick.show(reveal(t, c('itself'), 0.4));

  // the close: the phrase dominates; author and reviewer settle at 0.6 so the gap between them carries it
  const fin = reveal(t, c('so') + 0.2, 0.6);

  // the author and the reviewer start
  S.author.show(reveal(t, c('authors'), 0.6));
  S.author.dim(lerp(Math.max(spot(t, c('authors'), c('reviewers')), spot(t, c('trusting'), c('reviewer'))), 0.6, fin));
  S.rev.show(reveal(t, c('reviewers'), 0.6));
  S.rev.dim(lerp(Math.max(spot(t, c('reviewers'), c('then')), spot(t, c('reviewer'), END)), 0.6, fin));

  // the results arrive with the author's own dim "clean" claim; the producer's scan re-checks, a tick by each card
  const cardDim = spot(t, c('layout'), c('trusting'), 0.4);
  const s0 = c('confirm') - 0.1, sd = 1.6;
  S.cards.forEach((cd, i) => {
    cd.show(reveal(t, c('layout') + i * 0.2, 0.5)).dim(cardDim);
    cd.tk.show(reveal(t, s0 + sd * ((CARDS[i] - 390) / 310), 0.3));
  });
  const sc = prog(t, s0, sd);
  const sy = lerp(390, 700, sc);
  set(S.scan, { y1: sy.toFixed(1), y2: sy.toFixed(1), opacity: +(sc > 0 && sc < 1 ? Math.min(1, sc * 8, (1 - sc) * 8) : 0).toFixed(3) });
  // the claim: on screen before the scan, spotlit on "is clean", then back to dim; gone before the brief arrives
  S.bubble.show(fadeBetween(t, c('layout') + 0.4, c('each'))).dim(spot(t, c('clean') - 0.2, c('clean') + 1.0, 0.45));

  // four files fly from the producer to the author: the brief first, then the reference files
  S.files.forEach((f, i) => {
    const t0 = i === 0 ? c('brief') : c('refs') + (i - 1) * 0.25;
    const q = ease.inOut(prog(t, t0, 0.8));
    const sx = 860, sy0 = 380, kx = 600, ky = 230;
    const x = (1 - q) ** 2 * sx + 2 * (1 - q) * q * kx + q * q * FILES[i];
    const y = (1 - q) ** 2 * sy0 + 2 * (1 - q) * q * ky + q * q * FY;
    f.show(reveal(t, t0, 0.2) * (i === 0 ? 1 : 0.6)).at(x, y, i === 0 ? 1.2 : 1).dim(spot(t, -1, c('reviewer'), 0.5));
  });
  S.briefLab.show(reveal(t, c('brief'), 0.5)).dim(spot(t, -1, c('reviewer'), 0.5));

  // the reviewer gets only an eye: a dashed line and the eye travelling along it
  const el1 = reveal(t, c('reviewer'), 0.5);
  set(S.eyeLine, { opacity: +el1.toFixed(3) });
  const eq = ease.inOut(prog(t, c('reviewer') + 0.2, 1.0));
  S.eye.show(el1).at(lerp(1170, 1320, eq), 470);
  S.readLab.show(reveal(t, c('read'), 0.5));

  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.5, fin).toFixed(3) });
}
