// Scene 03: the plan is one page. Five bars build on a single centred page; a new-episode folder appears beside it.
import { palette as P, el, lerp } from 'style';
import { type, label, chip, curve, flow, glow, Item, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'start', at: 'Start with the plan' },
    { name: 'three', at: 'three questions' },
    { name: 'none', at: 'none of them well' },
    { name: 'page', at: 'one page' },
    { name: 'before', at: 'before the script' },
    { name: 'holds', at: 'It holds' },
    { name: 'thesis', at: 'a thesis' },
    { name: 'repeat', at: 'could repeat' },
    { name: 'audience', at: 'the audience' },
    { name: 'question', at: 'the question they come in' },
    { name: 'facts', at: 'short list of the facts' },
    { name: 'depends', at: 'depends on' },
    { name: 'skip', at: 'people skip' },
    { name: 'notcover', at: 'will not cover' },
    { name: 'later', at: 'later episode' },
    { name: 'scenes', at: 'sketches the scenes' },
    { name: 'point', at: 'its one point' },
    { name: 'bridge', at: 'a bridge' },
    { name: 'follows', at: 'why it follows' },
    { name: 'onebefore', at: 'the one before' },
    { name: 'youdo', at: 'You do not start' },
    { name: 'blank', at: 'a blank page' },
    { name: 'command', at: 'one command' },
    { name: 'new', at: 'new, sets up' },
    { name: 'setsup', at: 'sets up an episode' },
    { name: 'folder', at: 'episode folder' },
    { name: 'thispage', at: 'this page' },
    { name: 'empty', at: 'empty versions' },
  ],
};

// page geometry (bible: 360 x 470, centred at x 960)
const PX = 960, PY = 500, PW = 360, PH = 470;
const L = PX - PW / 2, T = PY - PH / 2; // 780, 265
const CL = L + 36, CR = L + PW - 36;   // content 816..1104
const ROW = { thesis: 316, viewer: 382, facts: 448, notcover: 514 };
const DOTS = [590, 644, 698];

let S;
const bar = (g, x1, x2, y, h, color, op = 1) => el(g, 'rect', { x: x1, y: y - h / 2, width: x2 - x1, height: h, rx: h / 2, fill: color, opacity: op });
const group = (parent) => new Item(parent);

