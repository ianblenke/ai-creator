// 09 - the first render: THE TRACK (canon geometry, six pipeline stages) builds left to right; the stage being spoken has the
// accent ring, and a finished stage gets a green tick. Above it the work itself changes: a flat silent line, word marks on it (alignment), small brief cards over it,
// the cards become still frames with a layout tick, then one moving rendered frame, then the draft video file. Each stage
// prints a last line that matches the docs; the render's own note (about a minute, twenty-four cores, no graphics card,
// about two on a copy, both single measured runs); the track is "the example"; your own episodes folder is dashed (not there yet) until one command
// makes it. Ends wide on "one stage at a time".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, arrow, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'offline', at: 'offline run' },
    { name: 'stages', at: 'one stage at a time' },
    { name: 'first', at: 'First the' },
    { name: 's0', at: 'silent narration' },
    { name: 's1', at: 'Then alignment' },
    { name: 'word', at: 'finds when each word' },
    { name: 's2', at: 'scene briefs' },
    { name: 'desc', at: 'short description' },
    { name: 's3', at: 'and keyframes' },
    { name: 'still', at: 'still frames' },
    { name: 'layout', at: 'check the layout' },
    { name: 's4', at: 'draft render of the moving' },
    { name: 'moving', at: 'moving pictures' },
    { name: 's5', at: 'a draft video' },
    { name: 'joins', at: 'joins them' },
    { name: 'sound', at: 'with the sound' },
    { name: 'each', at: 'Each stage prints' },
    { name: 'lastline', at: 'a last line' },
    { name: 'compare', at: 'compare with' },
    { name: 'took', at: 'render took' },
    { name: 'minute', at: 'about a minute' },
    { name: 'cores', at: 'twenty-four cores' },
    { name: 'nocard', at: 'no graphics card' },
    { name: 'two', at: 'about two' },
    { name: 'example', at: 'This runs' },
    { name: 'ships', at: 'where it ships' },
    { name: 'own', at: 'Your own episodes' },
    { name: 'folder', at: 'episodes folder' },
    { name: 'fresh', at: 'a fresh copy' },
    { name: 'docs', at: 'the docs show' },
    { name: 'command', at: 'one command' },
    { name: 'makes', at: 'makes it' },
  ],
};

// THE TRACK (canon): six stops R 72 with an icon inside, y 560, evenly from x 260 to 1676, a thin dim line between them;
// the stage being spoken has the accent ring, a finished stage gets a small accent tick. Labels: even below, odd above.
const TY = 560, R = 72;
const XS = [0, 1, 2, 3, 4, 5].map((i) => 260 + (i * (1676 - 260)) / 5);
const NAMES = ['silent narration', 'alignment', 'scene briefs', 'keyframes', 'draft render', 'draft video'];
const LAB = 44;
const LY = (i) => (i % 2 === 0 ? TY + R + 60 : TY - R - 60);
const LINE_Y = 330, CARD_X = [760, 960, 1160], CARD_Y = 225;   // the work zone above the track
const BOT = 800;                                                // the lower band
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const WAVE_X = (k) => (k - 4) * 34;                             // canon voice positions: 12 px bars, gap 22

