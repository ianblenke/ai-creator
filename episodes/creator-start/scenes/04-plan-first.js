// Scene 04: plan first. The track's four stops appear and light in a chain; the first stop (plan) stays lit, before any audio.
// The camera drops to the lone author and the script page: "one problem" heads it, fact lines fill one by one, each gets a source
// tick. The check sweeps the page and rings a small magenta slip on paper. Then wide: two warm cost bars on a flat axis with no
// numbers, a tiny one "on paper" and a tall one "narrated and animated" that glows magenta. Ends on the scene's point, held.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { type, Item, label, chip, glow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'chain', at: 'chain of steps' },
    { name: 'first', at: 'the first one' },
    { name: 'audio', at: 'before any audio' },
    { name: 'you', at: 'You decide' },
    { name: 'says', at: 'the episode says' },
    { name: 'problem', at: 'one problem' },
    { name: 'fact', at: 'every fact' },
    { name: 'sourced', at: 'sourced' },
    { name: 'slow', at: 'sounds slow' },
    { name: 'cheapest', at: 'the cheapest place' },
    { name: 'mistake', at: 'a mistake' },
    { name: 'wrong', at: 'A wrong sentence' },
    { name: 'nothing', at: 'nothing on paper' },
    { name: 'narrated', at: 'narrated and animated' },
    { name: 'fixing', at: 'fixing it costs' },
  ],
};

// world layout (the final wide shot shows world = screen)
const TY = 540, STOPS = [560, 880, 1200, 1520], SZ = 150;            // THE TRACK, as scene 02 defines it
const PG = { x: 360, y: 280, w: 460, h: 460 };                        // the script page
const LINE_Y = [425, 490, 555, 620, 685], LINE_W = [300, 250, 320, 230, 280], LX = 450, TICK_X = 410;
const SLIP = { line: 2, x0: 620, x1: 700 };                           // the small slip on the third fact line
const DOT = [250, 540];                                               // the lone author, left margin
const AX = { x0: 1040, x1: 1720, y: 640 }, BW = 140;                  // the cost axis and bar width
const B1 = { x: 1160, h: 34, w: 110 }, B2 = { x: 1560, h: 400 };              // tiny bar (on paper), tall bar (narrated and animated)

