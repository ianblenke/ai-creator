// Scene 05: dated stamps. A measured number gets a "measured on" stamp; a later change brings a second number with its own
// stamp while the first stays true for its date; estimates say "about"; unverified items sit dimmed under "not claimed".
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'card', at: 'Even' },
    { name: 'stale', at: 'go stale' },
    { name: 'video', at: 'a video stays' },
    { name: 'moves', at: 'number moves' },
    { name: 'so', at: 'So for anything' },
    { name: 'measured', at: 'you measured' },
    { name: 'date', at: 'say the date' },
    { name: 'loud', at: 'out loud' },
    { name: 'screen', at: 'on screen' },
    { name: 'thisdate', at: 'measured on this date' },
    { name: 'then', at: 'Then a later' },
    { name: 'change', at: 'change does' },
    { name: 'false', at: 'video false' },
    { name: 'dated', at: 'makes it dated' },
    { name: 'redo', at: 'which part' },
    { name: 'spirit', at: 'same spirit' },
    { name: 'estimate', at: 'an estimate' },
    { name: 'about', at: 'says about' },
    { name: 'verify', at: 'could not verify' },
    { name: 'heading', at: 'under a heading' },
    { name: 'claimed', at: 'not claimed' },
    { name: 'nobody', at: 'so nobody' },
    { name: 'back', at: 'adds it back' },
  ],
};

const bar = (g, x, y, w, h, color, op = 1) => el(g, 'rect', { x, y, width: w, height: h, rx: h / 2, fill: color, opacity: op });

// MEASURED tag: 56 px rounded square with a ruler and ticks, ink.
function rulerTag(g, x, y) {
  el(g, 'rect', { x: x - 28, y: y - 28, width: 56, height: 56, rx: 12, fill: P.bg2, stroke: P.ink, 'stroke-width': 3 });
  el(g, 'rect', { x: x - 20, y: y - 8, width: 40, height: 16, rx: 3, fill: 'none', stroke: P.ink, 'stroke-width': 3 });
  for (let i = 0; i < 4; i++) el(g, 'line', { x1: x - 12 + i * 8, x2: x - 12 + i * 8, y1: y - 8, y2: y - (i % 2 ? 2 : 0), stroke: P.ink, 'stroke-width': 2.5 });
}

// A measured fact: card with the tag, a big value bar (the number) and two text bars.
function factCard(parent, valueW) {
  const it = new Item(parent, 420, 200);
  el(it.g, 'rect', { x: -210, y: -100, width: 420, height: 200, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  rulerTag(it.g, -140, -30);
  it.value = bar(it.g, -84, -52, valueW, 44, P.ink);
  bar(it.g, -84, 6, 240, 18, P.dim, 0.8);
  bar(it.g, -170, 50, 300, 18, P.dim, 0.8);
  return it;
}

// Tiny calendar mark: band on top, a 3 x 2 grid with one lit cell (k), never digits.
function calMark(g, x, y, k, s = 1) {
  const w = 40 * s;
  el(g, 'rect', { x: x - w / 2, y: y - w / 2, width: w, height: w, rx: 6 * s, fill: 'none', stroke: P.accent, 'stroke-width': 3 });
  el(g, 'rect', { x: x - w / 2, y: y - w / 2, width: w, height: 10 * s, rx: 4 * s, fill: P.accent });
  for (let i = 0; i < 6; i++) {
    const cx = x - 11 * s + (i % 3) * 11 * s, cy = y + 4 * s + Math.floor(i / 3) * 10 * s;
    const r = (i === k ? 5.6 : 3.5) * s; // lit cell 1.6x and unlit cells faint, so the two stamps differ at a glance
    el(g, 'rect', { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r, rx: 1.5 * s, fill: P.accent, opacity: i === k ? 1 : 0.1 });
  }
}

// DATE STAMP: accent rounded rect, calendar mark (lit cell k = which date), "measured on". Larger than the bible's 200 x 64 so the words stay 38 px.
function stamp(parent, k) {
  const tw = measure('measured on', type.note);
  const w = Math.ceil(30 + 56 + 18 + tw + 30), h = 72;
  const it = new Item(parent, w, h);
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 18, fill: P.accent, 'fill-opacity': 0.14, stroke: P.accent, 'stroke-width': 3 });
  it.iconX = -w / 2 + 30 + 28;
  calMark(it.g, it.iconX, 0, k, 1.4);
  el(it.g, 'text', { x: -w / 2 + 30 + 56 + 18, y: type.note * 0.35, 'font-family': font.sans, 'font-size': type.note, 'font-weight': 700, fill: P.ink }, 'measured on');
  return it;
}

