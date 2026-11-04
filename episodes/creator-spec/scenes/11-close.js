// Scene 11: the close. The plan, the fact sheet and the shield in one calm row, read once, then dimmed;
// the title card for the next part fades in with an unlabeled arrow pointing right, and the frame holds.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, label, arrow, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'whole', at: 'the whole plan' },
    { name: 'plan', at: 'one-page plan' },
    { name: 'fact', at: 'a fact sheet' },
    { name: 'check', at: 'and a check' },
    { name: 'reads', at: 'reads all of it' },
    { name: 'end', at: 'the end of this part' },
    { name: 'next', at: 'In the next part' },
    { name: 'start', at: 'we start on the script' },
    { name: 'ear', at: 'writing for the ear' },
    { name: 'listener', at: 'as a listener' },
  ],
};

const ROW = { plan: 480, fact: 960, check: 1440, y: 420 };
const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z';
const TITLE = 'Next: writing for the ear';
const bar = (g, x, y, w, color = P.ink, h = 12) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color });

/** A page: 360 x 470, rx 24, bg2 fill, 4 px dim outline, with a scan line for "reads all of it". */
function page(parent) {
  const it = new Item(parent, 360, 470);
  el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  return it;
}
const addScan = (it) => (it.scan = el(it.g, 'rect', { x: -170, y: 0, width: 340, height: 5, fill: P.accent, opacity: 0 }));

