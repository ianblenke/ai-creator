// 08 - the tests: opens on the finished container box exactly as scene 07 ended (full of layers); on "run the test suite"
// it slides left and a row of small test squares runs out of it; on "It takes seconds" they turn green one after another
// while a dim clock hand sweeps, then "zero failures" and one big OK near the end of the row. On "does not pass" the
// passing run steps back (its labels fade out) and a single magenta, ringed square is held to the side. Ends wide on "fix that first".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, arrow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'build', at: 'build finishes' },
    { name: 'suite', at: 'run the test suite' },
    { name: 'container', at: 'container' },
    { name: 'trust', at: 'trust anything else' },
    { name: 'seconds', at: 'takes seconds' },
    { name: 'zero', at: 'zero failures' },
    { name: 'ok', at: 'word OK' },
    { name: 'end', at: 'near the end' },
    { name: 'fail', at: 'does not pass' },
    { name: 'fix', at: 'fix that first' },
    { name: 'broken', at: 'broken base' },
  ],
};

// CANON container box: 360 x 420, rx 28, 4 px ink outline, 8 layers of 40 px (cool, stroke 2, fill-opacity 0.18)
const BW = 360, BH = 420, NL = 8;
const B0 = [1100, 480, 1], B1 = [400, 480, 0.85];   // where scene 07 left it -> beside the test row
const N = 8, SQ = 80, GAP = 24, ROW_X = 1060, ROW_Y = 480;
const SX = (i) => ROW_X - ((N - 1) * (SQ + GAP)) / 2 + i * (SQ + GAP);
const OKX = 1650;
const BAD = [1340, 700];   // the failing square, held to the side (not in the OK's column)

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'trust', dur: 1.4, x: 1000, y: 520, z: 1.03 },      // a gentle lean in on the run
    { cue: 'fail', dur: 1.4, x: 960, y: 540, z: 1 },           // wide for the failure and the takeaway
  ], ctx.cue);
  const W = S.stage.world;

  // THE CONTAINER BOX, already full (the finished build)
  S.box = new Item(W, BW, BH);
  el(S.box.g, 'rect', { x: -BW / 2, y: -BH / 2, width: BW, height: BH, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  for (let i = 0; i < NL; i++) el(S.box.g, 'rect', {
    x: -BW / 2 + 22, y: BH / 2 - 20 - (i + 1) * 48 + 6, width: BW - 44, height: 40, rx: 10,
    fill: P.cool, 'fill-opacity': 0.18, stroke: P.cool, 'stroke-width': 2,
  });
  S.box.at(...B0);
  S.contLab = label(W, 'the container', { size: type.label }).at(B0[0], B0[1] + BH / 2 + 50);
  S.boxLab = label(W, 'inside the container', { size: type.note, color: P.cool }).at(B1[0], 730);
  const bx = B1[0] + (BW / 2) * B1[2] + 14;
  S.feed = arrow(W, bx, ROW_Y, SX(0) - SQ / 2 - 14, ROW_Y, { color: P.dim, width: 4, head: 16 });

  // THE TEST SQUARES
  S.sq = Array.from({ length: N }, (_, i) => {
    const it = new Item(W, SQ, SQ);
    it.r = el(it.g, 'rect', { x: -SQ / 2, y: -SQ / 2, width: SQ, height: SQ, rx: 16, fill: P.dim, 'fill-opacity': 0.25, stroke: P.dim, 'stroke-width': 4 });
    return it.at(SX(i), ROW_Y);
  });
  S.suiteLab = label(W, 'the test suite', { size: type.label }).at(ROW_X, 340);

  // THE CLOCK: a dim circle with one slow hand
  S.clock = new Item(W, 110, 110);
  el(S.clock.g, 'circle', { cx: 0, cy: 0, r: 50, fill: 'none', stroke: P.dim, 'stroke-width': 5 });
  S.hand = el(S.clock.g, 'line', { x1: 0, y1: 0, x2: 0, y2: -36, stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round' });
  S.clock.at(OKX, 240);
  S.secLab = label(W, 'seconds', { size: type.label, color: P.dim }).at(OKX, 345);

  S.zero = chip(W, 'zero failures', { color: P.accent }).at(ROW_X, 620);
  S.ok = label(W, 'OK', { size: 128, color: P.accent }).at(OKX, ROW_Y);
  S.endLab = label(W, 'near the end', { size: type.note, color: P.accent }).at(OKX, 600);

  // the failing square: hot, ringed, to the side
  S.bad = new Item(W, 150, 150);
  el(S.bad.g, 'rect', { x: -SQ / 2, y: -SQ / 2, width: SQ, height: SQ, rx: 16, fill: P.hot, 'fill-opacity': 0.25, stroke: P.hot, 'stroke-width': 4 });
  S.ring = el(S.bad.g, 'circle', { cx: 0, cy: 0, r: 70, fill: 'none', stroke: P.hot, 'stroke-width': 3 });
  S.bad.at(...BAD);
  S.failLab = label(W, 'does not pass', { size: type.note, color: P.hot }).at(BAD[0], 835);

  S.final = label(S.stage.hud, 'fix that first', { size: 64, color: P.ink }).at(960, 830);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const back = dimAfter(t, c('fail'), 0.35);           // the passing run steps back for the failure
  const gone = 1 - reveal(t, c('fail'), 0.6);           // parts that only served the passing run fade out

  // the finished box (as 07 ended) slides aside for the test row
  const m = ease.inOut(prog(t, c('suite'), 1.0));
  S.box.at(lerp(B0[0], B1[0], m), lerp(B0[1], B1[1], m), lerp(B0[2], B1[2], m)).show(1)
    .dim(Math.min(lerp(1, 0.85, reveal(t, c('build'), 0.6) * (1 - reveal(t, c('suite'), 0.4))), dimAfter(t, c('seconds'), 0.6), back));
  S.contLab.show(1 - reveal(t, c('suite'), 0.4));
  S.boxLab.show(reveal(t, c('container'), 0.5) * gone).dim(dimAfter(t, c('seconds'), 0.35));
  S.feed.draw(ease.inOut(prog(t, c('suite') + 0.8, 0.5)), reveal(t, c('suite') + 0.8, 0.3) * lerp(1, 0.5, reveal(t, c('seconds'), 0.6)) * gone);

  // the suite: dim squares appear on "run the test suite", turn green one by one on "takes seconds"
  const s0 = c('seconds'), step = 0.2;
  const lit = Math.max(dimAfter(t, c('ok'), 0.5), fadeBetween(t, c('zero'), c('ok')));
  S.sq.forEach((it, i) => {
    const g = reveal(t, s0 + i * step, 0.25);
    set(it.r, { fill: g > 0.5 ? P.accent : P.dim, 'fill-opacity': +lerp(0.25, 0.9, g).toFixed(3), stroke: g > 0.5 ? P.accent : P.dim });
    it.show(reveal(t, c('suite') + 1.0 + i * 0.08, 0.4)).at(SX(i), ROW_Y - 10 * Math.sin(Math.PI * prog(t, s0 + i * step, 0.3)), 1).dim(Math.min(lit, back));
  });
  S.suiteLab.show(reveal(t, c('suite') + 1.0, 0.5) * gone).dim(dimAfter(t, c('container'), 0.35));

  // the clock: one slow hand sweeps while the squares run
  S.clock.show(reveal(t, s0, 0.5) * gone).dim(dimAfter(t, c('zero'), 0.35));
  const ang = 120 * ease.inOut(prog(t, s0, N * step + 0.4));
  set(S.hand, { transform: `rotate(${ang.toFixed(2)})` });
  S.secLab.show(reveal(t, s0 + 0.2, 0.5) * gone).dim(dimAfter(t, c('zero'), 0.35));

  S.zero.show(reveal(t, c('zero'), 0.5) * (1 - reveal(t, c('fail'), 0.5))).dim(dimAfter(t, c('ok'), 0.5));
  const pop = ease.back(prog(t, c('ok') + 0.1, 0.5));
  S.ok.show(reveal(t, c('ok') + 0.1, 0.4)).at(OKX, ROW_Y, lerp(0.6, 1, pop)).dim(back);
  S.endLab.show(reveal(t, c('end'), 0.5) * gone);

  // the failure: a magenta ringed square to the side; a clear bright pulse on "broken base"
  const pulse = Math.sin(Math.PI * prog(t, c('broken'), 0.8));
  S.bad.show(reveal(t, c('fail') - 0.3, 0.5)).dim(Math.max(lerp(1, 0.7, reveal(t, c('fix'), 0.6)), pulse));
  set(S.ring, { r: (70 + 14 * pulse).toFixed(2), 'stroke-width': (3 + 3 * pulse).toFixed(2) });
  S.failLab.show(reveal(t, c('fail'), 0.5)).dim(dimAfter(t, c('fix'), 0.5));

  S.final.show(reveal(t, c('fix'), 0.6));
}
