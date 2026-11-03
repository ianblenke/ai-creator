// 06 - the picture writer: after the voice (a waveform, checked, set aside) comes what you see: a scene card with a code
// bracket. The large Opus figure writes it (pencil, dots of code flowing in), a second Opus session with a magnifier sweeps the
// frame and rings a small fault. Then the comparison: Opus and the smaller Sonnet in two rows, two scenes each from the same
// brief; on the denser scene two time bars grow (Opus about ten times longer), Opus's frame glows the brighter. Ends wide on
// "my judgement, not a benchmark" (a judgement: no trophy, no winner banner).
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, flow, arrow, glow, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'sound', at: 'With the sound' },
    { name: 'covered', at: 'covered' },
    { name: 'half', at: 'other half' },
    { name: 'video', at: 'the video' },
    { name: 'see', at: 'what you see' },
    { name: 'job', at: 'the one job' },
    { name: 'strongest', at: 'strongest model' },
    { name: 'opus', at: 'Claude Opus' },
    { name: 'writes', at: 'writes each animation' },
    { name: 'code', at: 'small piece of code' },
    { name: 'session', at: 'second Opus session' },
    { name: 'reviews', at: 'reviews the frames' },
    { name: 'faults', at: 'faults' },
    { name: 'compared', at: 'I compared' },
    { name: 'sonnet', at: 'Sonnet model' },
    { name: 'two', at: 'on two scenes' },
    { name: 'brief', at: 'same brief' },
    { name: 'denser', at: 'denser scene' },
    { name: 'took', at: 'took about' },
    { name: 'longer', at: 'ten times longer' },
    { name: 'better', at: 'much better' },
    { name: 'shorter', at: 'shorter time' },
    { name: 'worth', at: 'not worth it' },
    { name: 'sample', at: 'Two scenes is' },
    { name: 'small', at: 'small sample' },
    { name: 'judgement', at: 'my judgement' },
  ],
};

const SV = '#8670c8';                                   // Sonnet: a slightly dimmer violet
const CARD = [960, 500, 560, 315];                       // the big scene card (phase A)
const OP_A = [420, 520], OP_B = [450, 330], SON = [450, 690], REV = [1500, 520];
const ROWY = [330, 690], CX = [670, 830], CW = 150, CH = 84; // phase B rows and their two small scene cards
const BAR_X = 970, BAR_L = 760, BAR_H = 40, LAB_X = 970;
const stroke = (color, w) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// THE VOICE: rounded accent bars centred on a baseline
function wave(parent, n, hmax, gap = 24, bw = 12) {
  const it = new Item(parent, n * gap, hmax);
  it.bars = Array.from({ length: n }, (_, i) => {
    const h = hmax * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    const b = el(it.g, 'rect', { x: (i - (n - 1) / 2) * gap - bw / 2, y: -h / 2, width: bw, height: h, rx: bw / 2, fill: P.accent });
    b.h = h;
    return b;
  });
  it.play = (t, k) => it.bars.forEach((b, i) => {
    const g = Math.exp(-(((i - (((t / 1.8) % 1) * (n + 6) - 3)) ** 2) / 6));
    const h = b.h * (1 + 0.25 * g * k);
    set(b, { y: (-h / 2).toFixed(2), height: h.toFixed(2) });
  });
  return it;
}