/** THE PLAN, as scenes 03 and 04 draw it (page-local coordinates). */
function planPage(parent) {
  const it = page(parent), pg = it.g;
  bar(pg, -144, -184, 288, P.ink, 16); // thesis
  el(pg, 'circle', { cx: -128, cy: -129, r: 9, fill: P.dim }); // viewer
  el(pg, 'rect', { x: -142, y: -117, width: 28, height: 16, rx: 8, fill: P.dim });
  bar(pg, -98, -118, 168);
  label(pg, '?', { size: type.note }).show(1).at(112, -118);
  [0, 1, 2].forEach((i) => { // three tagged facts
    const x = -144 + i * 98, y = -52, col = [P.accent, P.ink, P.dim][i];
    const s = { fill: 'none', stroke: col, 'stroke-width': 2.5 };
    el(pg, 'rect', { x, y: y - 15, width: 30, height: 30, rx: 7, ...s, 'stroke-width': 3 });
    if (i === 0) { el(pg, 'ellipse', { cx: x + 11, cy: y, rx: 6, ry: 4, ...s }); el(pg, 'ellipse', { cx: x + 19, cy: y, rx: 6, ry: 4, ...s }); }
    if (i === 1) { el(pg, 'line', { x1: x + 6, y1: y + 5, x2: x + 24, y2: y + 5, ...s }); [9, 15, 21].forEach((k) => el(pg, 'line', { x1: x + k, y1: y + 5, x2: x + k, y2: y - 4, ...s, 'stroke-width': 2 })); }
    if (i === 2) el(pg, 'path', { d: `M ${x + 6} ${y + 2} q 4.5 -8 9 0 t 9 0`, ...s, 'stroke-linecap': 'round' });
    bar(pg, x + 38, y, 48, P.ink, 10);
  });
  [[0, 200], [14, 160], [28, 184]].forEach(([dy, w]) => bar(pg, -144, dy, w, P.dim, 8)); // not covered, crossed out
  el(pg, 'line', { x1: -152, y1: 36, x2: 70, y2: -8, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round' });
  [90, 144, 198].forEach((y, i) => { el(pg, 'circle', { cx: -124, cy: y, r: 11, fill: P.ink }); bar(pg, -90, y, [190, 140, 170][i]); });
  for (let i = 0; i < 2; i++) {
    const y1 = [90, 144][i] + 16, y2 = [144, 198][i] - 16;
    el(pg, 'line', { x1: -124, y1, x2: -124, y2, stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });
    el(pg, 'path', { d: `M -132 ${y2 - 8} L -124 ${y2} L -116 ${y2 - 8}`, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }
  addScan(it);
  return it;
}

/** A fact tag, as scene 04 draws it: 56 x 56 rounded square with a tiny icon, no letters. */
function tag(g, kind, cx, cy) {
  const color = kind === 'cited' ? P.accent : kind === 'measured' ? P.ink : P.dim;
  const t = el(g, 'g', { transform: `translate(${cx} ${cy})` });
  el(t, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: color, 'fill-opacity': 0.12, stroke: color, 'stroke-width': 3 });
  const s = { fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 'cited') {
    el(t, 'rect', { x: -19, y: -6, width: 24, height: 12, rx: 6, ...s, transform: 'rotate(-45) translate(-4 0)' });
    el(t, 'rect', { x: -5, y: -6, width: 24, height: 12, rx: 6, ...s, transform: 'rotate(-45) translate(4 0)' });
  } else if (kind === 'measured') {
    el(t, 'rect', { x: -20, y: -8, width: 40, height: 16, rx: 3, ...s });
    for (let i = 0; i < 5; i++) el(t, 'line', { x1: -14 + i * 7, x2: -14 + i * 7, y1: -8, y2: i % 2 ? -2 : 1, ...s, 'stroke-width': 2 });
  } else {
    el(t, 'path', { d: 'M -18 4 C -12 -8, -6 -8, 0 0 S 12 8, 18 -4', ...s });
  }
}

/** THE FACT SHEET, as scene 04 draws it: three tagged rows (page-local rows at -130, 0, 130). */
function factSheet(parent) {
  const it = page(parent);
  ['cited', 'measured', 'estimated'].forEach((k, i) => {
    const y = [-130, 0, 130][i];
    bar(it.g, -70, y - 14, 220);
    bar(it.g, -70, y + 14, 150, P.dim);
    tag(it.g, k, -124, y);
  });
  addScan(it);
  return it;
}

/** THE SHIELD, as scene 08 draws it: outline and four centred denylist bars, plus an accent copy of each to flash. */
function shield(parent) {
  const it = new Item(parent, 220, 260);
  el(it.g, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  const ws = [120, 96, 120, 80], ys = [-62, -22, 18, 58];
  it.flash = ys.map((y, i) => {
    el(it.g, 'rect', { x: -ws[i] / 2, y: y - 9, width: ws[i], height: 18, rx: 9, fill: P.ink });
    return el(it.g, 'rect', { x: -ws[i] / 2, y: y - 9, width: ws[i], height: 18, rx: 9, fill: P.accent, opacity: 0 });
  });
  return it;
}

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 480, z: 1.06 }, // start a little close
    { cue: 'end', delay: 0, dur: 1.8, x: 960, y: 540, z: 1 }, // ease out to wide for the ending
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // three empty slots for "the whole plan", filled one by one
  S.slots = [
    el(W, 'rect', { x: ROW.plan - 180, y: ROW.y - 235, width: 360, height: 470, rx: 24, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '14 12', opacity: 0 }),
    el(W, 'rect', { x: ROW.fact - 180, y: ROW.y - 235, width: 360, height: 470, rx: 24, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '14 12', opacity: 0 }),
    el(W, 'path', { d: SHIELD_D, transform: `translate(${ROW.check} ${ROW.y})`, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '14 12', opacity: 0 }),
  ];
  S.plan = planPage(W).at(ROW.plan, ROW.y);
  S.fact = factSheet(W).at(ROW.fact, ROW.y);
  S.shield = shield(W).at(ROW.check, ROW.y);
  S.lPlan = label(W, 'a one-page plan', { size: type.label }).at(ROW.plan, 700);
  S.lFact = label(W, 'a fact sheet', { size: type.label }).at(ROW.fact, 700);
  S.lCheck = label(W, 'a check', { size: type.label, color: P.accent }).at(ROW.check, 700);

  // the title card and its unlabeled arrow, centred together as one line
  const tw = measure(TITLE, 64), gap = 40, aw = 160;
  const x0 = 960 - (tw + gap + aw) / 2;
  S.title = label(W, TITLE, { size: 64 }).at(x0 + tw / 2, 840);
  S.arrow = arrow(W, x0 + tw + gap, 840, x0 + tw + gap + aw, 840, { color: P.accent });

  // writing for the ear: the voice waveform, and the listener who will review it
  S.wave = new Item(W, 9 * 34, 60).at(900, 730);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((h, i) => el(S.wave.g, 'rect', { x: -136 + i * 34 - 6, y: -30 * h, width: 12, height: 60 * h, rx: 6, fill: P.accent }));
  S.person = new Item(W, 60, 104).at(1130, 730);
  el(S.person.g, 'circle', { cx: 0, cy: -33, r: 19, fill: P.dim });
  el(S.person.g, 'rect', { x: -30, y: -8, width: 60, height: 60, rx: 24, fill: P.dim });
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // slots wait for their item, then give way to it
  const on = [c('plan'), c('fact'), c('check')];
  S.slots.forEach((s, i) => set(s, { opacity: +(fadeBetween(t, c('whole'), on[i], 0.4) * 0.6).toFixed(3) }));

  // each item bright when spoken, then back; all bright together while the check reads all of it; all dim at the end
  const all = fadeBetween(t, c('reads'), c('end'), 0.5);
  const endDim = dimAfter(t, c('end'), 0.35);
  const d = (after) => lerp(dimAfter(t, after, 0.35), 1, all) * endDim;
  const items = [[S.plan, S.lPlan, c('fact')], [S.fact, S.lFact, c('check')], [S.shield, S.lCheck, Infinity]];
  items.forEach(([it, lb, after], i) => {
    const a = reveal(t, on[i]);
    it.show(a).dim(d(after));
    lb.show(a * (1 - ease.in(prog(t, c('end'), 0.5)))).dim(d(after));
  });

  // "reads all of it": a scan line passes down each page, the shield's list lights once
  [S.plan, S.fact].forEach((p, i) => {
    const k = prog(t, c('reads') + i * 0.5, 1.4);
    set(p.scan, { y: lerp(-225, 220, k).toFixed(1), opacity: +(k > 0 && k < 1 ? 0.9 : 0) });
  });
  S.shield.flash.forEach((f, i) => set(f, { opacity: +fadeBetween(t, c('reads') + 1.2 + i * 0.25, c('reads') + 1.9 + i * 0.25, 0.3).toFixed(3) }));

  // the next part
  S.title.show(reveal(t, c('next')));
  S.arrow.draw(ease.out(prog(t, c('start'), 1.0)), reveal(t, c('start'), 0.3));
  S.wave.show(reveal(t, c('ear')));
  S.person.show(reveal(t, c('listener')));
}
