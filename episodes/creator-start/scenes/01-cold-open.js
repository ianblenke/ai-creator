// 01 - cold open: one acid-green waveform (the voice) draws across the frame as it speaks, a soft highlight riding the
// leading edge. On "one spot" a small bar rises out of place in a quiet stretch of the line, still green; on "a check" a
// thin green scan line sweeps along the waveform, flashing each bar it passes; the blip flares magenta as the scan reaches it
// and a magenta ring closes around it on "found it".
// It ends wide on "a check found it before my ears did". Calm, nearly empty.
import { palette as P, prog, ease, clamp, lerp, el, set } from 'style';
import { type, Item, label, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'voice', at: 'my voice' },           // label: my voice,
    { name: 'cloned', at: 'cloned' },            // ... cloned
    { name: 'script', at: 'this script' },       // the script page, never read aloud
    { name: 'aloud', at: 'aloud' },              // the page steps back: the author never reads it
    { name: 'model', at: 'A model did' },        // label: a model did
    { name: 'fine', at: 'almost everything' },   // the whole line settles bright
    { name: 'spot', at: 'one spot' },            // magenta blip rises; camera leans toward it
    { name: 'check', at: 'a check' },            // the scan line starts its sweep
    { name: 'found', at: 'found it' },           // ring closes around the blip
    { name: 'before', at: 'before my ears' },    // pull back wide, closing phrase
  ],
};

const BASE = 540, N = 52, X0 = 340, STEP = 24, BW = 12;
const BLIP = 38, BX = X0 + BLIP * STEP;       // the out-of-place bar sits in a quiet stretch
const DRAW_END = 8.5;                          // the line is fully drawn by "fine."
let S;