// A big tear-off calendar page with the same 3 x 2 grid as the stamp's mark; lit cell k matches one stamp.
function calPage(parent, k) {
  const it = new Item(parent, 220, 240);
  el(it.g, 'rect', { x: -110, y: -120, width: 220, height: 240, rx: 20, fill: P.bg2, stroke: P.accent, 'stroke-width': 4 });
  el(it.g, 'rect', { x: -110, y: -120, width: 220, height: 56, rx: 20, fill: P.accent });
  for (let i = 0; i < 6; i++) el(it.g, 'rect', { x: -80 + (i % 3) * 58, y: -40 + Math.floor(i / 3) * 70, width: 44, height: 44, rx: 8, fill: P.accent, opacity: i === k ? 1 : 0.22 });
  return it;
}

const WAVE = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6];
const K1 = 0, K2 = 5; // first date = top-left cell, later date = bottom-right cell
let S;

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: 0, dur: 0.01, x: 600, y: 420, z: 1.2 },
    { cue: 'then', delay: 0, dur: 1.6, x: 760, y: 430, z: 1.1 },
    { cue: 'spirit', delay: 0, dur: 1.6, x: 960, y: 450, z: 1 },
  ], ctx.cue);
  const w = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // The video (a square card with a play mark) around the first fact.
  S.frame = new Item(w, 540, 550);
  el(S.frame.g, 'rect', { x: -270, y: -275, width: 540, height: 550, rx: 28, fill: 'none', stroke: P.ink, 'stroke-width': 4 });
  el(S.frame.g, 'path', { d: 'M -236 -252 L -236 -220 L -210 -236 Z', fill: P.ink });
  S.frame.at(480, 425);

  S.card1 = factCard(w, 220).at(480, 330);
  S.stamp1 = stamp(w, K1).at(480, 520);
  S.wave = new Item(w, 9 * 34, 60);
  S.waveBars = WAVE.map((hh, i) => el(S.wave.g, 'rect', { x: -4 * 34 - 6 + i * 34, y: -30, width: 12, height: 60, rx: 6, fill: P.accent }));
  S.waveFlat = el(S.wave.g, 'rect', { x: -4 * 34 - 6, y: -2, width: 8 * 34 + 12, height: 4, rx: 2, fill: P.dim, opacity: 0 });
  S.wave.at(480, 620);

  // Before the stamp: the fact goes stale and the real number moves on (a copy of the value slides off and grows).
  S.stale = chip(w, 'stale', { color: P.dim, dashed: true, padY: 10 }).at(590, 190);
  S.ghost = new Item(w, 280, 44);
  S.ghostBar = bar(S.ghost.g, -110, -22, 220, 44, P.dim);

  // The second measurement, then the two calendar pages that fly into the two stamps.
  S.card2 = factCard(w, 280).at(1060, 330);
  S.stamp2 = stamp(w, K2).at(1060, 520);
  S.page2 = calPage(w, K2);
  S.page1 = calPage(w, K1);

  // The first video is not false, it is dated (chips sit inside the first video).
  S.falseChip = chip(w, 'false', { color: P.dim, dashed: true });
  S.falseStrike = el(S.falseChip.g, 'line', { x1: -S.falseChip.w / 2 + 14, x2: S.falseChip.w / 2 - 14, y1: 0, y2: 0, stroke: P.ink, 'stroke-width': 4, 'stroke-linecap': 'round' });
  S.falseChip.at(480, 640);
  S.datedChip = chip(w, 'dated', { color: P.accent }).at(480, 640);

  // Which part to redo: a hot ring hugging the first number's value bar.
  S.ring = new Item(w, 260, 64);
  el(S.ring.g, 'ellipse', { cx: 0, cy: 0, rx: 130, ry: 32, fill: 'none', stroke: P.hot, 'stroke-width': 3 });
  S.ring.at(506, 300);

  // Right column: an estimate is a value that says "about"; unverified items sit dimmed under "not claimed".
  S.est = new Item(w, 56, 56);
  el(S.est.g, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
  el(S.est.g, 'path', { d: 'M -18 4 C -10 -10, -4 -10, 0 0 S 10 10, 18 -4', fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' });
  S.est.at(1380, 240);
  S.about = chip(w, 'about', { color: P.dim, dashed: true }).at(1520, 240);
  S.estVal = new Item(w, 140, 44);
  bar(S.estVal.g, -70, -22, 140, 44, P.dim);
  S.estVal.at(1690, 240);

  S.head = label(w, 'not claimed', { size: type.label, color: P.dim }).at(1550, 390);
  S.list = new Item(w, 300, 140);
  bar(S.list.g, -150, -59, 300, 18, P.dim, 0.6);
  S.midBar = bar(S.list.g, -150, -9, 240, 18, P.dim, 0.6);
  bar(S.list.g, -150, 41, 280, 18, P.dim, 0.6);
  S.strike = el(S.list.g, 'line', { x1: -140, y1: -56, x2: -140, y2: -56, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 });
  S.list.at(1550, 520);

  S.final = label(stage.hud, 'measured on this date', { size: 64, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const on = (at, dur = 0.6) => ease.inOut(prog(t, at, dur));
  // dimmed to `floor` from cue a until cue b brings it back
  const dipped = (a, b, floor) => 1 - (1 - floor) * on(c(a)) * (1 - on(c(b)));

  const leftDim = dimAfter(t, c('spirit'), 0.35);

  // First fact, its video and its stamp. The value fades when the number moves on and is true again once dated.
  S.card1.show(reveal(t, c('card'))).dim(Math.min(dipped('date', 'dated', 0.55), leftDim));
  set(S.card1.value, { opacity: +(1 - 0.65 * on(c('moves')) * (1 - on(c('thisdate')))).toFixed(3) });
  S.frame.show(reveal(t, c('video'))).dim(Math.min(dipped('date', 'false', 0.6), leftDim));
  const pop = 1 + 0.12 * Math.sin(Math.PI * prog(t, c('thisdate'), 0.8));
  S.stamp1.show(reveal(t, c('date'), 0.5)).dim(Math.min(dipped('change', 'dated', 0.6), leftDim)).at(480, 520, (0.8 + 0.2 * ease.out(prog(t, c('date'), 0.5))) * pop);
  const live = 1 - prog(t, c('thisdate') + 1.2, 0.6); // speaking only while "out loud ... this date" is said
  S.waveBars.forEach((r, i) => {
    const k = 0.55 + 0.45 * Math.abs(Math.sin(t * 5 + i * 1.3));
    const hh = lerp(4, WAVE[i] * 60 * k, live);
    set(r, { y: (-hh / 2).toFixed(1), height: hh.toFixed(1), opacity: +live.toFixed(3) });
  });
  set(S.waveFlat, { opacity: +(1 - live).toFixed(3) });
  S.wave.show(fadeBetween(t, c('loud'), c('then'))).dim(dimAfter(t, c('screen'), 0.5));

  // Going stale; the number moves on: a copy of the value slides right and grows.
  const preOut = c('so');
  S.stale.show(fadeBetween(t, c('stale'), preOut));
  const mv = ease.inOut(prog(t, c('moves'), 1.0));
  const gw = lerp(220, 280, mv);
  set(S.ghostBar, { x: (-gw / 2).toFixed(1), width: gw.toFixed(1) });
  S.ghost.show(fadeBetween(t, c('moves'), preOut) * 0.8).at(lerp(506, 900, mv), 300);

  // Two calendar pages: the first flies into stamp 1's mark, the second into stamp 2's; the second fact appears.
  const pin = reveal(t, c('then'), 0.35);
  const f1 = ease.inOut(prog(t, c('then') + 0.4, 0.7));
  S.page1.show(pin * (1 - prog(t, c('then') + 0.85, 0.25))).at(lerp(1060, 480 + S.stamp1.iconX, f1), lerp(330, 520, f1), lerp(1, 0.25, f1), -8 * Math.sin(Math.PI * f1));
  const f2 = ease.inOut(prog(t, c('change'), 0.6));
  S.page2.show(pin * (1 - prog(t, c('change') + 0.4, 0.2))).at(lerp(1060, 1060 + S.stamp2.iconX, f2), lerp(330, 520, f2), lerp(1, 0.25, f2));
  S.card2.show(reveal(t, c('change') + 0.3, 0.6)).dim(leftDim);
  S.stamp2.show(reveal(t, c('change') + 0.45, 0.4)).dim(leftDim);

  // Not false (struck) ... but dated, in the same spot inside the first video.
  S.falseChip.show(fadeBetween(t, c('false') + 0.3, c('dated') + 0.05, 0.35));
  set(S.falseStrike, { opacity: +ease.out(prog(t, c('false') + 0.3, 0.35)).toFixed(3) });
  S.datedChip.show(reveal(t, c('dated') + 0.45, 0.4)).dim(leftDim);

  S.ring.show(reveal(t, c('redo') + 0.2, 0.5)).dim(leftDim);

  // Right column.
  const rightDim = dimAfter(t, c('verify'), 0.45);
  S.est.show(reveal(t, c('estimate'))).dim(rightDim);
  S.about.show(reveal(t, c('about'))).dim(rightDim);
  S.estVal.show(reveal(t, c('about') + 0.15)).dim(rightDim);
  const bk = Math.sin(Math.PI * prog(t, c('back'), 1.0)); // a bar tries to slide back out and is held
  S.list.show(reveal(t, c('verify') + 0.4)).dim(lerp(0.8, 0.6, prog(t, c('back') + 1.0, 0.4)));
  set(S.midBar, { x: (-150 - 30 * bk).toFixed(1) });
  const sk = ease.out(prog(t, c('claimed') + 0.3, 0.5));
  set(S.strike, { x2: (-140 + 260 * sk).toFixed(1), y2: (-56 + 112 * sk).toFixed(1), opacity: sk > 0.01 ? 1 : 0 });
  S.head.show(reveal(t, c('claimed'), 0.4)).at(1550, 390, 1 + 0.08 * bk);

  S.final.show(reveal(t, c('back') + 0.8, 0.5));
}
