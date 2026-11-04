// Scene 06: the critic. The script page in the middle, its three inputs (fact sheet, plan, script) as a small stack on the left,
// a read-only reviewer with a magnifier on the right that circles a bold claim bar in magenta, checks for private things,
// and ends with a thesis bar beneath the page and a verdict stamp: fix first.
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, curve, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'page', at: 'Smooth bridges' },
    { name: 'claim', at: 'claim is true' },
    { name: 'true', at: 'is true' },
    { name: 'critic', at: 'the critic, checks' },
    { name: 'checks', at: 'checks exactly' },
    { name: 'model', at: 'AI model' },
    { name: 'attack', at: 'attack what' },
    { name: 'three', at: 'three things' },
    { name: 'script', at: 'script, the fact' },
    { name: 'sheet', at: 'fact sheet, and' },
    { name: 'plan', at: 'plan if' },
    { name: 'list', at: 'list of facts' },
    { name: 'sources', at: 'with sources' },
    { name: 'allowed', at: 'allowed to use' },
    { name: 'every', at: 'Every claim' },
    { name: 'behind', at: 'behind it' },
    { name: 'wrong', at: 'wrong claim' },
    { name: 'back', at: 'cannot take back' },
    { name: 'oncepub', at: 'it is public' },
    { name: 'strongly', at: 'stated more strongly' },
    { name: 'nothing', at: 'and nothing' },
    { name: 'source', at: 'its source' },
    { name: 'also', at: 'also looks' },
    { name: 'private', at: 'anything private' },
    { name: 'machine', at: 'a machine' },
    { name: 'address', at: 'an address' },
    { name: 'name', at: 'or a' },
    { name: 'public', at: 'public the moment' },
    { name: 'ends', at: 'It ends' },
    { name: 'thesis', at: 'the thesis' },
    { name: 'verdict', at: 'a verdict' },
    { name: 'ready', at: 'ready to record' },
    { name: 'fix', at: 'fix first' },
    { name: 'helped', at: 'helped you write' },
    { name: 'newconv', at: 'new conversation' },
    { name: 'writer', at: 'a writer' },
    { name: 'gaps', at: 'own gaps' },
    { name: 'read', at: 'only read' },
    { name: 'reports', at: 'reports problems' },
    { name: 'final', at: 'instead of' },
    { name: 'rewriting', at: 'quietly rewriting' },
  ],
};

const PX = 860, PY = 440;            // the script page centre (360 x 470)
const CLAIM = { x: 898, y: 462 };    // centre of the bold claim bar (world)
const CX = 1420, CY = 400;           // the critic
const REST = { x: 1300, y: 445 };    // where the critic holds the magnifier
const PRIV_X = 210, PRIV_Y = 380;   // the private-items list (left, where the stack was)
const STACK_X = 290, STACK_Y = [230, 455, 680], SMALL = 0.42;

const bar = (g, x, y, w, color = P.ink, h = 12) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color });
const steps = (t, v0, list) => list.reduce((v, [at, to]) => lerp(v, to, ease.inOut(prog(t, at, 0.6))), v0);