export function setup(ctx) {
  const c = (n) => ctx.cue(n);
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: 0, dur: 0.01, x: 960, y: 540, z: 1.1 },                 // start a little close on the voice
    { cue: 'spot', delay: 0, dur: 1.6, x: 1040, y: 530, z: 1.12 }, // lean gently toward the slip
    { cue: 'before', delay: 0.1, dur: 1.0, x: 960, y: 540, z: 1 }, // end wide
  ], ctx.cue);
  const W = S.stage.world, H = S.stage.hud;

  // bar heights: seeded syllable-like envelope, with a quiet stretch around the blip so it reads as out of place
  const r = ctx.rand(11);
  S.amp = Array.from({ length: N }, (_, i) => {
    const env = 0.55 + 0.45 * Math.sin(i * 0.55) * Math.sin(i * 0.17 + 0.6);
    const quiet = Math.abs(i - BLIP) <= 3 ? 0.3 : 1;
    return (34 + 230 * Math.abs(env) * (0.45 + 0.55 * r())) * quiet;
  });
  S.bars = S.amp.map((_, i) => el(W, 'rect', { x: X0 + i * STEP - BW / 2, width: BW, rx: BW / 2, fill: P.accent, opacity: 0 }));

  // the blip: first just an out-of-place green bar, it turns magenta only once the check finds it
  S.blipA = el(W, 'rect', { x: BX - BW / 2, width: BW, rx: BW / 2, fill: P.accent, opacity: 0 });
  S.blip = el(W, 'rect', { x: BX - BW / 2, width: BW, rx: BW / 2, fill: P.hot, opacity: 0 });
  S.scan = el(W, 'line', { y1: BASE - 190, y2: BASE + 190, stroke: P.accent, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 });
  S.ringR = 84;
  S.ringLen = 2 * Math.PI * S.ringR;
  S.ring = el(W, 'circle', { cx: BX, cy: BASE, r: S.ringR, fill: 'none', stroke: P.hot, 'stroke-width': 3,
    'stroke-dasharray': `${S.ringLen} ${S.ringLen}`, transform: `rotate(-90 ${BX} ${BASE})`, opacity: 0 });
  S.spotLbl = label(W, 'one spot', { size: type.label, color: P.ink }).at(BX, BASE - 160);

  // the script: a flat page with five text bars (no letters)
  S.page = new Item(H, 200, 150);
  el(S.page.g, 'rect', { x: -100, y: -75, width: 200, height: 150, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [120, 96, 130, 84, 110].forEach((w, i) => el(S.page.g, 'rect', { x: -70, y: -50 + i * 22, width: w, height: 8, rx: 4, fill: P.ink }));
  S.page.at(960, 230);

  // typed word by word: 'cloned' arrives when spoken
  const wa = measure('my voice, ', 56), wb = measure('cloned', 56), x0 = 960 - (wa + wb) / 2;
  S.lblVoice = label(H, 'my voice,', { size: 56 }).at(x0 + measure('my voice,', 56) / 2, 230);
  S.lblCloned = label(H, 'cloned', { size: 56 }).at(x0 + wa + wb / 2, 230);
  S.lblModel = label(H, 'a model did', { size: 56 }).at(960, 230);
  S.lblEnd = label(H, 'a check found it before my ears did', { size: 64 }).at(960, 810);
  S.c = c;
}

export function render(ctx, t) {
  const c = S.c;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // the voice draws left to right; a soft highlight rides its leading edge while it plays
  const head = lerp(X0 - 40, X0 + (N - 1) * STEP + 40, prog(t, 0.05, DRAW_END));
  const playing = 1 - prog(t, DRAW_END, 0.8);
  const settle = reveal(t, c('fine'), 1.2);                 // "almost everything was fine": the line evens out bright
  const quiet = dimAfter(t, c('spot'), 0.35, 0.8);           // the slip takes focus
  // the scan sweeps at a steady pace timed so it reaches the blip on "found it"
  const xs = X0 - 60, xe = X0 + (N - 1) * STEP + 60, s0 = c('check') - 0.1;
  const sDur = (c('found') - s0) * (xe - xs) / (BX - xs);
  const scanX = lerp(xs, xe, prog(t, s0, sDur));
  const scanOn = fadeBetween(t, s0, s0 + sDur - 0.2, 0.25);
  const rise = ease.out(prog(t, c('spot'), 0.6));

  S.bars.forEach((b, i) => {
    const x = X0 + i * STEP;
    const grow = ease.out(clamp((head - x) / 70));
    const h = Math.max(BW, S.amp[i] * grow * (1 + 0.06 * Math.sin(t * 5 + i) * playing));
    const hi = Math.exp(-(((x - head) / 110) ** 2)) * playing;
    const flash = Math.exp(-(((x - scanX) / 40) ** 2)) * scanOn; // a bar lights as the check passes it
    const base = lerp(0.5, 0.85, settle) * quiet;
    const under = i === BLIP ? 1 - rise : 1; // the blip replaces this bar
    set(b, { y: (BASE - h / 2).toFixed(1), height: h.toFixed(1), opacity: +(under * grow * clamp(base + 0.5 * hi + 0.6 * flash)).toFixed(3) });
  });

  // the blip: the bar in the quiet stretch grows out of place, still green and easy to miss; it flares magenta as the scan reaches it
  const bh = lerp(S.amp[BLIP], 92, rise);
  const flare = clamp((scanX - BX + 20) / 40);
  for (const r of [S.blipA, S.blip]) set(r, { y: (BASE - bh / 2).toFixed(1), height: bh.toFixed(1) });
  set(S.blipA, { opacity: +(0.55 * rise * (1 - flare)).toFixed(3) });
  set(S.blip, { opacity: +flare.toFixed(3) });
  S.spotLbl.show(fadeBetween(t, c('spot') + 0.1, c('check') - 0.8, 0.4));

  // the check: the scan line sweeps, and the ring closes as it reaches the blip
  set(S.scan, { x1: scanX.toFixed(1), x2: scanX.toFixed(1), opacity: +(0.9 * scanOn).toFixed(3) });
  const ringP = ease.inOut(prog(t, c('found'), 0.4));
  set(S.ring, { 'stroke-dashoffset': (S.ringLen * (1 - ringP)).toFixed(1), opacity: ringP > 0 ? 1 : 0 });

  S.lblVoice.show(fadeBetween(t, c('voice'), c('script') - 0.9, 0.4));
  S.lblCloned.show(fadeBetween(t, c('cloned'), c('script') - 0.9, 0.4));
  S.page.show(fadeBetween(t, c('script') - 0.1, c('model') - 0.5, 0.4)).dim(dimAfter(t, c('aloud'), 0.35, 0.5));
  S.lblModel.show(fadeBetween(t, c('model'), c('spot') - 0.6, 0.4)).dim(dimAfter(t, c('fine'), 0.6));
  S.lblEnd.show(reveal(t, c('before') + 0.15, 0.5));
}
