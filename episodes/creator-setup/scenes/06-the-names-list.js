// 06 - the names list: the agent asks first for the one thing that protects you, the names list (a page of short ink bars).
// The pipeline reads scripts and puts words on screen, so it must know which names never appear. The example page is copied
// and your own names replace its bars as hot-ringed bars. The safety gate (a thin accent bar across a path, before the main
// stages) stops a magenta line that comes from a script, a scene or a subtitle. Until the list is filled in a banner of hot
// marks sits over the page; the gate still runs but does not know your names (dashed rings). Then the git hooks: a small check
// before every commit refuses private files and audio, but lets a script's text through unread. Ends wide on the gate.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, arrow, flow, glow, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'first', at: 'first thing' },
    { name: 'agent', at: 'the agent' },
    { name: 'ask', at: 'ask you' },
    { name: 'protects', at: 'protects you' },
    { name: 'pipeline', at: 'This pipeline' },
    { name: 'scripts', at: 'reads your scripts' },
    { name: 'words', at: 'puts words' },
    { name: 'screen', at: 'on screen' },
    { name: 'which', at: 'which names' },
    { name: 'never', at: 'never appear' },
    { name: 'copy', at: 'Copy the example' },
    { name: 'example', at: 'example list' },
    { name: 'own', at: 'put your own' },
    { name: 'machine', at: 'machine names' },
    { name: 'user', at: 'user name' },
    { name: 'family', at: 'family names' },
    { name: 'gate', at: 'safety gate' },
    { name: 'stages', at: 'main stages' },
    { name: 'stops', at: 'stops them' },
    { name: 'shows', at: 'shows up' },
    { name: 'script', at: 'in a script' },
    { name: 'scene', at: 'a scene' },
    { name: 'subtitle', at: 'a subtitle' },
    { name: 'until', at: 'Until you fill' },
    { name: 'fill', at: 'fill the list' },
    { name: 'warning', at: 'loud warning' },
    { name: 'runs', at: 'gate still runs' },
    { name: 'know', at: 'not know' },
    { name: 'then', at: 'Then switch' },
    { name: 'hooks', at: 'git hooks' },
    { name: 'commit', at: 'every commit' },
    { name: 'refuse', at: 'They refuse' },
    { name: 'private', at: 'private files' },
    { name: 'audio', at: 'any audio' },
    { name: 'read', at: 'not read' },
    { name: 'gatedoes', at: 'gate does that' },
    { name: 'stage', at: 'run a stage' },
  ],
};

const stroke = (color, w = 5) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));
const ROWS = [-150, -75, 0, 75, 150];                 // bar rows on the page (page-local y)
const BARW = [0.62, 0.48, 0.7, 0.4, 0.55].map((k) => k * 260);
const YOURW = [0.5, 0.36, 0.58].map((k) => k * 260);  // your own names: different lengths from the example's
const PY = 420, GX = 1020, LANE = 760;               // the gate path's y, the gate's x, the commit lane's y
const STOPS = [1250, 1450, 1650];
const COMMITS = [1250, 1450, 1650];

