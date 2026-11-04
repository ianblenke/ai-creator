// Scene 10: what the check cannot catch. The shield gains four gaps, the eyes check every frame by hand,
// and the scan that needs an extra tool: without it, it checks nothing. Ends wide on that phrase.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { type, label, chip, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'none', at: 'None of this is complete' },
    { name: 'taught', at: 'what you have taught' },
    { name: 'and', at: 'and it only matches' },
    { name: 'patterns', at: 'matches patterns' },
    { name: 'street', at: 'your street' },
    { name: 'employer', at: 'your employer' },
    { name: 'unless', at: 'unless they are' },
    { name: 'list', at: 'on the list' },
    { name: 'catch', at: 'It cannot catch' },
    { name: 'words', at: 'place described in words' },
    { name: 'face', at: 'a face' },
    { name: 'reflection', at: 'reflection in a window' },
    { name: 'terminal', at: 'terminal line' },
    { name: 'machine', at: 'machine name' },
    { name: 'so', at: 'So you look' },
    { name: 'scan', at: 'picture text scan' },
    { name: 'hand', at: 'by hand' },
    { name: 'tool', at: 'extra tool' },
    { name: 'without', at: 'without it' },
    { name: 'nothing', at: 'checks nothing' },
  ],
};

// CANON: scene 08's outline, fill bg2 at 0.7, 6 px accent stroke, 4 centred denylist bars
const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z';
const DENY = [[-62, 120], [-22, 96], [18, 120], [58, 80]];
// gap targets on the outline (shield-local), in the order they are spoken
const GAPS = [
  { name: 'words', p: [-110, -50], text: 'a place in words', chip: [590, 370] },
  { name: 'face', p: [-82, 80], text: 'a face', chip: [660, 600] },
  { name: 'reflection', p: [110, -50], text: 'a reflection', chip: [1300, 370] },
  { name: 'terminal', p: [82, 80], text: 'terminal line', chip: [1280, 600] },
];
const SH = { x: 960, y: 460 };
let S;

const bar = (g, x, y, w, h, fill, op = 1) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill, opacity: op });

