// 08 - what you need: the cast as one table split into two zones. Left, "on your machine" (cool): the card with the voice,
// the processor with the aligner and the recognizer. Right, "a paid plan" (violet): the cloud with the writing and the pictures.
// Then the camera drops to a dated note: an AI agent read the pricing page on the second of November; Claude Code and Opus 5.5
// are ticked on the paid plans, not on the free one; usage limits are left as empty dashed cells (not checked). The camera
// returns to the table, two dashed "not yet" chips join it, and the scene ends wide on "check the page yourself".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'cast', at: 'whole cast' },
    { name: 'which', at: 'which parts' },
    { name: 'machine', at: 'parts run on' },
    { name: 'pay', at: 'you pay for' },
    { name: 'three', at: 'Three models' },
    { name: 'voice', at: 'the voice' },
    { name: 'card', at: 'graphics card' },
    { name: 'aligner', at: 'the aligner' },
    { name: 'recognizer', at: 'the recognizer' },
    { name: 'processor', at: 'a processor' },
    { name: 'writing', at: 'The writing' },
    { name: 'pictures', at: 'the pictures' },
    { name: 'plan', at: 'Claude plan' },
    { name: 'agent', at: 'When an AI agent' },
    { name: 'page', at: 'pricing page' },
    { name: 'date', at: 'second of November' },
    { name: 'code', at: 'Claude Code' },
    { name: 'opus', at: 'Opus 5.5' },
    { name: 'included', at: 'included' },
    { name: 'paid', at: 'the paid plans' },
    { name: 'free', at: 'free one' },
    { name: 'limits', at: 'usage limits' },
    { name: 'change', at: 'plans change' },
    { name: 'yourself', at: 'check the page yourself' },
    { name: 'other', at: 'other chat models' },
    { name: 'timed', at: 'timed or priced' },
  ],
};

const OY = 1080;                                   // board 2 (the dated note) sits one frame below the table
const ZT = 140, ZB = 700;                          // zone top and bottom
const LZ = [150, 930], RZ = [990, 1770];           // zone x ranges
const LX = [330, 690], RX = 1380;                  // left zone columns, right zone centre
const COLS = [1330, 1640], ROWS = [370, 490, 610]; // board 2 table: paid / free columns, rows
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// THE VOICE: rounded accent bars (12 px on a 24 px pitch) centred on a baseline
function wave(parent, n, hmax, gap = 24, bw = 12) {
  const it = new Item(parent, n * gap, hmax);
  it.bars = Array.from({ length: n }, (_, i) => {
    const h = hmax * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    const b = el(it.g, 'rect', { x: (i - (n - 1) / 2) * gap - bw / 2, y: -h / 2, width: bw, height: h, rx: bw / 2, fill: P.accent });
    b.h = h;
    return b;
  });
  it.play = (t, k) => it.bars.forEach((b, i) => {
    const g = Math.exp(-(((i - (((t / 1.8) % 1) * (n + 6) - 3)) ** 2) / 6));
    const h = b.h * (1 + 0.25 * g * k);
    set(b, { y: (-h / 2).toFixed(2), height: h.toFixed(2) });
  });
  return it;
}

