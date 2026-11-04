// 02-intro: four stops in a row (plan, fact sheet, script, shield), lit in order; a dim waveform and play button wait at the right.
import { palette as P, ease, lerp, prog, el, set } from 'style';
import { label, arrow, makeStage, paintBackground, makeParticles, reveal, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'intro', at: 'This part' },
    { name: 'skel', at: 'takes those choices' },
    { name: 'plan', at: 'one-page plan' },
    { name: 'fact', at: 'fact sheet' },
    { name: 'script', at: 'the script' },
    { name: 'checks', at: 'the checks' },
    { name: 'read', at: 'read all of it' },
    { name: 'small', at: 'Each one is small' },
    { name: 'each', at: 'and each gives' },
    { name: 'a1', at: 'gives the next' },
    { name: 'a2', at: 'next something' },
    { name: 'a3', at: 'something to rely' },
    { name: 'before', at: 'Before any script' },
    { name: 'decide', at: 'you decide' },
    { name: 'video', at: 'what one video says' },
    { name: 'wide', at: 'and I will' },
    { name: 'there', at: 'start there' },
  ],
};

const Y = 470, K = 0.55; // bible CANON: a page as a stop icon may be scaled to 0.5-0.6, stroke scaled back to ~4 px
const SW = 4 / K;
const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z'; // scene 08
const XS = [260, 560, 860, 1150];
const NAMES = ['one-page plan', 'fact sheet', 'script', 'checks'];
let S;

const bar = (g, x, y, w, h, color, extra = {}) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color, ...extra });

function page(parent) {
  const it = new Item(parent, 360, 470);
  it.frame = el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': SW });
  return it;
}

