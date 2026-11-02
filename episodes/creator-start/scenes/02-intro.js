// 02 - intro: the lone author dot at the left; THE TRACK unrolls to the right (plan, voice, pictures, ship).
// The check from the cold open is "one piece" (the voice stop lights first), the pipeline is taken "apart", the stops light
// "one at a time", the words 'the map' arrive and the track brightens end to end, then the dot walks the whole track once.
// THE TRACK geometry (reused by later scenes): stops at x 560 / 880 / 1200 / 1520 on y 540, 150 px rounded squares,
// labels 48 px below; the line runs only between the boxes. The author dot starts at x 250 and walks to x 1690.
import { palette as P, font, prog, ease, lerp, clamp, el, set } from 'style';
import { type, Item, label, glow, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'hi', at: 'Hi' },                       // the lone dot
    { name: 'check', at: 'That check' },            // the voice stop arrives with the cold open's caught bar, ringed
    { name: 'piece', at: 'one piece' },             // the voice stop appears, lit
    { name: 'pipeline', at: 'of a pipeline' },      // camera pulls out, the track unrolls, the other stops arrive
    { name: 'apart', at: 'apart' },                 // the stops spread apart and settle back
    { name: 'person', at: 'one person' },           // the dot is spotlit and named
    { name: 'finished', at: 'finished' },           // the promise, word by word
    { name: 'narrated', at: 'narrated' },
    { name: 'explainer', at: 'explainer' },
    { name: 'series', at: 'series, one problem' },
    { name: 'oneatatime', at: 'one problem at a time' }, // the stops light one at a time
    { name: 'first', at: 'This first video' },      // the promise clears
    { name: 'map', at: 'the map' },                 // 'the map' + the track brightens end to end
    { name: 'shows', at: 'It shows' },              // the 'one person' label clears
    { name: 'end', at: 'could end up' },            // the destination past the last stop lights
    { name: 'how', at: 'how the pipeline' },        // the dot walks the whole track
    { name: 'there', at: 'you there' },             // the dot arrives
    { name: 'foryou', at: 'whether it is for you' }, // the dot pulses at the destination
  ],
};

const Y = 540, HOME = 250, END = 1690;
const STOPS = [
  { x: 560, name: 'plan' }, { x: 880, name: 'voice' }, { x: 1200, name: 'pictures' }, { x: 1520, name: 'ship' },
];
const SZ = 150;
const PROMISE = ['finished,', 'narrated', 'explainer', 'series'];
let S;

// The stop's icon, drawn in one colour.
function icon(g, kind, color) {
  const st = { fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 'plan') {
    el(g, 'rect', { x: -28, y: -36, width: 56, height: 72, rx: 8, ...st });
    [[-18, 16], [-4, 10], [10, 16], [24, 4]].forEach(([y, r]) => el(g, 'line', { x1: -16, x2: r, y1: y, y2: y, ...st }));
  } else if (kind === 'voice') {
    [18, 34, 52, 30, 44, 22, 14].forEach((h, i) => el(g, 'rect', { x: -39.5 + i * 12, y: -h / 2, width: 7, height: h, rx: 3.5, fill: color }));
  } else if (kind === 'pictures') {
    el(g, 'rect', { x: -44, y: -25, width: 88, height: 50, rx: 8, ...st });
    el(g, 'circle', { cx: -20, cy: -6, r: 7, fill: color });
    el(g, 'path', { d: 'M -8 16 L 12 -6 L 32 16 Z', fill: color });
  } else {
    el(g, 'path', { d: 'M -34 0 L 30 0 M 10 -20 L 32 0 L 10 20', ...st });
  }
}