function tickPath(parent, color, s = 1) {
  return el(parent, 'path', { d: 'M -15 0 L -4 11 L 16 -12', ...stroke(color, 7), transform: `scale(${s})` });
}
// a SILENT voice (canon): the 9 waveform positions drawn flat, 4 px high, dim
function silentLine(parent, s) {
  const g = el(parent, 'g', { transform: `scale(${s})` });
  for (let k = 0; k < 9; k++) el(g, 'rect', { x: WAVE_X(k) - 6, y: -2, width: 12, height: 4, rx: 2, fill: P.dim });
  return g;
}
// the six stage icons, drawn about 90 px inside a stop
function stageIcon(g, i) {
  if (i === 0) {        // silent narration: the flat silent line
    for (let k = 0; k < 9; k++) el(g, 'rect', { x: (k - 4) * 11 - 4, y: -3, width: 8, height: 6, rx: 3, fill: P.dim });
  } else if (i === 1) { // alignment: the flat line with a mark at each word
    for (let k = 0; k < 9; k++) el(g, 'rect', { x: (k - 4) * 11 - 4, y: 9, width: 8, height: 6, rx: 3, fill: P.dim });
    [-33, -11, 11, 33].forEach((x) => el(g, 'line', { x1: x, x2: x, y1: -22, y2: 4, ...stroke(P.ink, 5) }));
  } else if (i === 2) { // scene briefs: a page of short lines
    el(g, 'rect', { x: -30, y: -38, width: 60, height: 76, rx: 8, ...stroke(P.ink, 5) });
    [-18, 0, 18].forEach((y, k) => el(g, 'line', { x1: -16, x2: k === 1 ? 6 : 16, y1: y, y2: y, ...stroke(P.ink, 5) }));
  } else if (i === 3) { // keyframes: a still frame
    el(g, 'rect', { x: -42, y: -30, width: 84, height: 60, rx: 8, ...stroke(P.ink, 5) });
    el(g, 'circle', { cx: -12, cy: 2, r: 12, ...stroke(P.ink, 4), fill: P.ink, 'fill-opacity': 0.2 });
    el(g, 'rect', { x: 8, y: -8, width: 22, height: 20, rx: 4, ...stroke(P.dim, 4) });
  } else if (i === 4) { // draft render: a frame with a moving shape
    el(g, 'rect', { x: -42, y: -30, width: 84, height: 60, rx: 8, ...stroke(P.ink, 5) });
    el(g, 'circle', { cx: 12, cy: 0, r: 12, ...stroke(P.ink, 4), fill: P.ink, 'fill-opacity': 0.2 });
    [-8, 8].forEach((y) => el(g, 'line', { x1: -26, x2: -10, y1: y, y2: y, ...stroke(P.dim, 4) }));
  } else {              // draft video: the file with a play mark (ink)
    el(g, 'path', { d: 'M -28 -38 L 14 -38 L 30 -22 L 30 38 L -28 38 Z', ...stroke(P.ink, 5), fill: P.ink, 'fill-opacity': 0.08 });
    el(g, 'path', { d: 'M -10 -14 L 14 2 L -10 18 Z', ...stroke(P.ink, 4), fill: P.ink, 'fill-opacity': 0.2 });
  }
}
// a brief card that becomes a still frame: bars (the description), then a neutral picture and a layout tick
function briefCard(parent) {
  const it = new Item(parent, 150, 84);
  it.rect = el(it.g, 'rect', { x: -75, y: -42, width: 150, height: 84, rx: 12, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  it.bars = el(it.g, 'g');
  [[-22, 90], [-2, 64], [18, 78]].forEach(([y, w]) => el(it.bars, 'rect', { x: -50, y: y - 4, width: w, height: 8, rx: 4, fill: P.ink }));
  it.pic = el(it.g, 'g', { opacity: 0 });
  el(it.pic, 'circle', { cx: -22, cy: 4, r: 20, fill: P.ink, 'fill-opacity': 0.2, stroke: P.ink, 'stroke-width': 3 });
  el(it.pic, 'rect', { x: 10, y: -14, width: 44, height: 36, rx: 6, fill: P.dim, 'fill-opacity': 0.2, stroke: P.dim, 'stroke-width': 3 });
  it.tk = el(it.g, 'g', { transform: 'translate(88 -46)', opacity: 0 });
  tickPath(it.tk, P.accent, 1.1);
  return it;
}
// THE PROCESSOR: the cool chip with pins on four sides
function processor(parent) {
  const it = new Item(parent, 142, 142);
  el(it.g, 'rect', { x: -55, y: -55, width: 110, height: 110, rx: 12, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  for (let k = -1.5; k <= 1.5; k++) {
    const o = k * 24;
    [[o, -55, o, -71], [o, 55, o, 71], [-55, o, -71, o], [55, o, 71, o]].forEach(([x1, y1, x2, y2]) => el(it.g, 'line', { x1, y1, x2, y2, ...stroke(P.cool, 4) }));
  }
  return it;
}
// THE CARD (canon): 320 x 120 cool slab, fan left, 6 fins right; dashed and struck through (the narration says there is none)
function noCard(parent) {
  const it = new Item(parent, 340, 130);
  const d = { 'stroke-dasharray': '10 8' };
  el(it.g, 'rect', { x: -160, y: -60, width: 320, height: 120, rx: 16, fill: P.cool, 'fill-opacity': 0.06, stroke: P.cool, 'stroke-width': 4, ...d });
  el(it.g, 'circle', { cx: -90, cy: 0, r: 34, fill: 'none', stroke: P.cool, 'stroke-width': 4, ...d });
  for (let k = 0; k < 6; k++) el(it.g, 'line', { x1: -20 + k * 28, y1: -26, x2: -20 + k * 28, y2: 26, ...stroke(P.cool, 4), opacity: 0.7, ...d });
  el(it.g, 'line', { x1: -170, y1: 60, x2: 170, y2: -60, ...stroke(P.dim, 6) });
  return it;
}
// THE CLOCK: a dim circle with one slow hand
function clock(parent) {
  const it = new Item(parent, 110, 110);
  el(it.g, 'circle', { cx: 0, cy: 0, r: 50, fill: 'none', stroke: P.dim, 'stroke-width': 5 });
  it.hand = el(it.g, 'line', { x1: 0, y1: 0, x2: 0, y2: -36, ...stroke(P.dim, 6) });
  return it;
}
// a folder with a tab; dashed until it exists
function folder(parent) {
  const it = new Item(parent, 110, 80);
  it.p = el(it.g, 'path', { d: 'M -55 -40 L -15 -40 L -5 -28 L 55 -28 L 55 40 L -55 40 Z', ...stroke(P.dim, 4) });
  return it;
}
// a plain ink chip with a separate accent tick to its left
function tickedChip(parent, text, x, y) {
  const ch = chip(parent, text, { color: P.ink }).at(x, y);
  const tk = new Item(parent, 40, 30);
  tickPath(tk.g, P.accent, 1);
  tk.at(x - ch.w / 2 - 40, y);
  return { ch, tk };
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  // zoom stays at 1: the track spans the whole frame width, so the camera glides vertically only
  S.stage = makeStage(ctx.svg, [
    { cue: 's0', dur: 2.0, x: 960, y: 500, z: 1 },          // up to the work above the track
    { cue: 'each', dur: 1.6, x: 960, y: 580, z: 1 },        // down to the last line and the docs
    { cue: 'took', dur: 1.6, x: 960, y: 500, z: 1 },        // up to the render's own note
    { cue: 'example', dur: 1.4, x: 960, y: 540, z: 1 },     // level: the example
    { cue: 'own', dur: 1.6, x: 960, y: 580, z: 1 },         // down to your own folder
    { cue: 'makes', delay: -0.3, dur: 1.0, x: 960, y: 540, z: 1 }, // end wide
  ], ctx.cue);
  const W = S.stage.world;

  // the opening words
  S.offLab = label(W, 'the offline run', { size: type.title }).at(960, 230);
  S.oneLab = label(W, 'one stage at a time', { size: type.label, color: P.ink }).at(960, 330);

  // THE TRACK
  S.segs = XS.slice(1).map((x, i) => el(W, 'line', { x1: XS[i] + R, y1: TY, x2: XS[i] + R, y2: TY, ...stroke(P.dim, 5), opacity: 0 }));
  S.stops = XS.map((x, i) => {
    const it = new Item(W, 2 * R, 2 * R);
    el(it.g, 'circle', { cx: 0, cy: 0, r: R, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
    it.ring = el(it.g, 'circle', { cx: 0, cy: 0, r: R, fill: P.accent, 'fill-opacity': 0.1, stroke: P.accent, 'stroke-width': 6, opacity: 0 });
    it.icon = el(it.g, 'g', { opacity: 0 });
    stageIcon(it.icon, i);
    it.tk = el(it.g, 'g', { transform: 'translate(52 -52)', opacity: 0 });
    el(it.tk, 'circle', { cx: 0, cy: 0, r: 22, fill: P.bg, stroke: P.accent, 'stroke-width': 4 });
    tickPath(it.tk, P.accent, 0.8);
    it.at(x, TY);
    const lab = label(W, NAMES[i], { size: LAB });
    it.lab = lab.at(Math.min(Math.max(x, 132 + lab.w / 2), 1788 - lab.w / 2), LY(i));
    return it;
  });

  // the work zone: the flat silent line, its word marks, the brief cards, the rendered frame, the video file
  S.silent = el(W, 'g', { transform: `translate(960 ${LINE_Y})`, opacity: 0 });
  silentLine(S.silent, 2);
  S.marks = Array.from({ length: 9 }, (_, k) => el(W, 'line', { x1: 960 + 2 * WAVE_X(k), x2: 960 + 2 * WAVE_X(k), y1: LINE_Y - 22, y2: LINE_Y + 22, ...stroke(P.ink, 4), opacity: 0 }));
  S.cards = CARD_X.map((x) => briefCard(W).at(x, CARD_Y));
  S.frame = new Item(W, 340, 192);
  el(S.frame.g, 'rect', { x: -170, y: -96, width: 340, height: 192, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  S.ball = el(S.frame.g, 'circle', { cx: 0, cy: 10, r: 30, fill: P.ink, 'fill-opacity': 0.2, stroke: P.ink, 'stroke-width': 4 });
  el(S.frame.g, 'rect', { x: -130, y: 58, width: 260, height: 10, rx: 5, fill: P.ink, 'fill-opacity': 0.2, stroke: P.ink, 'stroke-width': 2 });
  S.joinArrow = arrow(W, 1148, 265, 1232, 265, { color: P.dim, width: 5, head: 18 });
  S.video = new Item(W, 110, 140);
  el(S.video.g, 'path', { d: 'M -55 -70 L 25 -70 L 55 -40 L 55 70 L -55 70 Z', ...stroke(P.ink, 5), fill: P.ink, 'fill-opacity': 0.08 });
  el(S.video.g, 'path', { d: 'M 25 -70 L 25 -40 L 55 -40', ...stroke(P.ink, 5) });
  el(S.video.g, 'path', { d: 'M -16 -30 L 22 -6 L -16 18 Z', fill: P.ink, 'fill-opacity': 0.2, stroke: P.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  S.vSound = el(S.video.g, 'line', { x1: -34, y1: 44, x2: 34, y2: 44, ...stroke(P.dim, 5), opacity: 0 });
  S.video.at(1300, 265);

  // each stage prints a last line; it matches the docs
  S.lastLine = tickedChip(W, 'last line', 640, BOT);
  S.eq = label(W, '=', { size: type.title, color: P.accent }).at(960, BOT);
  S.docsChip = chip(W, 'the docs', { color: P.ink }).at(1210, BOT);

  // the render's own note
  S.clock = clock(W).at(230, 220);
  S.minLab = label(W, 'about a minute', { size: 44, anchor: 'start' });
  S.minLab.at(305 + S.minLab.w / 2, 220);
  // "about two on a copy" is a measured single run (123 s on a copy, facts.md), hedged like "about a minute": same plain label
  S.twoLab = label(W, 'about two on a copy', { size: 44, anchor: 'start' });
  S.twoLab.at(305 + S.twoLab.w / 2, 330);
  S.cpu = processor(W).at(860, 220);
  S.coreLab = label(W, 'twenty-four cores', { size: 44, color: P.cool, anchor: 'start' });
  S.coreLab.at(955 + S.coreLab.w / 2, 220);
  S.noCard = noCard(W).at(1580, 220);
  S.noCardLab = label(W, 'no graphics card', { size: 44, color: P.dim }).at(1580, 335);

  // the example: a box around the row of stops
  S.exBox = el(W, 'rect', { x: 152, y: 464, width: 1616, height: 192, rx: 28, fill: 'none', stroke: P.ink, 'stroke-width': 4, opacity: 0 });
  S.exLab = label(W, 'the example', { size: type.label }).at(960, 330);

  // your own episodes folder: dashed until the one command makes it
  S.folder = folder(W).at(440, BOT);
  S.folderLab = label(W, 'episodes folder', { size: 44, anchor: 'start' });
  S.folderLab.at(520 + S.folderLab.w / 2, BOT);
  S.notYet = chip(W, 'not yet', { color: P.dim, dashed: true }).at(1060, BOT);
  S.cmd = tickedChip(W, 'one command', 1460, BOT);

  S.final = label(S.stage.hud, 'one stage at a time', { size: type.title, color: P.ink }).at(960, 220);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const SC = [0, 1, 2, 3, 4, 5].map((i) => c(`s${i}`));

  // the opening words, gone before the silent line arrives
  S.offLab.show(fadeBetween(t, c('offline'), c('first'))).dim(lerp(1, 0.5, reveal(t, c('stages'), 0.5)));
  S.oneLab.show(fadeBetween(t, c('stages'), c('first')));

  // spotlight on the track over the scene
  const allBright = Math.max(fadeBetween(t, c('each'), c('lastline') + 0.6), fadeBetween(t, c('example'), c('own')));
  const trackBack = lerp(1, 0.35, reveal(t, c('own'), 0.6));
  S.stops.forEach((s, i) => {
    s.show(reveal(t, c('stages') + i * 0.15, 0.4));
    const next = i < 5 ? SC[i + 1] : c('each');
    // the stage being spoken carries the accent ring; the render's ring returns when it is spoken again
    let on = fadeBetween(t, SC[i], next, 0.4);
    if (i === 4) on = Math.max(on, fadeBetween(t, c('took'), c('example'), 0.4));
    set(s.ring, { opacity: +on.toFixed(3) });
    set(s.icon, { opacity: +reveal(t, SC[i], 0.4).toFixed(3) });
    set(s.tk, { opacity: +reveal(t, next, 0.3).toFixed(3) });
    // not reached yet: waiting dim; current: bright; finished: steps back
    let d = t < SC[i] ? 0.6 : lerp(1, 0.4, ease.inOut(reveal(t, next, 0.6)));
    if (i === 4) d = Math.max(d, fadeBetween(t, c('took'), c('example')));
    d = Math.max(d, allBright);
    // "each stage prints": a quick pulse left to right; "where it ships": a small one inside the box
    const pulse = fadeBetween(t, c('each') + i * 0.15, c('each') + i * 0.15 + 0.35, 0.2);
    s.at(XS[i], TY, 1 + 0.15 * pulse + 0.07 * fadeBetween(t, c('ships') + i * 0.1, c('ships') + i * 0.1 + 0.4, 0.2));
    s.dim(d * trackBack);
    s.lab.show(reveal(t, SC[i], 0.4)).dim(d * trackBack);
    if (i > 0) {   // the line reaches this stop as it is named
      const k = ease.inOut(reveal(t, SC[i] - 0.5, 0.5));
      set(S.segs[i - 1], { x2: lerp(XS[i - 1] + R, XS[i] - R, k).toFixed(1), opacity: +((k > 0 ? 1 : 0) * trackBack).toFixed(3) });
    }
  });

  // the work zone: silent line -> word marks -> brief cards -> still frames -> rendered frame -> draft video
  const workOut = 1 - reveal(t, c('took'), 0.6);
  const early = (1 - reveal(t, SC[4], 0.5)) * workOut;      // line, marks and cards give way to the rendered frame
  const lineDim = lerp(1, 0.45, reveal(t, SC[2], 0.6));
  set(S.silent, { opacity: +(reveal(t, SC[0], 0.6) * early * lineDim).toFixed(3) });
  S.marks.forEach((m, k) => set(m, { opacity: +(reveal(t, c('word') + k * 0.1, 0.25) * early * lineDim).toFixed(3) }));
  S.cards.forEach((cd, i) => {
    cd.show(reveal(t, c('desc') + i * 0.3, 0.5) * early);
    const still = reveal(t, c('still') + i * 0.2, 0.4);
    set(cd.bars, { opacity: +(1 - still).toFixed(3) });
    set(cd.pic, { opacity: +still.toFixed(3) });
    set(cd.rect, { stroke: still > 0.5 ? P.ink : P.dim });
    set(cd.tk, { opacity: +reveal(t, c('layout') + i * 0.25, 0.3).toFixed(3) });
  });
  const fr = reveal(t, SC[4] + 0.4, 0.6);
  const frX = lerp(960, 900, ease.inOut(prog(t, SC[5], 0.8)));
  S.frame.show(fr * workOut).at(frX, 265, lerp(0.6, 1, fr)).dim(lerp(1, 0.5, reveal(t, c('joins'), 0.5)));
  // the moving pictures: a shape slides across the frame
  const mv = reveal(t, c('moving'), 0.4);
  set(S.ball, { cx: (mv * 90 * Math.sin((t - c('moving')) * 1.6)).toFixed(1) });
  S.joinArrow.draw(ease.inOut(prog(t, c('joins'), 0.6)), reveal(t, c('joins'), 0.2) * workOut);
  S.video.show(reveal(t, SC[5], 0.5) * workOut);
  set(S.vSound, { opacity: +reveal(t, c('sound'), 0.4).toFixed(3) });

  // each stage prints a last line, and it matches the docs
  const lowOut = 1 - reveal(t, c('took'), 0.6);
  const llA = reveal(t, c('lastline'), 0.5) * lowOut, llD = lerp(1, 0.6, reveal(t, c('compare'), 0.5));
  S.lastLine.ch.show(llA).dim(llD);
  S.lastLine.tk.show(llA).dim(llD);
  S.eq.show(reveal(t, c('compare'), 0.5) * lowOut);
  S.docsChip.show(reveal(t, c('compare') + 0.4, 0.5) * lowOut);

  // the render's own note, gone when the example is named
  const noteOut = 1 - reveal(t, c('example'), 0.6);
  const sp = (a, b) => lerp(0.45, 1, fadeBetween(t, a, b));
  S.clock.show(reveal(t, c('minute'), 0.5) * noteOut).dim(sp(c('minute'), c('cores')));
  set(S.clock.hand, { transform: `rotate(${(Math.max(0, t - c('minute')) * 24).toFixed(1)})` });
  S.minLab.show(reveal(t, c('minute'), 0.5) * noteOut).dim(sp(c('minute'), c('cores')));
  S.cpu.show(reveal(t, c('cores') - 0.3, 0.5) * noteOut).dim(sp(c('cores'), c('nocard')));
  S.coreLab.show(reveal(t, c('cores'), 0.5) * noteOut).dim(sp(c('cores'), c('nocard')));
  S.noCard.show(reveal(t, c('nocard'), 0.5) * noteOut).dim(sp(c('nocard'), c('two')));
  S.noCardLab.show(reveal(t, c('nocard') + 0.2, 0.5) * noteOut).dim(sp(c('nocard'), c('two')));
  S.twoLab.show(reveal(t, c('two'), 0.5) * noteOut).dim(sp(c('two'), c('example')));

  // the example: the box around the row of stops
  set(S.exBox, { opacity: +(reveal(t, c('example'), 0.6) * trackBack).toFixed(3) });
  S.exLab.show(reveal(t, c('example') + 0.3, 0.6)).dim(trackBack);

  // your own episodes folder: dashed and dim until the one command makes it
  const made = reveal(t, c('makes'), 0.4);
  S.folder.show(reveal(t, c('folder') - 0.3, 0.5));
  set(S.folder.p, { stroke: made > 0.5 ? P.ink : P.dim, 'stroke-dasharray': made > 0.5 ? 'none' : '10 8', fill: P.ink, 'fill-opacity': (0.08 * made).toFixed(3) });
  S.folderLab.show(reveal(t, c('folder'), 0.5));
  S.notYet.show(fadeBetween(t, c('fresh') + 0.6, c('makes'), 0.4));
  S.cmd.ch.show(reveal(t, c('docs'), 0.5)).dim(lerp(0.6, 1, reveal(t, c('command'), 0.4)));
  S.cmd.tk.show(reveal(t, c('makes'), 0.3));

  // the idea, held to the end, wide
  S.final.show(reveal(t, c('makes') - 0.2, 0.5));
}
