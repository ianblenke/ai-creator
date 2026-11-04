// Scene 07: the script format. One page (the script) on the left; the rules light up one by one beside it.
import { palette as P, font, el, set, ease, prog, lerp } from 'style';
import { type, measure, label, chip, arrow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'script', at: 'the script can use' },
    { name: 'pile', at: 'public pile' },
    { name: 'rules', at: 'a few rules' },
    { name: 'heading', at: 'Each heading' },
    { name: 'starts', at: 'starts a scene' },
    { name: 'para', at: 'The paragraphs under' },
    { name: 'voice', at: 'the voice will say' },
    { name: 'visual', at: 'visual marker' },
    { name: 'draws', at: 'whoever draws' },
    { name: 'never', at: 'never spoken' },
    { name: 'subtitle', at: 'becomes a subtitle' },
    { name: 'spoken', at: 'spoken-form tag' },
    { name: 'pause', at: 'pause marker' },
    { name: 'validate', at: 'The validate command' },
    { name: 'command', at: 'validate command' },
    { name: 'checks', at: 'only checks' },
    { name: 'narr', at: 'has narration' },
    { name: 'title', at: 'a title of its own' },
    { name: 'length', at: 'warns when the length' },
    { name: 'cannot', at: 'It cannot tell' },
    { name: 'connects', at: 'scene connects' },
    { name: 'reviewer', at: 'job' },
    { name: 'most', at: 'matters most' },
    { name: 'final', at: 'every scene starts by tying' },
  ],
};

let S;
const PX = 520, PY = 450; // page centre (360 x 470)
const L = PX - 180, T = PY - 235;
const IN = L + 35;

