// Scene 03: a listener cannot see headings. The script page loses its headings out loud; a gap opens between the
// kettle's switch and its handle; the listener faces it; a viewer's complaint; the old rule's bare question is a false bridge.
import { palette as P, font, el, set, ease, prog, lerp } from 'style';
import { type, measure, label, chip, curve, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'stop', at: 'The first stop' },
    { name: 'heading', at: 'heading itself' },
    { name: 'page', at: 'On a page' },
    { name: 'tells', at: 'tells the reader' },
    { name: 'changed', at: 'subject has changed' },
    { name: 'loud', at: 'out loud' },
    { name: 'noHeading', at: 'no heading,' },
    { name: 'nothingDoes', at: 'nothing does' },
    { name: 'soIf', at: 'So if one' },
    { name: 'ends', at: 'one scene ends' },
    { name: 'kettle', at: "the kettle's switch" },
    { name: 'switch', at: 'switch' },
    { name: 'handle', at: 'the handle' },
    { name: 'gap', at: 'nothing joining them' },
    { name: 'joining', at: 'joining them' },
    { name: 'sounds', at: 'it sounds as though' },
    { name: 'stopped', at: 'stopped talking' },
    { name: 'else', at: 'something else' },
    { name: 'know', at: 'I know that feeling' },
    { name: 'side', at: 'the other side' },
    { name: 'viewer', at: 'a viewer' },
    { name: 'told', at: 'told me' },
    { name: 'quote1', at: 'just stops talking' },
    { name: 'quote2', at: 'changes the subject' },
    { name: 'rule', at: 'My rule' },
    { name: 'tie', at: 'tie back' },
    { name: 'question', at: 'a bare question counted' },
    { name: 'bridgesNothing', at: 'bridges nothing' },
  ],
};

let S;
// the script page (360 x 470) centred at (560, 470)
const PX = 560, PY = 470, PL = PX - 180, PT = PY - 235;
const HX = PL + 24, TX = PL + 104;           // heading bars on the left edge, text bars to their right
const ROWS = [300, 400, 500];                 // block tops, packed tight; blocks 2 and 3 slide down to open the gap
const GAP_DY = 120;                           // gap 1-2 becomes ~150 px against ~32 px between 2 and 3
const KX = 1080, KY = 430;                   // the kettle
const LX0 = 1440, LX1 = 1080, LY = 480;      // the listener: first on the right, then facing the gap
const AX = 1560;                             // the author

