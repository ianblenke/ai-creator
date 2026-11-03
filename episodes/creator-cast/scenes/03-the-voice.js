// 03 - the voice: the waveform alone first (everything follows its timing), then the model's name, the card slides in on the
// left and the waveform runs right out of it in a single lane: one request block at a time enters the card and the voice plays
// out of it (one card is enough). A license tag hangs from the model's name, with the date stamp beside it and the hedge (an AI
// agent read it, check the page yourself), two dashed unknowns (training data, whose voice), "clone only your own", then a
// magenta "no watermark" note and a description page that gains a line. Ends wide on "the voice is synthetic".
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, arrow, measure, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'voice', at: 'Start with the voice' },
    { name: 'timing', at: 'everything else follows' },
    { name: 'name', at: 'Audio8' },
    { name: 'open', at: 'small open model' },
    { name: 'card', at: 'graphics card' },
    { name: 'clones', at: 'clones my voice' },
    { name: 'recording', at: 'one recording' },
    { name: 'request', at: 'one request at a time' },
    { name: 'enough', at: 'one card is enough' },
    { name: 'modelcard', at: 'Its model card' },
    { name: 'apache', at: 'Apache' },
    { name: 'weights', at: 'code and weights' },
    { name: 'aiagent', at: 'an AI agent read it' },
    { name: 'date', at: 'first of November' },
    { name: 'check', at: 'check the page' },
    { name: 'unknown', at: 'does not describe' },
    { name: 'training', at: 'training data' },
    { name: 'whose', at: 'whose voice' },
    { name: 'own', at: 'clone only your own' },
    { name: 'mark', at: 'adds no watermark' },
    { name: 'nomark', at: 'no watermark' },
    { name: 'desc', at: 'each description' },
    { name: 'synthetic', at: 'is synthetic' },
  ],
};

// world layout: card left, the lane with the waveform right, a top label slot over the lane, a bottom row under it
const CARD = [440, 540], WAVE_Y = 540, WX0 = 960, WX1 = 1100;
const LANE = { x1: 634, x2: 1640, top: 420, bot: 660 };
const TOP = [1170, 360], ROW = 720;
const TAG = [440, 240], DATE = [820, 240], HEDGE = [820, 322];   // the license group above the model's name
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// THE VOICE: rounded accent bars (12 px on a 24 px pitch) centred on a baseline; play() lifts the bars under a sweeping highlight
function wave(parent, n, hmax, gap = 24, bw = 12) {
  const it = new Item(parent, n * gap, hmax);
  it.bars = Array.from({ length: n }, (_, i) => {
    const h = hmax * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    const b = el(it.g, 'rect', { x: (i - (n - 1) / 2) * gap - bw / 2, y: -h / 2, width: bw, height: h, rx: bw / 2, fill: P.accent });
    b.h = h;
    return b;
  });
  // pos = where the highlight is along the bars (0..1, left to right); default: a sweep every 1.8 s
  it.play = (t, k, pos = (t / 1.8) % 1) => it.bars.forEach((b, i) => {
    const g = Math.exp(-(((i - (pos * (n + 6) - 3)) ** 2) / 6));
    const h = b.h * (1 + 0.25 * g * k);
    set(b, { y: (-h / 2).toFixed(2), height: h.toFixed(2), opacity: +lerp(1, 0.8 + 0.2 * g, k).toFixed(3) });
  });
  return it;
}

