// Scene 04: the fact sheet. One page with three tagged rows (cited, measured, estimated); a source read through a magnifier;
// leads (snippet, forum post, model answer) stay dim at the edge.
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, arrow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'plan', at: 'The plan names' },
    { name: 'facts', at: 'the facts your thesis' },
    { name: 'sheet', at: 'fact sheet is where' },
    { name: 'rule', at: 'The rule is simple' },
    { name: 'script', at: 'the script and the scenes' },
    { name: 'scenes', at: 'scenes may take' },
    { name: 'onefile', at: 'this one file' },
    { name: 'marker', at: 'carries a marker' },
    { name: 'cited', at: 'A cited fact' },
    { name: 'public', at: 'public source' },
    { name: 'link', at: 'link and the day' },
    { name: 'day', at: 'the day you read' },
    { name: 'measured', at: 'A measured fact' },
    { name: 'test', at: 'your own test' },
    { name: 'how', at: 'how, when' },
    { name: 'when', at: 'when, and how' },
    { name: 'runs', at: 'how many runs' },
    { name: 'estimated', at: 'An estimated fact' },
    { name: 'guess', at: 'best guess' },
    { name: 'rests', at: 'what it rests on' },
    { name: 'about', at: 'script says about' },
    { name: 'reading', at: 'A marker is only' },
    { name: 'read', at: 'read the source itself' },
    { name: 'stronger', at: 'no stronger than' },
    { name: 'wide', at: 't=44.9' },
    { name: 'snippet', at: 'search snippet' },
    { name: 'forum', at: 'a forum post' },
    { name: 'model', at: "model's answer" },
    { name: 'lead', at: 'is a lead' },
    { name: 'notsource', at: 'not a source' },
  ],
};

const ROW_Y = [350, 480, 610]; // world y of the three sheet rows (sheet centre 960, 480)
const NOTE_Y = [330, 420, 510, 600];

const bar = (g, x, y, w, color = P.ink, h = 12) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color });

/** A page: 360 x 470, rx 24, bg2 fill, 4 px dim outline (series vocabulary). */
function page(parent) {
  const it = new Item(parent, 360, 470);
  el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  return it;
}

/** A fact tag: 56 x 56 rounded square with a tiny icon (cited link, measured ruler, estimated tilde), no letters. */
function tag(parent, kind) {
  const color = kind === 'cited' ? P.accent : kind === 'measured' ? P.ink : P.dim;
  const it = new Item(parent, 56, 56);
  el(it.g, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: color, 'fill-opacity': 0.12, stroke: color, 'stroke-width': 3 });
  const s = { fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 'cited') {
    el(it.g, 'rect', { x: -19, y: -6, width: 24, height: 12, rx: 6, ...s, transform: 'rotate(-45) translate(-4 0)' });
    el(it.g, 'rect', { x: -5, y: -6, width: 24, height: 12, rx: 6, ...s, transform: 'rotate(-45) translate(4 0)' });
  } else if (kind === 'measured') {
    el(it.g, 'rect', { x: -20, y: -8, width: 40, height: 16, rx: 3, ...s });
    for (let i = 0; i < 5; i++) el(it.g, 'line', { x1: -14 + i * 7, x2: -14 + i * 7, y1: -8, y2: i % 2 ? -2 : 1, ...s, 'stroke-width': 2 });
  } else {
    el(it.g, 'path', { d: 'M -18 4 C -12 -8, -6 -8, 0 0 S 12 8, 18 -4', ...s });
  }
  return it;
}