// THE TRACK stop icons and stops, same drawing as scene 02: a dim layer with an accent layer on top that `lit` blends in
function icon(g, kind, color) {
  const st = { fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 0) {
    el(g, 'rect', { x: -28, y: -36, width: 56, height: 72, rx: 8, ...st });
    [[-18, 16], [-4, 10], [10, 16], [24, 4]].forEach(([y, r]) => el(g, 'line', { x1: -16, x2: r, y1: y, y2: y, ...st }));
  } else if (kind === 1) {
    [18, 34, 52, 30, 44, 22, 14].forEach((h, i) => el(g, 'rect', { x: -39.5 + i * 12, y: -h / 2, width: 7, height: h, rx: 3.5, fill: color }));
  } else if (kind === 2) {
    el(g, 'rect', { x: -44, y: -25, width: 88, height: 50, rx: 8, ...st });
    el(g, 'circle', { cx: -20, cy: -6, r: 7, fill: color });
    el(g, 'path', { d: 'M -8 16 L 12 -6 L 32 16 Z', fill: color });
  } else {
    el(g, 'path', { d: 'M -34 0 L 30 0 M 10 -20 L 32 0 L 10 20', ...st });
  }
}
function stop(parent, kind) {
  const it = new Item(parent, SZ, SZ);
  el(it.g, 'rect', { x: -SZ / 2, y: -SZ / 2, width: SZ, height: SZ, rx: 34, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  icon(it.g, kind, P.dim);
  const litG = el(it.g, 'g', { opacity: 0 });
  el(litG, 'rect', { x: -SZ / 2, y: -SZ / 2, width: SZ, height: SZ, rx: 34, fill: P.bg2, stroke: P.accent, 'stroke-width': 5 });
  el(litG, 'rect', { x: -SZ / 2, y: -SZ / 2, width: SZ, height: SZ, rx: 34, fill: P.accent, 'fill-opacity': 0.12 });
  icon(litG, kind, P.accent);
  it.lit = (k) => set(litG, { opacity: +clamp(k).toFixed(3) });
  return it;
}

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'you', delay: 0, dur: 1.4, x: 760, y: 540, z: 1.2 },
    { cue: 'wrong', delay: 0, dur: 1.4, x: 960, y: 540, z: 1 },
  ], ctx.cue);
  const W = stage.world;
  S = { stage, parts: makeParticles(ctx.rand(7)) };

  // the track
  // segments only between box edges, so no line shows through a dimmed stop
  S.segs = STOPS.slice(1).map((x, i) => el(W, 'line', { x1: STOPS[i] + SZ / 2, y1: TY, x2: STOPS[i] + SZ / 2, y2: TY, stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }));
  S.stops = STOPS.map((x, i) => stop(W, i).at(x, TY));
  S.stopLabels = ['plan', 'voice', 'pictures', 'ship'].map((w, i) => label(W, w, { size: type.label, color: P.ink }).at(STOPS[i], TY + SZ / 2 + 48));
  S.noAudio = chip(W, 'before any audio', { color: P.accent }).at(STOPS[0], TY + SZ / 2 + 150);

  // the lone author and the script page
  S.dot = el(W, 'g', { opacity: 0 });
  el(S.dot, 'circle', { cx: DOT[0], cy: DOT[1], r: 14, fill: P.ink });
  el(S.dot, 'circle', { cx: DOT[0], cy: DOT[1], r: 30, fill: 'none', stroke: P.ink, 'stroke-width': 4 });
  S.page = el(W, 'g', { opacity: 0 });
  el(S.page, 'rect', { x: PG.x, y: PG.y, width: PG.w, height: PG.h, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.title = chip(S.page, 'one problem', { size: 44, color: P.accent }).at(PG.x + PG.w / 2, 345);
  S.lines = LINE_Y.map((y) => el(S.page, 'rect', { x: LX, y: y - 8, width: 0, height: 16, rx: 8, fill: P.ink }));
  // a page-coloured patch opens a gap in the third line where the slip lifts out of it
  S.gap = el(S.page, 'rect', { x: SLIP.x0 - 2, y: LINE_Y[SLIP.line] - 10, width: SLIP.x1 - SLIP.x0 + 4, height: 20, fill: P.bg2, opacity: 0 });
  S.slip = el(W, 'rect', { x: SLIP.x0, y: LINE_Y[SLIP.line] - 8, width: SLIP.x1 - SLIP.x0, height: 16, rx: 8, fill: P.ink, opacity: 0 });
  S.ticks = LINE_Y.map((y) => el(S.page, 'path', { d: `M ${TICK_X - 14} ${y} L ${TICK_X - 4} ${y + 10} L ${TICK_X + 14} ${y - 10}`, fill: 'none', stroke: P.accent, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }));
  S.scan = el(S.page, 'line', { x1: PG.x + 20, x2: PG.x + PG.w - 20, y1: 0, y2: 0, stroke: P.accent, 'stroke-width': 3, opacity: 0 });
  const RR = 56;
  S.ringLen = 2 * Math.PI * RR;
  S.ring = el(W, 'circle', { cx: (SLIP.x0 + SLIP.x1) / 2, cy: LINE_Y[SLIP.line], r: RR, fill: 'none', stroke: P.hot, 'stroke-width': 3, 'stroke-dasharray': `${S.ringLen} ${S.ringLen}`, opacity: 0, transform: `rotate(-90 ${(SLIP.x0 + SLIP.x1) / 2} ${LINE_Y[SLIP.line]})` });

  // the two thoughts beside the page (gone before the bars arrive)
  S.slow = label(W, 'sounds slow', { size: type.label, color: P.dim }).at(1180, 440);
  S.cheap = label(W, 'the cheapest place', { size: type.label, color: P.accent }).at(1180, 560);

  // the cost bars on a flat axis, no numbers
  S.hotGlow = glow(W, { rx: 200, ry: 300, color: P.hot, strength: 0.9 }).at(B2.x, AX.y - B2.h / 2);
  S.axis = el(W, 'line', { x1: AX.x0, x2: AX.x1, y1: AX.y, y2: AX.y, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 });
  S.bar1 = el(W, 'rect', { x: B1.x - B1.w / 2, width: B1.w, rx: 10, fill: P.warm, opacity: 0 });
  S.bar2 = el(W, 'rect', { x: B2.x - BW / 2, width: BW, rx: 10, fill: P.warm, stroke: P.hot, 'stroke-width': 0, opacity: 0 });
  S.lab1 = label(W, 'on paper', { size: type.note, color: P.ink }).at(B1.x, AX.y + 56);
  S.lab2 = label(W, 'narrated and animated', { size: type.note, color: P.ink }).at(B2.x, AX.y + 56);

  // the point, held through the tail
  S.final = label(W, 'the cheapest place to find a mistake', { size: 60, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // track: on screen from the start (as scene 02 leaves it); the chain draws gap by gap and lights stop by stop on "chain of
  // steps", then only plan stays lit and the rest dim; gone as we glide down to the page
  const trackOut = 1 - prog(t, c('you'), 0.5);
  const trackIn = reveal(t, 0, 0.6);
  const chain = ease.inOut(prog(t, c('chain'), 1.2)) * (STOPS.length - 1);
  S.segs.forEach((ln, i) => set(ln, { x2: (STOPS[i] + SZ / 2 + (STOPS[i + 1] - STOPS[i] - SZ) * clamp(chain - i)).toFixed(1), opacity: +(clamp(chain - i) > 0 ? trackOut : 0).toFixed(3) }));
  S.stops.forEach((s, i) => {
    const on = fadeBetween(t, c('chain') + i * 0.3, c('first'), 0.3);
    s.lit(i === 0 ? Math.max(on, reveal(t, c('first'), 0.3)) : on);
    const d = i === 0 ? 1 : lerp(1, 0.35, reveal(t, c('first'), 0.5));
    const appear = i === 0 ? trackIn : reveal(t, c('chain') + i * 0.3, 0.3); // plan from the start, the rest as the chain reaches them
    s.show(appear * trackOut).dim(d);
    S.stopLabels[i].show(appear * trackOut).dim(d);
  });
  S.noAudio.show(reveal(t, c('audio'), 0.5) * trackOut);

  // the author and the page
  // the author sits at the left margin from the start (dim), and is the bright focus on "You decide"
  set(S.dot, { opacity: +(reveal(t, 0, 0.6) * lerp(0.5, 1, fadeBetween(t, c('you'), c('says') + 0.3, 0.4))).toFixed(3) });
  const pageDim = lerp(1, 0.35, reveal(t, c('wrong'), 0.6));
  const fin = reveal(t, c('fixing'), 0.6);
  const headline = reveal(t, c('narrated'), 0.6); // up before the closing line, so the ending is not a late repeat
  set(S.page, { opacity: +(reveal(t, c('says'), 0.6) * lerp(pageDim, 0.6, fin)).toFixed(3) });
  S.title.show(reveal(t, c('problem'), 0.5)).dim(dimAfter(t, c('fact'), 0.5));
  const step = (c('sourced') - 0.3 - c('fact')) / LINE_Y.length;
  S.lines.forEach((r, i) => set(r, { width: (LINE_W[i] * ease.out(prog(t, c('fact') + i * step, step * 1.4))).toFixed(1) }));
  S.ticks.forEach((p, i) => set(p, { opacity: +reveal(t, c('sourced') + i * 0.15, 0.3).toFixed(3) }));

  // the check: a scan line sweeps the page; at the third line the slip shows magenta and lifts, then the ring closes around it
  const s0 = c('cheapest'), sDur = c('mistake') - s0 - 0.1;
  const sy = lerp(PG.y + 30, PG.y + PG.h - 30, prog(t, s0, sDur));
  set(S.scan, { y1: sy, y2: sy, opacity: +fadeBetween(t, s0, s0 + sDur - 0.2, 0.2).toFixed(3) });
  const hit = reveal(t, s0 + sDur * ((LINE_Y[SLIP.line] - PG.y - 30) / (PG.h - 60)), 0.25);
  // the slip stays bright while "A wrong sentence" names it, and steps back only when the bars take over
  const slipDim = lerp(lerp(1, 0.35, reveal(t, c('nothing'), 0.6)), 0.6, fin);
  set(S.slip, { opacity: +(hit * slipDim).toFixed(3), fill: P.hot, transform: `translate(0 ${(-20 * hit).toFixed(2)})` });
  set(S.gap, { opacity: +hit.toFixed(3) });
  const ringP = ease.out(prog(t, c('mistake'), 0.5));
  set(S.ring, { 'stroke-dashoffset': (S.ringLen * (1 - ringP)).toFixed(2), opacity: +((ringP > 0 ? 1 : 0) * slipDim).toFixed(3) });

  // the two thoughts
  const thoughtsOut = 1 - prog(t, c('wrong'), 0.4);
  S.slow.show(reveal(t, c('slow'), 0.5) * thoughtsOut).dim(dimAfter(t, c('cheapest'), 0.35));
  S.cheap.show(reveal(t, c('cheapest'), 0.5) * thoughtsOut);

  // the cost bars: the axis after the glide, the tiny bar on "nothing on paper", the tall one rising through "narrated and animated"
  const axisIn = reveal(t, c('wrong') + 1.2, 0.4); // after the glide, so the axis is never cut by the frame edge
  set(S.axis, { opacity: +axisIn.toFixed(3) });
  const h1 = B1.h * ease.out(prog(t, c('nothing'), 0.6));
  const b1Dim = lerp(1, 0.7, reveal(t, c('narrated'), 0.5));
  set(S.bar1, { y: (AX.y - h1).toFixed(1), height: h1.toFixed(1), opacity: +(h1 > 0.5 ? b1Dim : 0).toFixed(3) });
  S.lab1.show(reveal(t, c('nothing'), 0.5)).dim(b1Dim);
  const h2 = B2.h * ease.inOut(prog(t, c('narrated'), c('fixing') - c('narrated')));
  set(S.bar2, { y: (AX.y - h2).toFixed(1), height: h2.toFixed(1), opacity: h2 > 0.5 ? 1 : 0, 'stroke-width': (4 * reveal(t, c('fixing'), 0.5)).toFixed(2) });
  S.lab2.show(reveal(t, c('narrated'), 0.5));
  S.hotGlow.pulse(t, reveal(t, c('fixing'), 0.8));

  // the point
  S.final.show(headline);
}
