// Scene 03: the promise. Two columns split by a thin divider: 'what you bring' (left) and 'what you get' (right).
// Left builds up: the computer, the card slab under it (its label typed word by word), a spark for the idea, then the card
// shrinks a little as 'smallest card tested' is typed and a dashed 'in the description' chip appears. Right builds up: one finished
// episode frame with its words typed beside it, the acid-green waveform under it (played by a soft highlight), and one speech
// bubble for 'your own voice / only yours'. The camera glides left, then right, then back out to wide, where three violet clouds
// appear at the top and send small jobs (code bracket, pencil) down to the episode while the home card glows. Ends wide on the point.
import { palette as P, font, prog, ease, lerp, clamp, el, set } from 'style';
import { type, Item, label, chip, glow, flow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'test', at: 'The test is simple' },
    { name: 'bring', at: 'what you bring' },
    { name: 'get', at: 'what you get' },
    { name: 'youBring', at: 'You bring a computer' },
    { name: 'computer', at: 'a computer' },
    { name: 'decent', at: 'decent graphics' },
    { name: 'graphics', at: 'graphics card' },
    { name: 'card', at: 'card and something' },
    { name: 'something', at: 'something you want' },
    { name: 'explain', at: 'to explain' },
    { name: 'name', at: 'I name the smallest' },
    { name: 'smallest', at: 'smallest card' },
    { name: 'card2', at: 'card I have' },
    { name: 'tested', at: 'tested in the' },
    { name: 'description', at: 'in the description' },
    { name: 'youGet', at: 'You get a real' },
    { name: 'real', at: 'a real episode' },
    { name: 'real2', at: 'real episode' },
    { name: 'episode', at: 'episode made yourself' },
    { name: 'made', at: 'made yourself' },
    { name: 'yourself', at: 'yourself in your' },
    { name: 'inYour', at: 'in your own voice' },
    { name: 'your', at: 'your own voice' },
    { name: 'own', at: 'own voice' },
    { name: 'voice', at: 'voice and only' },
    { name: 'only', at: 'only yours' },
    { name: 'yours', at: 'yours with a few' },
    { name: 'few', at: 'a few cloud' },
    { name: 'cloud', at: 'cloud models' },
    { name: 'models', at: 'models doing' },
    { name: 'parts', at: 'parts a home' },
    { name: 'homeCard', at: 'home card cannot' },
    { name: 'cannot', at: 'cannot' },
  ],
};

// world layout (camera at rest = screen)
const LX = 440, RX = 1380;                                // column centres for the headers
const HEAD_Y = 220, DIV = [960, 300, 800];                // headers, divider x / top / bottom
const SCR = [440, 390, 320, 200];                         // computer screen centre x, y, w, h
const CARD = [440, 590, 320, 84];                         // the card slab, just under the stand
const SPARK = [770, 410];                                 // the idea
const FR = [1200, 410, 360, 203];                         // the episode frame (16:9)
const WAVE = { x0: 1050, x1: 1698, y: 590, n: 28, max: 92 };   // series canon: 12 px bars on a 24 px pitch
const BUB = [1380, 728];                                 // speech bubble centre
const CLOUDS = [[1090, 128], [1350, 112], [1610, 128]];
const NOTE = 44;