// a figure: circle head over a rounded body, drawn at 300 px and scaled to H; optional pencil (writer) or eye (reviewer)
function figure(parent, H, color, { pencil = false, eye = false } = {}) {
  const it = new Item(parent, 0.5 * H, H);
  const s = H / 300, sw = 5 / s;
  const g = el(it.g, 'g', { transform: `scale(${s})` });
  const st = { fill: color, 'fill-opacity': 0.18, stroke: color, 'stroke-width': sw };
  el(g, 'circle', { cx: 0, cy: -112, r: 38, ...st });
  el(g, 'rect', { x: -70, y: -62, width: 140, height: 212, rx: 50, ...st });
  if (pencil) {
    it.pencil = el(g, 'g', { transform: 'translate(64 -10) rotate(-35)' });
    // the series pencil: a violet outline with a ferrule, at -35 deg
    el(it.pencil, 'rect', { x: 0, y: -8, width: 70, height: 16, rx: 3, fill: P.bg, stroke: color, 'stroke-width': 4 / s });
    el(it.pencil, 'line', { x1: 14, y1: -8, x2: 14, y2: 8, stroke: color, 'stroke-width': 4 / s });
    el(it.pencil, 'path', { d: 'M 70 -8 L 90 0 L 70 8 Z', fill: P.bg, stroke: color, 'stroke-width': 4 / s, 'stroke-linejoin': 'round' });
  }
  if (eye) {
    el(g, 'path', { d: 'M -24 -112 Q 0 -130 24 -112 Q 0 -94 -24 -112 Z', fill: P.bg, stroke: P.ink, 'stroke-width': 4 / s });
    el(g, 'circle', { cx: 0, cy: -112, r: 7, fill: P.ink });
  }
  return it;
}

