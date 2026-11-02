// Scene 06: pictures as functions of time. One diagram that accumulates: the voice, then a frame built to fit it; the cloud
// writes a small piece of code; a clock reading 't' feeds the code, which draws the frame. The clock stops on one moment and the
// same frame is drawn twice; the two match. Then the second copy shows a faint leftover: laid over the first, only the leftover
// lights up, and the check's ring closes around it. Ends wide on the point.
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, label, glow, arrow, curve, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'narration', at: 'narration' },
    { name: 'pictures', at: 'the pictures' },
    { name: 'fit', at: 'built to fit' },
    { name: 'cloud', at: 'A cloud model' },
    { name: 'writes', at: 'writes each animation' },
    { name: 'code', at: 'small piece of code' },
    { name: 'frame', at: 'each frame is drawn' },
    { name: 'time', at: 'the time alone' },
    { name: 'so', at: 'So the same' },
    { name: 'moment', at: 'the same moment' },
    { name: 'same', at: 'the same frame' },
    { name: 'render', at: 'render a frame twice' },
    { name: 'twice', at: 'twice' },
    { name: 'compare', at: 'compare' },
    { name: 'ghost', at: 'caught a ghost' },
    { name: 'leftover', at: 'leftover copy' },
    { name: 'wide', at: 'one frame wide' },
    { name: 'never', at: 'never would have seen' },
  ],
};

// world layout: voice and cloud on top, clock -> code -> frame in the middle row, the second frame under the first
const WAVE = { x: 470, y: 170, w: 312 };
// the series waveform: 12 px bars on a 24 px pitch; it arrives wide on the 540 baseline (as scene 05 leaves it), then its middle
// bars glide up into the slot while the outer ones fade
const PITCH = 24, NB = 58, KEEP0 = 22, KEEP = 13;
const CLOCK = { x: 470, y: 380, r: 85 };
const CODE = { x: 900, y: 380, w: 260, h: 190 };
const CLOUD = { x: 900, y: 165 };
const FA = { x: 1420, y: 380 }, FB = { x: 1420, y: 700 };
const FW = 440, FH = 248;
const GHOST_DX = -64; // the leftover sits one step behind the moving shape
const LAY = { x: FA.x + 14, y: FA.y - 14 }; // the second copy's outline rests just up-right of the first, so the end still reads as two frames laid over each other
const SLOT = { x: 900, y: 700 }; // label slot left of the second frame

// the clock's reading: runs with t, then settles on one moment and holds it
const reading = (t, at) => (t < at ? t : at + 0.5 * ease.out(prog(t, at, 0.6)));
const ballX = (tau) => 130 * Math.sin(tau * 1.2);

