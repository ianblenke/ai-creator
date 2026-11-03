// 02 - intro: two questions (what do you need, can you see it work first?) in violet bubbles, then THE TRACK: six stops
// that light one after another as they are named (a checklist, a project folder with the agent, a shield, a container box
// being built, a check mark, a play button), then the camera pulls back to show a seventh stop past the row, a faint waveform
// in a dashed ring: the voice comes later. A dim clock (slowest step) and THE CARD (dashed: optional) join it. Ends wide.
import { palette as P, ease, lerp, el, set } from 'style';
import { type, Item, label, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'two', at: 'two questions' },
    { name: 'need', at: 'you need' },
    { name: 'work', at: 'see it work' },
    { name: 'go', at: 'go through' },
    { name: 'list', at: 'short list' },
    { name: 'project', at: 'the project' },
    { name: 'agent', at: 'coding agent' },
    { name: 'names', at: 'names to block' },
    { name: 'build', at: 'build the tools' },
    { name: 'tests', at: 'run the tests' },
    { name: 'render', at: 'render the example' },
    { name: 'voice', at: 'The voice' },
    { name: 'slowest', at: 'slowest step' },
    { name: 'graphics', at: 'graphics card' },
    { name: 'later', at: 'comes later' },
  ],
};

const Y = 560, R = 72;                                    // the track's baseline and stop radius (CANON)
const XS = [0, 1, 2, 3, 4, 5, 6].map((k) => 260 + k * 283.2); // six setup stops 260..1676 (CANON), then the voice stop off-frame right
const NS = { 'vector-effect': 'non-scaling-stroke' };    // icons drawn at CANON full size and scaled down keep a readable stroke
const STOPS = [
  ['list', 'short list'], ['project', 'the project'], ['names', 'names to block'], ['build', 'build the tools'],
  ['tests', 'run the tests'], ['render', 'render the example'], ['voice', 'the voice'],
];
const LAB = 46;                                           // stop labels; even stops below the row, odd above
const labY = (i) => (i % 2 === 0 ? Y + R + 52 : Y - R - 52);
const stroke = (color, w = 5) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// the six icons and the voice card, drawn about 90 px inside a stop
function icon(g, i) {
  if (i === 0) {        // checklist: a page with three ticked rows
    el(g, 'rect', { x: -30, y: -38, width: 60, height: 76, rx: 8, ...stroke(P.ink) });
    for (let k = 0; k < 3; k++) {
      el(g, 'path', { d: `M -18 ${-18 + k * 20} l 5 5 l 8 -9`, ...stroke(P.accent, 4) });
      el(g, 'line', { x1: 2, x2: 18, y1: -16 + k * 20, y2: -16 + k * 20, ...stroke(P.ink, 4) });
    }
  } else if (i === 1) { // project folder (lower left); THE AGENT is added in setup (upper right)
    el(g, 'path', { d: 'M -42 -4 L -42 34 L 14 34 L 14 -4 L -10 -4 L -16 -12 L -42 -12 Z', ...stroke(P.ink), fill: P.ink, 'fill-opacity': 0.08, transform: 'translate(-8 12) scale(0.8)', ...NS });
  } else if (i === 2) { // shield
    el(g, 'path', { d: 'M 0 -40 L 32 -28 L 30 6 Q 26 28 0 42 Q -26 28 -30 6 L -32 -28 Z', ...stroke(P.ink), fill: P.ink, 'fill-opacity': 0.08 });
  } else if (i === 3) { // THE CONTAINER BOX (CANON 360 x 420), scaled; its layers are added in setup
    g.box = el(g, 'g', { transform: 'scale(0.19)' });
    el(g.box, 'rect', { x: -180, y: -210, width: 360, height: 420, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 4, ...NS });
  } else if (i === 4) { // check mark
    el(g, 'path', { d: 'M -30 2 L -8 24 L 32 -22', ...stroke(P.accent, 9) });
  } else if (i === 5) { // play button
    el(g, 'path', { d: 'M -18 -30 L 32 0 L -18 30 Z', ...stroke(P.ink, 6), fill: P.ink, 'fill-opacity': 0.12 });
  } else {              // THE VOICE waveform (CANON: 9 bars, 12 wide, gap 22, up to 60 tall), small and faint: it comes later
    const w = el(g, 'g', { transform: 'scale(0.44)', opacity: 0.7 });
    [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((k, j) => {
      const h = 60 * k;
      el(w, 'rect', { x: -142 + j * 34, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent });
    });
  }
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 300, z: 1.15 },          // close on the two questions
    { cue: 'go', delay: -0.3, dur: 1.4, x: 960, y: 540, z: 1 }, // wide for the track
    { cue: 'voice', delay: -1.2, dur: 1.4, x: 1110, y: 560, z: 0.84 }, // pull back so the voice stop fits at the far right
  ], ctx.cue);
  const W = S.stage.world;

  // the two questions
  S.two = label(W, 'two questions', { size: type.title }).at(960, 190);
  S.bubbles = [['need?', 760], ['work?', 1160]].map(([word, x]) => {
    const it = new Item(W, 220, 110);
    const b = label(it.g, word, { size: type.label, color: P.ink }).show(1);
    const w = Math.ceil(b.w + 64), h = 96;
    el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: P.bg2, stroke: P.violet, 'stroke-width': 4 });
    el(it.g, 'path', { d: `M ${-w / 2 + 40} ${h / 2 - 2} L ${-w / 2 + 30} ${h / 2 + 20} L ${-w / 2 + 64} ${h / 2 - 2}`, ...stroke(P.violet, 4), fill: P.bg2 });
    b.raise();
    it.w = w; it.h = h + 24;
    return it.at(x, 290);
  });

  // THE TRACK: a dim line that grows from stop to stop, and a dashed tail to the voice stop
  S.segs = XS.slice(1).map((x, i) => el(W, 'line', { x1: XS[i] + R, y1: Y, x2: XS[i] + R, y2: Y, ...stroke(P.dim, 5), ...(i === 5 ? { 'stroke-dasharray': '12 12' } : {}), opacity: 0 }));
  S.stops = XS.map((x, i) => {
    const it = new Item(W, R * 2, R * 2);
    el(it.g, 'circle', { cx: 0, cy: 0, r: R, fill: P.bg2, stroke: P.dim, 'stroke-width': 4, ...(i === 6 ? { 'stroke-dasharray': '12 10' } : {}) });
    it.ring = el(it.g, 'circle', { cx: 0, cy: 0, r: R, fill: P.accent, 'fill-opacity': 0.1, stroke: P.accent, 'stroke-width': 6, opacity: 0 });
    it.icon = el(it.g, 'g', { opacity: 0 });
    icon(it.icon, i);
    if (i === 3) it.layers = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => el(it.icon.box, 'rect', { x: -158, y: 148 - k * 48, width: 316, height: 40, rx: 10, fill: P.cool, 'fill-opacity': 0.18, stroke: P.cool, 'stroke-width': 2, ...NS, opacity: 0 }));
    if (i === 1) {   // THE AGENT (CANON drawing), scaled into the stop's upper right, fully inside the ring
      it.agent = el(it.icon, 'g', { opacity: 0, transform: 'translate(10 -20) scale(0.45)' });
      const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3, ...NS };
      [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.agent, 'circle', { cx, cy, r, ...st }));
      const pen = el(it.agent, 'g', { transform: 'translate(40 40) rotate(-35)' });
      const ps = { fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round', ...NS };
      el(pen, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, ...ps });
      el(pen, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, ...ps });
      el(pen, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', ...ps });
    }
    it.at(x, Y);
    it.lab = label(W, STOPS[i][1], { size: fitSize(STOPS[i][1], 520, LAB, 44), color: i === 6 ? P.dim : P.ink });
    it.lab.at(i === 6 ? x : Math.min(x, 1796 - it.lab.w / 2), labY(i));   // keep the last setup label inside the safe frame at zoom 1
    return it;
  });

  // at "coding agent" the project stop's label becomes "project and agent" (one fades fully out first)
  S.agentLab = label(W, 'project and agent', { size: fitSize('project and agent', 520, LAB, 44) }).at(XS[1], labY(1));

  // the voice's company, stacked directly above the voice stop and tied to its ring: a dim clock (the slowest step),
  // THE CARD (what speeds it up most) and its name
  S.clock = new Item(W, 84, 84);
  el(S.clock.g, 'circle', { cx: 0, cy: 0, r: 38, ...stroke(P.dim, 5) });
  S.hand = el(S.clock.g, 'line', { x1: 0, y1: 0, x2: 0, y2: -28, ...stroke(P.dim, 5) });
  S.clock.at(XS[6], 170, 1.2);
  // THE CARD (CANON 320 x 120, fan left, 6 fins right), DASHED: it is optional
  S.card = new Item(W, 320, 120);
  const dash = { 'stroke-dasharray': '10 8', ...NS };
  el(S.card.g, 'rect', { x: -160, y: -60, width: 320, height: 120, rx: 16, fill: P.cool, 'fill-opacity': 0.06, stroke: P.cool, 'stroke-width': 4, ...dash });
  el(S.card.g, 'circle', { cx: -90, cy: 0, r: 34, ...stroke(P.cool, 4), ...dash });
  for (let k = 0; k < 6; k++) el(S.card.g, 'line', { x1: -20 + k * 28, y1: -26, x2: -20 + k * 28, y2: 26, ...stroke(P.cool, 4), ...dash, opacity: 0.7 });
  S.card.at(XS[6], 300, 0.6);
  S.cardLab = label(W, 'graphics card', { size: LAB, color: P.ink }).at(XS[6], 372);
  // thin dim connectors: clock -> card, and the whole stack -> the voice stop's ring
  const link = (y1, y2) => el(W, 'line', { x1: XS[6], y1, x2: XS[6], y2, ...stroke(P.dim, 3), 'stroke-dasharray': '6 8', opacity: 0 });
  S.links = [link(222, 262), link(404, Y - R - 6)];

  const fin = 'The voice comes later';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 72, 56), color: P.ink }).at(960, 850);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const fin = reveal(t, c('later'), 0.6);

  // the two questions: bright while spoken, pushed back once the list starts
  const qBack = lerp(1, 0.35, ease.inOut(reveal(t, c('go'), 0.8))) * lerp(1, 0.45, ease.inOut(reveal(t, c('list'), 0.8))); // ~0.15 once the track is underway
  S.two.show(reveal(t, c('two') - 0.2, 0.6)).dim(qBack * lerp(1, 0.6, reveal(t, c('need'), 0.4)));
  S.bubbles[0].show(reveal(t, c('need'), 0.5)).dim(qBack * lerp(1, 0.6, reveal(t, c('work'), 0.4)));
  S.bubbles[1].show(reveal(t, c('work'), 0.5)).dim(qBack);

  // the row of stops appears dim on "go through"; each one lights when it is named, then steps back
  const cues = STOPS.map(([n]) => c(n));
  S.stops.forEach((s, i) => {
    s.show(i === 6 ? reveal(t, c('voice'), 0.5) : reveal(t, c('go') + 0.15 * i, 0.5));
    const on = i === 6 ? 0 : fadeBetween(t, cues[i], cues[i + 1], 0.4);
    set(s.ring, { opacity: +on.toFixed(3) });
    set(s.icon, { opacity: +reveal(t, cues[i], 0.4).toFixed(3) });
    const after = i < 6 ? ease.inOut(reveal(t, cues[i + 1], 0.6)) : 0;
    const d = t < cues[i] ? 0.6 : lerp(1, 0.4, after);
    s.dim(d);
    const swap = i === 1 ? reveal(t, c('agent'), 0.3) : 0;
    s.lab.show(reveal(t, cues[i], 0.4) * (1 - swap)).dim(d);
    if (i === 1) S.agentLab.show(reveal(t, c('agent') + 0.3, 0.3)).dim(d);
    if (s.layers) s.layers.forEach((r, k) => set(r, { opacity: +reveal(t, cues[i] + 0.2 + k * 0.12, 0.2).toFixed(3) }));
    if (s.agent) set(s.agent, { opacity: +reveal(t, c('agent'), 0.4).toFixed(3) });
    if (i > 0) {   // the line reaches this stop as it is named
      const k = ease.inOut(reveal(t, cues[i] - 0.5, 0.5));
      set(S.segs[i - 1], { x2: lerp(XS[i - 1] + R, XS[i] - R, k).toFixed(1), opacity: +(k > 0 ? 1 : 0) });
    }
  });

  S.clock.show(reveal(t, c('slowest'), 0.5)).dim(lerp(1, 0.6, reveal(t, c('graphics'), 0.4)));
  set(S.hand, { transform: `rotate(${(Math.max(0, t - c('slowest')) * 12).toFixed(2)})` });
  const cardDim = lerp(1, 0.6, reveal(t, c('later'), 0.4));
  S.card.show(reveal(t, c('graphics'), 0.5)).dim(cardDim);
  S.cardLab.show(reveal(t, c('graphics') + 0.2, 0.4)).dim(cardDim);
  S.links.forEach((l) => set(l, { opacity: +(0.8 * reveal(t, c('graphics'), 0.5)).toFixed(3) }));

  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.6, fin).toFixed(3) });
}
