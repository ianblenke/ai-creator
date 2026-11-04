// Scene 04: what a bridge is. Two topic blocks (the switch, the handle) joined by a lit "because" plank a listener crosses;
// beneath, three dim false bridges, each crossed out: a bare question mark, a megaphone, the words "now let's talk".
import { palette as P, el, lerp, prog, ease } from 'style';
import { type, label, chip, glow, arrow, Item, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'open', at: 'So if a bare' },
    { name: 'question', at: 'bare question' },
    { name: 'nothing', at: 'bridges nothing' },
    { name: 'what', at: 'what does' },
    { name: 'bridge', at: 'A bridge is' },
    { name: 'sentences', at: 'sentences that' },
    { name: 'connect', at: 'connect two ideas' },
    { name: 'why', at: 'say why' },
    { name: 'follows', at: 'the next one follows' },
    { name: 'here', at: 'Here is one' },
    { name: 'kettle', at: 'for the kettle' },
    { name: 'joining', at: 'joining the switch' },
    { name: 'sw', at: 'switch to the handle' },
    { name: 'hd', at: 'handle The switch' },
    { name: 'sw2', at: 'switch means' },
    { name: 'away', at: 'walk away' },
    { name: 'boils', at: 'it boils' },
    { name: 'back', at: 'come back' },
    { name: 'pour', at: 'pour so' },
    { name: 'next', at: 'so the next thing' },
    { name: 'hd2', at: 'handle That is' },
    { name: 'that', at: 'That is a bridge' },
    { name: 'because', at: 'because it gives' },
    { name: 'reason', at: 'gives a reason' },
    { name: 'qnot', at: 'A question is not' },
    { name: 'q', at: 'question is not' },
    { name: 'x1', at: 'next Neither' },
    { name: 'announce', at: 'announcement like' },
    { name: 'part', at: 'here is the part' },
    { name: 'x2', at: 'about Neither' },
    { name: 'now', at: "now let's talk" },
    { name: 'x3', at: 'handle Each' },
    { name: 'each', at: 'Each one points' },
    { name: 'points', at: 'points at' },
    { name: 'without', at: 'without saying' },
  ],
};

// geometry: two topic blocks (x 320..720 and 1200..1600) with a gap between them; the plank fills the gap exactly at mid-height
const BL = 520, BR = 1400, BY = 430, BW = 400, BH = 320;
const KY = 400;            // kettle centre inside each block
const KS = 0.9;            // kettle scale (about 240 px wide)
const GL = BL + BW / 2, GR = BR - BW / 2;   // the gap's edges (720, 1200)
const PY = 440;            // plank centre = where the gap's "?" stood
const PT = PY - 34;        // plank top: the figure's feet
const FY = 720;            // false-plank row
const FX = [520, 960, 1400];