function planPage(parent) {
  const it = page(parent);
  const g = el(it.g, 'g', { transform: 'translate(-960 -500)' }); // scene 03's drawing, page centre (960, 500)
  const b3 = (x1, x2, y, h, color) => el(g, 'rect', { x: x1, y: y - h / 2, width: x2 - x1, height: h, rx: h / 2, fill: color });
  const CL = 816;
  it.thesis = b3(CL, 1104, 316, 16, P.ink);
  el(g, 'circle', { cx: 832, cy: 371, r: 9, fill: P.dim });
  el(g, 'rect', { x: 818, y: 383, width: 28, height: 16, rx: 8, fill: P.dim });
  b3(862, 1030, 382, 12, P.ink);
  // "?" drawn as a path: text at stop scale would be under the 36 px minimum
  el(g, 'path', { d: 'M 1060 370 Q 1060 358 1072 358 Q 1084 358 1084 370 Q 1084 379 1072 384 L 1072 392', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
  el(g, 'circle', { cx: 1072, cy: 403, r: 3.5, fill: P.ink });
  [0, 1, 2].forEach((i) => {
    const x = CL + i * 98, y = 448, c = [P.accent, P.ink, P.dim][i];
    el(g, 'rect', { x, y: y - 15, width: 30, height: 30, rx: 7, fill: 'none', stroke: c, 'stroke-width': 3 });
    if (i === 0) { el(g, 'ellipse', { cx: x + 11, cy: y, rx: 6, ry: 4, fill: 'none', stroke: c, 'stroke-width': 2.5 }); el(g, 'ellipse', { cx: x + 19, cy: y, rx: 6, ry: 4, fill: 'none', stroke: c, 'stroke-width': 2.5 }); }
    if (i === 1) { el(g, 'line', { x1: x + 6, y1: y + 5, x2: x + 24, y2: y + 5, stroke: c, 'stroke-width': 2.5 }); [9, 15, 21].forEach((k) => el(g, 'line', { x1: x + k, y1: y + 5, x2: x + k, y2: y - 4, stroke: c, 'stroke-width': 2 })); }
    if (i === 2) el(g, 'path', { d: `M ${x + 6} ${y + 2} q 4.5 -8 9 0 t 9 0`, fill: 'none', stroke: c, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    b3(x + 38, x + 86, y, 10, P.ink);
  });
  [[0, 200], [14, 160], [28, 184]].forEach(([dy, w]) => b3(CL, CL + w, 500 + dy, 8, P.dim));
  el(g, 'line', { x1: CL - 8, y1: 536, x2: CL + 214, y2: 492, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round' });
  const DOTS = [590, 644, 698];
  DOTS.forEach((y, i) => { el(g, 'circle', { cx: 836, cy: y, r: 11, fill: P.ink }); b3(870, [1060, 1010, 1040][i], y, 12, P.ink); });
  for (let i = 0; i < 2; i++) {
    const y1 = DOTS[i] + 16, y2 = DOTS[i + 1] - 16;
    el(g, 'line', { x1: 836, y1, x2: 836, y2, stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });
    el(g, 'path', { d: `M 828 ${y2 - 8} L 836 ${y2} L 844 ${y2 - 8}`, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }
  return it;
}

function factPage(parent) {
  const it = page(parent);
  it.tags = [];
  it.content = el(it.g, 'g', {}); // fades at 'before': nothing is filled in yet
  const icons = [
    (g) => { // cited: two chained loops
      el(g, 'rect', { x: -18, y: -8, width: 22, height: 14, rx: 7, fill: 'none', stroke: P.accent, 'stroke-width': 4 });
      el(g, 'rect', { x: -4, y: -6, width: 22, height: 14, rx: 7, fill: 'none', stroke: P.accent, 'stroke-width': 4 });
      return P.accent;
    },
    (g) => { // measured: a ruler with ticks
      el(g, 'rect', { x: -20, y: -8, width: 40, height: 16, rx: 3, fill: 'none', stroke: P.ink, 'stroke-width': 3 });
      for (let k = 0; k < 4; k++) el(g, 'line', { x1: -12 + k * 8, y1: -8, x2: -12 + k * 8, y2: k % 2 ? -1 : 2, stroke: P.ink, 'stroke-width': 3 });
      return P.ink;
    },
    (g) => { // estimated: a tilde wave
      el(g, 'path', { d: 'M -18 4 Q -9 -10 0 0 T 18 -4', fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' });
      return P.dim;
    },
  ];
  icons.forEach((draw, i) => {
    const y = -130 + i * 120;
    const g = el(it.content, 'g', { opacity: 0, transform: `translate(-112 ${y})` });
    const box = el(g, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: P.bg, 'stroke-width': 3 });
    set(box, { stroke: draw(g) });
    bar(it.content, -60, y - 12, 200, 18, P.ink);
    bar(it.content, -60, y + 18, 150, 14, P.dim);
    it.tags.push(g);
  });
  return it;
}

function scriptPage(parent) {
  const it = page(parent);
  it.text = el(it.g, 'g', {});
  for (let s = 0; s < 3; s++) {
    const y = -175 + s * 135;
    bar(it.text, -140, y, 250, 26, P.ink);
    bar(it.text, -140, y + 40, 270, 14, P.dim);
    bar(it.text, -140, y + 68, 220, 14, P.dim);
  }
  return it;
}

function shield(parent) {
  const it = new Item(parent, 220, 260);
  el(it.g, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': 6 / K, 'stroke-linejoin': 'round' });
  it.content = el(it.g, 'g', {});
  [120, 96, 120, 80].forEach((w, i) => bar(it.content, -w / 2, -62 + i * 40, w, 18, P.ink));
  return it;
}

function scanLine(parent) {
  const it = new Item(parent, 360, 470);
  it.line = el(it.g, 'line', { x1: -170, x2: 170, y1: -230, y2: -230, stroke: P.accent, 'stroke-width': 5, 'stroke-linecap': 'round' });
  return it;
}

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'plan', delay: 0, dur: 2.0, x: 930, y: 520, z: 1.03 },
      { cue: 'before', delay: 0, dur: 1.6, x: 938, y: 490, z: 1.04 },
      { cue: 'wide', delay: 0, dur: 1.1, x: 960, y: 540, z: 1 },
    ], c),
  };
  const W = S.stage.world;
  S.stops = [planPage(W), factPage(W), scriptPage(W), shield(W)];
  S.stops.forEach((s, i) => s.at(XS[i], Y, K));
  S.scans = [0, 1, 2].map((i) => scanLine(W).at(XS[i], Y, K));
  S.labels = NAMES.map((n, i) => label(W, n, { size: 40 }).at(XS[i], Y + 175));
  // gaps between stop edges: page half-width 99, shield half-width 61
  const gaps = [[359 + 14, 461 - 14], [659 + 14, 761 - 14], [959 + 18, 1089 - 18]];
  S.link = el(W, 'g', { opacity: 0 }); // only in the gaps, so it never shows through a stop
  gaps.forEach(([a, b]) => el(S.link, 'line', { x1: a, y1: Y, x2: b, y2: Y, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  S.arrows = gaps.map(([a, b]) => arrow(W, a, Y, b, Y, { color: P.accent, width: 5, head: 18 }));
  // the waiting voice: 9-bar waveform and a play button, dim
  S.wave = new Item(W, 284, 60);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((h, i) => el(S.wave.g, 'rect', { x: -142 + i * 34, y: -h * 30, width: 12, height: h * 60, rx: 6, fill: P.accent }));
  S.wave.at(1420, Y);
  S.play = new Item(W, 100, 100);
  el(S.play.g, 'circle', { cx: 0, cy: 0, r: 46, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  el(S.play.g, 'path', { d: 'M -14 -20 L 22 0 L -14 20 Z', fill: P.dim });
  S.play.at(1660, Y);
  S.small = label(S.stage.hud, 'Each one is small', { size: 64 }).at(960, 820);
  S.rely = label(S.stage.hud, 'Each gives the next something to rely on', { size: 64 }).at(960, 830);
  S.final = label(S.stage.hud, 'Decide what one video says', { size: 64, color: P.ink }).at(960, 840);
}

const io = ease.inOut;

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  set(S.link, { opacity: +(0.45 * reveal(t, c('skel'), 0.8) * lerp(1, 0.6, io(prog(t, c('before'), 0.6)))).toFixed(3) });
  const lit = [c('plan'), c('fact'), c('script'), c('checks')];
  const level = (i, ghost) => {
    let v = lerp(ghost * reveal(t, c('skel'), 0.8), 1, reveal(t, lit[i], 0.5));
    if (i < 3) v = lerp(v, 0.35, io(prog(t, lit[i + 1], 0.6)));
    v = lerp(v, 1, io(prog(t, c('small'), 0.6)));
    if (i > 0) v = lerp(v, 0.3, io(prog(t, c('before'), 0.6)));
    return v;
  };
  S.stops.forEach((s, i) => s.show(level(i, 0.22)));
  // "each one is small": a brief squeeze; "the checks read": the shield pulses as the scans start
  const squeeze = 1 - 0.08 * Math.sin(Math.PI * prog(t, c('small'), 0.8));
  [1, 2].forEach((i) => S.stops[i].at(XS[i], Y, K * squeeze));
  S.stops[3].at(XS[3], Y, K * squeeze * (1 + 0.1 * Math.sin(Math.PI * prog(t, c('read') - 0.2, 0.6))));
  // before any script exists: the script page empties
  const empty = io(prog(t, c('before'), 0.6));
  set(S.stops[2].text, { opacity: +(1 - empty).toFixed(3) });
  [1, 3].forEach((i) => set(S.stops[i].content, { opacity: +lerp(1, 0.3, empty).toFixed(3) }));
  S.labels.forEach((l, i) => l.show(level(i, 0)));

  // fact tags stamp in one after another
  S.stops[1].tags.forEach((g, i) => set(g, { opacity: +reveal(t, c('fact') + 0.15 + i * 0.25, 0.35).toFixed(3) }));

  // the checks read all of it: a scan line sweeps down each page
  const r0 = c('read');
  S.scans.forEach((s, i) => {
    const p = io(prog(t, r0 + i * 0.12, 0.9));
    const y = lerp(-225, 225, p);
    set(s.line, { y1: y.toFixed(1), y2: y.toFixed(1) });
    s.show(p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0);
  });

  // each gives the next something to rely on
  ['a1', 'a2', 'a3'].forEach((n, i) => {
    const p = io(prog(t, c(n), 0.5));
    S.arrows[i].draw(p, p > 0 ? lerp(1, 0.3, io(prog(t, c('before'), 0.6))) : 0); // hidden until drawn: a zero-length round cap paints a dot
  });

  // before any script: the plan comes forward
  const lift = io(prog(t, c('decide'), 0.8));
  S.stops[0].at(XS[0] - 10 * lift, Y - 20 * lift, lerp(K * squeeze, 0.6, lift));
  set(S.stops[0].thesis, { fill: reveal(t, c('video'), 0.4) > 0.5 ? P.accent : P.ink });
  set(S.stops[0].frame, { stroke: reveal(t, c('there'), 0.4) > 0.5 ? P.accent : P.dim });

  const wait = 0.3 * reveal(t, c('skel'), 0.8); // with the ghost stops, so it is not alone on screen
  S.wave.show(wait);
  S.play.show(wait);

  S.small.show(reveal(t, c('small') + 0.1, 0.5) * (1 - ease.in(prog(t, c('each') - 0.45, 0.4))));
  S.rely.show(reveal(t, c('a2'), 0.5) * (1 - ease.in(prog(t, c('before'), 0.4))));
  S.final.show(reveal(t, c('video'), 0.5));
}
