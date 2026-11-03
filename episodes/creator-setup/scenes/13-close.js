// 13 - close: the silent line (baseline y 540, as in scene 01) proves the pictures and the video (two ticked chips). The voice
// cannot be proven: the series waveform fades in DIM beside the line, with no tick; the checks that listen meet a STOP. Then an
// unlabeled arrow points right to a blank page, "the spec", and the scene ends wide on the sentence about what the spec is for.
import { palette as P, prog, ease, lerp, el } from 'style';
import { type, Item, label, chip, arrow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'silent', at: 'silent render' },
    { name: 'pictures', at: 'the pictures' },
    { name: 'video', at: 'the video' },
    { name: 'voice', at: 'prove the voice' },
    { name: 'novoice', at: 'no voice to check' },
    { name: 'checks', at: 'checks that listen' },
    { name: 'refuse', at: 'refuse to run' },
    { name: 'next', at: 'Next is' },
    { name: 'plan', at: 'the plan' },
    { name: 'spec', at: 'the spec' },
    { name: 'how', at: 'how one problem' },
    { name: 'never', at: 'what never goes' },
  ],
};

const LINE_Y = 540, LX = 482, VX = 890, PAGE = [1560, 520];
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

function tick(parent) {
  const it = new Item(parent, 34, 26);
  el(it.g, 'path', { d: 'M -15 0 L -4 11 L 16 -12', ...stroke(P.accent, 7) });
  return it;
}
// THE VOICE (CANON II): 9 bars, 12 wide, pitch 34, centred, up to 60 tall, accent; render() can flatten it to the silent voice (4 px, dim)
function waveform(parent, n = 9, pitch = 34, hMax = 60) {
  const it = new Item(parent, (n - 1) * pitch + 12, hMax);
  it.hs = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].map((k) => hMax * k);
  it.bars = it.hs.map((h, i) => el(it.g, 'rect', { x: -((n - 1) * pitch + 12) / 2 + i * pitch, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent }));
  return it;
}
// A STOP (CANON across scenes): hot octagon r 32, stroke 5, hot bar
function stop(parent, r = 32) {
  const it = new Item(parent, r * 2, r * 2);
  const pts = Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + (i * Math.PI) / 4; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; });
  el(it.g, 'polygon', { points: pts.join(' '), fill: P.hot, 'fill-opacity': 0.18, stroke: P.hot, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(it.g, 'line', { x1: -r * 0.45, y1: 0, x2: r * 0.45, y2: 0, ...stroke(P.hot, 6) });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 620, y: 560, z: 1.12 },          // close on the silent line and the voice
    { cue: 'next', dur: 1.1, x: 960, y: 540, z: 1 }, // wide: the arrow and the page join
  ], ctx.cue);
  const W = S.stage.world;

  // the silent line: scene 01's line (x 260..1000) at 0.6 of its length, from x 260, dim
  S.line = new Item(W, 444, 8);
  el(S.line.g, 'line', { x1: -222, y1: 0, x2: 222, y2: 0, ...stroke(P.dim, 6) });
  S.line.at(LX, LINE_Y);
  S.lineLab = label(W, 'A silent render', { size: type.label }).at(LX, 450);

  // what it proves: two ticked chips
  S.proofs = [['the pictures', 640], ['the video', 725]].map(([txt, y]) => chip(W, txt, { color: P.accent }).at(LX, y));
  const tx = LX - Math.max(...S.proofs.map((c) => c.w)) / 2 - 40; // both ticks in one column
  S.proofs.forEach((c) => { c.tk = tick(W).at(tx, c.y); });

  // what it does not prove: the voice, dim, no tick
  S.wave = waveform(W).at(VX, LINE_Y, 1.1); // 312 px wide at 1.1: clears the line's end (x 704) and the arrow (x 1140)
  S.waveLab = label(W, 'the voice', { size: type.label, color: P.ink }).at(VX, 450);
  S.checks = chip(W, 'checks that listen', { color: P.dim }).at(VX, 650);
  S.stop = stop(W).at(VX - 150, 750);
  S.refuse = label(W, 'refuse to run', { size: type.note, color: P.hot }).at(VX + 50, 750);

  // next: an unlabeled arrow toward a blank page
  S.arrow = arrow(W, 1140, LINE_Y, 1390, LINE_Y, { color: P.dim });
  S.page = new Item(W, 260, 340);
  el(S.page.g, 'rect', { x: -130, y: -170, width: 260, height: 340, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.page.at(...PAGE);
  S.specLab = label(W, 'the spec', { size: type.label, color: P.ink }).at(PAGE[0], 300);

  const f1 = 'how one problem becomes one episode,', f2 = 'and what never goes on screen';
  const sz = Math.min(fitSize(f1, 1500, 64, 56), fitSize(f2, 1500, 64, 56));
  S.fin1 = label(S.stage.hud, f1, { size: sz }).at(960, 760);
  S.fin2 = label(S.stage.hud, f2, { size: sz }).at(960, 834);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  const next = dimAfter(t, c('next'), 0.35);
  const keep = dimAfter(t, c('next'), 0.8); // the line and the voice stay readable in the final wide frame
  // the lower rows (proof chips, checks, stop) clear before the closing sentence takes that space
  const clear = 1 - ease.in(prog(t, c('how') - 0.5, 0.5));

  // the silent line: bright first, spotlit again on "no voice to check"
  const lineSpot = Math.min(dimAfter(t, c('voice'), 0.35), 1) + lerp(0, 0.65, reveal(t, c('novoice'), 0.4)) * (1 - ease.inOut(prog(t, c('checks'), 0.6)));
  S.line.show(reveal(t, c('silent') - 0.2, 0.6)).dim(Math.min(1, lineSpot) * keep);
  S.lineLab.show(reveal(t, c('silent'), 0.5)).dim(Math.min(1, lineSpot) * keep);

  S.proofs.forEach((p, i) => {
    const at = c(i === 0 ? 'pictures' : 'video');
    const d = dimAfter(t, c('voice'), 0.35) * next * clear;
    p.show(reveal(t, at, 0.5)).dim(d);
    p.tk.show(reveal(t, at + 0.3, 0.4)).dim(d);
  });

  // the voice: fades in dim, never ticked; on "no voice to check" it flattens to the silent voice (4 px, dim)
  const flat = ease.inOut(prog(t, c('novoice') + 0.1, 0.8));
  S.wave.bars.forEach((r, i) => {
    const h = lerp(S.wave.hs[i], 4, flat);
    r.setAttribute('height', h.toFixed(2)); r.setAttribute('y', (-h / 2).toFixed(2));
    r.setAttribute('fill', flat > 0 ? P.dim : P.accent); // dim as soon as it flattens: never brighter than before 'no voice'
  });
  // brighten only once the bars are mostly flat, to the silent line's strength
  S.wave.show(reveal(t, c('voice') + 0.3, 0.9)).dim(lerp(0.45, 0.9, ease.inOut(prog(t, c('novoice') + 0.6, 0.4))) * keep);
  S.waveLab.show(reveal(t, c('voice') + 0.3, 0.6)).dim(dimAfter(t, c('novoice'), 0.35) * keep);
  S.checks.show(reveal(t, c('checks'), 0.5)).dim(dimAfter(t, c('refuse'), 0.5) * next * clear);
  S.stop.show(reveal(t, c('refuse'), 0.5)).dim(next * clear);
  S.refuse.show(reveal(t, c('refuse') + 0.2, 0.5)).dim(next * clear);

  // next: the arrow draws toward a blank page; the page is named on "the spec"
  S.arrow.draw(ease.inOut(prog(t, c('next') + 0.3, 0.9)), reveal(t, c('next') + 0.3, 0.2) * dimAfter(t, c('spec'), 0.6));
  S.page.show(reveal(t, c('plan') + 0.5, 0.6)); // after the camera has nearly settled, so the page is never cut by the edge
  S.specLab.show(reveal(t, c('spec'), 0.5)).dim(dimAfter(t, c('how'), 0.6));

  // the closing sentence: first half on "how one problem", second half on "what never goes"
  S.fin1.show(reveal(t, c('how') + 0.05, 0.6));
  S.fin2.show(reveal(t, c('never'), 0.6));
}