let S;
const item = (parent) => new Item(parent);
const line = (g, x1, y1, x2, y2, color, w = 5) => el(g, 'line', { x1, y1, x2, y2, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' });

// THE KETTLE (bible + continuity addendum): trapezoid body, flat lid knob, handle arc on the left, straight spout on the right,
// switch dot just under the handle's lower end. The shared parts go in `base` (dimmed); the subject part is drawn bright.
function drawKettle(g, cx, cy, subject) {
  const k = el(g, 'g', { transform: `translate(${cx} ${cy}) scale(${KS})` });
  const base = el(k, 'g');
  el(base, 'path', { d: 'M 68 -4 L 118 -48 L 108 -58 L 60 -32', fill: P.bg2, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(base, 'path', { d: 'M -84 90 L 74 90 Q 86 90 83 78 L 60 -50 Q 56 -70 36 -70 L -46 -70 Q -66 -70 -69 -50 L -88 78 Q -90 90 -84 90 Z', fill: P.bg2, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(base, 'rect', { x: -16, y: -86, width: 32, height: 16, rx: 8, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  const handleD = 'M -66 -44 Q -124 -40 -114 22 Q -108 54 -84 58';
  el(subject === 'handle' ? k : base, 'path', { d: handleD, fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
  const handleLit = el(k, 'path', { d: handleD, fill: 'none', stroke: P.accent, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0 });
  el(subject === 'switch' ? k : base, 'circle', { cx: -104, cy: 74, r: 11, fill: subject === 'switch' ? P.ink : P.dim });
  const switchLit = el(k, 'circle', { cx: -104, cy: 74, r: 12, fill: P.accent, opacity: 0 });
  return { k, base, handleLit, switchLit };
}

// THE FIGURE (continuity addendum, same shape as scene 01): circle head over a flat-topped, square-shouldered body,
// about 220 px tall, two small ear arcs, `dim` here (nobody is listening in this scene). Origin at the feet.
function drawListener(g) {
  const f = el(g, 'g', { transform: 'translate(0 -110)' });
  el(f, 'path', { d: 'M -62 110 L -62 10 Q -62 -28 -24 -28 L 24 -28 Q 62 -28 62 10 L 62 110 Z', fill: P.bg2, stroke: P.dim, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(f, 'circle', { cx: 0, cy: -72, r: 36, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  ['M -36 -88 Q -56 -72 -36 -56', 'M 36 -88 Q 56 -72 36 -56'].forEach((d) => el(f, 'path', { d, fill: 'none', stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round' }));
}

// a false plank: content on its left part, a small `hot` cross on its empty right end (never over the content),
// and a dashed arrow that aims at the handle block and stops short ("points at the next topic without saying why")
function falsePlank(W, x, kind, aimFrom) {
  const it = item(W);
  const cx = x - 40;
  el(it.g, 'rect', { x: x - 210, y: FY - 38, width: 420, height: 76, rx: 16, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  if (kind === 'q') label(it.g, '?', { size: 56, color: P.dim }).at(cx, FY).show(1);
  if (kind === 'mega') {
    el(it.g, 'rect', { x: cx - 54, y: FY - 12, width: 18, height: 24, rx: 4, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
    el(it.g, 'path', { d: `M ${cx - 36} ${FY - 12} L ${cx + 10} ${FY - 28} L ${cx + 10} ${FY + 28} L ${cx - 36} ${FY + 12} Z`, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linejoin': 'round' });
    it.arcs = el(it.g, 'g', { opacity: 0 });
    [18, 34].forEach((r) => el(it.arcs, 'path', { d: `M ${cx + 14 + r * 0.5} ${FY - r} q ${r * 0.6} ${r} 0 ${r * 2}`, fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  }
  if (kind === 'talk') label(it.g, "now let's talk", { size: 40, color: P.dim }).at(x - 30, FY).show(1);
  it.cross = el(it.g, 'g', { opacity: 0 });
  line(it.cross, x + 134, FY - 18, x + 170, FY + 18, P.hot, 4);
  line(it.cross, x + 170, FY - 18, x + 134, FY + 18, P.hot, 4);
  // aim at the handle block's bottom centre, stop at 80% of the way
  const [ax, ay] = aimFrom, tx = BR, ty = BY + BH / 2, k = 0.8;
  it.aim = arrow(W, ax, ay, ax + (tx - ax) * k, ay + (ty - ay) * k, { color: P.dim, width: 4, dashed: true, head: 18 });
  it.aim.draw(0, 0);
  return it;
}

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'what', dur: 1.6, x: 960, y: 470, z: 1.2 },
    { cue: 'joining', dur: 1.6, x: 960, y: 440, z: 1 },
    { cue: 'back', dur: 1.6, x: 960, y: 470, z: 1.18 },
    { cue: 'qnot', dur: 1.8, x: 960, y: 600, z: 1.12 },
    { cue: 'each', dur: 1.6, x: 960, y: 540, z: 1 },
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // the listener sits behind the blocks: on the crossing it steps behind the switch block and out onto the plank
  S.figG = el(W, 'g');
  S.fig = item(S.figG);
  drawListener(S.fig.g);

  S.top = el(W, 'g');
  // topic blocks
  S.blocks = [[BL, 'switch'], [BR, 'handle']].map(([cx, subject]) => {
    const it = item(S.top);
    el(it.g, 'rect', { x: cx - BW / 2, y: BY - BH / 2, width: BW, height: BH, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
    it.lit = el(it.g, 'rect', { x: cx - BW / 2, y: BY - BH / 2, width: BW, height: BH, rx: 24, fill: 'none', stroke: P.accent, 'stroke-width': 5, opacity: 0 });
    it.bars = el(it.g, 'g');
    el(it.bars, 'rect', { x: cx - 110, y: 392, width: 220, height: 16, rx: 8, fill: P.ink });
    el(it.bars, 'rect', { x: cx - 110, y: 436, width: 150, height: 16, rx: 8, fill: P.ink });
    it.kettle = el(it.g, 'g', { opacity: 0 });
    Object.assign(it, drawKettle(it.kettle, cx, KY, subject));
    return it;
  });
  S.steam = el(S.top, 'g', { opacity: 0 });
  S.puffs = [0, 1, 2].map(() => el(S.steam, 'path', { d: 'M 0 0 q -6 -8 0 -16 q 6 -8 0 -16', fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' }));
  S.lblSw = label(S.top, 'the switch', { size: 44 }).at(BL, 548);
  S.lblHd = label(S.top, 'the handle', { size: 44 }).at(BR, 548);

  // the gap's question mark (magenta: what is wrong), at the height the plank will land
  S.gapQ = label(S.top, '?', { size: 56, color: P.hot }).at(960, PY);

  // the bridge plank: its own group so it can be re-brightened under the end phrase; it ends exactly at the blocks' inner edges
  S.bridgeG = el(W, 'g');
  S.glow = glow(S.bridgeG, { rx: 250, ry: 64, color: P.accent, strength: 0.35 }).at(960, PY);
  S.plank = item(S.bridgeG);
  el(S.plank.g, 'rect', { x: GL + 6, y: PY - 34, width: GR - GL - 12, height: 68, rx: 16, fill: P.accent, stroke: P.accent, 'stroke-width': 4 });
  S.because = label(S.bridgeG, 'because', { size: 44, color: P.bg }).at(960, PY);

  S.top2 = el(W, 'g');

  S.reason = chip(S.top2, 'gives a reason', { size: type.label, color: P.accent }).at(960, 540);

  // definition, one phrase at a time
  S.def1 = label(W, 'one or two sentences', { size: type.label }).at(960, 690);
  S.def2 = label(W, 'connect two ideas', { size: type.label, color: P.accent }).at(960, 690);
  S.def3 = chip(W, 'say why', { size: type.label, color: P.accent }).at(960, 690);

  // false bridges
  S.fq = falsePlank(W, FX[0], 'q', [FX[0] + 60, FY - 44]);
  S.fm = falsePlank(W, FX[1], 'mega', [FX[1] + 60, FY - 44]);
  S.ft = falsePlank(W, FX[2], 'talk', [FX[2] + 40, FY - 44]);

  S.final = label(stage.hud, 'without saying why it follows', { size: 64 }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // whole top composition pushed back while the false bridges are spoken, partly restored for the wide overview
  const topD = lerp(dimAfter(t, c('qnot'), 0.35), 0.6, reveal(t, c('each'), 0.8));
  S.top.setAttribute('opacity', topD.toFixed(3));
  S.top2.setAttribute('opacity', topD.toFixed(3));
  S.figG.setAttribute('opacity', topD.toFixed(3));
  // the one real bridge comes back to full strength under the end phrase
  S.bridgeG.setAttribute('opacity', lerp(topD, 1, reveal(t, c('without'), 0.6)).toFixed(3));

  // blocks: bars until the kettle, then the kettle; spotlight the switch, then the handle
  const kettleIn = reveal(t, c('kettle'), 0.7);
  const [bl, br] = S.blocks;
  const leftD = 1 - 0.6 * (reveal(t, c('hd2')) - reveal(t, c('that')) * 0.6);
  const rightD = 1 - 0.6 * (reveal(t, c('sw2')) - reveal(t, c('next')));
  bl.show(reveal(t, c('open'))).dim(leftD);
  br.show(reveal(t, c('open') + 0.2)).dim(rightD);
  const connect = fadeBetween(t, c('connect'), c('why'), 0.4);
  [bl, br].forEach((b) => {
    b.bars.setAttribute('opacity', (1 - reveal(t, c('here'), 0.5)).toFixed(3));
    b.kettle.setAttribute('opacity', kettleIn.toFixed(3));
    b.lit.setAttribute('opacity', connect.toFixed(3));
  });
  // shared kettle parts dim once each block's subject is named; the subject (switch dot, handle arc) stays bright
  bl.base.setAttribute('opacity', dimAfter(t, c('sw'), 0.25, 0.5).toFixed(3));
  br.base.setAttribute('opacity', dimAfter(t, c('hd'), 0.25, 0.5).toFixed(3));
  const pulse = 0.75 + 0.25 * Math.sin(t * 3.9);
  bl.switchLit.setAttribute('opacity', (reveal(t, c('sw'), 0.4) * (t > c('sw2') && t < c('back') ? pulse : 1)).toFixed(3));
  br.handleLit.setAttribute('opacity', (reveal(t, c('hd'), 0.4) * (t > c('hd2') && t < c('reason') ? pulse : 1)).toFixed(3));
  // the pour happens only once the listener has reached the handle
  const tilt = 8 * fadeBetween(t, c('hd2') + 0.3, c('reason'), 0.4);
  br.k.setAttribute('transform', `translate(${BR} ${KY}) rotate(${tilt.toFixed(2)}) scale(${KS})`);
  S.lblSw.show(reveal(t, c('sw'), 0.4));
  S.lblHd.show(reveal(t, c('hd'), 0.4));

  // steam from the left kettle's spout while it boils
  S.steam.setAttribute('opacity', (0.8 * reveal(t, c('boils'), 0.8)).toFixed(3));
  S.puffs.forEach((p, i) => {
    const u = (((t * 0.6 + i / 3) % 1) + 1) % 1;
    p.setAttribute('transform', `translate(${BL + 96 + i * 13} ${KY - 60 - u * 20})`); // stays inside the block's outline
    p.setAttribute('opacity', Math.sin(u * Math.PI).toFixed(3));
  });

  // the gap's question mark, gone just before the plank lands in its place
  S.gapQ.show(fadeBetween(t, c('nothing'), c('bridge') - 0.45, 0.4));
  const plankIn = reveal(t, c('bridge') + 0.15, 0.7);
  S.plank.show(plankIn).at(0, (1 - plankIn) * -30);
  S.glow.pulse(t, plankIn * (0.5 + 0.5 * fadeBetween(t, c('follows'), c('here'), 0.5) + 0.5 * fadeBetween(t, c('that'), c('qnot'), 0.5)));
  // "because" is written on the plank when "say why" is spoken; it swells on the spoken "because"
  const swell = fadeBetween(t, c('because'), c('reason') + 0.5, 0.35);
  S.because.show(reveal(t, c('why'), 0.4) * plankIn).at(960, PY, 1 + 0.14 * swell);

  // the listener: stands beside the switch block, walks away left (fading) on "walk away", comes back on "come back",
  // then on "so the next thing" crosses (behind the switch block, out onto the plank) and reaches the handle on "handle"
  const bobAt = (moving) => (moving ? Math.abs(Math.sin(t * 9)) * 8 : 0);
  const HX = 220, FLOOR = BY + BH / 2;
  const away = ease.inOut(prog(t, c('away'), 1.4)), back = ease.inOut(prog(t, c('back'), 0.9));
  const ws = c('next'), walk = ease.inOut(prog(t, ws, c('hd2') - ws));
  const fx = walk > 0 ? lerp(HX, 1130, walk) : lerp(HX, 170, away * (1 - back));
  const fy = lerp(FLOOR, PT, ease.inOut(prog(fx, 300, 400)));
  const moving = (away > 0 && away < 1) || (back > 0 && back < 1) || (walk > 0 && walk < 1);
  S.fig.show(reveal(t, c('sw2'), 0.4)).dim(lerp(1, 0.45, away * (1 - back)) * dimAfter(t, c('that'), 0.35)).at(fx, fy - bobAt(moving));

  S.reason.show(reveal(t, c('reason'), 0.5));

  // definition phrases (each fully gone before the next arrives)
  S.def1.show(fadeBetween(t, c('sentences') - 0.1, c('connect') - 0.35, 0.3));
  S.def2.show(fadeBetween(t, c('connect'), c('why') - 0.32, 0.3));
  S.def3.show(fadeBetween(t, c('why'), c('here'), 0.4));

  // false bridges: each appears when named, is crossed out, then dims as the next comes in; the "?" one previews on "bare question"
  const overview = reveal(t, c('each'), 0.8);
  const fset = (f, inA, xT, outT) => {
    f.show(inA).dim(outT ? lerp(dimAfter(t, outT, 0.4), 1, overview) : 1);
    f.cross.setAttribute('opacity', reveal(t, xT, 0.35).toFixed(3));
    f.aim.draw(reveal(t, c('points'), 0.8), f.g.getAttribute('opacity') * lerp(1, 0.35, reveal(t, c('without'), 0.6)));
  };
  fset(S.fq, reveal(t, c('q'), 0.6), c('x1'), c('announce'));
  fset(S.fm, reveal(t, c('announce'), 0.6), c('x2'), c('now'));
  fset(S.ft, reveal(t, c('now'), 0.6), c('x3'), null);
  S.fm.arcs.setAttribute('opacity', (reveal(t, c('part'), 0.4) * (0.6 + 0.4 * Math.sin(t * 5))).toFixed(3));

  S.final.show(reveal(t, c('without'), 0.6));
}