// THE CARD: a flat cool slab with a round fan (three spokes) and fins
function gpu(parent) {
  const it = new Item(parent, 256, 67);
  const g = el(it.g, 'g', { transform: 'scale(0.8)' });
  el(g, 'rect', { x: -160, y: -42, width: 320, height: 84, rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(g, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  it.fan = el(g, 'g');
  for (let k = 0; k < 3; k++) el(it.fan, 'line', { x1: 0, y1: 0, x2: 20 * Math.cos((k * 2 * Math.PI) / 3), y2: 20 * Math.sin((k * 2 * Math.PI) / 3), stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round' });
  for (let k = 0; k < 8; k++) el(g, 'line', { x1: -30 + k * 22, y1: -22, x2: -30 + k * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
  return it;
}

// THE PROCESSOR: a flat cool square chip with short pins on all four sides
function cpu(parent) {
  const it = new Item(parent, 156, 156);
  el(it.g, 'rect', { x: -60, y: -60, width: 120, height: 120, rx: 12, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(it.g, 'rect', { x: -26, y: -26, width: 52, height: 52, rx: 6, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  for (let k = 0; k < 4; k++) {
    const o = -36 + k * 24;
    el(it.g, 'line', { x1: o, y1: -62, x2: o, y2: -76, ...stroke(P.cool, 4) });
    el(it.g, 'line', { x1: o, y1: 62, x2: o, y2: 76, ...stroke(P.cool, 4) });
    el(it.g, 'line', { x1: -62, y1: o, x2: -76, y2: o, ...stroke(P.cool, 4) });
    el(it.g, 'line', { x1: 62, y1: o, x2: 76, y2: o, ...stroke(P.cool, 4) });
  }
  return it;
}

// THE CLOUD: three overlapping translucent violet circles
function cloud(parent, s = 1) {
  const it = new Item(parent, 128 * s, 82 * s);
  const g = el(it.g, 'g', { transform: `scale(${s})` });
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 4 / s };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(g, 'circle', { cx, cy, r, ...st }));
  return it;
}

function tick(parent) {
  const it = new Item(parent, 34, 26);
  el(it.g, 'path', { d: 'M -15 0 L -4 11 L 16 -12', ...stroke(P.accent, 7) });
  return it;
}
function dash(parent) {
  const it = new Item(parent, 40, 6);
  el(it.g, 'line', { x1: -20, y1: 0, x2: 20, y2: 0, ...stroke(P.dim, 6) });
  return it;
}
function emptyCell(parent) {
  const it = new Item(parent, 60, 60);
  el(it.g, 'rect', { x: -30, y: -30, width: 60, height: 60, rx: 12, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 7' });
  return it;
}
function zone(parent, [x0, x1], color) {
  const it = new Item(parent);
  el(it.g, 'rect', { x: x0, y: ZT, width: x1 - x0, height: ZB - ZT, rx: 30, fill: color, 'fill-opacity': 0.04, stroke: color, 'stroke-width': 3 });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'three', dur: 1.4, x: 920, y: 540, z: 1.04 },             // lean toward the machine side
    { cue: 'writing', dur: 1.4, x: 1000, y: 540, z: 1.04 },          // lean toward the paid side
    { cue: 'agent', delay: 0.2, dur: 0.8, x: 960, y: 540 + OY, z: 1 },   // down to the dated note (as the table fades)
    { cue: 'other', delay: -0.52, dur: 0.01, x: 960, y: 540, z: 1 }, // back to the table in a cut (both boards faded), wide
  ], ctx.cue);
  const W = S.stage.world;

  S.title = label(W, 'the whole cast', { size: type.title }).at(960, 470);

  // ---- board 1: the table ----
  S.b1 = new Item(W); S.b1.show(1);
  const B = S.b1.g;
  S.lz = zone(B, LZ, P.cool);
  S.rz = zone(B, RZ, P.violet);
  S.lLab = label(B, 'on your machine', { size: type.label, color: P.cool }).at((LZ[0] + LZ[1]) / 2, 205);
  S.rLab = label(B, 'a paid plan', { size: type.label, color: P.violet }).at(RX, 205);

  S.voiceG = new Item(B);
  S.wave = wave(S.voiceG.g, 10, 90).at(LX[1], 315);
  S.voiceChip = chip(S.voiceG.g, 'the voice', { color: P.accent }).at(LX[1], 415);
  S.gpu = gpu(S.voiceG.g).at(LX[0], 315);
  S.gpuLab = label(S.voiceG.g, 'graphics card', { size: type.note, color: P.cool }).at(LX[0], 415);

  S.earsG = new Item(B);
  S.aligner = chip(S.earsG.g, 'the aligner', { color: P.accent }).at(LX[1], 525);
  S.recog = chip(S.earsG.g, 'the recognizer', { color: P.ink }).at(LX[1], 625);
  S.cpu = cpu(S.earsG.g).at(LX[0], 545);
  S.cpuLab = label(S.earsG.g, 'a processor', { size: type.note, color: P.cool }).at(LX[0], 664);

  S.cloudG = new Item(B);
  S.cloud = cloud(S.cloudG.g, 1.4).at(RX, 315);
  S.writing = chip(S.cloudG.g, 'the writing', { color: P.violet }).at(1220, 440);
  S.pictures = chip(S.cloudG.g, 'the pictures', { color: P.violet }).at(1540, 440);
  S.plan = chip(S.cloudG.g, 'paid Claude plan', { color: P.violet }).at(RX, 560);

  // the open questions belong to neither zone: one neutral row under both
  S.notYet = label(B, 'not yet', { size: type.note, color: P.dim }).at(480, 745);
  S.other = chip(B, 'other chat models', { color: P.dim, dashed: true }).at(760, 745);
  S.timed = chip(B, 'timed or priced', { color: P.dim, dashed: true }).at(1230, 745);

  // ---- board 2: the dated note ----
  S.b2 = new Item(W); S.b2.show(1);
  const N = el(S.b2.g, 'g', { transform: `translate(0 ${OY})` });
  S.srcG = new Item(N);
  S.agent = cloud(S.srcG.g, 1).at(360, 200);
  S.agentLab = label(S.srcG.g, 'an AI agent', { size: type.note, color: P.violet }).at(560, 200);
  S.look = el(S.srcG.g, 'line', { x1: 360, y1: 250, x2: 360, y2: 350, stroke: P.violet, 'stroke-width': 4, 'stroke-dasharray': '10 9', opacity: 0 });
  S.page = new Item(S.srcG.g, 200, 220);
  el(S.page.g, 'rect', { x: -100, y: -110, width: 200, height: 220, rx: 16, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [120, 90, 130, 70, 110].forEach((w, k) => el(S.page.g, 'rect', { x: -70, y: -74 + k * 34, width: w, height: 12, rx: 6, fill: P.ink }));
  S.page.at(360, 470);
  S.date = chip(S.srcG.g, 'second of November', { color: P.accent }).at(360, 720);
  S.pageLab = label(S.srcG.g, 'the pricing page', { size: type.note, color: P.dim }).at(360, 625);

  S.grid = el(N, 'line', { x1: 780, y1: 290, x2: 1780, y2: 290, stroke: P.dim, 'stroke-width': 3, opacity: 0 });
  S.hPaid = label(N, 'paid plans', { size: type.label, color: P.violet }).at(COLS[0], 235);
  S.hFree = label(N, 'the free one', { size: type.label, color: P.dim }).at(COLS[1], 235);
  S.rCode = chip(N, 'Claude Code', { color: P.ink }).at(960, ROWS[0]);
  S.rOpus = chip(N, 'Opus 5.5', { color: P.violet }).at(960, ROWS[1]);
  S.rLim = chip(N, 'usage limits', { color: P.dim, dashed: true }).at(960, ROWS[2]);
  S.ticks = [0, 1].map((r) => tick(N).at(COLS[0], ROWS[r], 1.4));
  S.dashes = [0, 1].map((r) => dash(N).at(COLS[1], ROWS[r]));
  S.cells = COLS.map((x) => emptyCell(N).at(x, ROWS[2]));
  S.change = label(N, 'plans change', { size: type.note, color: P.dim }).at(COLS[0] + 150, 715);

  S.final = label(S.stage.hud, 'check the page yourself', { size: type.title }).at(960, 845);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  S.title.show(fadeBetween(t, c('cast'), c('which') - 0.3, 0.4));

  // board 1 fades out as the camera drops to the note; the note fades, the camera cuts back and the table fades in
  const away = c('agent'), back = c('other') - 0.52;
  S.b1.show((1 - ease.inOut(prog(t, away, 0.4))) + reveal(t, back, 0.4));
  S.b2.show(fadeBetween(t, away + 0.2, back - 0.4, 0.4));

  // the two zones: outlines on "run on your machine" / "pay for"
  S.lz.show(reveal(t, c('machine'), 0.6));
  S.lLab.show(reveal(t, c('machine') + 0.5, 0.5));
  S.rz.show(reveal(t, c('pay'), 0.6));
  S.rLab.show(reveal(t, c('pay'), 0.5));
  // spotlight: the side being spoken is bright; at the end both sides sit back behind the open questions
  const endBack = reveal(t, back, 0.4);
  const left = lerp(1, 0.45, reveal(t, c('writing'), 0.6));
  const right = lerp(1, 0.4, reveal(t, c('three'), 0.6)) + 0.6 * reveal(t, c('writing'), 0.6);
  S.lz.dim(lerp(left, 0.5, endBack)); S.lLab.dim(lerp(left, 0.5, endBack));
  S.rz.dim(lerp(right, 0.5, endBack)); S.rLab.dim(lerp(right, 0.5, endBack));

  // left: the voice on a graphics card, then the two ears on a processor
  S.voiceG.show(1).dim(lerp(Math.min(dimAfter(t, c('aligner'), 0.4), left), 0.5, endBack));
  S.wave.show(reveal(t, c('voice'), 0.5));
  S.wave.play(t, reveal(t, c('voice'), 0.4) * (1 - reveal(t, c('aligner'), 0.4)));
  S.voiceChip.show(reveal(t, c('voice') + 0.2, 0.5));
  S.gpu.show(reveal(t, c('card'), 0.5));
  S.gpuLab.show(reveal(t, c('card') + 0.4, 0.5));
  set(S.gpu.fan, { transform: `translate(-100 0) rotate(${((t * 140) % 360).toFixed(1)})` });
  S.earsG.show(1).dim(lerp(left, 0.5, endBack));
  S.aligner.show(reveal(t, c('aligner'), 0.5));
  S.recog.show(reveal(t, c('recognizer'), 0.5));
  S.cpu.show(reveal(t, c('processor'), 0.5));
  S.cpuLab.show(reveal(t, c('processor') + 0.2, 0.5));

  // right: the cloud, the writing and the pictures, a paid Claude plan
  S.cloudG.show(1).dim(lerp(1, 0.5, endBack));
  S.cloud.show(reveal(t, c('writing'), 0.5));
  S.writing.show(reveal(t, c('writing') + 0.15, 0.5));
  S.pictures.show(reveal(t, c('pictures'), 0.5));
  S.plan.show(reveal(t, c('plan'), 0.5));

  // the dated note: the agent reads the page, the date stamp, then the table of what is included where
  const src = dimAfter(t, c('code'), 0.45);
  S.srcG.show(1).dim(src);
  S.agent.show(reveal(t, away + 0.6, 0.4));
  S.agentLab.show(reveal(t, away + 0.7, 0.4));
  set(S.look, { opacity: +reveal(t, c('page'), 0.4).toFixed(3) });
  S.page.show(reveal(t, c('page'), 0.5));
  S.pageLab.show(reveal(t, c('page') + 0.3, 0.5));
  S.date.show(reveal(t, c('date'), 0.5));
  const tbl = lerp(1, 0.6, reveal(t, c('yourself'), 0.6));
  S.rCode.show(reveal(t, c('code'), 0.5)).dim(tbl);
  S.rOpus.show(reveal(t, c('opus'), 0.5)).dim(tbl);
  // ticks breathe once on "included", then fade back a little on "plans change"
  const tk = lerp(1, 0.55, reveal(t, c('change'), 0.6)) * tbl;
  S.ticks.forEach((k, i) => k.show(reveal(t, c('included') + i * 0.2, 0.4)).dim(tk).at(COLS[0], ROWS[i], 1.4 + 0.25 * fadeBetween(t, c('included') + i * 0.2, c('included') + i * 0.2 + 0.5, 0.25)));
  S.hPaid.show(reveal(t, c('included') - 0.1, 0.5)).dim(tbl);
  set(S.grid, { opacity: +(reveal(t, c('included') - 0.1, 0.5) * tbl).toFixed(3) });
  S.hFree.show(reveal(t, c('free'), 0.5)).dim(tbl);
  S.dashes.forEach((d, i) => d.show(reveal(t, c('free') + 0.2 + i * 0.2, 0.4)).dim(tbl));
  S.rLim.show(reveal(t, c('limits'), 0.5)).dim(tbl);
  S.cells.forEach((k, i) => k.show(reveal(t, c('limits') + 0.3 + i * 0.2, 0.4)).dim(tbl));
  S.change.show(reveal(t, c('change'), 0.5)).dim(tbl);

  // back on the table: what is not tried yet sits under both zones, dashed and neutral; the phrase holds to the end
  S.notYet.show(reveal(t, c('other'), 0.4));
  S.other.show(reveal(t, c('other'), 0.4));
  S.timed.show(reveal(t, c('timed'), 0.5));
  S.final.show(reveal(t, c('yourself'), 0.6));
}