function bar(g, x, y, w, h, color) { return el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color }); }
function tick(parent, color = P.accent) {
  const it = new Item(parent, 44, 40);
  el(it.g, 'path', { d: 'M -18 0 L -5 13 L 18 -14', fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return it;
}
function cross(parent, x, y, r = 16) {
  const g = el(parent, 'g', { opacity: 0 });
  el(g, 'path', { d: `M ${x - r} ${y - r} L ${x + r} ${y + r} M ${x + r} ${y - r} L ${x - r} ${y + r}`, stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round' });
  return g;
}
function line(parent, x1, y1, x2, y2, dashed = true) {
  return el(parent, 'line', { x1, y1, x2, y2, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round', ...(dashed ? { 'stroke-dasharray': '10 10' } : {}), opacity: 0 });
}
const leftAt = (it, x, y) => it.at(x + it.w / 2, y);

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'heading', dur: 1.6, x: 900, y: 470, z: 1.12 },
      { cue: 'visual', dur: 1.6, x: 980, y: 480, z: 1.08 },
      { cue: 'validate', dur: 1.6, x: 1060, y: 460, z: 1.1 },
      { cue: 'cannot', dur: 1.6, x: 960, y: 480, z: 1.04 },
      { cue: 'final', dur: 1.4, x: 960, y: 540, z: 1 },
    ], c),
  };
  const w = S.stage.world;

  // ---- the script page ----
  S.page = new Item(w, 360, 470);
  S.page.at(0, 0);
  const pg = S.page.g;
  el(pg, 'rect', { x: L, y: T, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.h1 = bar(pg, IN, 248, 230, 22, P.ink);
  S.p1 = [bar(pg, IN, 290, 290, 12, P.ink), bar(pg, IN, 318, 270, 12, P.ink), bar(pg, IN, 346, 210, 12, P.ink)];
  // plain bars stand in for the note, tag and pause rows until each rule is spoken
  S.notePh = bar(pg, IN, 409, 250, 12, P.ink);
  S.note = el(pg, 'g', {});
  el(S.note, 'rect', { x: IN, y: 380, width: 290, height: 58, rx: 12, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 6' });
  el(S.note, 'text', { x: IN + 18, y: 422, 'font-family': font.sans, 'font-size': 38, 'font-weight': 700, fill: P.dim }, 'visual');
  bar(S.note, IN + 160, 409, 110, 10, P.dim);
  S.h2 = bar(pg, IN, 474, 230, 22, P.ink);
  S.p4 = [bar(pg, IN, 514, 150, 12, P.ink), bar(pg, IN + 198, 514, 92, 12, P.ink)];
  S.tagPh = bar(pg, IN + 150, 514, 48, 12, P.ink);
  S.tag = el(pg, 'rect', { x: IN + 160, y: 500, width: 28, height: 28, rx: 7, fill: P.accent, 'fill-opacity': 0.2, stroke: P.accent, 'stroke-width': 3 });
  S.pausePh = bar(pg, IN, 554, 290, 12, P.ink);
  S.pauseRow = el(pg, 'g', {});
  bar(S.pauseRow, IN, 554, 80, 12, P.ink);
  el(S.pauseRow, 'line', { x1: IN + 95, y1: 554, x2: IN + 195, y2: 554, stroke: P.dim, 'stroke-width': 4 });
  el(S.pauseRow, 'line', { x1: IN + 95, y1: 542, x2: IN + 95, y2: 566, stroke: P.dim, 'stroke-width': 3 });
  el(S.pauseRow, 'line', { x1: IN + 195, y1: 542, x2: IN + 195, y2: 566, stroke: P.dim, 'stroke-width': 3 });
  bar(S.pauseRow, IN + 210, 554, 80, 12, P.ink);
  S.p5 = [bar(pg, IN, 594, 280, 12, P.ink), bar(pg, IN, 622, 230, 12, P.ink), bar(pg, IN, 650, 160, 12, P.ink)];

  // joins between scenes: question marks beside the page
  S.q = [240, 474].map((y) => label(w, '?', { size: type.label, color: P.dim }).at(300, y));

  // ---- section 1: the public pile ----
  S.pile = el(w, 'g', { opacity: 0 });
  // CITED: two chained loops
  el(S.pile, 'rect', { x: 1072, y: 302, width: 56, height: 56, rx: 12, fill: P.bg2, stroke: P.accent, 'stroke-width': 3 });
  el(S.pile, 'rect', { x: 1084, y: 322, width: 20, height: 14, rx: 7, fill: 'none', stroke: P.accent, 'stroke-width': 3 });
  el(S.pile, 'rect', { x: 1096, y: 324, width: 20, height: 14, rx: 7, fill: 'none', stroke: P.accent, 'stroke-width': 3 });
  // MEASURED: ruler
  el(S.pile, 'rect', { x: 1162, y: 302, width: 56, height: 56, rx: 12, fill: P.bg2, stroke: P.ink, 'stroke-width': 3 });
  el(S.pile, 'rect', { x: 1172, y: 324, width: 36, height: 12, fill: 'none', stroke: P.ink, 'stroke-width': 2 });
  for (let i = 0; i < 4; i++) el(S.pile, 'line', { x1: 1178 + i * 8, y1: 324, x2: 1178 + i * 8, y2: 330, stroke: P.ink, 'stroke-width': 2 });
  // a LEAD bubble stays outside, never lit
  S.lead = el(w, 'g', { opacity: 0 });
  el(S.lead, 'path', { d: 'M 1342 306 h 48 a 8 8 0 0 1 8 8 v 26 a 8 8 0 0 1 -8 8 h -30 l -10 10 v -10 h -8 a 8 8 0 0 1 -8 -8 v -26 a 8 8 0 0 1 8 -8 z', fill: 'none', stroke: P.dim, 'stroke-width': 3 });
  el(S.lead, 'path', { d: 'M 1336 300 L 1404 364 M 1404 300 L 1336 364', stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round' });
  S.pileArrow = arrow(w, 1050, 330, 725, 318, { color: P.accent, width: 4 });
  S.pileLabel = label(w, 'the public pile', { size: type.label, color: P.ink }).at(1190, 440);
  S.rulesLabel = label(w, 'a few rules', { size: type.label, color: P.accent }).at(1190, 540);

  // ---- section 2: headings and paragraphs ----
  S.hLine = line(w, 715, 248, 975, 262, false);
  S.hashLabel = leftAt(label(w, '##', { size: type.label, color: P.ink }), 990, 262);
  S.hLabel = leftAt(label(w, 'starts a scene', { size: type.label, color: P.ink }), 990 + measure('## ', type.label), 262);
  S.wave = el(w, 'g', { opacity: 0 });
  S.bars = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].map((k, i) =>
    el(S.wave, 'rect', { x: 1200 + (i - 4) * 34 - 6, y: 380 - k * 30, width: 12, height: k * 60, rx: 6, fill: P.accent }));
  S.pLine = line(w, 715, 318, 1050, 380, false);
  S.voiceLabel = label(w, 'the voice', { size: type.note, color: P.accent }).at(1200, 450);

  // ---- section 3: the visual note is never spoken ----
  S.dLine = line(w, 715, 425, 1500, 570);
  S.draw = new Item(w, 170, 120);
  el(S.draw.g, 'rect', { x: -80, y: -55, width: 160, height: 110, rx: 12, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.draw.g, 'path', { d: 'M -30 30 L 30 -30 L 42 -18 L -18 42 Z M -30 30 L -38 50 L -18 42', fill: 'none', stroke: P.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  S.draw.at(1600, 570);
  S.drawLabel = label(w, 'the drawing', { size: type.note, color: P.ink }).at(1600, 665);
  S.nLine = line(w, 715, 409, 1040, 395);
  S.nCross = cross(w, 878, 402);
  S.neverChip = chip(w, 'never spoken', { color: P.dim }).at(1200, 262);
  S.sub = el(w, 'g', { opacity: 0 });
  el(S.sub, 'rect', { x: 1050, y: 525, width: 300, height: 70, rx: 14, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
  bar(S.sub, 1080, 552, 240, 10, P.ink); bar(S.sub, 1120, 572, 160, 10, P.ink);
  S.subLabel = label(w, 'subtitle', { size: type.note, color: P.ink }).at(1200, 640);
  S.sLine = line(w, 715, 425, 1040, 560);
  S.sCross = cross(w, 878, 492);

  // ---- section 4: spoken-form tag and pause ----
  S.tLine = line(w, 715, 514, 985, 560, false);
  S.tagChip = chip(w, 'spoken-form tag', { color: P.accent }).at(1200, 560);
  S.qLine = line(w, 715, 554, 1050, 650, false);
  S.silence = el(w, 'g', { opacity: 0 });
  el(S.silence, 'line', { x1: 1064, y1: 650, x2: 1336, y2: 650, stroke: P.dim, 'stroke-width': 4 });
  el(S.silence, 'line', { x1: 1064, y1: 636, x2: 1064, y2: 664, stroke: P.dim, 'stroke-width': 3 });
  el(S.silence, 'line', { x1: 1336, y1: 636, x2: 1336, y2: 664, stroke: P.dim, 'stroke-width': 3 });
  S.silenceLabel = label(w, 'exact silence', { size: type.note, color: P.ink }).at(1200, 705);

  // ---- section 5: validate ----
  S.valArrow = arrow(w, 715, 300, 995, 290, { color: P.accent, width: 3, head: 14 });
  S.valChip = chip(w, 'validate', { size: type.label, color: P.accent }).at(1150, 290);
  S.rows = ['narration', 'a title', 'length', 'connects'].map((txt, i) => ({
    lab: leftAt(label(w, txt, { size: type.label, color: i === 3 ? P.dim : P.ink }), 1050, 385 + i * 70),
    y: 385 + i * 70,
  }));
  S.tickN = tick(w).at(1005, 385);
  S.tickT = tick(w).at(1005, 455);
  S.warn = new Item(w, 44, 44);
  el(S.warn.g, 'circle', { cx: 0, cy: 0, r: 20, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  el(S.warn.g, 'line', { x1: 0, y1: -10, x2: 0, y2: 3, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' });
  el(S.warn.g, 'circle', { cx: 0, cy: 10, r: 3, fill: P.dim });
  S.warn.at(1005, 525);
  S.connQ = label(w, '?', { size: type.label, color: P.dim }).at(1005, 595);
  S.connLine = el(w, 'line', { x1: 1050, y1: 625, x2: 1260, y2: 625, stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0 });

  // ---- section 6: a reviewer ----
  S.revChip = chip(w, 'a reviewer', { size: type.label, color: P.accent }).at(1500, 595);
  S.revArrow = arrow(w, 1355, 595, 1290, 595, { color: P.accent, width: 4, head: 16 });

  // ---- final sentence ----
  S.fin = label(w, 'every scene ties itself to the previous one', { size: 64, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const fin = c('final');
  const endDim = dimAfter(t, fin, 0.35);

  // page
  S.page.show(reveal(t, c('script'))).dim(endDim);
  const base = 0.45;
  // focus helper: 1 while [a, b), else base
  const foc = (a, b) => lerp(base, 1, ease.out(prog(t, a, 0.4)) * (1 - ease.in(prog(t, b, 0.4))));
  set(S.h1, { opacity: foc(c('heading'), c('para')).toFixed(3) });
  const pf = foc(c('para'), c('visual') - 1.2);
  S.p1.forEach((b) => set(b, { opacity: pf.toFixed(3), fill: t >= c('voice') && t < c('visual') - 0.8 ? P.accent : P.ink }));
  const rv = reveal(t, c('visual')), rt = reveal(t, c('spoken')), rp = reveal(t, c('pause'));
  set(S.notePh, { opacity: (base * (1 - rv)).toFixed(3) });
  set(S.note, { opacity: (foc(c('visual'), c('spoken') - 0.1) * rv).toFixed(3) });
  set(S.h2, { opacity: base });
  S.p4.forEach((b) => set(b, { opacity: base }));
  set(S.tagPh, { opacity: (base * (1 - rt)).toFixed(3) });
  set(S.tag, { opacity: (foc(c('spoken'), c('pause') - 0.3) * rt).toFixed(3) });
  set(S.pausePh, { opacity: (base * (1 - rp)).toFixed(3) });
  set(S.pauseRow, { opacity: (foc(c('pause'), c('validate')) * rp).toFixed(3) });
  S.p5.forEach((b) => set(b, { opacity: base }));

  // joins: question marks
  const qs = 1 + 0.25 * ease.out(prog(t, c('most'), 0.6));
  S.q.forEach((q, i) => q.show(reveal(t, c('connects') + i * 0.3)).at(300, i ? 474 : 240, qs).dim(endDim));

  // section 1
  const s1 = fadeBetween(t, c('pile'), c('heading') - 0.6);
  set(S.pile, { opacity: s1.toFixed(3) });
  set(S.lead, { opacity: (0.35 * s1).toFixed(3) });
  S.pileArrow.draw(ease.out(prog(t, c('pile') + 0.3, 0.8)), s1);
  S.pileLabel.show(s1).dim(dimAfter(t, c('rules')));
  S.rulesLabel.show(fadeBetween(t, c('rules'), c('heading') - 0.6));

  // section 2
  const s2h = fadeBetween(t, c('starts'), c('visual') - 0.8);
  set(S.hLine, { opacity: (s2h * 0.8).toFixed(3) });
  S.hashLabel.show(fadeBetween(t, c('heading') + 0.8, c('visual') - 0.8));
  S.hLabel.show(s2h);
  const sw = fadeBetween(t, c('voice'), c('validate') - 0.5);
  set(S.wave, { opacity: (sw * dimAfter(t, c('never'), 0.35)).toFixed(3) });
  S.bars.forEach((b, i) => {
    const k = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6][i] * (0.85 + 0.15 * Math.sin(t * 6 + i * 1.3));
    set(b, { y: (380 - k * 30).toFixed(1), height: (k * 60).toFixed(1) });
  });
  set(S.pLine, { opacity: (fadeBetween(t, c('voice'), c('visual') - 0.8) * 0.8).toFixed(3) });
  S.voiceLabel.show(sw).dim(dimAfter(t, c('spoken'), 0.5));

  // section 3
  const s3 = fadeBetween(t, c('never'), c('spoken') - 0.6);
  set(S.nLine, { opacity: s3.toFixed(3) });
  set(S.nCross, { opacity: (s3 * reveal(t, c('never') + 0.2)).toFixed(3) });
  const sd = fadeBetween(t, c('draws'), c('spoken') - 0.6);
  set(S.dLine, { opacity: (0.8 * fadeBetween(t, c('draws'), c('subtitle') - 0.6)).toFixed(3) });
  S.draw.show(sd).dim(dimAfter(t, c('never'), 0.5));
  S.drawLabel.show(sd).dim(dimAfter(t, c('never'), 0.5));
  S.neverChip.show(fadeBetween(t, c('never'), c('validate') - 0.5)).dim(dimAfter(t, c('spoken')));
  const sub = fadeBetween(t, c('subtitle'), c('spoken') - 0.6);
  set(S.sub, { opacity: sub.toFixed(3) });
  S.subLabel.show(sub);
  set(S.sLine, { opacity: sub.toFixed(3) });
  set(S.sCross, { opacity: (sub * reveal(t, c('subtitle') + 0.5)).toFixed(3) });

  // section 4
  const s4t = fadeBetween(t, c('spoken'), c('validate') - 0.5);
  set(S.tLine, { opacity: (s4t * 0.8).toFixed(3) });
  S.tagChip.show(s4t).dim(dimAfter(t, c('pause')));
  const s4p = fadeBetween(t, c('pause'), c('validate') - 0.5);
  set(S.qLine, { opacity: (s4p * 0.8).toFixed(3) });
  set(S.silence, { opacity: s4p.toFixed(3) });
  S.silenceLabel.show(s4p);

  // section 5
  const vd = dimAfter(t, c('cannot'), 0.35);
  S.valArrow.draw(ease.out(prog(t, c('command'), 0.6)), Math.min(vd, endDim) * reveal(t, c('command'), 0.2));
  S.valChip.show(reveal(t, c('validate'))).dim(Math.min(vd, endDim));
  const rowAt = [c('narr'), c('title'), c('length'), c('connects')];
  S.rows.forEach((r, i) => r.lab.show(reveal(t, rowAt[i])).dim(i === 3 ? endDim : Math.min(vd, endDim)));
  S.tickN.show(reveal(t, c('narr') + 0.2)).dim(Math.min(vd, endDim));
  S.tickT.show(reveal(t, c('title') + 0.2)).dim(Math.min(vd, endDim));
  S.warn.show(reveal(t, c('length') + 0.3)).dim(Math.min(vd, endDim));
  S.connQ.show(reveal(t, c('connects'))).dim(endDim);
  set(S.connLine, { opacity: (reveal(t, c('connects')) * endDim).toFixed(3) });

  // section 6
  S.revChip.show(reveal(t, c('reviewer'))).dim(endDim);
  S.revArrow.draw(ease.out(prog(t, c('reviewer') + 0.3, 0.6)), endDim);

  // final
  S.fin.show(reveal(t, fin));
}