// a SCENE CARD: a 16:9 rounded frame with a code bracket "{ }" (bars, no letters) and n code bars
function sceneCard(parent, w, h, color, n) {
  const it = new Item(parent, w, h);
  it.frame = el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(22, h * 0.14), fill: P.bg2, stroke: color, 'stroke-width': 4 });
  const bx = w * 0.41, bh = h * 0.33, bw = w * 0.04, sw = Math.max(3, w * 0.009);
  el(it.g, 'path', { d: `M ${-bx + bw} ${-bh} L ${-bx} ${-bh} L ${-bx} ${-bw} L ${-bx - bw} 0 L ${-bx} ${bw} L ${-bx} ${bh} L ${-bx + bw} ${bh}`, ...stroke(color, sw) });
  el(it.g, 'path', { d: `M ${bx - bw} ${-bh} L ${bx} ${-bh} L ${bx} ${-bw} L ${bx + bw} 0 L ${bx} ${bw} L ${bx} ${bh} L ${bx - bw} ${bh}`, ...stroke(color, sw) });
  const fr = [0.46, 0.36, 0.54, 0.29, 0.41], bar = Math.max(8, h * 0.045);
  it.code = Array.from({ length: n }, (_, i) => {
    const y = n === 1 ? 0 : -h * 0.25 + (i * h * 0.5) / (n - 1);
    const r = el(it.g, 'rect', { x: -w * 0.32, y: y - bar / 2, width: fr[i] * w, height: bar, rx: bar / 2, fill: P.ink });
    r.full = fr[i] * w;
    return r;
  });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 500, z: 1.12 },               // close on the voice, then the card
    { cue: 'opus', dur: 1.4, x: 960, y: 520, z: 1 },             // out for the writer
    { cue: 'session', dur: 1.4, x: 1030, y: 520, z: 1.03 },      // lean toward the reviewer
    { cue: 'compared', dur: 1.6, x: 960, y: 520, z: 1 },         // the comparison rows
    { cue: 'took', dur: 1.4, x: 1010, y: 500, z: 1.02 },         // lean toward the bars
    { cue: 'sample', dur: 1.4, x: 960, y: 540, z: 1 },           // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // ---- phase A: the voice set aside, the scene card, the writer and the reviewer ----
  S.wave = wave(W, 13, 110);
  S.tick = new Item(W, 40, 30);
  el(S.tick.g, 'path', { d: 'M -18 0 L -5 13 L 19 -14', ...stroke(P.accent, 7) });

  S.glowA = glow(W, { rx: 340, ry: 210, color: P.violet, strength: 0.28 }).at(CARD[0], CARD[1]);
  S.card = sceneCard(W, CARD[2], CARD[3], P.violet, 5).at(CARD[0], CARD[1]);   // the Opus-output card, as in phase B
  // THE DEFECT: one small magenta bar out of place, after the third code line
  const l3 = S.card.code[2];
  S.defect = el(S.card.g, 'rect', { x: -CARD[2] * 0.32 + l3.full + 22, y: -19, width: 40, height: 14, rx: 7, fill: P.hot, opacity: 0 });
  S.defXY = [CARD[0] - CARD[2] * 0.32 + l3.full + 42, CARD[1] - 12];

  S.strong = label(W, 'the strongest model', { size: type.label, color: P.violet }).at(960, 200);

  S.opus = figure(W, 300, P.violet, { pencil: true });
  S.opusLab = label(W, 'Claude Opus', { size: type.label, color: P.violet }).at(OP_A[0], 740);
  S.ink = flow(W, [[OP_A[0] + 146, OP_A[1] - 64], [CARD[0] - CARD[2] * 0.32, CARD[1] - CARD[3] * 0.25]], { n: 4, r: 8, color: P.ink, period: 1.4 });
  S.codeLab = label(W, 'small piece of code', { size: type.label }).at(960, 740);

  S.rev = figure(W, 300, P.violet, { eye: true }).at(...REV);
  S.revLab = label(W, 'second Opus session', { size: type.label, color: P.violet }).at(REV[0], 740);
  S.scan = el(W, 'line', { x1: 0, y1: CARD[1] - CARD[3] / 2 + 14, x2: 0, y2: CARD[1] + CARD[3] / 2 - 14, ...stroke(P.accent, 3), opacity: 0 });
  S.lens = new Item(W, 130, 130);
  el(S.lens.g, 'circle', { cx: 0, cy: 0, r: 50, fill: P.ink, 'fill-opacity': 0.06, stroke: P.ink, 'stroke-width': 6 });
  el(S.lens.g, 'line', { x1: 36, y1: 36, x2: 74, y2: 74, ...stroke(P.ink, 10) });
  S.ring = el(W, 'circle', { cx: S.defXY[0], cy: S.defXY[1], r: 32, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });
  S.ringLen = 2 * Math.PI * 32;

  // ---- phase B: Opus and Sonnet, two scenes each from the same brief, and the two time bars ----
  S.glowB = glow(W, { rx: 125, ry: 85, color: P.violet, strength: 0.6 }).at(CX[1], ROWY[0]);
  S.cards = ROWY.map((y, r) => CX.map((x) => sceneCard(W, CW, CH, r ? SV : P.violet, 3).at(x, y)));
  const nameLab = (text, y, color) => { const w = measure(text, type.label); return label(W, text, { size: type.label, color }).at(LAB_X + w / 2, y); };
  S.opusName = nameLab('Opus', 265, P.violet);
  S.son = figure(W, 180, SV, { pencil: true }).at(...SON);
  S.sonName = nameLab('Sonnet', 625, SV);

  S.brief = new Item(W);
  const pg = el(S.brief.g, 'g', { transform: 'translate(750 510)' });
  el(pg, 'rect', { x: -40, y: -52, width: 80, height: 104, rx: 10, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [48, 40, 52, 30].forEach((w, k) => el(pg, 'rect', { x: -26, y: -32 + k * 20, width: w, height: 8, rx: 4, fill: P.ink }));
  S.briefArrows = [[735, 452, 680, 382], [765, 452, 820, 382], [735, 568, 680, 640], [765, 568, 820, 640]]
    .map(([a, b, c, d]) => arrow(S.brief.g, a, b, c, d, { color: P.dim, width: 4, head: 14 }));
  S.briefLab = nameLab('the same brief', 510, P.ink);
  S.sampleLab = nameLab('a small sample', 510, P.ink);

  S.barO = el(W, 'rect', { x: BAR_X, y: ROWY[0] - BAR_H / 2, width: 0, height: BAR_H, rx: BAR_H / 2, fill: P.violet, opacity: 0 });
  S.barS = el(W, 'rect', { x: BAR_X, y: ROWY[1] - BAR_H / 2, width: 0, height: BAR_H, rx: BAR_H / 2, fill: SV, opacity: 0 });
  const tw = measure('about ten times longer', type.label);
  S.tenLab = label(W, 'about ten times longer', { size: type.label, color: P.violet }).at(BAR_X + BAR_L - tw / 2, 400);
  S.betterLab = label(W, 'judged much better', { size: type.label, color: P.violet }).at(CX[1], 200);   // over the glowing card, clear of the head

  S.final = label(S.stage.hud, 'my judgement, not a benchmark', { size: type.title, color: P.ink }).at(960, 855);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const outA = 1 - ease.inOut(prog(t, c('compared'), 0.4));   // phase A leaves as the comparison starts

  // the sound, covered (a check), then set aside to the left and dimmed; gone before the writer arrives there
  const mv = ease.inOut(prog(t, c('half'), 1.0));
  const wx = lerp(960, 430, mv);
  S.wave.show(reveal(t, c('sound'), 0.5) * (1 - ease.inOut(prog(t, c('strongest'), 0.6)))).dim(dimAfter(t, c('half'), 0.35)).at(wx, 500);
  S.wave.play(t, 1 - mv);
  S.tick.show(reveal(t, c('covered'), 0.4) * (1 - ease.inOut(prog(t, c('strongest'), 0.6)))).dim(dimAfter(t, c('half'), 0.35)).at(wx + 200, 500);

  // what you see: the scene card; on "the one job" its violet frame firms up (a cloud model's job) and it glows once
  S.card.show(reveal(t, c('video'), 0.6) * outA).dim(1 - 0.4 * fadeBetween(t, c('opus'), c('writes')));
  set(S.card.frame, { 'stroke-width': +(4 + 2 * reveal(t, c('job'), 0.6)).toFixed(2) });   // "the one job": the frame firms up
  S.glowA.show(0.9 * fadeBetween(t, c('see'), c('strongest') + 1.5, 0.8) * outA);
  S.strong.show(reveal(t, c('strongest'), 0.5) * outA).dim(dimAfter(t, c('opus'), 0.35));

  // Claude Opus writes it: the code bars type in line by line, dots of code flow from the pencil
  const wr = prog(t, c('writes'), c('code') + 1.2 - c('writes'));
  S.card.code.forEach((r, i) => set(r, { width: (r.full * ease.out(Math.min(1, Math.max(0, wr * 5 - i)))).toFixed(1) }));
  set(S.defect, { opacity: +reveal(t, c('writes') + 0.5, 0.4).toFixed(3) });
  const wk = fadeBetween(t, c('writes'), c('session'), 0.4);
  set(S.opus.pencil, { transform: `translate(64 -10) rotate(${(-35 + 8 * Math.sin(t * 9) * wk).toFixed(2)})` });
  S.ink.update(t, 0.9 * wk);
  const ob = ease.inOut(prog(t, c('compared') + 0.4, 1.2));   // move once phase A text has gone
  S.opus.show(reveal(t, c('opus'), 0.6)).dim(lerp(dimAfter(t, c('session'), 0.35), 1, reveal(t, c('compared'), 0.6)))
    .at(lerp(OP_A[0], OP_B[0], ob), lerp(OP_A[1], OP_B[1], ob));
  S.opusLab.show(reveal(t, c('opus'), 0.5) * outA).dim(dimAfter(t, c('session'), 0.35));
  S.codeLab.show(reveal(t, c('code'), 0.5) * outA).dim(dimAfter(t, c('session'), 0.35));

  // a second Opus session reviews the frames: the lens and a scan sweep the card, a magenta ring closes on the fault
  S.rev.show(reveal(t, c('session'), 0.6) * outA);
  S.revLab.show(reveal(t, c('session'), 0.5) * outA);
  const sw = ease.inOut(prog(t, c('reviews'), c('faults') - c('reviews')));
  const lx = sw > 0 ? lerp(CARD[0] - CARD[2] / 2 + 70, S.defXY[0], sw) : 1350;
  const ly = sw > 0 ? S.defXY[1] + 30 * Math.sin(sw * Math.PI * 2) * (1 - sw) : 460;
  const back = ease.inOut(prog(t, c('reviews') - 0.6, 0.6));   // glide from the reviewer's hand to the card's left edge first
  const lensX = sw > 0 ? lx : lerp(1350, CARD[0] - CARD[2] / 2 + 70, back), lensY = sw > 0 ? ly : lerp(460, S.defXY[1], back);
  S.lens.show(reveal(t, c('session') + 0.2, 0.5) * outA).at(lensX, lensY);
  const scx = lerp(CARD[0] - CARD[2] / 2 + 20, S.defXY[0], sw);
  set(S.scan, { x1: scx.toFixed(1), x2: scx.toFixed(1), opacity: +(fadeBetween(t, c('reviews'), c('faults'), 0.3) * 0.9).toFixed(3) });
  const rg = ease.out(prog(t, c('faults'), 0.5));
  set(S.ring, { 'stroke-dasharray': `${S.ringLen} ${S.ringLen}`, 'stroke-dashoffset': (S.ringLen * (1 - rg)).toFixed(2), opacity: +(Math.min(1, rg * 4) * outA).toFixed(3) });

  // ---- phase B ----
  const fin = reveal(t, c('judgement'), 0.6);
  const samp = reveal(t, c('sample'), 0.6);
  S.opusName.show(reveal(t, c('compared') + 0.6, 0.5)).dim(lerp(1, 0.5, samp));
  S.son.show(reveal(t, c('sonnet'), 0.5)).dim(lerp(1 - 0.5 * reveal(t, c('better'), 0.6), 0.5, samp));
  S.sonName.show(reveal(t, c('sonnet'), 0.5)).dim(lerp(1 - 0.5 * reveal(t, c('better'), 0.6), 0.5, samp));
  S.opus.dim(lerp(S.opus.dimv, 0.5, samp));

  // two scenes each; the denser one stays bright, the other dims; "two scenes is a small sample" brings both back
  S.cards.forEach((row, r) => row.forEach((cd, i) => {
    let d = i === 0 ? dimAfter(t, c('denser'), 0.35) : 1;
    if (r === 1) d *= 1 - 0.5 * reveal(t, c('better'), 0.6);
    cd.show(reveal(t, c('two') + 0.2 + r * 0.3 + i * 0.15, 0.5)).dim(lerp(d, 1, samp));
  }));
  // Opus's frame glows the brighter
  const bt = reveal(t, c('better'), 0.6);
  set(S.cards[0][1].frame, { 'stroke-width': +(4 + 3 * bt * (1 - samp)).toFixed(2) });
  S.glowB.pulse(t, bt * (1 - samp) * 0.9);
  S.betterLab.show(bt).dim(lerp(1, 0.35, samp));

  // the same brief feeds both rows
  S.brief.show(reveal(t, c('brief'), 0.5)).dim(dimAfter(t, c('denser'), 0.35));
  S.briefArrows.forEach((a, i) => a.draw(ease.inOut(prog(t, c('brief') + 0.2 + (i % 2) * 0.1, 0.6)), 1));
  S.briefLab.show(reveal(t, c('brief'), 0.5) * (1 - ease.inOut(prog(t, c('better'), 0.5)))).dim(dimAfter(t, c('denser'), 0.35));
  S.sampleLab.show(reveal(t, c('small'), 0.5));

  // the time bars on the denser scene: Sonnet's stops short, Opus's runs about ten times as far
  const barA = reveal(t, c('took'), 0.3);
  set(S.barO, { width: (BAR_L * ease.inOut(prog(t, c('took'), 1.8))).toFixed(1), opacity: +(barA * lerp(1, 0.35, samp)).toFixed(3) });
  const sd = (1 - 0.5 * reveal(t, c('better'), 0.6)) + 0.5 * fadeBetween(t, c('shorter'), c('worth'), 0.4);
  set(S.barS, { width: ((BAR_L / 10) * ease.out(prog(t, c('took'), 0.4))).toFixed(1), opacity: +(barA * lerp(lerp(sd, 0.35, reveal(t, c('worth'), 0.6)), 0.35, samp)).toFixed(3) });
  S.tenLab.show(reveal(t, c('longer') + 0.2, 0.5)).dim(lerp(1, 0.35, samp));

  // the closing phrase dominates; the diagram drops back
  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.5, fin).toFixed(3) });
}
