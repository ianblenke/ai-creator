// Scene 07: the flow review. The critic reads the script as a page and misses the jumps; a viewer's comment brings in a
// second reviewer, the flow review: a listener with lit ears and a magnifier that hears the script once (headings and notes
// crossed out). For a gap it pops a card through its magnifier: two quoted bars, a severity chip and a bridge. Then a
// second list: a term used early and a reference back.
import { palette as P, font, el, set, ease, prog, lerp } from 'style';
import { type, label, chip, curve, arrow, flow, glow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'critic', at: 'But the critic' },
    { name: 'page', at: 'as a page' },
    { name: 'hid', at: 'my jumps hid' },
    { name: 'viewer', at: 'that viewer heard' },
    { name: 'comment', at: 'That comment' },
    { name: 'second', at: 'second reviewer exists' },
    { name: 'critic2', at: 'critic does check' },
    { name: 'opens', at: 'check how each scene opens' },
    { name: 'you', at: 'but you will' },
    { name: 'miss', at: 'probably miss jumps' },
    { name: 'know', at: 'already know why' },
    { name: 'follows', at: 'topic follows the other' },
    { name: 'so', at: 'So the second reviewer' },
    { name: 'flow', at: 'the flow review' },
    { name: 'model', at: 'AI model' },
    { name: 'only', at: 'may only' },
    { name: 'listener', at: 'act as a listener' },
    { name: 'start', at: 'from start to finish' },
    { name: 'headings', at: 'cannot see your headings' },
    { name: 'notes', at: 'notes in the script' },
    { name: 'draw', at: 'what to draw' },
    { name: 'abrupt', at: 'every abrupt change' },
    { name: 'last', at: 'the last sentence before' },
    { name: 'beforeW', at: 'before and the first' },
    { name: 'after', at: 'the first after' },
    { name: 'severity', at: 'gives a severity' },
    { name: 'high', at: 'of high' },
    { name: 'medium', at: 'medium or low' },
    { name: 'low', at: 'or low' },
    { name: 'bridge', at: 'suggests a bridge' },
    { name: 'terms', at: 'lists terms' },
    { name: 'refs', at: 'references back' },
    { name: 'fin', at: 'something you never said' },
    { name: 'never', at: 'never said' },
    { name: 'said', at: 'said' },
  ],
};

let S;
// the script page (360 x 470), same size as every scene
const PX = 650, PY = 450, L = PX - 180, R = PX + 180, T = PY - 235, IN = L + 30, TX = IN + 95, TR = L + 330;
const BLOCKS = [262, 428, 594]; // first row of each topic block; the gaps sit between them
const GAPS = [376, 546];
const CRIT = { x: 260, y: 470 }; // the critic, left of the page, magnifier towards it
const FIG = { x: 1080, y: 470 }; // the second reviewer = the flow review
const SIDE = { x: 1570, y: 470 }; // the viewer, then the writer
const LENS = { x: FIG.x + 90, y: FIG.y + 6 }; // the series magnifier: held at the front of the body, on the right

const txt = (g, x, y, s, size, color, anchor = 'middle') =>
  el(g, 'text', { x, y: y + size * 0.35, 'text-anchor': anchor, 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: color }, s);
const bar = (g, x, y, w, h, color) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color });
// 0.35 outside the given [in, out] windows, 1 inside (spotlight)
const spot = (t, ...wins) => 0.35 + 0.65 * Math.max(...wins.map(([a, b]) => fadeBetween(t, a, b)));

