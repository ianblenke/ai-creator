// 09 - close: three words appear as they are spoken (plan, voice, check) over a faint callback of the track; the matching stop
// lights with each word, on "check" a scan line sweeps under the track and the word turns acid green, and a small unlabeled
// arrow points right to the next part. The track geometry and icons are scene 02's.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { Item, label, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter } from 'kit';

export const meta = {
  cues: [
    { name: 'idea', at: 'the idea is simple' },  // the faint track fades in behind
    { name: 'plan', at: 'Plan before' },
    { name: 'voice', at: 'the voice lead' },
    { name: 'check', at: 'and check what' },
    { name: 'next', at: 'Next' },                // all three words back in focus, the arrow points on
    { name: 'works', at: 'that check works' },   // check gets one soft pulse
  ],
};

const Y = 540;                                     // THE TRACK as scene 02 defines it
const STOPS = [560, 880, 1200, 1520];              // plan, voice, pictures, ship
const KINDS = ['plan', 'voice', 'pictures', 'ship'];
const SZ = 150;
const WY = 780;                                    // the three words, below the track
const WORDS = ['plan', 'voice', 'check'];
const GAP = 110;                                   // equal gaps between the words, the group centred on x 960
const WW = WORDS.map((w) => measure(w, 120));
const WX = WW.map((w, i) => 960 - (WW.reduce((a, b) => a + b) + GAP * 2) / 2 + WW.slice(0, i).reduce((a, b) => a + b, 0) + GAP * i + w / 2);
const AX = WX[2] + WW[2] / 2 + 130;               // the unlabeled next arrow, just clear of "check"
let S;

// blend two #rrggbb colours
const mix = (a, b, k) => '#' + [1, 3, 5].map((i) => Math.round(lerp(parseInt(a.substr(i, 2), 16), parseInt(b.substr(i, 2), 16), k)).toString(16).padStart(2, '0')).join('');

// The stop's icon, drawn in one colour (same drawing as scene 02).
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

// A track stop (as scene 02): a dim layer and an accent layer on top; `lit` 0..1 blends between them.
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
    { t: 0, dur: 0.01, x: 960, y: 520, z: 1.06 },
    { cue: 'next', delay: 0, dur: 1.6, x: 1000, y: 520, z: 1 },  // ease out wide for the last frame
  ], ctx.cue);
  const W = S.stage.world;

  // the faint track: connector segments only between box edges, then the stops
  S.track = new Item(W, 0, 0);
  for (let i = 0; i < 3; i++) el(S.track.g, 'line', { x1: STOPS[i] + SZ / 2, y1: Y, x2: STOPS[i + 1] - SZ / 2, y2: Y, stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round' });
  S.stops = KINDS.map((k, i) => stop(W, k).at(STOPS[i], Y));

  // the check: a thin scan line sweeping under the whole track
  S.scan = el(W, 'line', { x1: STOPS[0] - SZ / 2, y1: Y + 120, x2: STOPS[0] - SZ / 2, y2: Y + 120, stroke: P.accent, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 });

  S.words = WORDS.map((w, i) => label(W, w, { size: 120 }).at(WX[i], WY));
  S.checkText = S.words[2].g.querySelector('text');

  S.arrow = new Item(W, 140, 60).at(AX, WY);
  S.arrowPath = el(S.arrow.g, 'path', { d: 'M -60 0 L 56 0 M 30 -24 L 58 0 L 30 24', fill: 'none', stroke: mix(P.dim, P.ink, 0.5), 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  S.arrowLen = 190;
  set(S.arrowPath, { 'stroke-dasharray': `${S.arrowLen} ${S.arrowLen}` });
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // faint track: a quiet callback, never the subject; it steps further back for the last frame
  const tr = 0.3 * reveal(t, c('idea'), 0.9) * lerp(1, 0.5, reveal(t, c('next'), 0.8));
  S.track.show(tr);
  // plan and voice stops light with their words, then settle to half when the next word comes
  const on = [c('plan'), c('voice')];
  const off = [c('voice'), c('check')];
  S.stops.forEach((s, i) => {
    s.show(tr + (i < 2 ? 0.3 * reveal(t, on[i], 0.5) * (1 - reveal(t, c('next'), 0.8)) : 0));
    s.lit(i < 2 ? reveal(t, on[i], 0.5) * (1 - 0.5 * reveal(t, off[i], 0.6)) : 0);
  });

  // the check sweeps under the track, then fades
  const sp = ease.inOut(prog(t, c('check'), 0.9));
  const x0 = STOPS[0] - SZ / 2;
  set(S.scan, { x2: lerp(x0, STOPS[3] + SZ / 2, sp).toFixed(1), opacity: +(sp > 0 ? 1 - ease.in(prog(t, c('check') + 0.9, 0.5)) : 0).toFixed(3) });

  // the three words: each appears on its word, earlier ones step back, all return for the closing frame
  const back = reveal(t, c('next'), 0.8);
  const cues = [c('plan'), c('voice'), c('check')];
  S.words.forEach((w, i) => {
    const d = i < 2 ? dimAfter(t, cues[i + 1], 0.35) : 1;
    w.show(reveal(t, cues[i], 0.5)).dim(lerp(d, 1, back));
  });
  const pulse = Math.sin(Math.PI * prog(t, c('works') - 0.2, 0.8));
  const green = mix(P.ink, P.accent, ease.out(prog(t, c('check') + 0.25, 0.5)));
  set(S.checkText, { fill: mix(green, P.ink, 0.35 * pulse) });
  S.words[2].at(WX[2], WY, 1 + 0.12 * pulse);

  // the small unlabeled arrow: on to the next part
  S.arrow.show(reveal(t, c('next'), 0.4));
  set(S.arrowPath, { 'stroke-dashoffset': (S.arrowLen * (1 - ease.out(prog(t, c('next'), 0.7)))).toFixed(1) });
}