function bar(g, x, y, w, h, color) { return el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color }); }
function cross(parent, x, y, r, color, width = 6, ry = r) {
  const g = el(parent, 'g', { opacity: 0 });
  el(g, 'path', { d: `M ${x - r} ${y - ry} L ${x + r} ${y + ry} M ${x + r} ${y - ry} L ${x - r} ${y + ry}`, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
  return g;
}
// the one neutral figure (about 220 px tall); the author gets a pencil, the listener gets ears
function figure(parent, color, { pencil = false, ears = true } = {}) {
  const it = new Item(parent, 150, 220);
  el(it.g, 'path', { d: 'M -62 110 L -62 10 Q -62 -28 -24 -28 L 24 -28 Q 62 -28 62 10 L 62 110 Z', fill: P.bg2, stroke: color, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(it.g, 'circle', { cx: 0, cy: -72, r: 36, fill: P.bg2, stroke: color, 'stroke-width': 5 });
  it.ears = !ears ? [] : [
    el(it.g, 'path', { d: 'M -36 -88 Q -56 -72 -36 -56', fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round' }),
    el(it.g, 'path', { d: 'M 36 -88 Q 56 -72 36 -56', fill: 'none', stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round' }),
  ];
  if (pencil) {
    const pg = el(it.g, 'g', { transform: 'translate(92 30) rotate(28)' });
    el(pg, 'rect', { x: -9, y: -54, width: 18, height: 78, rx: 4, fill: P.bg2, stroke: color, 'stroke-width': 4 });
    el(pg, 'path', { d: 'M -9 24 L 0 44 L 9 24', fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  }
  return it;
}

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'page', dur: 1.6, x: 780, y: 450, z: 1.1 },
      { cue: 'loud', dur: 1.6, x: 1000, y: 470, z: 1 },
      { cue: 'ends', dur: 1.6, x: 840, y: 450, z: 1.08 },
      { cue: 'sounds', delay: 0.2, dur: 1.6, x: 860, y: 480, z: 1.06 },
      { cue: 'know', dur: 1.8, x: 1150, y: 470, z: 1 },
      { cue: 'rule', dur: 1.6, x: 960, y: 540, z: 1 },
      { cue: 'bridgesNothing', dur: 1.0, x: 980, y: 500, z: 0.9 },
    ], c),
  };
  const w = S.stage.world;

  // ---- the script page ----
  S.page = new Item(w, 360, 470);
  S.page.at(0, 0);
  S.pageRect = el(S.page.g, 'rect', { x: PL, y: PT, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.blocks = ROWS.map((y) => {
    const g = el(S.page.g, 'g', {});
    const text = el(g, 'g', {});
    [230, 210, 160].forEach((bw, i) => bar(text, TX, y + i * 28, bw, 12, P.ink));
    const head = bar(g, HX, y + 14, 60, 24, P.ink);
    // out loud the heading is crossed out, never removed (canon); the cross rides with its block
    const hx = cross(g, HX + 30, y + 14, 26, P.ink, 5, 20);
    return { g, text, head, hx, y };
  });

  // ---- labels beside the page ----
  const LL = 820; // shared left edge of the two labels
  S.lHeading = label(w, 'the heading', { size: type.label, color: P.ink });
  S.lHeading.at(LL + S.lHeading.w / 2, 300);
  S.lChanged = label(w, 'subject changed', { size: type.label, color: P.ink });
  S.lChanged.at(LL + S.lChanged.w / 2, 400);
  S.lNo = chip(w, 'no heading', { size: type.label, color: P.dim }).at(1040, 330);
  S.lLoud = label(w, 'out loud', { size: type.note, color: P.accent }).at(LX0, 660);

  // ---- the kettle (faces right: handle left, spout right) ----
  // THE KETTLE: scene 01's exact form (body, lid knob, straight spout, handle arc, switch track and dot)
  S.kettle = new Item(w, 240, 196);
  const kg = S.kettle.g;
  const ink = { stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' };
  el(kg, 'path', { d: 'M 68 -4 L 118 -48 L 108 -58 L 60 -32', fill: P.bg2, ...ink });
  el(kg, 'path', { d: 'M -84 90 L 74 90 Q 86 90 83 78 L 60 -50 Q 56 -70 36 -70 L -46 -70 Q -66 -70 -69 -50 L -88 78 Q -90 90 -84 90 Z', fill: P.bg2, ...ink });
  el(kg, 'rect', { x: -16, y: -86, width: 32, height: 16, rx: 8, fill: P.bg2, ...ink });
  S.handle = el(kg, 'path', { d: 'M -66 -44 Q -124 -40 -114 22 Q -108 54 -84 58', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
  el(kg, 'rect', { x: -117, y: 56, width: 26, height: 52, rx: 13, fill: P.bg, stroke: P.dim, 'stroke-width': 3 });
  S.switchDot = el(kg, 'circle', { cx: -104, cy: 69, r: 10, fill: P.dim });
  S.kettle.at(KX, KY);
  // the switch link swings under the kettle so it never crosses the handle
  S.swLine = el(w, 'path', { d: `M ${TX + 240} ${ROWS[0] + 28} Q 900 650 ${KX - 104} ${KY + 69}`, fill: 'none', stroke: P.accent, 'stroke-width': 3, 'stroke-dasharray': '10 10', 'stroke-linecap': 'round', opacity: 0 });
  S.hdLine = el(w, 'line', { x1: TX + 220, y1: ROWS[1] + 28, x2: KX - 126, y2: KY + 10, stroke: P.accent, 'stroke-width': 3, 'stroke-dasharray': '10 10', 'stroke-linecap': 'round', opacity: 0 });

  // ---- the gap and its magenta question mark ----
  const g0 = ROWS[0] + 62, g1 = ROWS[1] + GAP_DY - 6; // block 1's last bar bottom, block 2's first bar top (opened)
  const gapY = (g0 + g1) / 2;
  S.gapY = gapY;
  S.gapBox = el(w, 'rect', { x: PL + 24, y: g0 + 12, width: 312, height: g1 - g0 - 24, rx: 14, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '12 12', opacity: 0 });
  // the false bridge (bible): a dim plank across the gap; the magenta ? stays bright and becomes its label
  S.plank = new Item(w, 336, 84);
  el(S.plank.g, 'rect', { x: -168, y: -42, width: 336, height: 84, rx: 14, fill: P.dim, 'fill-opacity': 0.25, stroke: P.dim, 'stroke-width': 3 });
  S.plank.at(PX, gapY);
  S.gapQ = label(w, '?', { size: 64, color: P.hot }).at(PX, gapY);
  // the cross over the plank and its question, drawn on "bridges nothing"
  S.plankCross = cross(w, PX, gapY, 150, P.ink, 7, 46);

  // ---- the listener and the author ----
  S.listener = figure(w, P.dim);
  S.author = figure(w, P.ink, { pencil: true, ears: false }).at(AX, LY);
  S.lRule = chip(w, 'my rule', { size: 42, color: P.ink }).at(AX, 670);
  S.lStopped = label(w, 'stopped talking', { size: type.label, color: P.ink }).at(LX1, 250);
  S.lElse = label(w, 'something else', { size: type.label, color: P.ink }).at(LX1, 700);
  S.lViewer = chip(w, 'a viewer', { size: 42, color: P.dim }).at(LX1, 660);

  // speech bubble from the viewer to the author
  const q1 = 'just stops talking', q2 = 'changes the subject';
  const bw = Math.ceil(Math.max(measure(q1, type.note), measure(q2, type.note)) + 70), bh = 140;
  const BX = 1330, BY = 220;
  S.bubBottom = BY + bh / 2;
  S.bubble = el(w, 'g', { opacity: 0 });
  S.bubRect = el(S.bubble, 'rect', { x: BX - bw / 2, y: BY - bh / 2, width: bw, height: bh, rx: 30, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.bubble, 'path', { d: `M ${BX - bw / 2 + 60} ${BY + bh / 2 - 2} L ${LX1 + 30} ${LY - 120} L ${BX - bw / 2 + 120} ${BY + bh / 2 - 2}`, fill: P.bg2, stroke: P.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  S.q1 = el(S.bubble, 'text', { x: BX, y: BY - 12, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': type.note, 'font-weight': 700, fill: P.ink, opacity: 0 }, q1);
  S.q2 = el(S.bubble, 'text', { x: BX, y: BY + 42, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': type.note, 'font-weight': 700, fill: P.ink, opacity: 0 }, q2);

  // ---- the old rule: tie back; a bare question as a false bridge ----
  S.tieCurve = curve(w, PL + 372, ROWS[1] + GAP_DY + 20, PL + 372, ROWS[0] + 30, { bend: 70, color: P.accent, width: 5, head: 18 });
  S.tieChip = chip(w, 'tie back', { size: type.label, color: P.accent }).at(AX, 300);
  // ---- end phrase ----
  S.fin = label(S.stage.hud, 'a bare question bridges nothing', { size: 64, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const fin = c('bridgesNothing');
  const endDim = dimAfter(t, fin, 0.35);

  // page: dims while the viewer story is told, returns for the rule
  const pageDim = lerp(1, 0.4, ease.inOut(prog(t, c('know'), 0.6)) * (1 - ease.inOut(prog(t, c('rule'), 0.6))));
  S.page.show(reveal(t, c('stop') - 0.3)).dim(Math.min(pageDim, lerp(1, 0.5, ease.inOut(prog(t, fin, 0.6)))));

  set(S.pageRect, { stroke: fadeBetween(t, c('page'), c('tells'), 0.25) > 0.5 ? P.accent : P.dim });

  // gap opens: blocks 2 and 3 slide down
  const dy = GAP_DY * ease.inOut(prog(t, c('gap'), 0.8));
  S.blocks.forEach((b, i) => set(b.g, { transform: `translate(0 ${i ? dy.toFixed(2) : 0})` }));

  // headings: bright when spoken; out loud they dim and are crossed out on "no heading", and stay so
  const hFocus = fadeBetween(t, c('heading'), c('loud'), 0.4);
  const gone = ease.inOut(prog(t, c('noHeading'), 0.3));
  const hOp = lerp(lerp(0.8, 1, hFocus), 0.3, gone);
  S.blocks.forEach((b, i) => {
    const pulse = i === 1 ? fadeBetween(t, c('tells'), c('loud') - 0.4, 0.3) : 0;
    set(b.head, { opacity: hOp.toFixed(3), fill: pulse > 0.5 ? P.accent : P.ink });
    set(b.hx, { opacity: (0.85 * gone).toFixed(3) });
  });

  // text bars: pushed back while headings speak; the switch block, then the handle block, in focus
  const tBase = lerp(0.75, 0.45, hFocus);
  const f1 = fadeBetween(t, c('soIf'), c('handle'), 0.4), f2 = fadeBetween(t, c('handle'), c('gap') + 0.4, 0.4);
  S.blocks.forEach((b, i) => {
    const f = i === 0 ? f1 : i === 1 ? f2 : 0;
    set(b.text, { opacity: lerp(tBase, 1, f).toFixed(3) });
  });

  // labels beside the page
  S.lHeading.show(fadeBetween(t, c('heading'), c('loud'))).dim(dimAfter(t, c('tells'), 0.35));
  S.lChanged.show(fadeBetween(t, c('changed'), c('loud')));
  S.lNo.show(fadeBetween(t, c('noHeading'), c('soIf'))).dim(dimAfter(t, c('nothingDoes'), 0.35));

  // listener: right side out loud, then slides to face the gap
  const slide = ease.inOut(prog(t, c('sounds') + 0.3, 1.2));
  const lx = lerp(LX0, LX1, slide);
  const lDim = lerp(1, 0.35, fadeBetween(t, c('ends'), c('sounds'), 0.5));
  S.listener.show(reveal(t, c('loud'))).at(lx, LY).dim(Math.min(lDim, endDim));
  const listening = Math.max(fadeBetween(t, c('loud'), c('know'), 0.4), fadeBetween(t, c('viewer'), c('quote1'), 0.3)); // still hearing the kettle example, only pushed back
  S.listener.ears.forEach((e) => set(e, { stroke: listening > 0.5 ? P.accent : P.dim }));
  S.lLoud.show(fadeBetween(t, c('loud') + 0.1, c('soIf'))).at(LX0, 660);

  // kettle: switch, then handle
  const kv = fadeBetween(t, c('kettle'), c('sounds'));
  S.kettle.show(kv);
  set(S.switchDot, { fill: t >= c('switch') && f1 > 0.5 ? P.accent : P.dim });
  set(S.handle, { stroke: f2 > 0.5 ? P.accent : P.ink });
  set(S.swLine, { opacity: (fadeBetween(t, c('switch'), c('handle'), 0.4) * 0.9).toFixed(3) });
  set(S.hdLine, { opacity: (fadeBetween(t, c('handle'), c('gap'), 0.4) * 0.9).toFixed(3) });

  // the gap's magenta question mark; small breath while the listener faces it
  const qBreath = 1 + 0.08 * Math.sin(t * 3.4) * fadeBetween(t, c('sounds'), c('know'));
  S.gapQ.show(reveal(t, Math.max(c('joining'), c('gap') + 0.55), 0.4)).at(PX, S.gapY, qBreath); // only once the gap is mostly open
  set(S.gapBox, { opacity: (0.7 * fadeBetween(t, c('gap') + 0.4, c('question'), 0.4)).toFixed(3) });

  // what the listener hears
  S.lStopped.show(fadeBetween(t, c('stopped'), c('know'))).dim(dimAfter(t, c('else'), 0.4));
  S.lElse.show(fadeBetween(t, c('else'), c('know')));

  // the other side: the author, a viewer's words
  // the author steps back while the viewer speaks, then owns "my rule"
  const aDim = lerp(lerp(1, 0.5, ease.inOut(prog(t, c('quote1'), 0.5))), 1, ease.inOut(prog(t, c('rule'), 0.5)));
  S.author.show(reveal(t, c('side'))).dim(Math.min(aDim, dimAfter(t, c('tie'), 0.35), endDim));
  S.lRule.show(reveal(t, c('rule'))).dim(Math.min(dimAfter(t, c('tie'), 0.4), endDim));
  S.lViewer.show(reveal(t, c('viewer'))).dim(Math.min(dimAfter(t, c('rule'), 0.35), endDim));
  // one-line bubble on "just", growing upward for the second line
  set(S.bubble, { opacity: fadeBetween(t, c('quote1'), c('rule')).toFixed(3) });
  const bhNow = lerp(84, 140, ease.inOut(prog(t, c('quote2'), 0.3)));
  set(S.bubRect, { y: (S.bubBottom - bhNow).toFixed(2), height: bhNow.toFixed(2) });
  set(S.q1, { y: (S.bubBottom - bhNow + 55).toFixed(2), opacity: (reveal(t, c('quote1')) * lerp(1, 0.5, reveal(t, c('quote2')))).toFixed(3) });
  set(S.q2, { opacity: reveal(t, c('quote2') + 0.3).toFixed(3) });

  // the old rule and its false bridge
  S.tieCurve.draw(ease.out(prog(t, c('tie'), 0.8)), reveal(t, c('tie')) * lerp(1, 0.5, reveal(t, c('question'), 0.4)));
  // the rule let a bare question through: the arrow loses its 'linked' green there
  const tieCol = t >= c('question') ? P.dim : P.accent;
  for (const n of S.tieCurve.g.children) set(n, { stroke: tieCol });
  S.tieChip.show(reveal(t, c('tie'))).dim(Math.min(dimAfter(t, c('question'), 0.4), endDim));
  S.plank.show(reveal(t, c('question'), 0.5));
  set(S.plankCross, { opacity: reveal(t, fin, 0.4).toFixed(3) });

  S.fin.show(reveal(t, fin));
}