// the series figure (about 220 px tall, as in scene 08): circle head over a flat-topped body with square shoulders, two ear
// arcs (dim unless listening); a reviewer holds the magnifier at the front of its body on the right, a writer the pencil on its right
function figure(parent, { mag = false, pencil = false, color = P.dim } = {}) {
  const it = new Item(parent, 240, 230);
  const g = it.g;
  el(g, 'path', { d: 'M -62 110 L -62 0 Q -62 -34 -28 -34 L 28 -34 Q 62 -34 62 0 L 62 110 Z', fill: P.bg2, stroke: color, 'stroke-width': 5 });
  el(g, 'circle', { cx: 0, cy: -76, r: 34, fill: P.bg2, stroke: color, 'stroke-width': 5 });
  it.ears = [el(g, 'path', { d: 'M -40 -90 Q -54 -76 -40 -62 M 40 -90 Q 54 -76 40 -62', fill: 'none', stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round' })];
  if (mag) {
    el(g, 'line', { x1: 74, y1: 24, x2: 54, y2: 48, stroke: P.ink, 'stroke-width': 7, 'stroke-linecap': 'round' });
    el(g, 'circle', { cx: 90, cy: 6, r: 24, fill: P.bg, 'fill-opacity': 0.5, stroke: P.ink, 'stroke-width': 5 });
  }
  if (pencil) el(g, 'path', { d: 'M 52 42 L 102 -18 L 114 -8 L 64 52 Z M 52 42 L 46 64 L 64 52', fill: P.bg2, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  return it;
}
function tick(parent, color = P.accent) {
  const it = new Item(parent, 44, 40);
  el(it.g, 'path', { d: 'M -18 0 L -5 13 L 18 -14', fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return it;
}
// hidden headings: an ink X (canon, as in scene 03), with a bg2 underlay so it reads over an ink bar
function cross(parent, x, y, r) {
  const g = el(parent, 'g', { opacity: 0 });
  const d = `M ${x - r} ${y - r} L ${x + r} ${y + r} M ${x + r} ${y - r} L ${x - r} ${y + r}`;
  el(g, 'path', { d, stroke: P.bg2, 'stroke-width': 12, 'stroke-linecap': 'round' });
  el(g, 'path', { d, stroke: P.ink, 'stroke-width': 6, 'stroke-linecap': 'round' });
  return g;
}
// a drawn opening quote mark (two filled dots with tails), about 48 px tall
function quoteMark(g, x, y, color) {
  [0, 26].forEach((dx) => {
    el(g, 'circle', { cx: x + dx, cy: y + 10, r: 11, fill: color });
    el(g, 'path', { d: `M ${x + dx - 10} ${y + 12} Q ${x + dx - 12} ${y - 18} ${x + dx + 8} ${y - 26}`, fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round' });
  });
}

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'hid', dur: 1.6, x: 920, y: 490, z: 1.02 },
      { cue: 'second', dur: 1.4, x: 940, y: 470, z: 1 },
      { cue: 'miss', dur: 1.6, x: 930, y: 500, z: 1.02 },
      { cue: 'so', dur: 1.6, x: 880, y: 480, z: 1.04 },
      { cue: 'abrupt', dur: 1.6, x: 965, y: 470, z: 1 },
      { cue: 'terms', dur: 1.4, x: 965, y: 500, z: 1 },
      { cue: 'said', dur: 0.9, x: 960, y: 540, z: 0.97 },
    ], c),
  };
  const w = S.stage.world;

  // ---- the script page: three topic blocks, a heading bar on the left of each, gaps between ----
  S.page = new Item(w, 360, 470);
  const pg = S.page.g;
  el(pg, 'rect', { x: L, y: T, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.body = el(pg, 'g', {});
  const widths = [[205, 180, 150], [205, 170, 0], [190, 205, 120]];
  BLOCKS.forEach((y, b) => {
    bar(S.body, IN, y, 70, 22, P.ink);
    widths[b].forEach((bw, r) => {
      if (b === 0 && r === 2) return; // the quoted "last before"
      if (b === 1 && r === 0) return; // the quoted "first after"
      if (bw) bar(S.body, TX, y + r * 28, bw, 12, P.ink);
    });
  });
  // the animator's note: a dashed box in the second block, never spoken (kept dim until "notes")
  S.note = el(pg, 'g', {});
  el(S.note, 'rect', { x: TX, y: BLOCKS[1] + 56 - 15, width: TR - TX, height: 30, rx: 10, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
  bar(S.note, TX + 20, BLOCKS[1] + 56, 90, 8, P.dim);
  S.qBefore = bar(pg, TX, BLOCKS[0] + 56, 150, 12, P.ink);
  S.qAfter = bar(pg, TX, BLOCKS[1], 205, 12, P.ink);
  S.hCross = BLOCKS.map((y) => cross(pg, IN + 35, y, 20));
  S.nCross = cross(pg, (TX + TR) / 2, BLOCKS[1] + 56, 22);
  S.scan = el(pg, 'rect', { x: L + 4, y: T + 10, width: 352, height: 44, rx: 12, fill: P.accent, 'fill-opacity': 0.16, opacity: 0 });
  S.ring = el(w, 'rect', { x: L - 14, y: T - 14, width: 388, height: 498, rx: 32, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-dasharray': '14 10', opacity: 0 });
  S.q = GAPS.map((y) => label(w, '?', { size: type.label, color: P.hot }).at(PX, y));
  S.ticks = BLOCKS.map((y) => tick(w).at(R + 40, y));
  // the writer misses the gaps: a dashed dim ring on the gap itself (the tick column stays the critic's)
  S.missRing = GAPS.map((y) => el(w, 'circle', { cx: PX, cy: y, r: 42, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '10 8', opacity: 0 }));
  S.asPage = label(w, 'as a page', { size: type.label }).at(PX, 745);

  // ---- act 1: the critic, the viewer and their comment, the second reviewer ----
  S.critic = figure(w, { mag: true }).at(CRIT.x, CRIT.y);
  S.criticChip = label(w, 'the critic', { size: type.note, color: P.dim }).at(CRIT.x, 650);
  S.viewer = figure(w).at(SIDE.x, SIDE.y);
  S.viewerChip = label(w, 'that viewer', { size: type.note, color: P.dim }).at(SIDE.x, 650);
  S.comment = new Item(w, 260, 130);
  el(S.comment.g, 'path', { d: `M ${SIDE.x - 110} 175 h 220 a 20 20 0 0 1 20 20 v 60 a 20 20 0 0 1 -20 20 h -90 l -20 32 l -6 -32 h -104 a 20 20 0 0 1 -20 -20 v -60 a 20 20 0 0 1 20 -20 z`, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  txt(S.comment.g, SIDE.x - 80, 225, '?', type.label, P.hot);
  bar(S.comment.g, SIDE.x - 40, 210, 150, 12, P.ink);
  bar(S.comment.g, SIDE.x - 40, 240, 110, 12, P.ink);
  S.why = arrow(w, SIDE.x - 145, 235, FIG.x + 80, 330, { color: P.accent, width: 5, head: 18 });
  S.flowFig = figure(w, { mag: true }).at(FIG.x, FIG.y);
  S.glint = glow(w, { r: 80 }).at(FIG.x, FIG.y - 76);
  S.modelLabel = label(w, 'AI model', { size: type.note, color: P.dim }).at(FIG.x, 720);
  S.secondChip = label(w, 'the second reviewer', { size: type.note }).at(FIG.x, 650);

  // ---- act 2: the writer already knows why ----
  S.writer = figure(w, { pencil: true, color: P.ink }).at(SIDE.x, SIDE.y);
  S.youLabel = label(w, 'you', { size: type.note }).at(SIDE.x, 650);
  S.thought = new Item(w, 300, 160);
  const th = S.thought.g;
  el(th, 'rect', { x: SIDE.x - 150, y: 170, width: 300, height: 110, rx: 40, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  el(th, 'circle', { cx: SIDE.x - 10, cy: 302, r: 10, fill: 'none', stroke: P.dim, 'stroke-width': 3 });
  el(th, 'circle', { cx: SIDE.x - 22, cy: 328, r: 6, fill: 'none', stroke: P.dim, 'stroke-width': 3 });
  S.because = new Item(w, 210, 56);
  el(S.because.g, 'rect', { x: -105, y: -28, width: 210, height: 56, rx: 16, fill: P.accent, 'fill-opacity': 0.2, stroke: P.accent, 'stroke-width': 4 });
  txt(S.because.g, 0, 0, 'because', type.note, P.ink);
  S.because.at(SIDE.x, 225);
  S.knowLabel = label(w, 'you already know why', { size: type.label }).at(1450, 745);

  // ---- act 3: the flow review listens ----
  S.flowChip = label(w, 'the flow review', { size: type.note }).at(FIG.x, 650);
  S.dots = flow(w, [[R + 15, 400], [FIG.x - 75, 388]], { n: 3, color: P.accent, period: 1.6 });
  S.onlyLabel = label(w, 'only your script', { size: type.label, color: P.accent }).at(PX, 745);
  S.onceLabel = label(w, 'hears it once', { size: type.label }).at(FIG.x, 735);
  S.headLabel = label(w, 'cannot see headings', { size: type.label }).at(PX, 745);
  S.notesLabel = label(w, 'or the notes', { size: type.label }).at(PX, 815);

  // ---- act 4: page -> magnifier -> card ----
  const CX = 1230, CW = 570;
  S.link1 = curve(w, R + 10, GAPS[0] - 16, LENS.x - 18, LENS.y - 30, { bend: -160, color: P.accent, width: 4, head: 18 });
  S.link2 = curve(w, LENS.x + 20, LENS.y - 22, CX - 4, 320, { bend: -24, color: P.accent, width: 4, head: 16 });
  S.card = new Item(w, CW, 390);
  el(S.card.g, 'rect', { x: CX, y: 170, width: CW, height: 390, rx: 26, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  S.cardQ = label(w, '?', { size: type.label, color: P.dim }).at(CX + CW / 2, 275); // the gap it came from, until the quotes arrive
  const row = (y) => {
    const it = new Item(w, 300, 60);
    quoteMark(it.g, CX + 34, y, P.ink);
    bar(it.g, CX + 80, y, 240, 14, P.ink);
    return it;
  };
  S.rowBefore = row(235);
  S.rowAfter = row(315);
  S.wBefore = label(w, 'before', { size: type.note }).at(CX + 430, 235);
  S.wAfter = label(w, 'after', { size: type.note }).at(CX + 430, 315);
  let x = CX + 34;
  S.sev = [['high', P.hot], ['medium', P.ink], ['low', P.dim]].map(([s, col]) => {
    const ch = chip(w, s, { color: col, textColor: col === P.hot ? P.hot : null, padX: 22 });
    ch.at(x + ch.w / 2, 405);
    x += ch.w + 12;
    return ch;
  });
  console.assert(x - 12 <= CX + CW - 24, 'severity chips overflow the card');
  S.plank = new Item(w, 360, 64);
  el(S.plank.g, 'rect', { x: CX + 60, y: 463, width: 360, height: 64, rx: 18, fill: P.accent, 'fill-opacity': 0.2, stroke: P.accent, 'stroke-width': 4 });
  txt(S.plank.g, CX + 240, 495, 'because', type.note, P.ink);

  // ---- act 5: the second list ----
  S.list = ['terms used before', 'references back'].map((s, i) => {
    const y = 640 + i * 80;
    const q = label(w, '?', { size: type.note, color: P.hot }).at(1290, y);
    const ch = chip(w, s, { color: P.ink });
    ch.at(1320 + ch.w / 2, y);
    return { q, ch };
  });

  // ---- end phrase (fixed on screen) ----
  S.fin = label(S.stage.hud, 'a listener who hears it once', { size: 64 }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const end = c('never'); // fade the end phrase in early enough to read it
  const endDim = dimAfter(t, end, 0.35, 0.4);
  const act4 = c('abrupt') - 0.6;

  // page
  S.page.show(reveal(t, c('critic'))).dim(endDim);
  const pageBody = dimAfter(t, c('abrupt'), 0.4);
  set(S.body, { opacity: pageBody.toFixed(3) });
  set(S.note, { opacity: ((0.35 + 0.65 * reveal(t, c('notes'))) * pageBody).toFixed(3) });
  const quoted = (at) => Math.max(pageBody, fadeBetween(t, at, c('severity')));
  set(S.qBefore, { opacity: quoted(c('last')).toFixed(3), fill: t >= c('last') && t < c('severity') ? P.accent : P.ink });
  set(S.qAfter, { opacity: quoted(c('after')).toFixed(3), fill: t >= c('after') && t < c('severity') ? P.accent : P.ink });
  S.hCross.forEach((n, i) => set(n, { opacity: (reveal(t, c('headings') + i * 0.15, 0.4) * pageBody).toFixed(3) }));
  set(S.nCross, { opacity: (reveal(t, c('notes'), 0.4) * pageBody).toFixed(3) });
  const sk = prog(t, c('start'), 2.3);
  set(S.scan, { y: lerp(T + 10, T + 470 - 54, sk).toFixed(1), opacity: fadeBetween(t, c('start'), c('headings') - 0.2, 0.3).toFixed(3) });
  set(S.ring, { opacity: fadeBetween(t, c('only'), c('start')).toFixed(3) });
  const qFade = 1 - 0.75 * fadeBetween(t, c('miss'), c('flow')); // the writer misses them; the flow review finds them again
  S.q.forEach((q, i) => {
    const grow = i === 0 ? 0.2 * ease.out(prog(t, c('abrupt'), 0.5)) : 0;
    q.show(reveal(t, c('hid') + i * 0.3) * qFade).at(PX, GAPS[i], 1 + grow)
      .dim(Math.min(endDim, i === 0 ? dimAfter(t, c('terms'), 0.35) : dimAfter(t, c('abrupt'), 0.35)));
  });
  S.ticks.forEach((k, i) => k.show(fadeBetween(t, c('opens') + i * 0.3, c('so'))).dim(dimAfter(t, c('miss'), 0.35, 0.4)));
  S.missRing.forEach((m, i) => set(m, { opacity: fadeBetween(t, c('miss') + 0.2 + i * 0.3, c('so')).toFixed(3) }));
  S.asPage.show(fadeBetween(t, c('page'), c('opens') - 1.0));

  // act 1: critic bright, then the viewer, then the second reviewer, then the critic again
  const critD = Math.min(endDim, spot(t, [-1, c('viewer')], [c('critic2'), c('miss')]));
  S.critic.show(reveal(t, c('critic'))).dim(critD);
  S.criticChip.show(reveal(t, c('critic') + 0.3)).dim(critD);
  const side1 = c('you') - 0.55; // the viewer is gone before the writer ("you") arrives
  const viewD = dimAfter(t, c('second'), 0.35);
  S.viewer.show(fadeBetween(t, c('viewer'), side1)).dim(viewD);
  S.viewerChip.show(fadeBetween(t, c('viewer') + 0.2, side1)).dim(viewD);
  S.viewer.ears.forEach((e) => set(e, { stroke: t >= c('viewer') + 0.4 ? P.accent : P.dim }));
  const bubD = dimAfter(t, c('critic2'), 0.35);
  const bub = fadeBetween(t, c('comment'), side1);
  S.comment.show(bub).dim(bubD);
  S.why.draw(ease.out(prog(t, c('second'), 0.5)), bub * bubD);

  // the second reviewer = the flow review: ears lit, magnifier, its own place
  const flowD = Math.min(endDim, spot(t, [c('second'), c('critic2')], [c('so'), 1e9]));
  S.flowFig.show(reveal(t, c('second'))).dim(flowD);
  S.flowFig.ears.forEach((e) => set(e, { stroke: t >= c('listener') ? P.accent : P.dim })); // lit only once it listens
  S.secondChip.show(fadeBetween(t, c('second') + 0.1, c('flow') - 0.55)).dim(flowD);
  S.glint.pulse(t, 0.8 * fadeBetween(t, c('model'), c('model') + 0.9, 0.3));
  S.modelLabel.show(fadeBetween(t, c('model') - 0.3, c('listener') + 0.4));

  // act 2: the writer, who already knows why
  S.writer.show(fadeBetween(t, c('you'), c('so')));
  S.youLabel.show(fadeBetween(t, c('you'), c('so')));
  S.thought.show(fadeBetween(t, c('know'), c('so')));
  const bc = fadeBetween(t, c('know'), c('so'));
  S.because.show(bc).at(SIDE.x, 225, 1 + 0.12 * Math.sin(Math.PI * prog(t, c('follows'), 0.9)));
  S.knowLabel.show(fadeBetween(t, c('know') + 0.1, c('so'))).dim(dimAfter(t, c('know') + 0.9, 0.5));

  // act 3: the flow review listens to the page
  S.flowChip.show(reveal(t, c('flow'))).dim(Math.min(endDim, dimAfter(t, c('only'), 0.6)));
  S.dots.update(t, fadeBetween(t, c('listener') + 0.4, c('draw')));
  S.onlyLabel.show(fadeBetween(t, c('only'), c('headings') - 0.6));
  S.onceLabel.show(fadeBetween(t, c('listener') + 1.2, c('headings') - 0.6));
  S.headLabel.show(fadeBetween(t, c('headings'), act4)).dim(dimAfter(t, c('notes'), 0.5));
  S.notesLabel.show(fadeBetween(t, c('notes'), act4)).dim(dimAfter(t, c('draw'), 0.5));

  // act 4: page -> magnifier -> card, all on "abrupt"
  const cardDim = Math.min(endDim, dimAfter(t, c('terms'), 0.35));
  S.link1.draw(prog(t, c('abrupt'), 0.45), cardDim);
  S.link2.draw(prog(t, c('abrupt') + 0.35, 0.3), cardDim);
  S.card.show(reveal(t, c('abrupt'), 0.5)).dim(cardDim);
  S.cardQ.show(fadeBetween(t, c('abrupt') + 0.3, c('last') - 0.3, 0.3));
  const rowDim = Math.min(cardDim, dimAfter(t, c('severity'), 0.5));
  S.rowBefore.show(reveal(t, c('last') + 0.15)).dim(rowDim);
  S.rowAfter.show(reveal(t, c('after'))).dim(rowDim);
  S.wBefore.show(reveal(t, c('beforeW'), 0.4)).dim(Math.min(rowDim, dimAfter(t, c('beforeW') + 1.0, 0.5)));
  S.wAfter.show(reveal(t, c('after') + 0.58, 0.4)).dim(Math.min(rowDim, dimAfter(t, c('after') + 1.58, 0.5)));
  const chipDim = Math.min(cardDim, dimAfter(t, c('bridge') + 0.5, 0.6));
  const notThis = dimAfter(t, c('low') + 0.5, 0.35, 0.5); // three choices, then "high" stays lit for this gap
  [c('high') + 0.18, c('medium'), c('low') + 0.16].forEach((at, i) => S.sev[i].show(reveal(t, at, 0.4)).dim(i === 0 ? chipDim : Math.min(chipDim, notThis)));
  S.plank.show(reveal(t, c('bridge') + 0.5)).dim(cardDim);

  // act 5
  S.list.forEach((it, i) => {
    const at = i === 0 ? c('terms') + 0.4 : c('refs');
    const d = Math.min(endDim, i === 0 ? dimAfter(t, c('refs'), 0.5) : 1);
    it.q.show(reveal(t, at)).dim(d);
    it.ch.show(reveal(t, at)).dim(d);
  });

  // end phrase, in the tail after the last word
  S.fin.show(reveal(t, end, 0.4));
}
