// Scene 05: the voice goes first. The script page gives way to one long waveform, the ruler of the video; timing ticks drop
// from its quiet gaps and the picture frames snap to them (an arrow runs from audio to picture, never back). Then one bar slips
// out of place, too small to hear; a magnifier slides along the waveform and a magenta ring closes around the slip. Ends wide.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { type, label, arrow, glow, Item, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'page', at: 'Once the script' },
    { name: 'solid', at: 'is solid' },
    { name: 'voice', at: 'the voice comes next' },
    { name: 'timing', at: 'sets the timing' },
    { name: 'picture', at: 'Every picture' },
    { name: 'fit', at: 'fit the audio' },
    { name: 'never', at: 'never the other way around' },
    { name: 'because', at: 'And because a voice model' },
    { name: 'slip', at: 'can slip' },
    { name: 'ears', at: 'your ears miss' },
    { name: 'checks', at: 'the pipeline checks' },
    { name: 'caught', at: 'the audio instead' },
    { name: 'trust', at: 'instead of trusting it' },
  ],
};

// world layout (world = screen at zoom 1): the series waveform (12 px bars, 24 px pitch, baseline 540) across the middle,
// picture frames below it, labels above (y 390, y 330 in the zoom) or below (y 862)
const BASE = 540, X0 = 264, N = 58, STEP = 24, BAR = 12, AMP = 88, X1 = X0 + N * STEP;
const TICKS = [X0, 590, 960, 1300, X1];           // phrase boundaries: the quiet gaps of the narration
const PIC = { y: 735, w: 260, h: 146 };           // 16:9 frames centred in each segment
const SLIP = 41, SLIP_H = 150, RING = 84;         // the slip: a quiet bar near the end of phrase 3, in line, far taller than its neighbours
const PAGE0 = { x: 590, y: 510 };                 // where scene 04 left the script page
const barX = (i) => X0 + STEP * (i + 0.5);