// A track stop: a dim layer and an accent layer on top; `lit` 0..1 blends between them.
function stop(parent, kind) {
  const it = new Item(parent, SZ, SZ);
  const base = el(it.g, 'g');
  el(base, 'rect', { x: -SZ / 2, y: -SZ / 2, width: SZ, height: SZ, rx: 34, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  icon(base, kind, P.dim);
  it.litG = el(it.g, 'g', { opacity: 0 });
  el(it.litG, 'rect', { x: -SZ / 2, y: -SZ / 2, width: SZ, height: SZ, rx: 34, fill: P.bg2, stroke: P.accent, 'stroke-width': 5 });
  el(it.litG, 'rect', { x: -SZ / 2, y: -SZ / 2, width: SZ, height: SZ, rx: 34, fill: P.accent, 'fill-opacity': 0.12 });
  icon(it.litG, kind, P.accent);
  it.lit = (k) => set(it.litG, { opacity: +clamp(k).toFixed(3) });
  return it;
}

export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: 0, dur: 0.01, x: 600, y: Y, z: 1.5 },                       // close on the lone dot at the left margin, room for the first stop
    { cue: 'pipeline', delay: -0.3, dur: 1.5, x: 970, y: Y, z: 1 }, // pull out to the whole pipeline
    { cue: 'first', delay: 0, dur: 1.4, x: 970, y: 600, z: 1 },     // settle up, leaving room for the closing phrase below
  ], ctx.cue);
  const W = S.stage.world;

  // the track line, only between the boxes: a dim layer and an accent layer (the brightening sweep), one segment per gap
  const seg = (color) => STOPS.slice(1).map(() => el(W, 'line', { y1: Y, y2: Y, stroke: color, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }));
  S.lineDim = seg(P.dim);
  S.lineLit = seg(P.accent);

  // a faint ring stays at home once the dot leaves
  S.home = el(W, 'circle', { cx: HOME, cy: Y, r: 30, fill: 'none', stroke: P.ink, 'stroke-width': 4, opacity: 0 });
  S.personGlow = glow(W, { r: 90, color: P.ink, strength: 0.22 }).at(HOME, Y);
  // the author dot (drawn under the stops so it passes through them)
  S.dot = new Item(W, 64, 64);
  el(S.dot.g, 'circle', { cx: 0, cy: 0, r: 30, fill: 'none', stroke: P.ink, 'stroke-width': 4 });
  el(S.dot.g, 'circle', { cx: 0, cy: 0, r: 14, fill: P.ink });

  S.stops = STOPS.map((s) => stop(W, s.name).at(s.x, Y));
  // the check carried over from the cold open: the caught bar of the voice icon in magenta, ringed
  S.caught = el(S.stops[1].g, 'g', { opacity: 0 });
  el(S.caught, 'rect', { x: -3.5, y: -15, width: 7, height: 30, rx: 3.5, fill: P.hot });
  el(S.caught, 'circle', { cx: 0, cy: 0, r: 24, fill: 'none', stroke: P.hot, 'stroke-width': 3 });
  S.labels = STOPS.map((s) => label(W, s.name, { size: type.label }).at(s.x, Y + SZ / 2 + 48));
  S.endGlow = glow(W, { r: 110, color: P.accent, strength: 0.35 }).at(END, Y);
  S.person = label(W, 'one person', { size: 44, color: P.ink }).at(HOME, Y + 100);

  // the promise, centred, revealed word by word
  const tx = el(W, 'text', { x: 970, y: 300, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 56, 'font-weight': 700, fill: P.ink, opacity: 0 });
  S.promise = tx;
  S.words = PROMISE.map((w, i) => el(tx, 'tspan', { opacity: 0 }, (i ? ' ' : '') + w));
  S.title = label(W, 'this first video is the map', { size: type.title, color: P.ink }).at(970, 900); // screen y 840 after the settle
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // appearance of each stop: the voice stop on "one piece", the others as the track unrolls past them
  const unroll = lerp(STOPS[0].x, STOPS[3].x, ease.inOut(prog(t, c('pipeline'), 1.6)));
  const appear = STOPS.map((s, i) => (i === 1 ? reveal(t, c('check'), 0.5) : reveal(t, c('pipeline') + 0.15 + i * 0.35, 0.5)));

  // "apart": the stops spread and settle back on their marks
  const spread = fadeBetween(t, c('apart'), c('person') - 0.1, 0.45);
  const pos = STOPS.map((s, i) => [s.x + (i - 1.5) * 90 * spread, Y + (i % 2 ? 70 : -70) * spread]);

  // lit: voice from "one piece" until "apart"; one at a time; then the end-to-end sweep on "the map", which stays
  const sweep = lerp(HOME, END, ease.inOut(prog(t, c('map'), 1.1)));
  const lit = STOPS.map((s, i) => {
    const first = i === 1 ? reveal(t, c('piece') + 0.2, 0.4) * (1 - ease.inOut(prog(t, c('apart'), 0.5))) : 0;
    const s0 = c('oneatatime') + i * 0.38;
    const one = fadeBetween(t, s0, s0 + 0.3, 0.12);
    const map = t >= c('map') ? clamp((sweep - (s.x - SZ / 2)) / SZ) : 0;
    return Math.max(first, one, map);
  });

  // the walk: the dot leaves home on "how the pipeline" and arrives past the last stop on "you there"
  const walk = ease.inOut(prog(t, c('how'), c('there') + 0.45 - c('how')));
  const dx = lerp(HOME, END, walk);

  // track segments: box edge to box edge, clipped by the unroll; the lit layer by the sweep; they break while the stops spread
  const breakA = 1 - spread;
  for (let i = 0; i < 3; i++) {
    const x1 = pos[i][0] + SZ / 2, y1 = pos[i][1], x2 = pos[i + 1][0] - SZ / 2, y2 = pos[i + 1][1];
    const k = clamp((unroll - x1) / (x2 - x1));
    set(S.lineDim[i], { x1, y1, x2: lerp(x1, x2, k), y2: lerp(y1, y2, k), opacity: +(0.8 * (k > 0 ? 1 : 0) * breakA).toFixed(3) });
    const kl = t >= c('map') ? clamp((sweep - x1) / (x2 - x1)) : 0;
    set(S.lineLit[i], { x1, y1, x2: lerp(x1, x2, kl), y2: lerp(y1, y2, kl), opacity: kl > 0 ? 1 : 0 });
  }

  // the stops; during the walk the one the dot is passing through swells a little
  S.stops.forEach((st, i) => {
    const inside = clamp(1 - Math.abs(dx - STOPS[i].x) / (SZ * 0.7)) * reveal(t, c('how'), 0.3);
    st.at(pos[i][0], pos[i][1], 1 + 0.08 * ease.inOut(inside)).show(appear[i]);
    st.lit(lit[i]);
    S.labels[i].at(pos[i][0], pos[i][1] + SZ / 2 + 48).show(appear[i]).dim(0.55 + 0.45 * Math.max(lit[i], inside));
  });

  // the dot: there from the start, spotlit on "one person", then walks
  const beat = Math.sin(Math.PI * prog(t, c('foryou'), 0.7));
  S.dot.at(dx, Y, 1 + 0.25 * beat).show(reveal(t, c('hi'), 0.6));
  set(S.home, { opacity: +(0.35 * clamp((dx - HOME) / 60)).toFixed(3) });
  S.personGlow.at(dx, Y);
  S.personGlow.pulse(t, fadeBetween(t, c('person'), c('first'), 0.5));
  S.person.show(fadeBetween(t, c('person'), c('shows'), 0.5));
  S.endGlow.pulse(t, reveal(t, c('end'), 0.6));

  // the promise, one word at a time, cleared as the last stop lights
  const words = ['finished', 'narrated', 'explainer', 'series'];
  S.words.forEach((w, i) => set(w, { opacity: +reveal(t, c(words[i]), 0.4).toFixed(3) }));
  set(S.promise, { opacity: +(fadeBetween(t, c('finished'), c('oneatatime') + 1.3, 0.5)).toFixed(3) });

  set(S.caught, { opacity: +fadeBetween(t, c('check') + 0.2, c('apart'), 0.4).toFixed(3) });
  S.title.show(reveal(t, c('map'), 0.6));
}