// text typed word by word (centred on cx, or left-aligned at `start`); words appear on their cues
function typed(parent, cx, y, words, cues, { size = NOTE, color = P.ink, start = null } = {}) {
  const it = new Item(parent, 0, 0);
  const node = el(it.g, 'text', { x: start ?? cx, y: y + size * 0.35, 'text-anchor': start === null ? 'middle' : 'start', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: color });
  it.type = (ctx, t) => {
    let k = 0;
    while (k < words.length && t >= ctx.cue(cues[k])) k++;
    node.textContent = words.slice(0, k).join(' ');
    return k;
  };
  return it;
}

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'youBring', delay: 0, dur: 1.4, x: 790, y: 510, z: 1.08 },   // onto what you bring
    { cue: 'youGet', delay: 0, dur: 1.4, x: 1060, y: 510, z: 1.04 },    // onto what you get (the faint left column stays inside the frame)
    { cue: 'few', delay: 0, dur: 1.4, x: 960, y: 540, z: 1 },           // back out wide for the clouds and the point
  ], ctx.cue);
  const W = stage.world;
  S = { stage, parts: makeParticles(ctx.rand(7)) };

  S.title = label(W, 'the test is simple', { size: type.title }).at(960, 520);

  // the clouds' jobs flow down to the episode (drawn first, so the header sits above the dots)
  S.flows = CLOUDS.map(([x, y], i) => flow(W, [[x, y + 50], [FR[0] - 120 + i * 120, FR[1] - FR[3] / 2 - 6]], { n: 3, r: 8, color: P.violet, period: 1.6 }));

  // divider and the two headers
  S.div = el(W, 'line', { x1: DIV[0], y1: DIV[1], x2: DIV[0], y2: DIV[1], stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '10 12', opacity: 0 });
  S.left = el(W, 'g');
  S.hBring = label(S.left, 'what you bring', { size: 56 }).at(LX, HEAD_Y);
  S.hGet = label(W, 'what you get', { size: 56 }).at(RX, HEAD_Y);

  // LEFT: the computer (screen + stand), the card slab (fan circle and fins) under it, the spark, the labels
  S.cardGlow = glow(W, { rx: 230, ry: 90, color: P.cool, strength: 0.45 }).at(CARD[0], CARD[1]);
  S.comp = new Item(S.left, SCR[2], SCR[3] + 50);
  el(S.comp.g, 'rect', { x: -SCR[2] / 2, y: -SCR[3] / 2, width: SCR[2], height: SCR[3], rx: 20, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.comp.g, 'rect', { x: -15, y: SCR[3] / 2, width: 30, height: 36, fill: P.dim });
  el(S.comp.g, 'rect', { x: -80, y: SCR[3] / 2 + 34, width: 160, height: 14, rx: 7, fill: P.dim });
  S.comp.at(SCR[0], SCR[1]);
  S.compText = typed(S.left, SCR[0], SCR[1], ['a', 'computer'], ['computer', 'computer'], { size: 44 });

  S.card = new Item(W, CARD[2], CARD[3]); // outside S.left so it can light up on 'home card'
  el(S.card.g, 'rect', { x: -CARD[2] / 2, y: -CARD[3] / 2, width: CARD[2], height: CARD[3], rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(S.card.g, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  S.fan = el(S.card.g, 'g');
  for (let i = 0; i < 3; i++) el(S.fan, 'line', { x1: 0, y1: 0, x2: 20 * Math.cos((i * 2 * Math.PI) / 3), y2: 20 * Math.sin((i * 2 * Math.PI) / 3), stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round' });
  for (let i = 0; i < 8; i++) el(S.card.g, 'line', { x1: -30 + i * 22, y1: -22, x2: -30 + i * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
  S.card.at(CARD[0], CARD[1]);
  S.cardText = typed(S.left, CARD[0], 680, ['decent', 'graphics', 'card'], ['decent', 'graphics', 'card'], { color: P.cool });
  S.smallText = typed(S.left, CARD[0], 680, ['smallest', 'card', 'tested'], ['smallest', 'card2', 'tested'], { color: P.cool });
  S.desc = chip(S.left, 'in the description', { color: P.dim, dashed: true }).at(CARD[0], 766);

  S.sparkGlow = glow(S.left, { r: 90, color: P.ink, strength: 0.25 }).at(...SPARK);
  S.spark = new Item(S.left, 90, 90);
  el(S.spark.g, 'path', { d: 'M 0 -44 Q 7 -7 44 0 Q 7 7 0 44 Q -7 7 -44 0 Q -7 -7 0 -44 Z', fill: P.ink });
  S.spark.at(...SPARK);
  S.sparkL1 = typed(S.left, SPARK[0], 520, ['something'], ['something']);
  S.sparkL2 = typed(S.left, SPARK[0], 580, ['to', 'explain'], ['explain', 'explain']);

  // a faint dashed outline holds the episode's place while the left column is spoken
  S.slot = el(W, 'rect', { x: FR[0] - FR[2] / 2, y: FR[1] - FR[3] / 2, width: FR[2], height: FR[3], rx: 18, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '12 10', opacity: 0 });

  // RIGHT: the episode frame with an abstract shape inside, its words beside it, the waveform, the speech bubble
  S.frame = new Item(W, FR[2], FR[3]);
  el(S.frame.g, 'rect', { x: -FR[2] / 2, y: -FR[3] / 2, width: FR[2], height: FR[3], rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.frame.g, 'path', { d: 'M -150 70 L -60 -10 L 10 50 L 70 0 L 150 70 Z', fill: P.dim, opacity: 0.55 });
  el(S.frame.g, 'circle', { cx: 90, cy: -40, r: 26, fill: P.ink, opacity: 0.6 });
  S.frame.at(FR[0], FR[1]);
  const lx = FR[0] + FR[2] / 2 + 50;
  S.epL1 = typed(W, 0, FR[1] - 34, ['a', 'real', 'episode'], ['real', 'real2', 'episode'], { start: lx });
  S.epL2 = typed(W, 0, FR[1] + 34, ['made', 'yourself'], ['made', 'yourself'], { start: lx });

  const r = ctx.rand(31);
  const step = (WAVE.x1 - WAVE.x0) / (WAVE.n - 1);
  S.bars = Array.from({ length: WAVE.n }, (_, i) => {
    const env = Math.sin(Math.PI * (0.15 + 0.7 * (i / (WAVE.n - 1))));
    const h = 22 + (WAVE.max - 22) * env * (0.45 + 0.55 * r());
    return { h, node: el(W, 'rect', { x: WAVE.x0 + i * step - 6, width: 12, rx: 6, fill: P.accent, opacity: 0 }) };
  });

  S.bubble = new Item(W, 400, 150);
  el(S.bubble.g, 'path', { d: 'M -200 -55 Q -200 -75 -180 -75 L -24 -75 L 0 -100 L 24 -75 L 180 -75 Q 200 -75 200 -55 L 200 55 Q 200 75 180 75 L -180 75 Q -200 75 -200 55 Z', fill: P.bg2, stroke: P.accent, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  S.bubble.at(...BUB);
  S.bubL1 = typed(W, BUB[0], BUB[1] - 30, ['your', 'own', 'voice'], ['your', 'own', 'voice'], { color: P.accent });
  S.bubL2 = typed(W, BUB[0], BUB[1] + 32, ['only', 'yours'], ['only', 'yours'], { color: P.accent });

  // the clouds at the top, each with its small job sign beside it (code bracket, pencil, code bracket)
  S.clouds = CLOUDS.map(([x, y], i) => {
    const it = new Item(W, 130, 80);
    const c = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 4 };
    el(it.g, 'circle', { cx: -36, cy: 8, r: 28, ...c });
    el(it.g, 'circle', { cx: 38, cy: 10, r: 26, ...c });
    el(it.g, 'circle', { cx: 0, cy: -8, r: 38, ...c });
    const s = { fill: 'none', stroke: P.violet, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    const j = el(it.g, 'g', { transform: 'translate(92 4)' });
    if (i === 1) {
      el(j, 'path', { d: 'M -14 16 L 10 -12 L 18 -4 L -6 24 L -16 26 Z', ...s });
    } else {
      el(j, 'path', { d: 'M -8 -16 L -20 0 L -8 16', ...s });
      el(j, 'path', { d: 'M 8 -16 L 20 0 L 8 16', ...s });
    }
    return it.at(x, y);
  });

  S.final = label(W, 'in your own voice and only yours', { size: 64, color: P.ink }).at(960, 860);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const fin = reveal(t, c('cannot') - 0.2, 0.5);

  // opening line, gone before the headers arrive
  S.title.show(reveal(t, c('test') + 0.1, 0.4) * (1 - prog(t, c('bring') - 0.35, 0.3)));

  // divider and headers; spotlight follows the column being spoken
  const dv = ease.inOut(prog(t, c('bring'), 0.9));
  set(S.div, { y2: lerp(DIV[1], DIV[2], dv).toFixed(1), opacity: +(dv > 0 ? 0.8 : 0).toFixed(2) });
  const headGone = 1 - prog(t, c('cloud') - 0.2, 0.4); // the clouds' jobs flow down through the header row
  S.hBring.show(reveal(t, c('bring'), 0.4) * headGone).dim(lerp(1, 0.6, fadeBetween(t, c('get'), c('youBring'), 0.4)));
  S.hGet.show(reveal(t, c('get'), 0.4) * headGone).dim(lerp(lerp(lerp(1, 0.5, reveal(t, c('youBring'), 0.6)), 1, reveal(t, c('youGet'), 0.6)), 0.6, reveal(t, c('few'), 0.6)));

  // the whole left column steps back while the right is spoken (kept faint so the moved camera cuts nothing readable), and comes back for the overview
  const leftDim = lerp(lerp(dimAfter(t, c('youGet'), 0.32), 0.6, reveal(t, c('few') + 1.5, 0.6)), 0.2, fin);
  set(S.left, { opacity: +leftDim.toFixed(3) });

  // computer and its typed words
  const cShow = reveal(t, c('computer'), 0.5);
  const cDim = dimAfter(t, c('decent'), 0.55);
  S.comp.show(cShow).dim(cDim);
  S.compText.type(ctx, t);
  S.compText.show(cShow).dim(cDim);

  // the card slab: bright on its words, again on 'smallest' (where it shrinks a little), and glows on 'home card'
  const kShow = reveal(t, c('decent'), 0.5);
  const kDim = lerp(lerp(dimAfter(t, c('something'), 0.55), 1, reveal(t, c('smallest'), 0.4)), 0.55, reveal(t, c('description'), 0.5));
  const shrink = lerp(1, 0.8, ease.inOut(prog(t, c('smallest'), 0.7)));
  const home = fadeBetween(t, c('homeCard'), c('cannot') + 0.3);
  S.card.show(kShow).dim(lerp(kDim * leftDim, 1, home) * (1 - 0.6 * fin)).at(CARD[0], CARD[1], shrink);
  set(S.fan, { transform: `translate(-100 0) rotate(${((t * 140) % 360).toFixed(1)})` });
  S.cardGlow.pulse(t, (fadeBetween(t, c('smallest'), c('description')) * leftDim + home) * (1 - reveal(t, c('inYour'), 0.6))); // gone before the close
  S.cardText.type(ctx, t);
  S.cardText.show(kShow * (1 - prog(t, c('smallest') - 0.35, 0.3))).dim(dimAfter(t, c('something'), 0.55));
  S.smallText.type(ctx, t);
  S.smallText.show(1).dim(dimAfter(t, c('description'), 0.55));
  S.desc.show(reveal(t, c('description'), 0.5) * (1 - prog(t, c('homeCard'), 0.4))).dim(dimAfter(t, c('youGet'), 0.6));

  // the spark for the idea
  const sShow = reveal(t, c('something'), 0.5);
  const sDim = dimAfter(t, c('name'), 0.55);
  S.spark.show(sShow).dim(sDim).at(SPARK[0], SPARK[1], 1 + 0.06 * Math.sin(t * 3), t * 12);
  S.sparkGlow.pulse(t, sShow * sDim);
  S.sparkL1.type(ctx, t); S.sparkL1.show(sShow).dim(sDim);
  S.sparkL2.type(ctx, t); S.sparkL2.show(1).dim(sDim);

  // the episode frame and its words (the dashed placeholder gives way to it)
  set(S.slot, { opacity: +(0.5 * reveal(t, c('get'), 0.5) * (1 - reveal(t, c('real'), 0.4))).toFixed(3) });
  const fShow = reveal(t, c('real'), 0.6);
  const fDim = lerp(lerp(dimAfter(t, c('inYour'), 0.6), 1, reveal(t, c('parts'), 0.5)), 0.4, fin);
  S.frame.show(fShow).dim(fDim).at(FR[0], FR[1], lerp(0.9, 1, fShow));
  S.epL1.type(ctx, t); S.epL1.show(1 - 0.5 * fin).dim(dimAfter(t, c('made'), 0.6));
  S.epL2.type(ctx, t); S.epL2.show(1 - 0.5 * fin).dim(dimAfter(t, c('inYour'), 0.6));

  // the waveform grows in left to right on 'in your own voice', then plays with a soft highlight sweeping across
  const play = t >= c('voice');
  const pos = (((t - c('voice')) / 2.2) % 1) * (WAVE.n + 8) - 4;
  const wDim = lerp(1, 0.75, reveal(t, c('few'), 0.5));
  S.bars.forEach(({ h, node }, i) => {
    const g = ease.out(prog(t, c('inYour') + i * 0.025, 0.4));
    const hh = Math.max(12, h * g);
    const lit = play ? Math.exp(-((i - pos) ** 2) / 6) : 0;
    set(node, { y: (WAVE.y - hh / 2).toFixed(1), height: hh.toFixed(1), opacity: +(g * wDim * (0.6 + 0.4 * lit)).toFixed(3) });
  });

  // one speech bubble: 'your own voice' / 'only yours'
  const bShow = reveal(t, c('inYour'), 0.5);
  const afterFew = reveal(t, c('few'), 0.5);
  S.bubble.show(bShow * (1 - fin)).dim(lerp(1, 0.6, afterFew)); // leaves with its words: the closing phrase says them
  S.bubL1.type(ctx, t); S.bubL1.show(bShow * (1 - fin)).dim(lerp(dimAfter(t, c('only'), 0.7), 0.5, afterFew));
  S.bubL2.type(ctx, t); S.bubL2.show(bShow * (1 - fin)).dim(lerp(1, 0.5, afterFew));

  // the clouds arrive once the camera is wide and send their small jobs down to the episode
  S.clouds.forEach((it, i) => it.show(reveal(t, c('cloud') + i * 0.2, 0.5) * (1 - 0.7 * fin)).at(CLOUDS[i][0], CLOUDS[i][1] + 4 * Math.sin(t * 1.6 + i)));
  const fl = reveal(t, c('models'), 0.5);
  S.flows.forEach((f, i) => f.update(t + i * 0.5, fl * (1 - 0.7 * fin)));

  // the point, held through the tail
  S.final.show(fin);
}