export function setup(ctx) {
  const cue = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'none', delay: 0, dur: 1.6, x: 960, y: 480, z: 1.25 },
      { cue: 'catch', delay: 0.3, dur: 1.4, x: 960, y: 480, z: 1 },
      { cue: 'so', delay: 0.3, dur: 1.6, x: 1000, y: 500, z: 1.05 },
      { cue: 'without', delay: 0.2, dur: 1.4, x: 960, y: 480, z: 1 }, // wide for the end phrase
    ], cue),
  };
  const W = S.stage.world;

  // ---- connectors (under everything) ----
  S.conn = GAPS.map(() => el(W, 'line', { stroke: P.hot, 'stroke-width': 3, opacity: 0 }));
  // names that pass through: drawn under the shield, and hidden while inside its outline
  S.street = chip(W, 'your street', { color: P.dim });
  S.employer = chip(W, 'your employer', { color: P.dim });

  // ---- the shield ----
  S.shield = new Item(W, 220, 260);
  const sg = S.shield.g;
  S.outline = el(sg, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  S.flash = [];
  DENY.forEach(([y, w]) => {
    bar(sg, -w / 2, y, w, 18, P.ink);
    S.flash.push(bar(sg, -w / 2, y, w, 18, P.accent, 0));
  });
  S.ring = el(sg, 'ellipse', { cx: 0, cy: -22, rx: 64, ry: 20, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });
  S.scanLine = el(sg, 'line', { x1: -80, x2: 80, stroke: P.accent, 'stroke-width': 4, opacity: 0 });
  // find each gap on the outline (nearest sampled point): its length for the dash, its point for the mark
  const L = S.outline.getTotalLength();
  S.len = L;
  S.gapAt = []; S.gapPt = [];
  GAPS.forEach((g) => {
    let best = 0, bd = 1e9, bp = { x: g.p[0], y: g.p[1] };
    for (let i = 0; i <= 400; i++) {
      const pt = S.outline.getPointAtLength((L * i) / 400);
      const d = Math.hypot(pt.x - g.p[0], pt.y - g.p[1]);
      if (d < bd) { bd = d; best = (L * i) / 400; bp = { x: pt.x, y: pt.y }; }
    }
    S.gapAt.push(best); S.gapPt.push(bp);
  });
  S.marks = S.gapPt.map((pt) => el(sg, 'circle', { cx: pt.x, cy: pt.y, r: 7, fill: P.hot, opacity: 0 }));

  // ---- phase 1 labels ----
  S.lTaught = label(W, 'what you have taught', { size: type.note }).at(960, 660);
  S.lPatterns = label(W, 'matches patterns', { size: type.note, color: P.accent }).at(960, 660);
  S.lList = label(W, 'on the list', { size: type.note, color: P.hot }).at(960, 660);

  // ---- gaps ----
  S.gapChips = GAPS.map((g) => chip(W, g.text, { color: P.hot }).at(g.chip[0], g.chip[1]));

  // ---- phase 2: frames and eyes ----
  S.frames = [700, 970, 1240, 1510].map((x, i) => {
    const it = new Item(W, 230, 150).at(x, 470);
    el(it.g, 'rect', { x: -115, y: -75, width: 230, height: 150, rx: 14, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
    // peak stays left of and below the sun
    el(it.g, 'path', { d: `M -90 55 L ${-50 + i * 6} ${-10 - i * 4} L 10 30 L 45 0 L 90 55 Z`, fill: P.dim, opacity: 0.35 });
    el(it.g, 'circle', { cx: 60 - i * 10, cy: -38, r: 14, fill: P.dim, opacity: 0.5 });
    it.hi = el(it.g, 'rect', { x: -115, y: -75, width: 230, height: 150, rx: 14, fill: 'none', stroke: P.accent, 'stroke-width': 5, opacity: 0 });
    it.scan = el(it.g, 'line', { x1: -105, x2: 105, stroke: P.accent, 'stroke-width': 4, opacity: 0 });
    return it;
  });
  S.eyes = new Item(W, 170, 50);
  for (const dx of [-45, 45]) {
    el(S.eyes.g, 'ellipse', { cx: dx, cy: 0, rx: 36, ry: 22, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
    el(S.eyes.g, 'circle', { cx: dx + 8, cy: 4, r: 10, fill: P.ink });
  }
  S.cScan = chip(W, 'picture text scan', { color: P.accent }).at(1000, 680);
  S.cHand = chip(W, 'by hand', { color: P.ink }).at(1390, 680);
  // the extra tool: a plug, dim (optional, not installed)
  S.tool = new Item(W, 90, 90).at(1560, 680);
  const tg = S.tool.g, ds = { fill: 'none', stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  el(tg, 'rect', { x: -26, y: -18, width: 52, height: 40, rx: 10, ...ds });
  el(tg, 'line', { x1: -12, y1: -18, x2: -12, y2: -38, ...ds });
  el(tg, 'line', { x1: 12, y1: -18, x2: 12, y2: -38, ...ds });
  el(tg, 'path', { d: 'M 0 22 L 0 32 Q 0 44 -14 44', ...ds });
  S.toolCross = el(W, 'g', { opacity: 0 });
  el(S.toolCross, 'line', { x1: 1515, y1: 640, x2: 1605, y2: 720, stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round' });
  el(S.toolCross, 'line', { x1: 1605, y1: 640, x2: 1515, y2: 720, stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round' });
  // the end phrase, in screen space so the camera does not scale it
  S.lEnd = label(S.stage.hud, 'without it, it checks nothing', { size: 64 }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // ---------- shield ----------
  // gap chips and connectors leave first; then the shield glides left, keeping its size
  const gapOut = 1 - ease.in(prog(t, c('so'), 0.4));
  const toLeft = ease.inOut(prog(t, c('so') + 0.45, 1.0));
  const sx = lerp(SH.x, 330, toLeft), sy = lerp(SH.y, 470, toLeft);
  S.shield.at(sx, sy).show(reveal(t, 0.6, 0.8)).dim(lerp(1, 0.5, toLeft) * dimAfter(t, c('without'), 0.7));

  // gaps open in the outline as each is spoken
  const open = GAPS.map((g) => 26 * ease.out(prog(t, c(g.name), 0.5)));
  const segs = S.gapAt.map((at, i) => ({ at, w: open[i] })).sort((a, b) => a.at - b.at);
  const dash = []; let pos = 0;
  for (const s of segs) { dash.push(Math.max(0, s.at - s.w / 2 - pos).toFixed(2), s.w.toFixed(2)); pos = s.at + s.w / 2; }
  dash.push(Math.max(0, S.len - pos).toFixed(2), '0');
  set(S.outline, { 'stroke-dasharray': dash.join(' ') });
  S.marks.forEach((m, i) => set(m, { opacity: +reveal(t, c(GAPS[i].name), 0.4).toFixed(3) }));

  // what it has been taught: the list bars light one by one; then a pattern scan
  S.flash.forEach((f, i) => set(f, { opacity: +fadeBetween(t, c('taught') + i * 0.3, c('taught') + i * 0.3 + 0.7, 0.3).toFixed(3) }));
  const sc = prog(t, c('patterns'), 1.4);
  set(S.scanLine, { y1: lerp(-85, 85, sc), y2: lerp(-85, 85, sc), opacity: +(sc > 0 && sc < 1 ? 1 : 0) });
  set(S.ring, { opacity: +fadeBetween(t, c('list'), c('catch'), 0.4).toFixed(3) });

  S.lTaught.show(fadeBetween(t, c('taught'), c('and') + 0.1, 0.4));
  S.lPatterns.show(fadeBetween(t, c('patterns'), c('unless'), 0.4));
  S.lList.show(fadeBetween(t, c('list'), c('catch'), 0.4));

  // names that are not on the list pass straight through (hidden while behind the outline)
  [[S.street, 'street', 395], [S.employer, 'employer', 525]].forEach(([it, name, y]) => {
    const x = lerp(1440, 480, ease.inOut(prog(t, c(name), 1.8)));
    const outside = clamp((Math.abs(x - SH.x) - (116 + it.w / 2)) / 30);
    it.at(x, y).show(fadeBetween(t, c(name), c('catch'), 0.4) * outside).dim(dimAfter(t, c('list'), 0.35));
  });

  // ---------- the four gaps ----------
  const back = reveal(t, c('machine'));
  GAPS.forEach((g, i) => {
    const d = i < 3 ? lerp(dimAfter(t, c(GAPS[i + 1].name), 0.35), 1, back) : 1;
    const a = reveal(t, c(g.name)) * gapOut;
    const ch = S.gapChips[i];
    ch.show(a).dim(d);
    const tx = g.chip[0] < SH.x ? g.chip[0] + ch.w / 2 + 6 : g.chip[0] - ch.w / 2 - 6;
    set(S.conn[i], { x1: sx + S.gapPt[i].x, y1: sy + S.gapPt[i].y, x2: tx, y2: g.chip[1], opacity: +(a * d * 0.8).toFixed(3) });
  });

  // ---------- look at every frame, by hand ----------
  const rowA = reveal(t, c('so') + 1.1);
  const endDim = dimAfter(t, c('without'), 0.35); // spotlight moves to the end phrase
  const eyeK = ease.inOut(prog(t, c('so') + 1.2, 4.4));
  const ex = lerp(700, 1510, eyeK);
  S.eyes.at(ex, 300 + 6 * Math.sin(t * 2.2) * (1 - eyeK)).show(rowA).dim(endDim);
  S.frames.forEach((f, i) => {
    f.show(rowA * reveal(t, c('so') + 1.1 + i * 0.25)).dim(endDim);
    set(f.hi, { opacity: +clamp(1 - Math.abs(ex - f.x) / 140).toFixed(3) });
    const k = prog(t, c('hand') + 0.2 + i * 0.35, 1.0);
    set(f.scan, { y1: lerp(-65, 65, k), y2: lerp(-65, 65, k), opacity: +(k > 0 && k < 1 ? 1 : 0) });
  });
  S.cScan.show(fadeBetween(t, c('scan'), c('without'), 0.45));
  S.cHand.show(reveal(t, c('hand'))).dim(dimAfter(t, c('tool'), 0.35));
  S.tool.show(reveal(t, c('tool')));
  set(S.toolCross, { opacity: +reveal(t, c('without')).toFixed(3) });
  S.lEnd.show(reveal(t, c('without')));
}