let S;

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'because', delay: 0.3, dur: 1.6, x: 1060, y: 600, z: 1.12 },   // toward the slip; the left end stays in frame
      { cue: 'caught', delay: 0, dur: 0.7, x: 960, y: 540, z: 1 },
    ], c),
  };
  const W = S.stage.world;

  // the script page (shared vocabulary): flat page, ink text-lines, source ticks
  // (the same 460 px square as scene 04; it starts where 04 left it and glides to the centre)
  S.page = new Item(W, 460, 460);
  S.pageRect = el(S.page.g, 'rect', { x: -230, y: -230, width: 460, height: 460, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [300, 240, 320, 220, 280].forEach((w, i) => el(S.page.g, 'rect', { x: -140, y: -148 + i * 70, width: w, height: 16, rx: 8, fill: P.ink }));
  [0, 1, 2, 3, 4].forEach((i) => el(S.page.g, 'path', { d: `M -194 ${-140 + i * 70} l 10 10 l 18 -20`, fill: 'none', stroke: P.accent, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

  // timing ticks: dashed lines from the waveform's quiet gaps down past the frames
  S.ticks = TICKS.map((x) => el(W, 'line', { x1: x, y1: BASE + 20, x2: x, y2: BASE + 20, stroke: P.accent, 'stroke-width': 3, 'stroke-dasharray': '10 10', opacity: 0 }));

  // the picture frames, one per phrase; each has a simple abstract shape inside
  const r = ctx.rand(5);
  S.pics = TICKS.slice(0, -1).map((x, i) => {
    const it = new Item(W, PIC.w, PIC.h);
    el(it.g, 'rect', { x: -PIC.w / 2, y: -PIC.h / 2, width: PIC.w, height: PIC.h, rx: 16, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
    const shape = [
      () => el(it.g, 'circle', { cx: 0, cy: 0, r: 44, fill: P.dim }),
      () => el(it.g, 'path', { d: 'M -56 40 L 0 -46 L 56 40 Z', fill: P.dim }),
      () => [-40, 0, 40].forEach((bx, k) => el(it.g, 'rect', { x: bx - 12, y: 40 - (30 + k * 22), width: 24, height: 30 + k * 22, rx: 6, fill: P.dim })),
      () => el(it.g, 'rect', { x: -60, y: -36, width: 120, height: 72, rx: 36, fill: P.dim }),
    ][i];
    shape();
    const home = (x + TICKS[i + 1]) / 2;
    return { it, home, dx: (r() - 0.5) * 120, dy: (r() - 0.5) * 70, rot: (r() - 0.5) * 14 };
  });

  // audio -> picture: one short arrow from the waveform down into each frame
  S.arrows = S.pics.map((p) => arrow(W, p.home, BASE + 58, p.home, PIC.y - PIC.h / 2 - 12, { color: P.accent, width: 6 }));

  // the waveform (the voice): rounded bars, quieter at the phrase boundaries so the ticks sit in the gaps
  const wr = ctx.rand(11);
  S.bars = Array.from({ length: N }, (_, i) => {
    const x = barX(i);
    const seg = TICKS.findIndex((tx, k) => x >= tx && x < TICKS[k + 1]);
    const u = (x - TICKS[seg]) / (TICKS[seg + 1] - TICKS[seg]);
    const h = u < 0.06 || u > 0.94 ? 10 : 14 + AMP * Math.sin(Math.PI * u) ** 0.7 * (0.6 + 0.4 * wr());
    return { x, h, node: el(W, 'rect', { x: x - BAR / 2, y: BASE - h / 2, width: BAR, height: h, rx: BAR / 2, fill: P.accent, opacity: 0 }) };
  });

  // the check: a magnifier with a thin scan line, then the magenta ring around the slip
  S.lensGlow = glow(W, { r: 110, color: P.accent, strength: 0.25 });
  S.lens = new Item(W, 230, 230);
  el(S.lens.g, 'circle', { cx: 0, cy: 0, r: 82, fill: P.accent, 'fill-opacity': 0.06, stroke: P.accent, 'stroke-width': 5 });
  el(S.lens.g, 'line', { x1: 0, y1: -64, x2: 0, y2: 64, stroke: P.accent, 'stroke-width': 3, opacity: 0.8 });
  el(S.lens.g, 'line', { x1: 60, y1: 60, x2: 112, y2: 112, stroke: P.accent, 'stroke-width': 12, 'stroke-linecap': 'round' });
  S.ringGlow = glow(W, { r: 120, color: P.hot, strength: 0.35 }).at(barX(SLIP), BASE);
  S.ringLen = 2 * Math.PI * RING;
  S.ring = el(W, 'circle', { cx: barX(SLIP), cy: BASE, r: RING, fill: 'none', stroke: P.hot, 'stroke-width': 3, 'stroke-dasharray': `${S.ringLen} ${S.ringLen}`, transform: `rotate(-90 ${barX(SLIP)} ${BASE})`, opacity: 0 });

  // labels: narration words only, one per slot at a time
  const L = (text, y, color = P.ink) => label(W, text, { size: type.label, color }).at(960, y);
  S.lb = {
    voice: L('the voice', 390, P.accent),
    timing: L('sets the timing', 390, P.accent),
    picture: L('every picture', 862),
    never: L('never the other way around', 862),
    ears: L('your ears miss', 330, P.dim),
  };
  S.final = label(S.stage.hud, 'the pipeline checks the audio', { size: type.title }).at(960, 250);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // the script page: glides in from scene 04's spot, brightens and outlines green on "solid", then gives way to the voice
  const g = ease.inOut(prog(t, 0, 1.6));
  const pageOut = 1 - ease.inOut(prog(t, c('voice') - 0.15, 0.45));
  S.page.at(lerp(PAGE0.x, 960, g), lerp(PAGE0.y, BASE, g), lerp(1, 0.8, g)).show(lerp(0.6, 1, reveal(t, c('page'), 0.6)) * pageOut);
  set(S.pageRect, { stroke: t < c('solid') ? P.dim : P.accent });

  // the waveform grows left to right on "the voice", dims while the pictures arrive, returns when they fit the audio
  const grow = prog(t, c('voice'), 1.1);
  const wfDim = t < c('fit') ? dimAfter(t, c('picture'), 0.5, 0.4) : lerp(0.5, 1, ease.inOut(prog(t, c('fit'), 0.4)));
  const slide = ease.inOut(prog(t, c('checks') + 0.1, c('caught') + 0.15 - c('checks') - 0.1));
  const lensX = lerp(X0 + 130, barX(SLIP), slide), lensY = BASE;
  const lensOn = fadeBetween(t, c('checks'), c('caught') + 0.15, 0.35);   // the lens gives way as the ring closes
  const caught = prog(t, c('caught') + 0.15, 0.25);
  S.bars.forEach((b, i) => {
    const on = ease.out(clamp((grow * (N + 3) - i) / 3));
    const near = Math.max(0, 1 - Math.abs(b.x - lensX) / 90) * lensOn;   // bars under the lens light up
    let h = b.h * (1 + 0.3 * near), y = BASE - h / 2, x = b.x, fill = P.accent;   // the lens enlarges what it passes
    if (i === SLIP) {
      const k = ease.out(prog(t, c('slip') + 0.15, 0.35));
      h = lerp(b.h, SLIP_H, k); y = BASE - h / 2;   // in line, out of place by height
      x += 10 * Math.sin(prog(t, c('slip') + 0.15, 0.4) * Math.PI * 4) * (1 - k);   // a jolt as it slips
      if (caught > 0.5) fill = P.hot;
    }
    set(b.node, { x: (x - BAR / 2).toFixed(1), y: y.toFixed(1), height: h.toFixed(1), fill, opacity: +(on * Math.min(1, wfDim * 0.85 + near * 0.4 + (i === SLIP ? caught : 0))).toFixed(3) });
  });

  // timing ticks drop from the gaps on "sets the timing"; they dim with the frames once the slip story starts
  const rest = dimAfter(t, c('because'), 0.15) + 0.55 * reveal(t, c('caught'), 0.7);
  S.ticks.forEach((n, i) => {
    const d = ease.out(prog(t, c('timing') + i * 0.15, 0.6));
    set(n, { y2: (BASE + 20 + d * (PIC.y + PIC.h / 2 + 30 - BASE - 20)).toFixed(1), opacity: +(Math.min(d * 3, 1) * 0.7 * rest).toFixed(3) });
  });

  // the frames arrive loose on "Every picture" and snap into their segments on "fit the audio"
  const snap = ease.back(prog(t, c('fit'), 0.5));
  S.pics.forEach((p, i) => {
    const k = 1 - snap;
    p.it.at(p.home + p.dx * k, PIC.y + p.dy * k, 1, p.rot * k).show(reveal(t, c('picture') + i * 0.12, 0.4)).dim(rest);
  });
  S.arrows.forEach((a, i) => { const p = ease.out(prog(t, c('never') + i * 0.1, 0.4)); a.draw(p, p > 0 ? 0.9 * rest : 0); });

  // the check: the lens slides to the slip, the slip turns magenta and the ring closes around it
  S.lens.at(lensX, lensY).show(lensOn);
  S.lensGlow.at(lensX, lensY).pulse(t, lensOn);
  set(S.ring, { opacity: caught > 0 ? 1 : 0, 'stroke-dashoffset': (S.ringLen * (1 - ease.out(prog(t, c('caught') + 0.15, 0.45)))).toFixed(1) });
  S.ringGlow.pulse(t, 0.8 * caught);

  // labels: each fades fully out before the next one in the same slot fades in
  const lb = S.lb;
  lb.voice.show(fadeBetween(t, c('voice'), c('timing') - 0.5, 0.4));
  lb.timing.show(fadeBetween(t, c('timing'), c('picture') - 0.2, 0.4));
  lb.picture.show(fadeBetween(t, c('picture'), c('never') - 0.5, 0.4));
  lb.never.show(fadeBetween(t, c('never'), c('because') - 0.2, 0.4));
  lb.ears.show(fadeBetween(t, c('ears'), c('trust') - 0.1, 0.4));
  S.final.show(reveal(t, c('caught') + 0.7, 0.4));
}