/** THE PICTURE: a 16:9 frame with a ground line and a moving disc; `withGhost` adds a hidden magenta leftover. */
function picture(parent, withGhost) {
  const it = new Item(parent, FW, FH);
  it.bg = el(it.g, 'rect', { x: -FW / 2, y: -FH / 2, width: FW, height: FH, rx: 22, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  it.inner = el(it.g, 'g');
  el(it.inner, 'line', { x1: -170, x2: 170, y1: 74, y2: 74, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' });
  if (withGhost) it.ghost = el(it.g, 'circle', { cx: 0, cy: 40, r: 30, fill: P.ink, opacity: 0 });
  it.ball = el(it.inner, 'circle', { cx: 0, cy: 40, r: 30, fill: P.ink });
  return it;
}

let S;

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { t: 0, dur: 4, x: 960, y: 450, z: 1.05 },
      { cue: 'time', delay: 0, dur: 1.6, x: 1000, y: 470, z: 1.08 },
      { cue: 'same', delay: 0, dur: 1.4, x: 1080, y: 540, z: 1 },
      { cue: 'ghost', delay: 0.2, dur: 1.6, x: 1120, y: 500, z: 1.04 },
      { cue: 'never', delay: -0.3, dur: 1.4, x: 980, y: 470, z: 0.94 },
    ], c),
  };
  const W = S.stage.world;

  // THE VOICE: the series waveform
  S.wave = new Item(W, 0, 0).at(0, 0); // bars are placed in world coordinates
  const r = ctx.rand(61);
  S.bars = Array.from({ length: NB }, (_, i) => {
    const h = 18 + r() * 78, j = i - KEEP0, keep = j >= 0 && j < KEEP;
    return { h, keep, u: keep ? j / (KEEP - 1) : 0, wx: 960 + (i - (NB - 1) / 2) * PITCH, sx: WAVE.x + (j - (KEEP - 1) / 2) * PITCH,
      node: el(S.wave.g, 'rect', { width: 12, height: h, rx: 6, fill: P.accent }) };
  });

  // THE CLOUD and the code it writes
  S.cloud = new Item(W, 200, 130).at(CLOUD.x, CLOUD.y);
  for (const [cx, cy, rr] of [[-50, 15, 40], [50, 15, 40], [0, -12, 52]]) el(S.cloud.g, 'circle', { cx, cy, r: rr, fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 4 });
  S.code = new Item(W, CODE.w, CODE.h).at(CODE.x, CODE.y);
  el(S.code.g, 'rect', { x: -CODE.w / 2, y: -CODE.h / 2, width: CODE.w, height: CODE.h, rx: 22, fill: P.bg2, stroke: P.violet, 'stroke-width': 4 });
  el(S.code.g, 'path', { d: 'M -36 -70 L -58 -50 L -36 -30 M 36 -70 L 58 -50 L 36 -30 M 12 -74 L -12 -26', fill: 'none', stroke: P.violet, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  S.codeLines = [170, 120, 150].map((len, i) => ({ len, node: el(S.code.g, 'line', { x1: -90, y1: -2 + i * 32, x2: -90, y2: -2 + i * 32, stroke: P.violet, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0 }) }));

  // the clock that reads 't'
  S.clock = new Item(W, CLOCK.r * 2, CLOCK.r * 2).at(CLOCK.x, CLOCK.y);
  el(S.clock.g, 'circle', { cx: 0, cy: 0, r: CLOCK.r, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.clock.g, 'text', { x: 0, y: 17, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': type.label, 'font-weight': 700, fill: P.ink }, 't');
  S.hand = el(S.clock.g, 'circle', { r: 12, fill: P.accent });

  // connections (drawn when spoken)
  S.aFit = curve(W, WAVE.x + 100, WAVE.y + 60, FA.x - FW / 2 - 14, FA.y - 60, { bend: 40, dashed: true });
  S.aCloud = arrow(W, CLOUD.x, CLOUD.y + 62, CLOUD.x, CODE.y - CODE.h / 2 - 12, { color: P.violet });
  S.aDraw = arrow(W, CODE.x + CODE.w / 2 + 12, CODE.y, FA.x - FW / 2 - 14, FA.y);
  S.aClock = arrow(W, CLOCK.x + CLOCK.r + 12, CLOCK.y, CODE.x - CODE.w / 2 - 14, CODE.y);
  S.aVoice = arrow(W, WAVE.x, WAVE.y + 58, WAVE.x, CLOCK.y - CLOCK.r - 12, { color: P.accent });
  S.aTwice = curve(W, CODE.x + CODE.w / 2 + 12, CODE.y + 60, FB.x - FW / 2 - 14, FB.y, { bend: 70 });

  // the two renders, the equality between them, the check
  S.fa = picture(W, false).at(FA.x, FA.y);
  S.fbHint = new Item(W, FW, FH).at(FB.x, FB.y); // a faint dashed promise of the same frame again, before it is rendered
  el(S.fbHint.g, 'rect', { x: -FW / 2, y: -FH / 2, width: FW, height: FH, rx: 22, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-dasharray': '14 12' });
  S.fb = picture(W, true).at(FB.x, FB.y);
  S.fbEdge = new Item(W, FW, FH).at(LAY.x, LAY.y); // outline only: the content stays exactly on the first frame
  el(S.fbEdge.g, 'rect', { x: -FW / 2, y: -FH / 2, width: FW, height: FH, rx: 22, fill: 'none', stroke: P.ink, 'stroke-width': 4 });
  S.eq = new Item(W, 80, 30).at(FA.x, (FA.y + FB.y) / 2);
  for (const y of [-9, 9]) el(S.eq.g, 'line', { x1: -34, x2: 34, y1: y, y2: y, stroke: P.accent, 'stroke-width': 7, 'stroke-linecap': 'round' });
  S.scan = el(W, 'line', { x1: 0, x2: 0, y1: 0, y2: 0, stroke: P.accent, 'stroke-width': 4, opacity: 0 });
  S.ghostGlow = glow(W, { r: 80, color: P.hot, strength: 0.25 });
  S.ring = el(W, 'circle', { r: 48, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });

  // labels: the narration's words, one per slot at a time
  const L = (text, x, y, opts = {}) => label(W, text, { size: type.note, ...opts }).at(x, y);
  S.lb = {
    wave: L('the narration', 800, WAVE.y),
    pic: L('the pictures', FA.x, 560),
    cloud: L('a cloud model', 1150, CLOUD.y, { color: P.violet }),
    code: L('small piece of code', CODE.x, 520, { size: 42 }), // stays visible in the zoomed-out overview
    time: L('the time alone', CLOCK.x, 520),
    moment: L('the same moment', CLOCK.x, 520, { color: P.accent }),
    twice: L('render it twice', SLOT.x, SLOT.y),
    same: L('the same frame', SLOT.x, SLOT.y, { color: P.accent }),
    ghost: L('a ghost', SLOT.x, SLOT.y, { size: type.label }),
    copy: L('a leftover copy', SLOT.x, SLOT.y),
    wide: L('one frame wide', FA.x, 590),
  };
  S.check = new Item(W, 50, 40).at(SLOT.x - S.lb.same.w / 2 - 44, SLOT.y);
  el(S.check.g, 'path', { d: 'M -20 0 L -6 14 L 20 -16', fill: 'none', stroke: P.accent, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  S.final = label(S.stage.hud, 'I never would have seen by eye', { size: 64 }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const wideAt = c('never'), over = (k) => lerp(k, Math.max(k, 0.6), reveal(t, wideAt, 0.8)); // overview lifts dimmed parts a little

  // the voice plays once (a soft highlight sweeping left to right), then steps back
  // outer bars fade first, then the kept bars glide (all uniform until then), then the highlight plays once over the slot
  const drop = 1 - ease.inOut(prog(t, 0.1, 0.5)), gl = ease.inOut(prog(t, 0.5, 1.4)), glEnd = 1.9;
  const hx = lerp(-0.2, 1.2, prog(t, glEnd, 2.4)), play = fadeBetween(t, glEnd, glEnd + 2.0, 0.4);
  for (const b of S.bars) {
    const x = b.keep ? lerp(b.wx, b.sx, gl) : b.wx, y = lerp(540, WAVE.y, gl);
    const lit = lerp(0.85, 0.4 + 0.6 * Math.exp(-(((b.u - hx) / 0.15) ** 2)), play);
    set(b.node, { x: (x - 6).toFixed(2), y: (y - b.h / 2).toFixed(2), opacity: +(b.keep ? lit : 0.85 * drop).toFixed(3) });
  }
  S.wave.show(reveal(t, 0, 0.5)).dim(over(dimAfter(t, c('cloud'), 0.35) + (1 - dimAfter(t, c('time'), 0.35)) * 0.45 * (1 - prog(t, c('so'), 0.6))));

  // frame A (the picture built to fit) and its moving disc, driven by the clock's reading
  const tau = reading(t, c('moment'));
  set(S.fa.ball, { cx: ballX(tau).toFixed(2) });
  S.aFit.draw(ease.out(prog(t, c('fit'), 0.9)), 1 - prog(t, c('cloud') - 0.4, 0.4));

  // the cloud writes the code
  S.cloud.show(reveal(t, c('cloud'))).dim(over(dimAfter(t, c('frame'), 0.35)));
  S.aCloud.draw(ease.out(prog(t, c('writes'), 0.5)), over(dimAfter(t, c('frame'), 0.35)));
  S.code.show(reveal(t, c('writes'))).dim(over(dimAfter(t, c('render'), 0.35)));
  S.codeLines.forEach((l, i) => {
    const k = ease.out(prog(t, c('writes') + 0.4 + i * 0.75, 0.7));
    set(l.node, { x2: (-90 + l.len * k).toFixed(1), opacity: k > 0 ? 1 : 0 });
  });

  // each frame is drawn from the time alone: code -> frame, then the clock (fed by the voice) -> code
  S.aDraw.draw(ease.out(prog(t, c('frame'), 0.6)), over(dimAfter(t, c('ghost'), 0.35)));
  S.clock.show(reveal(t, c('time'))).dim(over(dimAfter(t, c('render'), 0.35)));
  S.aClock.draw(ease.out(prog(t, c('time') + 0.2, 0.5)), over(dimAfter(t, c('render'), 0.35)));
  S.aVoice.draw(ease.out(prog(t, c('time') + 0.2, 0.5)), over(dimAfter(t, c('so'), 0.35)));
  const ang = tau * 1.2 - Math.PI / 2;
  set(S.hand, { cx: (Math.cos(ang) * CLOCK.r).toFixed(2), cy: (Math.sin(ang) * CLOCK.r).toFixed(2) });

  // render twice: the second frame comes from the same code at the same moment
  const twiceIn = reveal(t, c('twice') - 0.3, 0.6);
  S.aTwice.draw(ease.out(prog(t, c('render'), 0.9)), over(dimAfter(t, c('ghost'), 0.35)) * (1 - prog(t, c('leftover'), 0.4)));
  set(S.fb.ball, { cx: ballX(tau).toFixed(2) });

  // compare: a scan line sweeps both frames, an equals sign and a check
  const cmp = c('compare');
  const sx = lerp(FA.x - FW / 2 - 10, FA.x + FW / 2 + 10, ease.inOut(prog(t, cmp, 1.0)));
  const sweep2 = c('leftover') + 0.9, sx2 = lerp(FA.x - FW / 2 - 10, FA.x + FW / 2 + 10, ease.inOut(prog(t, sweep2, 1.3)));
  const s1 = fadeBetween(t, cmp, cmp + 1.0, 0.2), s2 = fadeBetween(t, sweep2, sweep2 + 1.3, 0.2);
  if (s2 > 0) set(S.scan, { x1: sx2, x2: sx2, y1: FA.y - FH / 2 - 10, y2: FA.y + FH / 2 + 10, opacity: +s2.toFixed(3) });
  else set(S.scan, { x1: sx, x2: sx, y1: FA.y - FH / 2 - 10, y2: FB.y + FH / 2 + 10, opacity: +s1.toFixed(3) });
  S.eq.show(fadeBetween(t, cmp + 0.6, c('ghost'), 0.4));
  S.check.show(fadeBetween(t, cmp + 0.6, c('ghost') - 0.35, 0.3));

  // the ghost: a faint leftover in the second frame; laid over the first, only the difference lights up
  // before the overlay the leftover is all but invisible (that is the point); it turns magenta only in the difference
  const ghostIn = reveal(t, c('ghost'), 0.5);
  const lay = ease.inOut(prog(t, c('leftover'), 0.9));
  const diff = reveal(t, c('leftover') + 0.8, 0.6);
  const mid = Math.sin(Math.PI * lay); // the moving copy dissolves while it slides, so its border never cuts through the first frame
  const fbx = FB.x, fby = lerp(FB.y, FA.y, lay);
  S.fbHint.show(fadeBetween(t, c('same'), c('twice'), 0.4) * 0.5);
  S.fb.at(fbx, fby).show(twiceIn);
  set(S.fb.bg, { 'fill-opacity': +((1 - lay) * (1 - mid)).toFixed(3), 'stroke-opacity': +((1 - lay) * (1 - mid)).toFixed(3) });
  S.fbEdge.show(diff * 0.5);
  set(S.fb.ghost, { cx: (ballX(tau) + GHOST_DX).toFixed(2), fill: diff > 0 ? P.hot : P.ink, opacity: +(diff > 0 ? lerp(0.07, 0.6, diff) : 0.07 * ghostIn).toFixed(3) });
  set(S.fa.inner, { opacity: +lerp(1, 0.6, diff).toFixed(3) }); // the real disc stays ink and readable; only the leftover is magenta
  set(S.fb.inner, { opacity: +(lerp(1, 0, diff) * (1 - 0.9 * mid)).toFixed(3) });
  S.fa.show(reveal(t, c('pictures'))).dim(over(dimAfter(t, c('ghost'), 0.6)) + (1 - dimAfter(t, c('leftover'), 0.6)));

  // the check's ring closes around the leftover on "one frame wide"
  const gx = fbx + ballX(tau) + GHOST_DX, gy = fby + 40;
  S.ghostGlow.at(gx, gy).pulse(t, diff);
  const rk = ease.out(prog(t, c('wide'), 0.6));
  set(S.ring, { cx: gx.toFixed(2), cy: gy, r: lerp(120, 48, rk).toFixed(2), opacity: +(rk > 0 ? Math.min(1, rk * 2) : 0).toFixed(3) });

  // labels: each fades fully out before the next in its slot
  const lb = S.lb;
  lb.wave.show(fadeBetween(t, c('narration'), c('fit') - 0.3, 0.4));
  lb.pic.show(fadeBetween(t, c('pictures'), c('same') - 0.2, 0.4));
  lb.cloud.show(reveal(t, c('cloud'))).dim(dimAfter(t, c('frame'), 0.3));
  lb.code.show(reveal(t, c('code'))).dim(over(dimAfter(t, c('so'), 0.3) * (1 - prog(t, c('render'), 0.4)))); // out of the second arrow's way, back in the overview
  lb.time.show(fadeBetween(t, c('time'), c('so'), 0.4));
  lb.moment.show(fadeBetween(t, c('moment') + 0.4, c('render'), 0.4));
  lb.same.show(Math.max(fadeBetween(t, c('same'), c('render') - 0.5, 0.4), fadeBetween(t, cmp + 0.6, c('ghost') - 0.35, 0.3)));
  lb.twice.show(fadeBetween(t, c('render'), cmp - 0.4, 0.4));
  lb.ghost.show(fadeBetween(t, c('ghost') + 0.1, c('leftover') - 0.45, 0.4));
  lb.copy.show(fadeBetween(t, c('leftover'), c('wide') - 0.45, 0.4));
  lb.wide.show(fadeBetween(t, c('wide') + 0.1, wideAt - 0.5, 0.4));
  S.final.show(reveal(t, wideAt, 0.6));
}