/** A page: 360 x 470, rx 24, bg2 fill, 4 px dim outline (series vocabulary). */
function page(parent, dashed = false) {
  const it = new Item(parent, 360, 470);
  el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4, ...(dashed ? { 'stroke-dasharray': '18 12' } : {}) });
  return it;
}
/** The script's interior: three heading bars down the left edge, text bars to their right. Returns the parts. */
function scriptInside(g, claimBold = false) {
  const parts = { heads: [], text: [] };
  [-165, -10, 145].forEach((y, s) => {
    parts.heads.push(bar(g, -152, y, 56, P.ink, 22));
    [0, 32, 64].forEach((dy, i) => {
      const bold = claimBold && s === 1 && i === 1;
      const b = bar(g, -76, y + dy, bold ? 228 : [228, 200, 150][i], bold ? P.ink : P.dim, bold ? 22 : 12);
      if (bold) parts.claim = b; else parts.text.push(b);
    });
  });
  return parts;
}
/** The fact sheet's three rows; returns the row groups and the link-tag group (lit at "sources"). */
function factInside(g0) {
  const rows = [], links = [];
  [-140, 0, 140].forEach((y, i) => {
    const row = el(g0, 'g', {}); rows.push({ g: row, y });
    const col = [P.accent, P.ink, P.dim][i];
    const s = { fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const g = i === 0 ? el(row, 'g', {}) : row;
    if (i === 0) links.push(g);
    el(g, 'rect', { x: -150, y: y - 34, width: 68, height: 68, rx: 14, fill: col, 'fill-opacity': 0.12, stroke: col, 'stroke-width': 5 });
    if (i === 0) { el(g, 'rect', { x: -138, y: y - 8, width: 28, height: 16, rx: 8, ...s }); el(g, 'rect', { x: -122, y: y - 8, width: 28, height: 16, rx: 8, ...s }); }
    if (i === 1) { el(g, 'rect', { x: -140, y: y - 10, width: 48, height: 20, rx: 3, ...s }); [-130, -120, -110, -100].forEach((x) => el(g, 'line', { x1: x, x2: x, y1: y - 10, y2: y - 2, ...s, 'stroke-width': 3 })); }
    if (i === 2) el(g, 'path', { d: `M -138 ${y + 4} q 11 -16 22 0 t 22 0`, ...s });
    bar(row, -60, y - 14, 200, P.ink, 16);
    bar(row, -60, y + 16, 140, P.dim, 14);
  });
  return { rows, link: links[0] };
}
function planInside(g) {
  bar(g, -144, -180, 288, P.accent, 22); // thesis
  el(g, 'circle', { cx: -126, cy: -112, r: 14, fill: P.dim }); // viewer
  el(g, 'rect', { x: -146, y: -94, width: 40, height: 24, rx: 12, fill: P.dim });
  [10, 90, 170].forEach((y, i) => { el(g, 'circle', { cx: -124, cy: y, r: 16, fill: P.ink }); bar(g, -86, y, [210, 160, 190][i], P.ink, 14); });
}
/** The neutral figure (about 216 px tall): dim head, two small ear arcs, rounded body. `pencil` makes it a writer (ink). */
function figure(parent, { pencil = false } = {}) {
  const it = new Item(parent, 160, 216);
  const col = pencil ? P.ink : P.dim;
  el(it.g, 'circle', { cx: 0, cy: -70, r: 36, fill: P.bg2, stroke: col, 'stroke-width': 5 });
  const ears = [-1, 1].map((s) => el(it.g, 'path', { d: `M ${s * 36} -82 q ${s * 14} 12 0 24`, fill: 'none', stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round' }));
  el(it.g, 'path', { d: 'M -72 108 L -72 18 Q -72 -24 -30 -24 L 30 -24 Q 72 -24 72 18 L 72 108 Z', fill: P.bg2, stroke: col, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  if (pencil) {
    const pg = el(it.g, 'g', { transform: 'translate(92 10) rotate(30)' });
    el(pg, 'rect', { x: -9, y: -54, width: 18, height: 84, rx: 4, fill: 'none', stroke: P.ink, 'stroke-width': 5 });
    el(pg, 'path', { d: 'M -9 30 L 0 52 L 9 30', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  }
  it.ears = ears;
  return it;
}

let S;
export function setup(ctx) {
  const c = ctx.cue;
  const stage = makeStage(ctx.svg, [
    { cue: 'three', delay: 0.2, dur: 1.6, x: 880, y: 480, z: 1.04 },
    { cue: 'every', delay: 0, dur: 1.6, x: 1010, y: 480, z: 1.04 },
    { cue: 'also', delay: 0.4, dur: 1.6, x: 900, y: 480, z: 1 },
    { cue: 'ends', delay: 0.2, dur: 1.6, x: 960, y: 510, z: 1.03 },
    { cue: 'helped', delay: 0, dur: 1.6, x: 900, y: 460, z: 1.03 },
    { cue: 'reports', delay: 0, dur: 1.4, x: 960, y: 540, z: 1 },
  ], c);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage, c };

  // ---- the stack of three small pages (fact sheet, plan, script), drawn at the page's own proportions ----
  // "three things": three empty outlines first, each filled as it is named
  S.slots = STACK_Y.map((y) => page(W).at(STACK_X, y, SMALL));
  S.small = ['sheet', 'plan', 'script'].map((k, i) => {
    const it = page(W, k === 'plan').at(STACK_X, STACK_Y[i], SMALL);
    if (k === 'sheet') S.fact = factInside(it.g); else if (k === 'plan') planInside(it.g); else scriptInside(it.g);
    const lab = label(W, k === 'sheet' ? 'fact sheet' : k, { size: type.note, color: P.ink });
    lab.at(STACK_X + 100 + lab.w / 2, STACK_Y[i]);
    return { it, lab, k };
  });
  S.allowed = curve(W, 382, 300, 672, 380, { bend: 30, color: P.accent }); // from the sheet's right edge, below its label

  // ---- the script page ----
  S.page = page(W).at(PX, PY);
  S.inside = scriptInside(S.page.g, true);
  // "no stronger than its source": a dashed accent underline as far as the source reaches, the overreach tinted hot
  S.srcLine = el(S.page.g, 'line', { x1: -76, y1: 42, x2: 64, y2: 42, stroke: P.accent, 'stroke-width': 5, 'stroke-dasharray': '14 10', 'stroke-linecap': 'round', opacity: 0 });
  S.over = el(S.page.g, 'path', { d: 'M 64 11 L 141 11 A 11 11 0 0 1 141 33 L 64 33 Z', fill: P.hot, opacity: 0 });
  S.plank = chip(S.page.g, 'because', { fill: P.accent }).at(30, -55);
  S.gapQ = label(W, '?', { size: type.label, color: P.hot }).at(900, 540);
  S.trueQ = label(W, '?', { size: type.label, color: P.dim }).at(1082, CLAIM.y);
  // link tags: a solid one behind a healthy bar; beside the claim only an empty dashed slot (a weak dashed source arrives later)
  const linkTag = (dashed) => {
    const it = new Item(W, 56, 56);
    const d = dashed ? { 'stroke-dasharray': '8 6' } : {};
    if (!dashed) el(it.g, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: P.accent, 'fill-opacity': 0.12, stroke: P.accent, 'stroke-width': 3 });
    el(it.g, 'rect', { x: -19, y: -6, width: 24, height: 12, rx: 6, fill: 'none', stroke: P.accent, 'stroke-width': 3, transform: 'rotate(-45) translate(-4 0)', ...d });
    el(it.g, 'rect', { x: -5, y: -6, width: 24, height: 12, rx: 6, fill: 'none', stroke: P.accent, 'stroke-width': 3, transform: 'rotate(-45) translate(4 0)', ...d });
    return it;
  };
  S.tag = linkTag(false).at(1082, PY - 165);
  S.slot = new Item(W, 56, 56).at(1082, CLAIM.y);
  el(S.slot.g, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
  S.weak = linkTag(true).at(1082, CLAIM.y);
  // the magenta ring drawn around the claim bar
  S.ring = el(W, 'ellipse', { cx: CLAIM.x, cy: CLAIM.y, rx: 140, ry: 34, fill: 'none', stroke: P.hot, 'stroke-width': 6, opacity: 0 });
  S.ringLen = 2 * Math.PI * Math.sqrt((140 * 140 + 34 * 34) / 2);

  // ---- thesis bar beneath the page ----
  S.thesis = new Item(W, 360, 24).at(PX, 722);
  bar(S.thesis.g, -180, 0, 360, P.accent, 24);
  S.heard = label(W, 'as it heard it', { size: type.note, color: P.ink }).at(PX, 776);

  // ---- the writer (left, later) ----
  S.writer = figure(W, { pencil: true }).at(330, 400);
  S.writerLab = label(W, 'a writer', { size: type.label }).at(330, 580);

  // ---- the critic (right): a read-only reviewer ----
  S.frame = el(W, 'rect', { x: 1235, y: 250, width: 370, height: 350, rx: 30, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-dasharray': '16 12', opacity: 0 });
  S.newconv = chip(W, 'a new conversation', { color: P.accent }).at(CX, 190);
  S.critic = figure(W).at(CX, CY);
  S.criticLab = label(W, 'the critic', { size: type.label }).at(CX, 568);
  // ONE magnifier, held at the front on the figure's right (as in scene 08); hot-ringed while it circles the claim
  el(S.critic.g, 'line', { x1: 78, y1: 24, x2: 58, y2: 48, stroke: P.ink, 'stroke-width': 7, 'stroke-linecap': 'round' });
  el(S.critic.g, 'circle', { cx: 94, cy: 6, r: 24, fill: P.bg, 'fill-opacity': 0.5, stroke: P.ink, 'stroke-width': 5 });
  S.magHot = el(S.critic.g, 'circle', { cx: 94, cy: 6, r: 24, fill: 'none', stroke: P.hot, 'stroke-width': 6, opacity: 0 });
  S.sight = el(W, 'path', { fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 10', 'stroke-linecap': 'round', opacity: 0 });
  S.reportLine = el(W, 'line', { x1: 938, y1: 532, x2: 1340, y2: 470, stroke: P.hot, 'stroke-width': 4, 'stroke-dasharray': '2 12', 'stroke-linecap': 'round', opacity: 0 });
  S.onlyRead = chip(W, 'only read', { color: P.ink }).at(CX, 190);
  // a pencil it does not use: crossed out, bright on "rewriting"
  S.noPencil = new Item(W, 120, 120).at(1270, 440); // beside the critic's free (left) hand
  const np = el(S.noPencil.g, 'g', { transform: 'rotate(30)' });
  el(np, 'rect', { x: -9, y: -48, width: 18, height: 74, rx: 4, fill: 'none', stroke: P.ink, 'stroke-width': 5 });
  el(np, 'path', { d: 'M -9 26 L 0 46 L 9 26', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(S.noPencil.g, 'path', { d: 'M -40 -40 L 40 40 M 40 -40 L -40 40', stroke: P.ink, 'stroke-width': 6, 'stroke-linecap': 'round' });

  // right column, one group at a time under the critic
  S.model = chip(W, 'an AI model', { color: P.ink }).at(CX, 650);
  S.attack = chip(W, 'attack', { color: P.ink }).at(CX, 740);
  S.takeBack = chip(W, 'cannot take back', { color: P.ink }).at(PX, 740); // under the page: it belongs to the claim
  S.privRows = [['a machine', 'machine'], ['an address', 'address'], ["a person's name", 'name']].map(([txt, cue], i) => {
    const y = PRIV_Y + i * 70;
    const icon = new Item(W, 52, 52).at(PRIV_X, y);
    const s = { fill: 'none', stroke: P.hot, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    if (i === 0) { el(icon.g, 'rect', { x: -22, y: -18, width: 44, height: 30, rx: 5, ...s }); el(icon.g, 'line', { x1: -12, y1: 22, x2: 12, y2: 22, ...s }); }
    if (i === 1) { el(icon.g, 'path', { d: 'M 0 24 C -22 0, -18 -22, 0 -22 C 18 -22, 22 0, 0 24 Z', ...s }); el(icon.g, 'circle', { cx: 0, cy: -6, r: 6, ...s }); }
    if (i === 2) { el(icon.g, 'rect', { x: -24, y: -16, width: 48, height: 32, rx: 6, ...s }); el(icon.g, 'circle', { cx: -10, cy: -2, r: 6, ...s }); el(icon.g, 'line', { x1: 2, y1: -2, x2: 16, y2: -2, ...s }); }
    const lab = label(W, txt, { size: type.note, color: P.ink });
    lab.at(PRIV_X + 40 + lab.w / 2, y);
    return { icon, lab, cue, y };
  });
  const privR = Math.max(...S.privRows.map((r) => r.lab.x + r.lab.w / 2)) + 22;
  S.privFrame = el(W, 'rect', { x: PRIV_X - 46, y: PRIV_Y - 44, width: privR - PRIV_X + 46, height: 228, rx: 24, fill: 'none', stroke: P.ink, 'stroke-width': 3, 'stroke-dasharray': '12 10', opacity: 0 });
  S.public = chip(W, 'public', { color: P.ink });
  S.public.at((PRIV_X - 46 + privR) / 2, PRIV_Y + 250);
  S.ready = chip(W, 'ready to record', { color: P.dim, dashed: true }).at(CX, 655);
  S.stamp = new Item(W, 260, 84).at(CX, 748);
  el(S.stamp.g, 'rect', { x: -130, y: -42, width: 260, height: 84, rx: 20, fill: 'none', stroke: P.ink, 'stroke-width': 5 });
  el(S.stamp.g, 'rect', { x: -120, y: -32, width: 240, height: 64, rx: 14, fill: 'none', stroke: P.ink, 'stroke-width': 2 });
  el(S.stamp.g, 'text', { x: 0, y: 17, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 48, 'font-weight': 800, fill: P.ink }, 'fix first');

  S.final = label(stage.hud, 'every claim needs a fact behind it', { size: 64 }).at(960, 840);
}

/** Where the critic is looking at time t (the sight line's end). */
function lensPos(t, c) {
  const glide = (a, b, t0, d = 1) => { const k = ease.inOut(prog(t, t0, d)); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; };
  const right = { x: CLAIM.x + 140, y: CLAIM.y };
  const onClaim = { x: CLAIM.x + 40, y: CLAIM.y };
  const scan = { x: 900, y: 618 };
  const loop = c('attack');
  if (t < loop) return right;
  if (t < loop + 1.6) { // once around the claim bar, from its right end
    const a = ease.inOut(prog(t, loop, 1.6)) * 2 * Math.PI;
    return { x: CLAIM.x + 140 * Math.cos(a), y: CLAIM.y - 34 * Math.sin(a) };
  }
  if (t < c('every')) return right;
  if (t < c('also')) return glide(right, onClaim, c('every'), 1.0);
  const p = glide(onClaim, scan, c('also'), 1.0);
  const k = prog(t, c('also') + 1.0, 0.4);
  return { x: p.x + 70 * Math.sin((t - c('also')) * 1.3) * k, y: p.y };
}

const pulse = (t, at, dur = 0.6) => Math.sin(Math.PI * prog(t, at, dur));

export function render(ctx, t) {
  const c = S.c;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const fin = c('final');
  const dF = dimAfter(t, fin, 0.3); // at the end phrase only it, the thesis and the crossed pencil stay bright

  // the script page: bright at the start and while its claim or verdict is the subject
  const pageDim = steps(t, 1, [[c('three'), 0.55], [c('every'), 1], [c('fix') + 0.5, 0.75], [c('helped'), 0.6], [c('gaps'), 1]]);
  S.page.show(reveal(t, c('page'))).dim(pageDim * dF);
  S.plank.show(1).dim(steps(t, 1, [[c('claim'), 0.45]]));
  // the claim bar itself never changes (the critic does not rewrite); the source's reach is drawn under it, the overreach tinted hot
  set(S.inside.claim, { opacity: steps(t, 0.5, [[c('claim'), 1]]).toFixed(3) });
  set(S.srcLine, { opacity: reveal(t, c('strongly')).toFixed(3) });
  set(S.over, { opacity: reveal(t, c('source'), 0.5).toFixed(3) });
  S.trueQ.show(fadeBetween(t, c('true'), c('critic'))).dim(1);
  // "needs a fact behind it": an empty dashed slot by the claim; a healthy bar gets a solid tag
  const tagD = steps(t, 1, [[c('wrong'), 0.45], [c('also'), 0.35]]) * dF;
  S.slot.show(reveal(t, c('every') + 0.3) * (1 - reveal(t, c('strongly'), 0.4))).dim(tagD).at(1082, CLAIM.y, 1 + 0.15 * pulse(t, c('behind') + 0.6));
  S.tag.show(reveal(t, c('behind'))).dim(tagD).at(1082, PY - 165, 1 + 0.2 * pulse(t, c('behind'), 0.6));
  S.weak.show(reveal(t, c('strongly'), 0.4)).dim(steps(t, 1, [[c('also'), 0.35]]) * dF).at(1082, CLAIM.y, 1 + 0.2 * pulse(t, c('source')));
  S.gapQ.show(reveal(t, c('gaps'))).dim(steps(t, 1, [[c('read'), 0.6], [c('reports'), 1]]) * dF).at(900, 540, 1 + 0.3 * pulse(t, c('reports'), 0.7));
  set(S.reportLine, { opacity: (fadeBetween(t, c('reports'), fin, 0.3) * 0.8).toFixed(3) });

  // magenta ring: drawn once as the magnifier circles the claim
  const rp = ease.inOut(prog(t, c('attack'), 1.6));
  const ringA = steps(t, 1, [[c('three'), 0.4], [c('every'), 1], [c('also'), 0.45], [c('reports'), 1]]) * dF;
  set(S.ring, {
    opacity: (rp > 0 ? ringA : 0).toFixed(3),
    'stroke-dasharray': `${S.ringLen.toFixed(1)} ${S.ringLen.toFixed(1)}`,
    'stroke-dashoffset': (S.ringLen * (1 - rp)).toFixed(1),
    'stroke-width': (6 + 4 * fadeBetween(t, c('wrong'), c('back')) + 4 * pulse(t, c('reports'), 0.7)).toFixed(2),
  });

  // the stack of inputs
  const stackOut = 1 - ease.in(prog(t, c('also'), 0.6));
  const inAt = { script: c('script'), sheet: c('sheet'), plan: c('plan') };
  S.small.forEach(({ it, lab, k }, i) => {
    const a = reveal(t, inAt[k]) * stackOut;
    S.slots[i].show(reveal(t, c('three')) * (1 - reveal(t, inAt[k], 0.4)) * stackOut).dim(0.5);
    const d = k === 'sheet'
      ? steps(t, 1, [[c('plan'), 0.45], [c('list'), 1], [c('every') + 1, 0.45]])
      : steps(t, 1, [[inAt[k] + (k === 'script' ? 0.9 : 1.2), 0.45]]);
    const pop = 1 + 0.12 * ease.out(prog(t, c('list'), 0.6)) * (k === 'sheet' ? 1 : 0) * (1 - ease.inOut(prog(t, c('every'), 0.8)));
    it.show(a).dim(k === 'plan' ? d * 0.8 : d).at(STACK_X, STACK_Y[i], SMALL * pop);
    lab.show(a).dim(d);
  });
  // the fact rows pulse one by one at "list of facts"; the link tag lights up at "sources"
  S.fact.rows.forEach(({ g, y }, i) => {
    const s = 1 + 0.12 * pulse(t, c('list') + i * 0.2, 0.5);
    set(g, { transform: `translate(0 ${y}) scale(${s.toFixed(4)}) translate(0 ${-y})` });
  });
  const ls = 1 + 0.25 * pulse(t, c('sources'), 0.6);
  set(S.fact.link, { opacity: lerp(0.3, 1, reveal(t, c('sources'), 0.3)).toFixed(3), transform: `translate(-116 -140) scale(${ls.toFixed(4)}) translate(116 140)` });
  S.allowed.draw(ease.out(prog(t, c('allowed'), 0.9)), fadeBetween(t, c('allowed'), c('also')) * dimAfter(t, c('every') + 1, 0.4));

  // thesis and verdict
  S.thesis.show(reveal(t, c('thesis'))).dim(steps(t, 1, [[c('verdict'), 0.6], [fin, 1]]));
  S.heard.show(fadeBetween(t, c('thesis') + 0.5, c('helped'))).dim(dimAfter(t, c('verdict'), 0.5));
  S.ready.show(fadeBetween(t, c('ready'), c('read'))).dim(steps(t, 1, [[c('fix'), 0.35]]));
  const st = ease.back(prog(t, c('fix'), 0.5));
  // the stamp rises clear of the end phrase once "ready to record" has gone
  S.stamp.show(prog(t, c('fix'), 0.2)).at(CX, lerp(748, 712, ease.inOut(prog(t, fin, 0.6))), lerp(1.3, 1, st)).dim(steps(t, 1, [[c('helped'), 0.55], [fin, 0.35]]));

  // the writer: a new conversation for the critic
  S.writer.show(reveal(t, c('helped'))).dim(steps(t, 1, [[c('newconv'), 0.5], [c('writer'), 1], [c('gaps') + 0.4, 0.4]]) * dF);
  S.writerLab.show(reveal(t, c('writer'))).dim(dimAfter(t, c('gaps') + 0.4, 0.4) * dF);
  const fr = fadeBetween(t, c('newconv'), c('read') - 0.2);
  set(S.frame, { opacity: (fr * dimAfter(t, c('writer'), 0.5)).toFixed(3) });
  S.newconv.show(fr).dim(dimAfter(t, c('writer'), 0.5));
  S.onlyRead.show(reveal(t, c('read') + 0.3)).dim(dF);
  S.noPencil.show(reveal(t, c('rewriting'), 0.4)).dim(1);

  // the critic, its hand magnifier, and the big lens tied to it while it works on the page
  S.critic.show(reveal(t, c('critic'))).dim(steps(t, 1, [[c('helped'), 0.7], [c('newconv'), 1]]) * dF);
  S.criticLab.show(reveal(t, c('critic'))).dim(dF);
  const lp = lensPos(t, c);
  const lv = fadeBetween(t, c('checks'), c('three') - 0.4) + fadeBetween(t, c('every'), c('ends'));
  // sight line from the held magnifier, arched above the tags, ending just short of what it looks at
  const hx = CX + 94, hy = CY + 6 - 26, qx = (hx + lp.x) / 2, qy = Math.min(hy, lp.y) - 150;
  const ex = lp.x - qx, ey = lp.y - qy, el2 = Math.hypot(ex, ey), sk = (el2 - 26) / el2;
  set(S.sight, { d: `M ${hx} ${hy} Q ${qx.toFixed(1)} ${qy.toFixed(1)} ${(qx + ex * sk).toFixed(1)} ${(qy + ey * sk).toFixed(1)}`, opacity: (lv * 0.7 * dF).toFixed(3) });
  const hotOn = fadeBetween(t, c('attack'), c('three') - 0.4, 0.3) + fadeBetween(t, c('every'), c('also'), 0.3);
  set(S.magHot, { opacity: hotOn.toFixed(3) });

  // right column groups
  S.model.show(fadeBetween(t, c('model'), c('three') - 0.5)).dim(dimAfter(t, c('attack'), 0.45));
  S.attack.show(fadeBetween(t, c('attack'), c('three') - 0.5));
  S.takeBack.show(fadeBetween(t, c('back'), c('nothing'))).at(PX, 740, 1 + 0.12 * pulse(t, c('oncepub') + 0.4, 0.6));
  // each private item lifts out of the block the critic is looking at, then settles in the list
  S.privRows.forEach(({ icon, lab, cue, y }) => {
    const a = fadeBetween(t, c(cue), c('ends') - 0.4, 0.3);
    const d = dimAfter(t, c(cue) + 1.1, 0.5) * dimAfter(t, c('public'), 0.8);
    const from = lensPos(c(cue), c), m = ease.inOut(prog(t, c(cue) + 0.2, 0.7));
    icon.show(a).dim(d).at(lerp(from.x, PRIV_X, m), lerp(from.y, y, m), lerp(0.6, 1, m));
    lab.show(reveal(t, c(cue) + 0.8, 0.4) * a).dim(d);
  });
  const pub = fadeBetween(t, c('public'), c('ends') - 0.4);
  set(S.privFrame, { opacity: pub.toFixed(3) });
  S.public.show(pub);

  S.final.show(reveal(t, fin + 0.2, 0.8));
}