// A LICENSE TAG: a small rounded tag with an ink outline, a punched hole and the license word
function tag(parent, text, size = 42) {
  const tw = measure(text, size), w = Math.ceil(tw + 96), h = Math.ceil(size + 30);
  const it = new Item(parent, w, h);
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(it.g, 'circle', { cx: -w / 2 + 24, cy: 0, r: 8, fill: 'none', stroke: P.ink, 'stroke-width': 3 });
  el(it.g, 'text', { x: 18, y: size * 0.35, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: P.ink }, text);
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 540, z: 1.15 },             // close on the voice alone
    { cue: 'card', dur: 1.4, x: 960, y: 540, z: 1 },           // out: the card joins on the left
    { cue: 'modelcard', dur: 1.4, x: 900, y: 560, z: 1.04 },   // lean toward the card and its tag
    { cue: 'unknown', dur: 1.4, x: 1020, y: 560, z: 1.04 },    // lean toward the open questions
    { cue: 'mark', dur: 1.4, x: 960, y: 540, z: 1 },           // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // the voice alone, its first words, the model's name
  S.wave = wave(W, 31, 170);
  S.voiceLab = label(W, 'the voice', { size: type.label, color: P.accent }).at(960, 340);
  S.timing = label(W, 'everything follows its timing', { size: type.label }).at(960, 720);
  S.name = chip(W, 'Audio8', { size: type.label, color: P.accent });
  S.open = label(W, 'small open model', { size: type.note, color: P.dim }).at(960, 720);

  // THE CARD: a flat cool slab with a round fan (three spokes) and eight fins, at 1.2 scale
  // one request: an ink block that travels into the card from the left, one per period (made first so the card covers it)
  S.req = new Item(W, 60, 36);
  el(S.req.g, 'rect', { x: -30, y: -18, width: 60, height: 36, rx: 10, fill: P.ink });
  S.card = new Item(W, 384, 101);
  const cg = el(S.card.g, 'g', { transform: 'scale(1.2)' });
  S.cardEdge = el(cg, 'rect', { x: -160, y: -42, width: 320, height: 84, rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(cg, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  S.fan = el(cg, 'g');
  for (let k = 0; k < 3; k++) el(S.fan, 'line', { x1: 0, y1: 0, x2: 20 * Math.cos((k * 2 * Math.PI) / 3), y2: 20 * Math.sin((k * 2 * Math.PI) / 3), stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round' });
  for (let k = 0; k < 8; k++) el(cg, 'line', { x1: -30 + k * 22, y1: -22, x2: -30 + k * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });

  // one recording of me, feeding the card from below
  S.rec = chip(W, 'one recording', { color: P.ink }).at(CARD[0], ROW);
  S.recArrow = arrow(W, CARD[0], ROW - 40, CARD[0], CARD[1] + 64, { color: P.ink, width: 4 });
  S.enough = label(W, 'one card is enough', { size: type.label, color: P.cool }).at(CARD[0], ROW);

  // the single lane: two rails out of the card, one request riding it at a time
  S.lane = new Item(W);
  [LANE.top, LANE.bot].forEach((y) => el(S.lane.g, 'line', { x1: LANE.x1, x2: LANE.x2, y1: y, y2: y, ...stroke(P.dim, 4) }));
  S.oneAt = label(W, 'one at a time', { size: type.label }).at(...TOP);

  // the license tag hangs from the model's name (its model card); its note above; the date stamp beside it; the hedge under it
  S.string = el(W, 'line', { x1: TAG[0], x2: TAG[0], y1: 358, y2: TAG[1] + 36, ...stroke(P.ink, 3), opacity: 0 });
  S.tag = tag(W, 'Apache 2.0').at(...TAG);
  S.weights = label(W, 'code and weights', { size: type.note, color: P.dim }).at(TAG[0], 165);
  S.date = chip(W, 'first of November', { color: P.accent }).at(...DATE);
  S.agent = label(W, 'an AI agent read it', { size: type.note, color: P.dim }).at(...HEDGE);
  S.check = label(W, 'check the page yourself', { size: type.note }).at(...HEDGE);

  // what the card and the license leave open
  S.train = chip(W, 'training data', { color: P.dim, dashed: true }).at(1300, ROW);
  S.whose = chip(W, 'whose voice?', { color: P.dim, dashed: true }).at(1620, ROW);
  S.own = label(W, 'clone only your own', { size: type.label, color: P.accent }).at(...TOP);

  // the close: no watermark, a line in each description, the voice is synthetic
  S.nomark = chip(W, 'no watermark', { color: P.hot }).at(...TOP);
  // the page is 130 tall and its new line sits well inside it; the final phrase carries the word "synthetic" (said once)
  S.page = new Item(W, 150, 130);
  el(S.page.g, 'rect', { x: -75, y: -65, width: 150, height: 130, rx: 12, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [96, 110, 70].forEach((w, k) => el(S.page.g, 'rect', { x: -52, y: -44 + k * 22, width: w, height: 8, rx: 4, fill: P.ink, opacity: 0.6 }));
  S.line = el(S.page.g, 'rect', { x: -52, y: 26, width: 0, height: 10, rx: 5, fill: P.accent });
  S.page.at(1560, 750);
  S.descLab = label(W, 'each description', { size: type.note, color: P.dim }).at(1330, 750);

  S.final = label(S.stage.hud, 'the voice is synthetic', { size: type.title }).at(960, 850);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  // spotlight: 1 inside any of the [from, to) windows, about 0.35 outside
  const foc = (...w) => 0.35 + 0.65 * Math.max(...w.map(([a, b]) => fadeBetween(t, a, b)));
  const END = 1e9;

  // the voice: alone and close, then into the lane; it plays on "timing" and from "clones" on
  const mv = ease.inOut(prog(t, c('card') - 0.2, 0.9));   // ahead of the card's slide so the two never touch
  S.wave.show(reveal(t, c('voice'), 0.6)).dim(foc([c('voice'), c('modelcard')], [c('own'), END])).at(lerp(WX0, WX1, mv), WAVE_Y);
  // one request at a time: a block enters the card (first 40% of each 2.2 s period), then the voice sweeps out of the card
  const inLane = t >= c('request') && t < c('modelcard');
  const u = ((((t - c('request')) / 2.2) % 1) + 1) % 1;
  S.wave.play(t, Math.max(fadeBetween(t, c('timing'), c('name') - 0.5), reveal(t, c('clones'), 0.5)), inLane ? (u < 0.4 ? 0 : (u - 0.4) / 0.6) : undefined);
  S.voiceLab.show(fadeBetween(t, c('voice'), c('name') - 0.5, 0.4));
  S.timing.show(fadeBetween(t, c('timing'), c('name'), 0.4));

  // the name above, the "small open model" note under; the name moves over the card when it arrives
  S.name.show(reveal(t, c('name'), 0.5)).dim(foc([c('name'), c('request')], [c('modelcard'), c('unknown')])).at(lerp(960, CARD[0], mv), lerp(340, 400, mv));
  S.open.show(fadeBetween(t, c('open'), c('card'), 0.4));

  // the card slides in from the left, its fan spins; the edge pulses on "one card is enough"
  const cd = reveal(t, c('card'), 0.6);
  S.card.show(cd).dim(foc([c('card'), c('request')], [c('enough'), c('modelcard')])).at(lerp(CARD[0] - 60, CARD[0], cd), CARD[1]);
  set(S.fan, { transform: `translate(-100 0) rotate(${((t * 140) % 360).toFixed(1)})` });
  set(S.cardEdge, { 'stroke-width': +(4 + 3 * fadeBetween(t, c('enough'), c('enough') + 0.6, 0.3)).toFixed(2) });

  // one recording feeds it, then gives way to "one card is enough"
  const rc = fadeBetween(t, c('recording'), c('request') + 1.2, 0.4);
  S.rec.show(rc);
  S.recArrow.draw(ease.out(prog(t, c('recording') + 0.2, 0.5)), rc);
  S.enough.show(fadeBetween(t, c('enough'), c('modelcard'), 0.4));

  // the single lane and its one request
  const ln = reveal(t, c('request'), 0.5), lf = foc([c('request'), c('modelcard')]);
  S.lane.show(ln).dim(lf);
  const rq = ease.inOut(Math.min(1, u / 0.4));
  S.req.show(inLane ? ln * lf * (1 - prog(u, 0.3, 0.1)) : 0).at(lerp(180, 290, rq), CARD[1]);
  S.oneAt.show(fadeBetween(t, c('request'), c('modelcard'), 0.4));

  // the license: tag on its string, the note, the date stamp, check the page
  const tg = reveal(t, c('apache'), 0.5), tf = foc([c('apache'), c('unknown')]);
  set(S.string, { opacity: +(tg * tf).toFixed(3) });
  S.tag.show(tg).dim(tf).at(TAG[0], lerp(TAG[1] - 20, TAG[1], tg));
  const out = c('mark') + 2.3;   // the bottom row clears before the description page arrives
  S.weights.show(fadeBetween(t, c('weights'), out)).dim(foc([c('weights'), c('date')]));
  const dt = reveal(t, c('date'), 0.5);
  S.date.show(fadeBetween(t, c('date'), out)).dim(foc([c('date'), c('unknown')])).at(lerp(DATE[0] + 40, DATE[0], dt), DATE[1]);
  S.agent.show(fadeBetween(t, c('aiagent'), c('check') - 0.4, 0.3));
  S.check.show(fadeBetween(t, c('check'), c('unknown'), 0.4));

  // the two open questions, then "clone only your own"
  const uf = foc([c('training'), c('own')]);
  S.train.show(fadeBetween(t, c('training'), out)).dim(uf);
  S.whose.show(fadeBetween(t, c('whose'), out)).dim(uf);
  S.own.show(fadeBetween(t, c('own'), c('mark'), 0.4));

  // no watermark; a line in each description, labelled synthetic
  S.nomark.show(reveal(t, c('nomark'), 0.5));
  S.page.show(reveal(t, c('desc'), 0.5));
  S.descLab.show(reveal(t, c('desc'), 0.5));
  set(S.line, { width: (110 * ease.out(prog(t, c('desc') + 0.4, 0.6))).toFixed(1) });

  // the phrase dominates the end: the diagram drops back to half
  const fin = reveal(t, c('synthetic') + 0.1, 0.5);
  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.5, fin).toFixed(3) });
}
