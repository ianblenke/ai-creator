// Scene 01: cold open. Two cards: three unconnected tags (every fact) and one kettle whose boiling water is linked to its switch (the reason).
// The kettle starts between the cards and gives the first its tags; a page shows the list reads fine; a listener leans toward the second card.
import { palette as P, ease, lerp, el, set, prog } from 'style';
import { type, label, makeStage, paintBackground, makeParticles, reveal, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'two', at: 'two ways' },
    { name: 'kettle', at: 'made-up kettle' },
    { name: 'first', at: 'The first: this' },
    { name: 'thermo', at: 'thermostat' },
    { name: 'steel', at: 'steel base' },
    { name: 'lid', at: 'lid that locks' },
    { name: 'second', at: 'The second: this' },
    { name: 'switches', at: 'switches itself off' },
    { name: 'water', at: 'the water' },
    { name: 'boils', at: 'water boils' },
    { name: 'walk', at: 'walk away' },
    { name: 'first2', at: 'The first is' },
    { name: 'had', at: 'every fact I had' },
    { name: 'second2', at: 'The second is' },
    { name: 'reason', at: 'the reason' },
    { name: 'script', at: 'script written' },
    { name: 'reads', at: 'reads fine' },
    { name: 'page', at: 'on a page' },
    { name: 'list', at: 'like a list' },
    { name: 'someone', at: 'someone hears' },
    { name: 'hears', at: 'hears it' },
    { name: 'part', at: 'This part' },
    { name: 'catching', at: 'catching that' },
  ],
};

const END = 'catching that before you record a word';
const CL = 500, CR = 1420, CY = 410, CW = 520, CH = 480; // card centres and size
const TAGX = [340, 500, 660], TAGY = 450, TAG = 96;
const KX0 = 960, KX = 1420, KY = 450; // kettle: first between the cards, then in the right card
const ROWY = [270, 410, 550]; // the script page's rows: a heading bar on the left, text bars to its right
const TAGPX = CL + 130, TAGPS = 0.55; // on the page each tag is a small inline mark at the end of its row's first text bar
const LX = 960, LY = 540; // listener centre (feet at LY + 110)

let S;
const group = (parent) => new Item(parent);
// spotlight level from [time, value] steps, each eased over 0.6 s; a pure function of t
const level = (t, steps, start = 1) => steps.reduce((v, [at, to]) => lerp(v, to, ease.inOut(prog(t, at, 0.6))), start);
const bump = (t, at, dur) => Math.sin(Math.PI * prog(t, at, dur));
const tickD = 'M -24 0 L -7 17 L 26 -20';