/** A lead: a small dim speech bubble with its words inside, always drawn at 0.35. */
function bubble(parent, text) {
  const c = chip(parent, text, { color: P.dim, dashed: true });
  el(c.g, 'path', { d: `M ${-c.w / 2 + 34} ${c.h / 2 - 2} l 0 18 l 20 -18`, fill: P.dim, 'fill-opacity': 0.12, stroke: P.dim, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return c;
}

/** Piecewise level with eased 0.6 s transitions: start at v0, then glide to each [time, value] in order. */
const steps = (t, v0, list) => list.reduce((v, [at, to]) => lerp(v, to, ease.inOut(prog(t, at, 0.6))), v0);

let S;
export function setup(ctx) {
  const cue = ctx.cue;
  const stage = makeStage(ctx.svg, [
    { cue: 'onefile', delay: 0, dur: 1.8, x: 960, y: 520, z: 1.03 },
    { cue: 'cited', delay: -0.2, dur: 1.4, x: 1060, y: 480, z: 1.12 },
    { cue: 'read', delay: -0.3, dur: 1.4, x: 1150, y: 470, z: 1.2 },
    { cue: 'wide', delay: 0, dur: 1.4, x: 960, y: 500, z: 1 },
  ], cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // the plan (left), drawn exactly as scene 03 draws it (its coordinates moved to page-local: x - 960, y - 500)
  S.plan = page(W).at(330, 480);
  const pg = S.plan.g;
  bar(pg, -144, -184, 288, P.ink, 16); // thesis
  el(pg, 'circle', { cx: -128, cy: -129, r: 9, fill: P.dim }); // viewer
  el(pg, 'rect', { x: -142, y: -117, width: 28, height: 16, rx: 8, fill: P.dim });
  bar(pg, -98, -118, 168);
  label(pg, '?', { size: type.note }).at(112, -118);
  S.planFacts = [0, 1, 2].map((i) => { // three tagged facts
    const x = -144 + i * 98, y = -52, col = [P.accent, P.ink, P.dim][i];
    const s = { fill: 'none', stroke: col, 'stroke-width': 2.5 };
    el(pg, 'rect', { x, y: y - 15, width: 30, height: 30, rx: 7, ...s, 'stroke-width': 3 });
    if (i === 0) { el(pg, 'ellipse', { cx: x + 11, cy: y, rx: 6, ry: 4, ...s }); el(pg, 'ellipse', { cx: x + 19, cy: y, rx: 6, ry: 4, ...s }); }
    if (i === 1) { el(pg, 'line', { x1: x + 6, y1: y + 5, x2: x + 24, y2: y + 5, ...s }); [9, 15, 21].forEach((k) => el(pg, 'line', { x1: x + k, y1: y + 5, x2: x + k, y2: y - 4, ...s, 'stroke-width': 2 })); }
    if (i === 2) el(pg, 'path', { d: `M ${x + 6} ${y + 2} q 4.5 -8 9 0 t 9 0`, ...s, 'stroke-linecap': 'round' });
    return bar(pg, x + 38, y, 48, P.ink, 10);
  });
  [[0, 200], [14, 160], [28, 184]].forEach(([dy, w]) => bar(pg, -144, 0 + dy, w, P.dim, 8)); // not covered, crossed out
  el(pg, 'line', { x1: -152, y1: 36, x2: 70, y2: -8, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round' });
  [90, 144, 198].forEach((y, i) => { // scene dots on the left, each with its point
    el(pg, 'circle', { cx: -124, cy: y, r: 11, fill: P.ink });
    bar(pg, -90, y, [190, 140, 170][i]);
  });
  for (let i = 0; i < 2; i++) {
    const y1 = [90, 144][i] + 16, y2 = [144, 198][i] - 16;
    el(pg, 'line', { x1: -124, y1, x2: -124, y2, stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });
    el(pg, 'path', { d: `M -132 ${y2 - 8} L -124 ${y2} L -116 ${y2 - 8}`, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  }
  S.planLabel = label(W, 'the plan', { size: type.label }).at(330, 200);
  S.planArrow = arrow(W, 525, 480, 765, 480, { color: P.accent });

  // the fact sheet (centre): three tagged rows
  S.sheet = page(W).at(960, 480);
  S.sheetLabel = label(W, 'the fact sheet', { size: type.label }).at(960, 200);
  S.rows = ROW_Y.map((y) => {
    const g = el(W, 'g');
    bar(g, 890, y - 14, 220);
    bar(g, 890, y + 14, 150, P.dim);
    const slot = el(W, 'rect', { x: 808, y: y - 28, width: 56, height: 56, rx: 12, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 7' });
    return { g, slot };
  });
  const kinds = ['cited', 'measured', 'estimated'];
  S.tags = kinds.map((k, i) => tag(W, k).at(836, ROW_Y[i]));
  S.terms = kinds.map((k, i) => {
    const it = label(W, k, { size: type.label, color: k === 'cited' ? P.accent : k === 'measured' ? P.ink : P.dim });
    return it.at(760 - it.w / 2, ROW_Y[i]);
  });
  S.oneFile = chip(W, 'only this file', { color: P.accent }).at(960, 790);

  // the script (right) and the scenes under it
  S.script = page(W).at(1590, 480);
  for (let i = 0; i < 2; i++) {
    bar(S.script.g, -140, -170 + i * 190, 260, P.ink, 18);
    for (let j = 0; j < 3; j++) bar(S.script.g, -140, -120 + i * 190 + j * 36, 240 - j * 40, P.dim);
  }
  S.scriptLabel = label(W, 'the script', { size: type.label }).at(1590, 200);
  S.scriptArrow = arrow(W, 1155, 480, 1395, 480, { color: P.accent });
  // the scenes: the bible's film strip (a small rectangle with sprocket dots), named as spoken
  S.frames = new Item(W, 240, 80).at(1590, 760);
  el(S.frames.g, 'rect', { x: -120, y: -40, width: 240, height: 80, rx: 10, fill: 'none', stroke: P.ink, 'stroke-width': 3 });
  for (let i = 0; i < 8; i++) for (const y of [-30, 30]) el(S.frames.g, 'rect', { x: -106 + i * 28, y: y - 4, width: 12, height: 8, rx: 2, fill: P.ink });
  for (let i = 0; i < 3; i++) el(S.frames.g, 'rect', { x: -104 + i * 72, y: -18, width: 64, height: 36, rx: 4, fill: 'none', stroke: P.ink, 'stroke-width': 2 });
  S.framesLabel = label(W, 'the scenes', { size: type.note }).at(1590, 840);

  // notes beside the active row (left-aligned at x 1290)
  const notes = [
    [['public source', 'public'], ['the link', 'link'], ['the day read', 'day']],
    [['your own test', 'test'], ['how', 'how'], ['when', 'when'], ['how many runs', 'runs']],
    [['best guess', 'guess'], ['what it rests on', 'rests'], ['says “about”', 'about']],
  ];
  S.notes = notes.map((list, r) => list.map(([text, c], i) => {
    const color = r === 0 ? P.accent : r === 1 ? P.ink : P.dim;
    const stamp = c === 'day'; // the bible's date stamp: accent, a calendar mark, no digits
    const it = chip(W, text, { color, dashed: r === 2, padX: stamp ? 48 : 28 });
    if (stamp) {
      set(it.g.querySelector('text'), { x: 20 });
      const x = -it.w / 2 + 22;
      el(it.g, 'rect', { x, y: -12, width: 26, height: 24, rx: 4, fill: 'none', stroke: P.accent, 'stroke-width': 3 });
      el(it.g, 'line', { x1: x, y1: -4, x2: x + 26, y2: -4, stroke: P.accent, 'stroke-width': 3 });
    }
    return { it: it.at(1290 + it.w / 2, NOTE_Y[i]), cue: c };
  }));
  S.links = ROW_Y.map((y) => el(W, 'path', { d: `M 1150 ${y} C 1215 ${y}, 1215 ${NOTE_Y[0]}, 1280 ${NOTE_Y[0]}`, fill: 'none', stroke: P.dim, 'stroke-width': 3, opacity: 0 }));

  // the source page read through a magnifier, beside the cited row
  S.source = new Item(W, 300, 220).at(1460, 380);
  el(S.source.g, 'rect', { x: -150, y: -110, width: 300, height: 220, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.source.g, 'line', { x1: -150, y1: -70, x2: 150, y2: -70, stroke: P.dim, 'stroke-width': 3 });
  for (let i = 0; i < 3; i++) el(S.source.g, 'circle', { cx: -126 + i * 20, cy: -90, r: 5, fill: P.dim });
  for (let i = 0; i < 4; i++) bar(S.source.g, -120, -36 + i * 36, 240 - (i % 2) * 70, i === 1 ? P.accent : P.ink);
  S.sourceArrow = arrow(W, 1150, 350, 1295, 375, { color: P.accent });
  S.lens = new Item(W, 120, 120);
  el(S.lens.g, 'circle', { cx: 0, cy: 0, r: 44, fill: P.accent, 'fill-opacity': 0.08, stroke: P.accent, 'stroke-width': 6 });
  el(S.lens.g, 'line', { x1: 32, y1: 32, x2: 62, y2: 62, stroke: P.accent, 'stroke-width': 10, 'stroke-linecap': 'round' });
  S.stronger = chip(W, 'no stronger than source', { color: P.accent });

  // leads at the left edge, never lit
  S.leads = ['snippet', 'forum post', "model's answer"].map((txt, i) => { const b = bubble(W, txt); return b.at(300, 330 + i * 140); });
  S.leadTag = chip(W, 'a lead', { color: P.dim }).at(300, 745);

  // the closing sentence, fixed on screen
  S.final = label(stage.hud, 'A lead, not a source.', { size: 64 }).at(960, 840);
  S.cue = cue;
}

export function render(ctx, t) {
  const c = S.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  const out0 = c('cited') - 0.6; // plan, script and scenes leave as the rows take over
  const gone = (at) => 1 - ease.in(prog(t, at, 0.5));
  const endDim = steps(t, 1, [[c('snippet') - 0.2, 0.35]]);

  // the plan
  S.plan.show(reveal(t, c('plan')) * gone(out0)).dim(dimAfter(t, c('rule'), 0.35));
  S.planFacts.forEach((b) => set(b, { fill: t >= c('facts') ? P.accent : P.ink }));
  S.planLabel.show(reveal(t, c('plan')) * gone(out0)).dim(dimAfter(t, c('rule'), 0.35));
  S.planArrow.draw(ease.out(prog(t, c('facts') + 0.3, 1.4)), reveal(t, c('facts') + 0.3) * gone(out0) * dimAfter(t, c('rule'), 0.35));

  // the sheet stays; it dims while the script is spoken, comes back for "one file"
  const sheetDim = steps(t, 1, [[c('script'), 0.45], [c('onefile') - 0.1, 1], [c('snippet') - 0.2, 0.35]]);
  S.sheet.show(reveal(t, c('sheet'))).dim(sheetDim);
  S.sheetLabel.show(reveal(t, c('sheet'))).dim(steps(t, sheetDim, [[c('cited'), 0.5]]));
  S.oneFile.show(fadeBetween(t, c('onefile'), out0));

  // the script and the scenes
  const scriptDim = dimAfter(t, c('onefile'), 0.35);
  S.script.show(reveal(t, c('script') + 0.1) * gone(out0)).dim(scriptDim);
  S.scriptLabel.show(reveal(t, c('script') + 0.1) * gone(out0)).dim(scriptDim);
  S.scriptArrow.draw(ease.out(prog(t, c('script') + 0.2, 1.0)), reveal(t, c('script') + 0.2) * gone(out0) * scriptDim);
  S.frames.show(reveal(t, c('scenes')) * gone(out0)).dim(scriptDim);
  S.framesLabel.show(reveal(t, c('scenes') + 0.1) * gone(out0)).dim(scriptDim);

  // rows: bright while spoken, pushed back after; all bright again for "a marker is only as good"
  const rowCue = ['cited', 'measured', 'estimated'];
  const rowEnd = [c('measured'), c('estimated'), c('reading') - 0.6]; // estimated notes gone before the rows pulse
  const rowDim = [
    steps(t, 1, [[rowEnd[0], 0.35], [c('reading'), 1], [c('snippet') - 0.2, 0.35]]),
    steps(t, 1, [[rowEnd[1], 0.35], [c('reading'), 1], [c('read'), 0.35]]),
    steps(t, 1, [[c('read'), 0.35]]),
  ];
  const sheetA = reveal(t, c('sheet'));
  for (let i = 0; i < 3; i++) {
    const on = c(rowCue[i]);
    const pulse = 1 + 0.15 * Math.sin(Math.PI * prog(t, c('reading') + i * 0.25, 0.7));
    set(S.rows[i].g, { opacity: +(sheetA * Math.min(rowDim[i], sheetDim)).toFixed(3) });
    set(S.rows[i].slot, { opacity: +(reveal(t, c('marker') + i * 0.2) * (1 - reveal(t, on, 0.3)) * endDim).toFixed(3) });
    S.tags[i].show(reveal(t, on, 0.4)).dim(rowDim[i]).at(836, ROW_Y[i], ease.back(prog(t, on, 0.5)) * pulse);
    S.terms[i].show(reveal(t, on + 0.1)).dim(rowDim[i]);
    const notesOut = rowEnd[i];
    const list = S.notes[i];
    list.forEach((n, j) => {
      const next = list[j + 1] ? c(list[j + 1].cue) : notesOut;
      n.it.show(reveal(t, c(n.cue), 0.4) * gone(notesOut)).dim(dimAfter(t, next, 0.45));
    });
    set(S.links[i], { opacity: +(reveal(t, c(list[0].cue)) * gone(notesOut) * 0.8).toFixed(3) });
  }

  // read the source itself: the source page opens beside the cited row, a lens passes over it
  const srcDim = steps(t, 1, [[c('snippet') - 0.2, 0.35]]);
  S.source.show(reveal(t, c('read'), 0.6)).dim(srcDim).at(1460, 380, lerp(0.6, 1, ease.out(prog(t, c('read'), 0.6))));
  S.sourceArrow.draw(ease.out(prog(t, c('read'), 0.8)), reveal(t, c('read')) * srcDim);
  const sweep = ease.inOut(prog(t, c('read') + 0.4, 2.6));
  S.lens.show(reveal(t, c('read') + 0.3)).dim(srcDim).at(1380 + 150 * sweep, 360 + 40 * Math.sin(sweep * Math.PI));
  S.stronger.show(reveal(t, c('stronger'), 0.5)).dim(srcDim).at(1460, lerp(640, 570, ease.out(prog(t, c('stronger'), 0.7))));

  // leads: dim speech bubbles at the edge, marked "a lead"
  ['snippet', 'forum', 'model'].forEach((k, i) => S.leads[i].show(reveal(t, c(k)) * 0.35));
  S.leadTag.show(reveal(t, c('lead')) * 0.35); // a lead is never lit
  S.final.show(reveal(t, c('notsource')));
}