// THE NAMES LIST: a 360 x 460 page of short ink bars; rows 0..2 can turn into your hot-ringed names or empty dashed rings
function page(parent, rings) {
  const it = new Item(parent, 360, 460);
  el(it.g, 'rect', { x: -180, y: -230, width: 360, height: 460, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  it.plain = ROWS.map((y, i) => el(it.g, 'rect', { x: -130, y: y - 11, width: BARW[i], height: 22, rx: 11, fill: P.ink }));
  if (rings) {
    it.yours = YOURW.map((w, i) => {
      const g = el(it.g, 'g', { opacity: 0 });
      el(g, 'rect', { x: -130, y: ROWS[i] - 11, width: w, height: 22, rx: 11, fill: P.ink });
      el(g, 'ellipse', { cx: -130 + w / 2, cy: ROWS[i], rx: w / 2 + 22, ry: 28, fill: 'none', stroke: P.hot, 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' });
      return g;
    });
    it.empty = BARW.slice(0, 3).map((w, i) => el(it.g, 'ellipse', { cx: -130 + w / 2, cy: ROWS[i], rx: w / 2 + 22, ry: 28, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 7', 'vector-effect': 'non-scaling-stroke', opacity: 0 }));
    // THE WARNING BANNER: a row of small hot marks across the top of the page
    it.banner = el(it.g, 'g', { opacity: 0 });
    it.marks = [-125, -75, -25, 25, 75, 125].map((x) => {
      const m = el(it.banner, 'g', { transform: `translate(${x} -207)` });
      el(m, 'path', { d: 'M 0 -15 L 15 12 L -15 12 Z', fill: P.hot, 'fill-opacity': 0.25, stroke: P.hot, 'stroke-width': 3, 'stroke-linejoin': 'round' });
      el(m, 'line', { x1: 0, y1: -5, x2: 0, y2: 3, ...stroke(P.hot, 3) });
      return m;
    });
  }
  return it;
}
// a script: a small rounded sheet of ink lines
function doc(parent, w, h, { dashed = false, color = P.ink } = {}) {
  const it = new Item(parent, w, h);
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(16, w * 0.12), fill: P.bg2, stroke: color, 'stroke-width': 4, ...(dashed ? { 'stroke-dasharray': '9 7' } : {}) });
  [0.7, 0.5, 0.64, 0.42].forEach((k, i) => el(it.g, 'rect', { x: -w * 0.34, y: -h * 0.3 + i * h * 0.2 - 5, width: w * 0.68 * k, height: 10, rx: 5, fill: color }));
  return it;
}
// THE COMPUTER: a flat rounded screen on a stand, ink outline, about 300 px wide
function computer(parent) {
  const it = new Item(parent, 300, 250);
  el(it.g, 'rect', { x: -150, y: -125, width: 300, height: 190, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(it.g, 'rect', { x: -12, y: 65, width: 24, height: 38, fill: P.ink });
  el(it.g, 'rect', { x: -70, y: 103, width: 140, height: 14, rx: 7, fill: P.ink });
  it.words = [[-100, -62, 170], [-100, -22, 120]].map(([x, y, w]) => el(it.g, 'rect', { x, y, width: w, height: 20, rx: 10, fill: P.ink, opacity: 0 }));
  return it;
}
// THE AGENT: a small violet cloud with a pencil
function agent(parent) {
  const it = new Item(parent, 160, 100);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  const p = el(it.g, 'g', { transform: 'translate(40 40) rotate(-35)' });
  el(p, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, fill: P.bg, stroke: P.violet, 'stroke-width': 3 });
  el(p, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, stroke: P.violet, 'stroke-width': 3 });
  el(p, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return it;
}
// a STOP: a small hot octagon
function octagon(parent, r = 32) {
  const it = new Item(parent, 2 * r, 2 * r);
  const pts = Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + (k * Math.PI) / 4; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; });
  el(it.g, 'polygon', { points: pts.join(' '), fill: P.hot, 'fill-opacity': 0.18, stroke: P.hot, 'stroke-width': 5 });
  el(it.g, 'line', { x1: -r * 0.45, y1: 0, x2: r * 0.45, y2: 0, ...stroke(P.hot, 6) });
  return it;
}
// a private FILE: a square with a folded corner
function file(parent, color) {
  const it = new Item(parent, 56, 68);
  el(it.g, 'path', { d: 'M -28 -34 L 12 -34 L 28 -18 L 28 34 L -28 34 Z', ...stroke(color, 4), fill: color, 'fill-opacity': 0.15 });
  el(it.g, 'path', { d: 'M 12 -34 L 12 -18 L 28 -18', ...stroke(color, 4) });
  return it;
}
// THE VOICE: 9 rounded accent bars, 12 px wide, pitch 34 (gap 22), up to 60 px (CANON II)
function wave(parent) {
  const it = new Item(parent, 284, 60);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((k, i) => { const h = 60 * k; el(it.g, 'rect', { x: -136 + i * 34 - 6, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent }); });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'copy', delay: -0.2, dur: 1.4, x: 1000, y: 480, z: 1.1 },   // close on the two pages
    { cue: 'gate', delay: -0.3, dur: 1.5, x: 960, y: 540, z: 1 },       // wide: the page, the gate path, the stages
    { cue: 'then', dur: 1.4, x: 960, y: 600, z: 1 },                    // down to the commit lane
    { cue: 'gatedoes', delay: -0.4, dur: 1.2, x: 960, y: 540, z: 1 },   // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // opening: the agent asks for the page
  S.agent = agent(W).at(470, 330);
  S.askLine = arrow(W, 570, 380, 750, 420, { color: P.violet, width: 4 });
  S.protect = label(W, 'protects you', { size: type.label, color: P.ink }).at(960, 760);
  S.glow = glow(W, { rx: 40, ry: 190, color: P.accent, strength: 0.45 }).at(GX, PY);

  // the pipeline: a script is read and its words go on screen
  S.script = doc(W, 200, 250).at(420, 600);
  S.scriptLab = chip(W, 'your scripts', { color: P.ink }).at(420, 800);
  S.read = arrow(W, 560, 600, 1320, 600, { color: P.dim, width: 5 });
  S.readDots = flow(W, [[580, 600], [1300, 600]], { n: 4, r: 8, color: P.ink, period: 2.0 });
  S.comp = computer(W).at(1500, 590);
  S.never = label(W, 'never appear', { size: type.label, color: P.hot }).at(960, 720);

  // the example page, its copy (your list) and what goes in it
  S.p0 = page(W, false);
  S.exLab = label(W, 'example list', { size: type.label }).at(620, 190);
  S.p1 = page(W, true);
  S.yourLabs = ['machine names', 'user name', 'family names'].map((s) => label(W, s, { size: 44, color: P.hot }));

  // the safety gate across the path, before the main stages
  S.path = el(W, 'line', { x1: 800, y1: PY, x2: STOPS[0], y2: PY, ...stroke(P.dim, 4), opacity: 0 });
  S.track = new Item(W);
  el(S.track.g, 'line', { x1: STOPS[0], y1: PY, x2: STOPS[2], y2: PY, ...stroke(P.dim, 5) });
  S.stops = STOPS.map((x) => el(S.track.g, 'rect', { x: x - 36, y: PY - 36, width: 72, height: 72, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 }));
  S.stagesLab = label(W, 'main stages', { size: type.label, color: P.ink }).at(1450, 520);
  S.leak = el(W, 'line', { x1: 800, y1: PY, x2: 800, y2: PY, ...stroke(P.hot, 7), opacity: 0 });
  // unfilled list: one of your names slips past the gate (dashed)
  S.leak2 = el(W, 'line', { x1: 800, y1: PY + 40, x2: 800, y2: PY + 40, ...stroke(P.hot, 6), 'stroke-dasharray': '16 12', opacity: 0 });
  S.gate = new Item(W, 14, 260);
  el(S.gate.g, 'rect', { x: -7, y: -130, width: 14, height: 260, rx: 7, fill: P.accent });
  S.gate.at(GX, PY);
  S.gateLab = label(W, 'safety gate', { size: type.label, color: P.accent }).at(GX, 230);
  S.stop1 = octagon(W).at(GX, 620);
  S.srcs = ['script', 'scene', 'subtitle'].map((s, i) => chip(W, s, { color: P.hot }).at(690, 330 + i * 90));
  S.warnLab = label(W, 'loud warning', { size: type.label, color: P.hot }).at(330, 232);
  S.knowLab = label(W, 'not know your names', { size: type.note, color: P.dim }).at(330, 700);
  S.checkDots = flow(W, [[800, 330], [1006, 330]], { n: 3, r: 8, color: P.accent, period: 1.4 });

  // the commit lane: a git hook before every commit
  S.lane = el(W, 'line', { x1: 1066, y1: LANE, x2: COMMITS[2], y2: LANE, ...stroke(P.dim, 4), opacity: 0 });
  S.commits = COMMITS.map((x) => { const it = new Item(W, 44, 44); el(it.g, 'circle', { cx: 0, cy: 0, r: 22, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 }); return it.at(x, LANE); });
  S.hook = new Item(W, 90, 90);
  el(S.hook.g, 'rect', { x: -45, y: -45, width: 90, height: 90, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.hook.at(GX, LANE);
  S.hookLab = label(W, 'git hooks', { size: type.label, color: P.ink }).at(GX, 865);
  S.commitLab = label(W, 'every commit', { size: type.note, color: P.ink }).at(1450, 865);
  S.stop2 = octagon(W).at(GX, 650);
  S.file = file(W, P.hot);
  S.fileLab = label(W, 'private files', { size: type.note, color: P.hot }).at(620, 660);
  S.wave = wave(W);
  S.waveLab = label(W, 'any audio', { size: type.note, color: P.accent }).at(560, 875);
  S.doc2 = doc(W, 90, 116, { dashed: true, color: P.ink });
  S.notRead = label(W, 'do not read', { size: type.note, color: P.dim }).at(GX, 650);

  const fin = 'The gate does that when you run a stage';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56), color: P.ink }).at(960, 850);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const END = 99;
  const fin = reveal(t, c('gatedoes') + 0.1, 0.6);

  // ---- opening: the agent asks for the one thing that protects you
  const outA = c('pipeline');
  S.agent.show(fadeBetween(t, c('agent'), outA)).dim(lerp(1, 0.5, reveal(t, c('protects'), 0.5)));
  S.askLine.draw(ease.inOut(prog(t, c('ask'), 0.6)), fadeBetween(t, c('ask'), outA, 0.4));
  S.protect.show(fadeBetween(t, c('protects'), outA, 0.4));

  // ---- the page: centre, then small and high while the pipeline reads, then left of its copy
  const up = ease.inOut(prog(t, outA, 0.9)), back = ease.inOut(prog(t, c('copy') - 0.2, 1.0));
  const p0x = lerp(960, 620, back), p0y = lerp(lerp(450, 250, up), 470, back), p0s = lerp(lerp(1, 0.5, up), 1, back);
  S.p0.show(fadeBetween(t, c('first'), c('family') + 1.0)).at(p0x, p0y, p0s);
  S.p0.dim(t < outA + 0.5 ? 1 : Math.max(spot(t, -1, outA + 0.5), spot(t, c('which') - 0.2, c('own'))));
  S.exLab.show(fadeBetween(t, c('example'), c('family') + 1.0)).dim(spot(t, c('example'), c('own')));

  // ---- the pipeline: script -> words on screen
  const outB = c('copy') - 0.7;
  const dimB = spot(t, -1, c('which') - 0.2, 0.45);
  S.script.show(fadeBetween(t, c('scripts') + 0.4, outB)).dim(dimB);
  S.scriptLab.show(fadeBetween(t, c('scripts') + 0.4, outB)).dim(dimB);
  S.read.draw(ease.inOut(prog(t, c('words'), 0.7)), fadeBetween(t, c('words'), outB) * dimB);
  S.readDots.update(t, fadeBetween(t, c('words') + 0.6, outB) * dimB);
  S.comp.show(fadeBetween(t, c('screen') - 0.2, outB)).dim(dimB);
  S.comp.words.forEach((w, i) => set(w, { opacity: +reveal(t, c('screen') + 0.2 + i * 0.3, 0.3).toFixed(3) }));
  S.never.show(fadeBetween(t, c('never'), outB));

  // ---- your copy: slides out of the example, your names replace its bars, then it moves left beside the gate
  const slide = ease.out(prog(t, c('copy'), 0.9)), left = ease.inOut(prog(t, c('gate') - 0.3, 1.4));
  S.p1.show(reveal(t, c('copy'), 0.3)).at(lerp(lerp(620, 1060, slide), 330, left), 470, lerp(1, 0.75, left));
  const ringOn = [c('machine'), c('user'), c('family')];
  // unfilled from "Until" to just after "not know your names"; filled otherwise once each name is spoken
  const unfill = fadeBetween(t, c('until'), c('know') + 1.3);
  S.p1.plain.forEach((b, i) => set(b, { opacity: +(i < 3 ? 1 - reveal(t, ringOn[i], 0.5) * (1 - unfill) : 1).toFixed(3) }));
  S.p1.yours.forEach((g, i) => set(g, { opacity: +(reveal(t, ringOn[i], 0.5) * (1 - unfill)).toFixed(3) }));
  S.p1.empty.forEach((e) => set(e, { opacity: +fadeBetween(t, c('know'), c('know') + 1.3).toFixed(3) }));
  set(S.p1.banner, { opacity: +fadeBetween(t, c('fill'), c('know') + 1.3).toFixed(3) });
  const loud = reveal(t, c('warning'), 0.4);
  S.p1.marks.forEach((m, i) => set(m, { transform: `translate(${-125 + i * 50} -207) scale(${(1 + 0.25 * loud * (0.5 + 0.5 * Math.sin(t * 6 + i))).toFixed(3)})` }));
  S.p1.dim(Math.max(spot(t, -1, c('gate')), spot(t, c('shows') - 0.2, c('script')), spot(t, c('until'), c('runs')), spot(t, c('know') - 0.2, c('then'))));
  S.yourLabs.forEach((l, i) => l.show(fadeBetween(t, ringOn[i], c('family') + 1.3)).at(1270 + l.w / 2, 470 + ROWS[i]).dim(spot(t, ringOn[i], ringOn[i + 1] ?? END)));
  S.warnLab.show(fadeBetween(t, c('warning'), c('know') + 1.3));
  S.knowLab.show(fadeBetween(t, c('know'), c('know') + 1.3));

  // ---- the safety gate: a thin accent bar across the path, before the main stages; it stops a magenta line
  const gateDim = Math.max(spot(t, c('gate'), c('stages'), 0.4), spot(t, c('stops'), c('until'), 0.4), spot(t, c('runs'), c('know'), 0.4), spot(t, c('gatedoes'), END, 0.4));
  S.gate.show(reveal(t, c('gate') + 0.2, 0.5)).dim(gateDim);
  S.gateLab.show(reveal(t, c('gate') + 0.3, 0.5)).dim(gateDim);
  S.glow.pulse(t, Math.max(fadeBetween(t, c('stops'), c('shows') + 0.8), fadeBetween(t, c('runs'), c('know')), reveal(t, c('gatedoes'), 0.5)) * 0.9);
  set(S.path, { opacity: +(reveal(t, c('gate') + 0.2, 0.5) * 0.7).toFixed(3) });
  const trackDim = Math.max(spot(t, c('stages'), c('stops'), 0.35), spot(t, c('stage') - 0.2, END, 0.35));
  S.track.show(reveal(t, c('stages'), 0.5)).dim(trackDim);
  S.stagesLab.show(reveal(t, c('stages'), 0.5)).dim(trackDim);
  const lit = reveal(t, c('stage'), 0.3) > 0.5;
  set(S.stops[0], { stroke: lit ? P.accent : P.dim, 'stroke-width': lit ? 6 : 5 });
  const lk = ease.out(prog(t, c('shows'), 0.6));
  set(S.leak, { x2: lerp(800, GX - 12, lk).toFixed(1), opacity: +(reveal(t, c('shows'), 0.2) * spot(t, -1, c('until'), 0.35) * (1 - reveal(t, c('until'), 0.4))).toFixed(3) });
  set(S.leak2, { x2: lerp(800, STOPS[0] - 50, ease.out(prog(t, c('know'), 0.8))).toFixed(1), opacity: +fadeBetween(t, c('know'), c('know') + 1.3).toFixed(3) });
  S.stop1.show(fadeBetween(t, c('shows') + 0.6, c('until'))).dim(spot(t, -1, c('script'), 0.5));
  const srcT = [c('script') + 0.2, c('scene') + 0.1, c('subtitle') + 0.1];
  S.srcs.forEach((s, i) => s.show(reveal(t, srcT[i], 0.4)).dim(Math.max(spot(t, srcT[i], srcT[i + 1] ?? c('until')), i === 0 ? spot(t, c('gatedoes'), END) : 0)));
  S.checkDots.update(t, Math.max(fadeBetween(t, c('runs') + 0.3, c('know')), reveal(t, c('gatedoes') + 0.4, 0.5)));

  // ---- the git hooks: a small check before every commit
  const laneDim = spot(t, -1, c('gatedoes') - 0.4, 0.35);
  S.hook.show(reveal(t, c('then'), 0.5)).dim(laneDim * lerp(0.5, 1, reveal(t, c('hooks'), 0.4)));
  S.hookLab.show(fadeBetween(t, c('hooks'), c('gatedoes') - 0.6, 0.4)).dim(spot(t, c('hooks'), c('commit'), 0.5));
  set(S.lane, { opacity: +(reveal(t, c('commit'), 0.5) * 0.8 * laneDim).toFixed(3) });
  S.commits.forEach((it, i) => it.show(reveal(t, c('commit') + i * 0.2, 0.4)).dim(laneDim));
  S.commitLab.show(fadeBetween(t, c('commit'), c('gatedoes') - 0.6, 0.4)).dim(spot(t, c('commit'), c('refuse'), 0.5));
  // refused: the private file and the audio stop at the hook
  const outE = c('read') - 0.6;
  const fq = ease.inOut(prog(t, c('private'), 0.8)), aq = ease.inOut(prog(t, c('audio'), 0.8));
  S.file.show(fadeBetween(t, c('private'), outE)).at(lerp(560, 920, fq), 730);
  S.fileLab.show(fadeBetween(t, c('private'), outE)).at(lerp(560, 820, fq), 660);
  S.wave.show(fadeBetween(t, c('audio'), outE)).at(lerp(560, 860, aq), 805, 0.7);
  S.waveLab.show(fadeBetween(t, c('audio'), outE)).at(lerp(560, 800, aq), 860);
  S.stop2.show(fadeBetween(t, c('refuse') + 0.2, outE));
  // the script's text goes through: the hook does not read it
  const dq = ease.inOut(prog(t, c('read') + 0.1, 1.6));
  S.doc2.show(reveal(t, c('read'), 0.4)).at(lerp(560, 1135, dq), LANE).dim(spot(t, -1, c('gatedoes'), 0.35));
  S.notRead.show(fadeBetween(t, c('read'), c('gatedoes') - 0.6, 0.4));

  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.6, fin).toFixed(3) });
}