function drawTag(parent, k) {
  const g = el(parent, 'g', { opacity: 0 });
  el(g, 'rect', { x: -TAG / 2, y: -TAG / 2, width: TAG, height: TAG, rx: 20, fill: P.bg, stroke: P.dim, 'stroke-width': 4 });
  const s = { fill: 'none', stroke: P.ink, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (k === 0) { // thermostat: a thermometer
    el(g, 'rect', { x: -8, y: -32, width: 16, height: 42, rx: 8, ...s });
    el(g, 'circle', { cx: 0, cy: 20, r: 13, ...s });
    el(g, 'line', { x1: 0, y1: -14, x2: 0, y2: 14, ...s });
  } else if (k === 1) { // steel base: a flat disc on a short stem
    el(g, 'line', { x1: 0, y1: -28, x2: 0, y2: 8, ...s });
    el(g, 'ellipse', { cx: 0, cy: 16, rx: 34, ry: 10, ...s });
  } else { // locked lid: a padlock
    el(g, 'path', { d: 'M -13 -6 V -16 A 13 13 0 0 1 13 -16 V -6', ...s });
    el(g, 'rect', { x: -21, y: -6, width: 42, height: 32, rx: 6, ...s });
  }
  return g;
}

// THE KETTLE (bible canon, same form as scenes 03 to 05): trapezoid body, flat lid knob, handle on the left,
// straight spout on the right, switch dot just under the handle's lower end. About 232 px wide.
function drawKettle(g) {
  const ink = { stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' };
  el(g, 'path', { d: 'M 68 -4 L 118 -48 L 108 -58 L 60 -32', fill: P.bg2, ...ink });
  el(g, 'path', { d: 'M -84 90 L 74 90 Q 86 90 83 78 L 60 -50 Q 56 -70 36 -70 L -46 -70 Q -66 -70 -69 -50 L -88 78 Q -90 90 -84 90 Z', fill: P.bg2, ...ink });
  const water = el(g, 'path', { d: 'M -78 24 Q -60 16 -40 24 T 0 24 T 40 24 T 74 24 L 80 76 Q 81 84 72 84 L -78 84 Q -84 84 -83 76 Z', fill: P.ink, 'fill-opacity': 0.14 });
  const bubbles = [-50, -14, 22, 52].map(() => el(g, 'circle', { r: 6, fill: 'none', stroke: P.ink, 'stroke-width': 3, opacity: 0 }));
  el(g, 'rect', { x: -16, y: -86, width: 32, height: 16, rx: 8, fill: P.bg2, ...ink });
  el(g, 'path', { d: 'M -66 -44 Q -124 -40 -114 22 Q -108 54 -84 58', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
  // the switch: a short track with a dot that clicks from on (top) to off (bottom)
  el(g, 'rect', { x: -117, y: 56, width: 26, height: 52, rx: 13, fill: P.bg, stroke: P.dim, 'stroke-width': 3 });
  const sw = el(g, 'circle', { cx: -104, cy: 69, r: 10, fill: P.dim });
  const link = el(g, 'path', { d: 'M 0 64 Q -46 80 -80 80 L -92 82', fill: 'none', stroke: P.accent, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 });
  return { water, bubbles, sw, link };
}

// the one neutral figure (bible canon): outlined head over an outlined rounded body, two ear arcs; origin at the centre
function drawListener(g) {
  // pivot group: the lean rotates the figure about its feet (0, 110)
  g = el(g, 'g');
  S.lean = g;
  el(g, 'path', { d: 'M -62 110 L -62 10 Q -62 -28 -24 -28 L 24 -28 Q 62 -28 62 10 L 62 110 Z', fill: P.bg2, stroke: P.dim, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(g, 'circle', { cx: 0, cy: -72, r: 36, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  return ['M -36 -88 Q -56 -72 -36 -56', 'M 36 -88 Q 56 -72 36 -56'].map((d) => el(g, 'path', { d, fill: 'none', stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round' }));
}

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 470, z: 1.04 }, // cards sit a little low until the words below them arrive
    { cue: 'first', dur: 1.4, x: 900, y: 470, z: 1.04 },
    { cue: 'second', dur: 1.4, x: 1020, y: 470, z: 1.04 },
    { cue: 'first2', dur: 1.4, x: 900, y: 470, z: 1.04 },
    { cue: 'had', dur: 1.4, x: 900, y: 530, z: 1.04 },
    { cue: 'second2', dur: 1.4, x: 1020, y: 530, z: 1.04 },
    { cue: 'script', dur: 1.4, x: 960, y: 530, z: 1.02 },
    { cue: 'part', dur: 1.4, x: 960, y: 560, z: 0.94 },
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // left card (fades into a page at "script"); its three tags are separate so they can move
  S.left = group(W);
  S.leftCard = el(S.left.g, 'g');
  el(S.leftCard, 'rect', { x: CL - CW / 2, y: CY - CH / 2, width: CW, height: CH, rx: 28, fill: P.bg2, 'fill-opacity': 0.85, stroke: P.dim, 'stroke-width': 4 });
  S.leftTitle = label(S.leftCard, 'the first', { size: type.label }).at(CL, 240);
  S.page = el(S.left.g, 'g', { opacity: 0 });
  el(S.page, 'rect', { x: CL - 180, y: CY - 235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  ROWY.forEach((y) => el(S.page, 'rect', { x: CL - 150, y: y - 14, width: 54, height: 28, rx: 10, fill: P.ink })); // the three heading bars (canon)
  S.bars = ROWY.flatMap((y) => [[CL - 80, y, 150], [CL - 80, y + 46, 200]].map(([x, yy, w]) => ({ w, r: el(S.page, 'rect', { x, y: yy - 9, width: w, height: 18, rx: 9, fill: P.ink, 'fill-opacity': 0.8 }) })));
  S.pageTick = el(S.page, 'path', { d: tickD, transform: `translate(${CL + 140} ${CY - 195}) scale(0.8)`, fill: 'none', stroke: P.accent, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });
  S.tags = [0, 1, 2].map((k) => drawTag(S.left.g, k));

  // right card: the kettle glides in at "The second"
  S.right = group(W);
  S.rightRect = el(S.right.g, 'rect', { x: CR - CW / 2, y: CY - CH / 2, width: CW, height: CH, rx: 28, fill: P.bg2, 'fill-opacity': 0.85, stroke: P.dim, 'stroke-width': 4 });
  S.rightTitle = label(S.right.g, 'the second', { size: type.label }).at(CR, 240);
  S.kettle = group(W);
  Object.assign(S, drawKettle(S.kettle.g));
  S.linkLen = S.link.getTotalLength();
  S.tick = el(S.kettle.g, 'path', { d: tickD, transform: 'translate(170 140)', fill: 'none', stroke: P.accent, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });

  // short words under the cards
  S.had = label(W, 'every fact I had', { size: type.label, color: P.ink }).at(CL, 720);
  S.listWord = group(W).at(CL, 720);
  const lw = label(S.listWord.g, 'a list', { size: type.label, color: P.ink });
  S.listLine = el(S.listWord.g, 'rect', { x: -lw.w / 2, y: 34, width: lw.w, height: 6, rx: 3, fill: P.hot });
  lw.show(1); S.listW = lw.w;
  S.reason = label(W, 'the reason', { size: type.label, color: P.accent }).at(CR, 720);

  // the listener: the series' neutral figure; it steps and leans toward the second card
  S.listener = group(W);
  S.ears = drawListener(S.listener.g);

  // the end phrase, fixed on screen
  S.end = label(stage.hud, END, { size: 64, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // card spotlights follow the narration back and forth
  const lv = level(t, [[c('first'), 1], [c('second'), 0.35], [c('first2'), 1], [c('second2'), 0.35], [c('script'), 1], [c('hears'), 0.5], [c('part'), 0.4]]);
  const rv = level(t, [[c('first'), 0.35], [c('second'), 1], [c('first2'), 0.35], [c('second2'), 1], [c('script'), 0.35], [c('hears'), 0.85], [c('part'), 0.45]]);
  S.left.show(reveal(t, c('two'), 0.6)).dim(lv);
  S.right.show(reveal(t, c('two') + 0.3, 0.6)).dim(rv);
  S.leftTitle.show(reveal(t, c('first'), 0.5));
  S.rightTitle.show(reveal(t, c('second'), 0.5));

  // "A script written like the first": the card and its heading fade fully out, then the script page fades in (never both outlines)
  const toPage = ease.inOut(prog(t, c('script'), 0.35)); // tags glide to their rows while no border is shown
  set(S.leftCard, { opacity: +(1 - toPage).toFixed(3) });
  set(S.page, { opacity: +ease.inOut(prog(t, c('script') + 0.35, 0.35)).toFixed(3) });
  S.bars.forEach((b, k) => set(b.r, { width: (b.w * ease.out(prog(t, c('script') + 0.7 + 0.12 * k, 0.4))).toFixed(1) }));
  // the page's tick says it reads fine; at "sounds like a list" it goes, so only the second card keeps a tick
  set(S.pageTick, { opacity: +(reveal(t, c('page'), 0.4) * (1 - ease.inOut(prog(t, c('list'), 0.6)))).toFixed(3) });

  // tags: each comes out of the kettle when named, earlier ones step back; "reads fine" passes over them one by one
  const tc = [c('thermo'), c('steel'), c('lid')];
  S.tags.forEach((g, k) => {
    const out = ease.inOut(prog(t, tc[k], 0.6));
    const x0 = lerp(lerp(KX0 - 150, TAGX[k], out), TAGPX, toPage);
    const y0 = lerp(TAGY, ROWY[k], toPage);
    const d = k < 2 ? level(t, [[tc[k + 1], 0.45], [c('second'), 1]]) : 1;
    const s = (0.6 + 0.4 * out) * lerp(1, TAGPS, toPage) * (1 + 0.12 * bump(t, c('reads') + 0.35 * k, 0.6));
    set(g, { transform: `translate(${x0.toFixed(1)} ${y0.toFixed(1)}) scale(${s.toFixed(4)})`, opacity: +(reveal(t, tc[k], 0.4) * d).toFixed(3) });
  });

  // kettle: centred between the cards, glides into the right card at "The second"
  const kx = lerp(KX0, KX, ease.inOut(prog(t, c('second'), 1.2)));
  const kd = level(t, [[c('first2'), 0.35], [c('second2'), 1], [c('script'), 0.35], [c('hears'), 0.85], [c('part'), 0.45]]);
  S.kettle.show(reveal(t, c('kettle'), 0.6)).dim(kd).at(kx, KY);
  // the right card's border steps aside while the kettle glides across it
  set(S.rightRect, { 'stroke-opacity': +(1 - Math.min(1, 1.7 * bump(t, c('second'), 1.2))).toFixed(3) });
  // the switch is the subject at "switches"; at "boils" one line runs from the water to it, then it clicks off and the bubbles stop
  const lk = ease.inOut(prog(t, c('boils'), 0.5));
  const off = ease.inOut(prog(t, c('boils') + 0.45, 0.2)); // clicks off as the line arrives
  set(S.sw, { cy: (69 + 26 * off).toFixed(1), fill: reveal(t, c('switches'), 0.4) > 0.5 ? P.accent : P.dim });
  set(S.link, { 'stroke-dasharray': `${S.linkLen} ${S.linkLen}`, 'stroke-dashoffset': (S.linkLen * (1 - lk)).toFixed(2), opacity: lk > 0 ? 1 : 0 });
  const boil = reveal(t, c('water'), 0.4) * (1 - ease.inOut(prog(t, c('boils') + 0.6, 1.0)));
  S.bubbles.forEach((b, i) => {
    const u = ((t * 0.9 + i * 0.29) % 1 + 1) % 1;
    set(b, { cx: [-50, -14, 22, 52][i], cy: (76 - 44 * u).toFixed(1), opacity: +(boil * Math.sin(Math.PI * u)).toFixed(3) });
  });
  set(S.tick, { opacity: +reveal(t, c('walk'), 0.5).toFixed(3) });

  // short words: "every fact I had" gives way to "a list" (never overlapping)
  S.had.show(reveal(t, c('had'), 0.5) * (1 - ease.in(prog(t, c('script'), 0.5)))).dim(level(t, [[c('second2'), 0.4], [c('script'), 1]]));
  S.listWord.show(reveal(t, c('list'), 0.5)).dim(level(t, [[c('hears'), 0.5], [c('part'), 0.4]]));
  set(S.listLine, { width: (S.listW * reveal(t, c('list') + 0.3, 0.4)).toFixed(1) });
  S.reason.show(reveal(t, c('reason'), 0.5)).dim(level(t, [[c('script'), 0.35], [c('hears'), 0.85], [c('part'), 0.45]]));

  // the listener arrives, its ears light and it steps toward the second card
  const step = 30 * ease.inOut(prog(t, c('hears') + 0.2, 1.0));
  S.listener.show(reveal(t, c('someone'), 0.6)).dim(level(t, [[c('part'), 0.6]])).at(LX + step, LY);
  set(S.lean, { transform: `rotate(${(10 * ease.inOut(prog(t, c('hears'), 1.0))).toFixed(2)} 0 110)` }); // leans toward the second card
  const ear = reveal(t, c('hears'), 0.4);
  S.ears.forEach((e) => set(e, { stroke: ear > 0.5 ? P.accent : P.dim }));

  S.end.show(reveal(t, c('catching'), 0.6));
}
