// 01 - cold open: a plain computer with a dashed (absent) card beside it; three "no" chips name what this example runs
// without. The narration is a thin dim track carrying the canon voice flattened (baseline y 540, kept for scene 13) of the right length; a playhead
// crosses it while a video frame builds up on the computer's screen anyway, step by step. Ends wide on
// "You can see that work before you record".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'example', at: 'The example' },
    { name: 'card', at: 'graphics card' },
    { name: 'server', at: 'voice server' },
    { name: 'internet', at: 'internet connection' },
    { name: 'narration', at: 'narration' },
    { name: 'silent', at: 'silent' },
    { name: 'placeholder', at: 'placeholder' },
    { name: 'length', at: 'right length' },
    { name: 'pictures', at: 'pictures' },
    { name: 'video', at: 'video' },
    { name: 'exactly', at: 'exactly' },
    { name: 'real', at: 'real voice' },
    { name: 'see', at: 'see that work' },
    { name: 'before', at: 'before you record' },
  ],
};

const LINE = [260, 1000], LY = 540;               // the silent line (baseline kept for scene 13)
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
// bright inside [a, b), `floor` outside, smooth edges
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'pictures', delay: -0.3, dur: 1.6, x: 1000, y: 470, z: 1.1 },  // lean in as the frame builds
    { cue: 'see', dur: 1.4, x: 960, y: 540, z: 1 },                      // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // THE COMPUTER (canon): screen 300x190 at x 1150..1450, y 300..490, on a stand
  S.pc = new Item(W, 300, 240);
  const g = S.pc.g;
  el(g, 'rect', { x: -150, y: -120, width: 300, height: 190, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(g, 'rect', { x: -12, y: 70, width: 24, height: 38, fill: P.ink });
  el(g, 'rect', { x: -70, y: 106, width: 140, height: 14, rx: 7, fill: P.ink });
  S.pc.at(1300, 420);

  // the video frame that builds up on the screen: a background, a cool block, three ink bars, a progress track and its fill
  const sg = el(W, 'g');
  S.frameBg = el(sg, 'rect', { x: 1166, y: 316, width: 268, height: 158, rx: 10, fill: P.bg, opacity: 0 });
  S.block = el(sg, 'rect', { x: 1186, y: 334, width: 100, height: 84, rx: 12, fill: P.cool, 'fill-opacity': 0.25, stroke: P.cool, 'stroke-width': 4, opacity: 0 });
  S.bars = [0, 1, 2].map((k) => el(sg, 'rect', { x: 1306, y: 342 + k * 28, width: [104, 76, 92][k], height: 14, rx: 7, fill: P.ink, opacity: 0 }));
  S.track = el(sg, 'rect', { x: 1186, y: 444, width: 228, height: 10, rx: 5, fill: P.dim, opacity: 0 });
  S.fill = el(sg, 'rect', { x: 1186, y: 444, width: 0, height: 10, rx: 5, fill: P.ink, opacity: 0 });
  // the tick sits as a badge beside the screen, off the frame it confirms
  S.tick = new Item(W, 96, 96);
  el(S.tick.g, 'circle', { cx: 0, cy: 0, r: 46, fill: P.bg2, stroke: P.accent, 'stroke-width': 4 });
  el(S.tick.g, 'path', { d: 'M -22 2 L -6 18 L 24 -16', ...stroke(P.accent, 9) });
  S.tick.at(1545, 395);

  // THE CARD (canon 320x120, fan + 6 fins), dashed: it is not there; scaled 0.55
  S.card = new Item(W, 320, 120);
  const dash = { 'stroke-dasharray': '10 8' };
  el(S.card.g, 'rect', { x: -160, y: -60, width: 320, height: 120, rx: 16, fill: P.cool, 'fill-opacity': 0.06, stroke: P.cool, 'stroke-width': 4, ...dash });
  el(S.card.g, 'circle', { cx: -90, cy: 0, r: 34, fill: 'none', stroke: P.cool, 'stroke-width': 4, ...dash });
  for (let k = 0; k < 6; k++) el(S.card.g, 'line', { x1: -20 + k * 28, y1: -26, x2: -20 + k * 28, y2: 26, ...stroke(P.cool, 4), ...dash, opacity: 0.7 });
  S.card.at(1620, 510, 0.55);

  // what it runs without
  S.chips = ['no graphics card', 'no voice server', 'offline once built'].map((s, i) => chip(W, s, { size: type.label, color: P.dim, textColor: P.ink }).at(560, 180 + i * 105));

  // the narration track (baseline kept for scene 13), thin so the voice's flat bars read on it
  S.line = el(W, 'line', { x1: LINE[0], y1: LY, x2: LINE[0], y2: LY, ...stroke(P.dim, 3), opacity: 0 });
  // THE VOICE (canon II): 9 bars, 12 wide, pitch 34, pattern x 60 px, scaled 1.6, centred at x 630.
  // Silent = the same 9 positions 4 px high in dim; the real voice to come = the same bars as accent outlines.
  const PAT = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6], K = 1.6, VX = 630;
  const bx = (i) => (VX + K * (-136 + i * 34 - 6)).toFixed(1);
  S.flat = PAT.map((_, i) => el(W, 'rect', { x: bx(i), y: (LY - 2 * K).toFixed(1), width: 12 * K, height: 4 * K, rx: 2 * K, fill: P.dim, opacity: 0 }));
  S.silent = label(W, 'silent', { size: type.label, color: P.dim }).at(400, 480);
  S.ph = label(W, 'a placeholder', { size: type.label }).at(780, 480);
  // the right length: end marks under the line and a span between them
  S.len = new Item(W);
  el(S.len.g, 'path', { d: `M ${LINE[0]} 600 L ${LINE[0]} 640 M ${LINE[1]} 600 L ${LINE[1]} 640 M ${LINE[0]} 620 L ${LINE[1]} 620`, ...stroke(P.ink, 4) });
  S.lenLab = label(W, 'the right length', { size: type.label }).at(630, 680);
  S.ghost = PAT.map((p, i) => {
    const h = 60 * K * p;
    return el(W, 'rect', { x: bx(i), y: (LY - h / 2).toFixed(1), width: 12 * K, height: h.toFixed(1), rx: 6 * K, fill: P.accent, 'fill-opacity': 0.08, stroke: P.accent, 'stroke-width': 3, 'stroke-dasharray': '4 3', opacity: 0 });
  });
  // the playhead: crosses the silent line while the video plays
  S.head = el(W, 'circle', { cx: LINE[0], cy: LY, r: 12, fill: P.ink, opacity: 0 });

  const fin = 'You can see that work before you record';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56) }).at(960, 830);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const END = 99;
  const fin = reveal(t, c('before'), 0.6);

  // the computer: in focus while it is the subject, pushed back while the line is explained
  S.pc.show(reveal(t, c('example'), 0.7)).dim(Math.max(spot(t, -1, c('narration'), 0.5), spot(t, c('pictures'), END, 0.5)));
  S.card.show(reveal(t, c('card'), 0.5) * 0.8 * (1 - reveal(t, c('pictures'), 0.8))).dim(spot(t, c('card'), c('server')));

  // the three "no" chips: each bright when spoken, then pushed back, then gone as the pictures start
  const ends = [c('server'), c('internet'), c('narration')];
  [c('card'), c('server'), c('internet')].forEach((at, i) => {
    S.chips[i].show(fadeBetween(t, at, c('pictures') - 0.4, 0.5)).dim(spot(t, at, ends[i]));
  });

  // the silent line draws on "narration"; its labels come with their words
  const lp = ease.inOut(prog(t, c('narration'), 1.0));
  const lineDim = spot(t, c('narration'), c('pictures'), 0.5);
  set(S.line, { x2: lerp(LINE[0], LINE[1], lp).toFixed(1), opacity: +(reveal(t, c('narration'), 0.3) * lineDim).toFixed(3) });
  S.flat.forEach((b, k) => set(b, { opacity: +(reveal(t, c('silent') + k * 0.04, 0.3) * lineDim).toFixed(3) }));
  const preReal = 1 - reveal(t, c('real') - 0.4, 0.4);   // labels leave before the voice ghost arrives
  S.silent.show(reveal(t, c('silent'), 0.5) * preReal).dim(spot(t, c('silent'), c('placeholder')));
  S.ph.show(reveal(t, c('placeholder'), 0.5) * preReal).dim(spot(t, c('placeholder'), c('length')));
  const lenA = reveal(t, c('length'), 0.5), lenD = spot(t, c('length'), c('pictures'));
  S.len.show(lenA).dim(lenD);
  S.lenLab.show(lenA).dim(lenD);

  // the frame builds up on the screen anyway, step by step, in time with the playhead on the silent line
  const on = (n, k = 0) => +reveal(t, c(n) + k, 0.4).toFixed(3);
  const done = lerp(1, 0.35, reveal(t, c('see'), 0.5));
  set(S.frameBg, { opacity: on('pictures') });
  set(S.block, { opacity: +(on('pictures', 0.5) * done).toFixed(3) });
  S.bars.forEach((b, k) => set(b, { opacity: +(on('video', k * 0.3) * done).toFixed(3) }));
  set(S.track, { opacity: +(on('exactly') * done).toFixed(3) });
  const play = prog(t, c('exactly'), c('see') - 0.3 - c('exactly'));
  set(S.fill, { width: (228 * play).toFixed(1), opacity: +(on('exactly') * done).toFixed(3) });
  set(S.head, { cx: lerp(LINE[0], LINE[1], play).toFixed(1), opacity: +(fadeBetween(t, c('exactly'), c('see'), 0.4)).toFixed(3) });
  const ghostA = lerp(1, 0.6, reveal(t, c('see'), 0.5));   // stays readable in the final wide shot
  S.ghost.forEach((b, k) => set(b, { opacity: +(reveal(t, c('real') + k * 0.04, 0.3) * ghostA).toFixed(3) }));
  S.tick.show(reveal(t, c('see'), 0.5));

  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.5, fin).toFixed(3) });
}