// plan contents, drawn once for the big page and again for the small copy inside the folder
const drawPage = (g, sw = 4) => el(g, 'rect', { x: L, y: T, width: PW, height: PH, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': sw });
const drawThesis = (g) => bar(g, CL, CR, ROW.thesis, 16, P.ink);
const drawViewer = (g) => {
  el(g, 'circle', { cx: 832, cy: ROW.viewer - 11, r: 9, fill: P.dim });
  el(g, 'rect', { x: 818, y: ROW.viewer + 1, width: 28, height: 16, rx: 8, fill: P.dim });
  bar(g, 862, 1030, ROW.viewer, 12, P.ink);
};
// tags at the bible's 56 x 56 (icons drawn on a 30 px grid, scaled up)
const TAG = 56, TK = TAG / 30;
const drawFacts = (g) => [0, 1, 2].forEach((i) => {
  const x = CL + i * 98, y = ROW.facts, c = [P.accent, P.ink, P.dim][i];
  const t = el(g, 'g', { transform: `translate(${x} ${y}) scale(${TK})` });
  el(t, 'rect', { x: 0, y: -15, width: 30, height: 30, rx: 7, fill: 'none', stroke: c, 'stroke-width': 1.8 });
  if (i === 0) { el(t, 'ellipse', { cx: 11, cy: 0, rx: 6, ry: 4, fill: 'none', stroke: c, 'stroke-width': 2 }); el(t, 'ellipse', { cx: 19, cy: 0, rx: 6, ry: 4, fill: 'none', stroke: c, 'stroke-width': 2 }); }
  if (i === 1) { el(t, 'line', { x1: 6, y1: 5, x2: 24, y2: 5, stroke: c, 'stroke-width': 2 }); [9, 15, 21].forEach((k) => el(t, 'line', { x1: k, y1: 5, x2: k, y2: -4, stroke: c, 'stroke-width': 1.6 })); }
  if (i === 2) el(t, 'path', { d: 'M 6 2 q 4.5 -8 9 0 t 9 0', fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round' });
  bar(g, x + TAG + 8, x + 90, y, 10, P.ink);
});
const NOT = [[0, 200], [14, 160], [28, 184]];
const drawNot = (g) => {
  NOT.forEach(([dy, w]) => bar(g, CL, CL + w, ROW.notcover - 14 + dy, 8, P.dim));
  el(g, 'line', { x1: CL - 8, y1: ROW.notcover + 22, x2: CL + 214, y2: ROW.notcover - 22, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round' });
};
const drawDots = (g) => DOTS.forEach((y) => el(g, 'circle', { cx: 836, cy: y, r: 11, fill: P.ink }));
const drawPoints = (g) => DOTS.forEach((y, i) => bar(g, 870, [1060, 1010, 1040][i], y, 12, P.ink));
const drawBridges = (g) => {
  for (let i = 0; i < 2; i++) {
    const y1 = DOTS[i] + 16, y2 = DOTS[i + 1] - 16;
    el(g, 'line', { x1: 836, y1, x2: 836, y2, stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });
    el(g, 'path', { d: `M 828 ${y2 - 8} L 836 ${y2} L 844 ${y2 - 8}`, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }
};

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'thesis', delay: 0.3, dur: 1.6, x: 960, y: 460, z: 1.2 },
    { cue: 'skip', delay: 0.1, dur: 1.6, x: 960, y: 560, z: 1.2 },
    { cue: 'onebefore', delay: 0.8, dur: 1.8, x: 960, y: 520, z: 1 },
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  S.title = label(W, 'the plan', { size: 56 }).at(960, 200);

  // opening: three questions, none answered well
  S.qs = [720, 960, 1200].map((x) => {
    const it = chip(W, '?', { size: type.title, color: P.dim, padX: 34 }).at(x, 480);
    it.strike = el(it.g, 'line', { x1: -60, y1: 46, x2: 60, y2: -46, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 });
    return it;
  });

  // the page
  S.page = group(W);
  drawPage(S.page.g);
  S.beforeChip = chip(W, 'before the script', { color: P.dim }).at(960, 800);

  // row 1: thesis
  S.r1 = group(W); drawThesis(S.r1.g);
  S.glow = glow(W, { rx: 210, ry: 46, color: P.accent, strength: 0.35 }).at(960, ROW.thesis);

  // row 2: viewer (listener figure) + bar, then the question they bring
  S.r2 = group(W); drawViewer(S.r2.g);
  S.q2 = label(W, '?', { size: type.note, color: P.ink }).at(1072, ROW.viewer);

  // row 3: facts, three tagged items (cited, measured, estimated)
  S.r3 = group(W); drawFacts(S.r3.g);
  S.dep = curve(W, 1160, ROW.facts, 1160, ROW.thesis + 10, { bend: 46, color: P.accent, width: 4, head: 14 });

  // row 4: not-covered list (dim bars crossed by one thin dim line)
  S.r4 = group(W); drawNot(S.r4.g);
  // items that become later episodes: each small page grows out of its own crossed-out bar
  S.later = [1250, 1330, 1410].map((x, i) => {
    const it = group(W);
    el(it.g, 'rect', { x: -27, y: -35, width: 54, height: 70, rx: 8, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
    bar(it.g, -15, 15, -12, 6, P.dim); bar(it.g, -15, 9, 4, 6, P.dim);
    const [dy, w] = NOT[i];
    Object.assign(it, { x0: x, sx: CL + w / 2, sy: ROW.notcover - 14 + dy });
    return it;
  });
  S.laterLbl = label(W, 'later episodes', { size: type.note, color: P.dim }).at(1330, 600);

  // row 5: scene dots joined by small arrows, each with its one point
  S.r5 = group(W); drawDots(S.r5.g);
  S.points = group(W); drawPoints(S.points.g);
  S.bridges = group(W); drawBridges(S.bridges.g);
  S.flow = flow(W, [[836, DOTS[0]], [836, DOTS[2]]], { n: 2, r: 6, color: P.accent, period: 1.8 });

  // labels to the left of the page
  const lbl = (text, y) => { const it = label(W, text, { size: 44 }); return it.at(740 - it.w / 2, y); };
  S.lbl = {
    thesis: lbl('thesis', ROW.thesis), audience: lbl('audience', ROW.viewer), facts: lbl('facts', ROW.facts),
    notcover: lbl('not covered', ROW.notcover), scenes: lbl('scenes', DOTS[1]),
  };

  // not a blank page: a dashed empty page, then the folder that "new" sets up
  S.blank = group(W);
  el(S.blank.g, 'rect', { x: 520 - PW / 2, y: T, width: PW, height: PH, rx: 24, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '16 12' });
  S.blankX = group(W);
  [[360, 285, 680, 715], [680, 285, 360, 715]].forEach(([x1, y1, x2, y2]) => el(S.blankX.g, 'line', { x1, y1, x2, y2, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  S.newChip = chip(W, 'new', { size: type.label, color: P.accent }).at(1440, 300);
  S.folder = group(W);
  el(S.folder.g, 'path', { d: 'M 1290 630 L 1290 384 Q 1290 372 1302 372 L 1388 372 L 1408 396 L 1578 396 Q 1590 396 1590 408 L 1590 618 Q 1590 630 1578 630 Z', fill: P.bg2, 'fill-opacity': 0.7, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  S.mini = group(W);
  // the same plan page at 0.3 scale (the "?" drawn as a path: text would be under 38 px)
  const mg = el(S.mini.g, 'g', { transform: `scale(0.3) translate(${-PX} ${-PY})` });
  drawPage(mg, 10); drawThesis(mg); drawViewer(mg); drawFacts(mg); drawNot(mg); drawDots(mg); drawPoints(mg); drawBridges(mg);
  el(mg, 'path', { d: `M 1062 ${ROW.viewer - 8} q 0 -14 12 -14 q 12 0 12 12 q 0 9 -12 12 v 6`, fill: 'none', stroke: P.ink, 'stroke-width': 6, 'stroke-linecap': 'round' });
  el(mg, 'circle', { cx: 1074, cy: ROW.viewer + 18, r: 4, fill: P.ink });
  S.empties = [1462, 1546].map((x) => {
    const it = group(W);
    el(it.g, 'rect', { x: x - 32, y: 465, width: 64, height: 100, rx: 8, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
    return it;
  });

  S.final = label(W, 'one page, written before the script', { size: 64 }).at(960, 820);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const back = reveal(t, c('new'), 0.8); // overview: everything returns to full brightness
  const spot = (_inCue, outCue) => lerp(dimAfter(t, c(outCue), 0.35), 1, back);

  S.title.show(reveal(t, c('start')));

  // questions: appear, struck through, then make way for the page
  S.qs.forEach((q, i) => {
    q.show(fadeBetween(t, c('three') + i * 0.15, c('page') - 0.6, 0.4));
    q.dim(dimAfter(t, c('none'), 0.4));
    q.strike.setAttribute('opacity', reveal(t, c('none') + i * 0.1, 0.3).toFixed(3));
  });

  S.page.show(reveal(t, c('page'), 0.6));
  S.beforeChip.show(fadeBetween(t, c('before'), c('holds'), 0.4));

  S.r1.show(reveal(t, c('thesis'))).dim(spot('thesis', 'audience'));
  S.glow.pulse(t, fadeBetween(t, c('repeat'), c('audience'), 0.5));
  S.r2.show(reveal(t, c('audience'))).dim(spot('audience', 'facts'));
  S.q2.show(reveal(t, c('question'))).dim(spot('question', 'facts'));
  S.r3.show(reveal(t, c('facts'))).dim(spot('facts', 'notcover'));
  S.dep.draw(reveal(t, c('depends'), 0.8), dimAfter(t, c('notcover'), 0.35) * (1 - reveal(t, c('youdo'), 0.5)));
  S.r4.show(reveal(t, c('notcover'))).dim(spot('notcover', 'scenes'));

  const laterOut = 1 - reveal(t, c('youdo'), 0.5);
  S.later.forEach((it, i) => {
    // farthest slot launches first, 0.6 s apart, so no page flies over another
    const k = reveal(t, c('later') - 0.6 + (2 - i) * 0.6, 0.9);
    it.show(k * laterOut).dim(dimAfter(t, c('scenes'), 0.35)).at(lerp(it.sx, it.x0, k), lerp(it.sy, ROW.notcover, k), lerp(0.3, 1, k));
  });
  S.laterLbl.show(reveal(t, c('later') + 0.4) * laterOut).dim(dimAfter(t, c('scenes'), 0.35));

  S.r5.show(reveal(t, c('scenes')));
  S.points.show(reveal(t, c('point')));
  S.bridges.show(reveal(t, c('bridge')));
  S.flow.update(t, fadeBetween(t, c('follows'), c('youdo'), 0.5));

  const L = S.lbl;
  // labels step aside for the blank page, then return at 0.35 for the wide overview
  // (each label is already dimmed to 0.35 by then, so it returns at full show and stays dim)
  const lblOut = lerp(1 - reveal(t, c('youdo'), 0.5), 1, reveal(t, c('new'), 0.5));
  L.thesis.show(reveal(t, c('thesis')) * lblOut).dim(dimAfter(t, c('audience'), 0.35));
  L.audience.show(reveal(t, c('audience')) * lblOut).dim(dimAfter(t, c('facts'), 0.35));
  L.facts.show(reveal(t, c('facts')) * lblOut).dim(dimAfter(t, c('notcover'), 0.35));
  L.notcover.show(reveal(t, c('notcover')) * lblOut).dim(dimAfter(t, c('scenes'), 0.35));
  L.scenes.show(reveal(t, c('scenes')) * lblOut).dim(dimAfter(t, c('youdo'), 0.35));

  S.blank.show(fadeBetween(t, c('blank'), c('new') - 0.5, 0.5));
  S.blankX.show(fadeBetween(t, c('blank'), c('new') - 0.5, 0.4));
  S.newChip.show(reveal(t, c('command'))).dim(lerp(0.35, 1, reveal(t, c('new'), 0.4)));
  S.folder.show(reveal(t, c('folder') - 0.2));
  const m = reveal(t, c('thispage'), 0.7);
  S.mini.show(m).at(1360, lerp(470, 515, m)); // drops into the folder, never across its wall
  S.empties.forEach((it, i) => it.show(reveal(t, c('empty') + i * 0.25, 0.5)));
  S.final.show(reveal(t, c('thispage'), 0.7));
}
