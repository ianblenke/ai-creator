// 10 - what comes later: the finished render sits on the left; three dim, dashed slots wait to its right (a download
// arrow into a small model box, a voice server over its weights slab, the violet coding-agent cloud with its pencil).
// Each cost lights its slot by name, then the camera visits each one in turn: the network (alignment, a real voice and the
// checks download their models the first time), disk space (the slab fills with the weights, about three gigabytes for one
// voice option, plus a container box for the image), money (the agent writes the scenes, the critique and the reviews; a
// dashed "not measured" note, never a tick). Ends wide on "each one costs you something".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, arrow, flow, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'three', at: 'Three things' },
    { name: 'render', at: 'this render' },
    { name: 'costs', at: 'costs you' },
    { name: 'offline', at: 'offline run' },
    { name: 'network', at: 'a network' },
    { name: 'disk', at: 'disk space' },
    { name: 'money', at: 'or money' },
    { name: 'first', at: 'First' },
    { name: 'align', at: 'alignment' },
    { name: 'voice', at: 'real voice' },
    { name: 'checks', at: 'the checks' },
    { name: 'download', at: 'download their' },
    { name: 'firsttime', at: 'first time' },
    { name: 'second', at: 'Second' },
    { name: 'server', at: 'voice server' },
    { name: 'downloads', at: 'server downloads' },
    { name: 'weights', at: 'own weights' },
    { name: 'gb', at: 'three gigabytes' },
    { name: 'option', at: 'one voice option' },
    { name: 'image', at: 'own image' },
    { name: 'third', at: 'Third' },
    { name: 'scenes', at: 'the scenes' },
    { name: 'critique', at: 'script critique' },
    { name: 'reviews', at: 'the reviews' },
    { name: 'written', at: 'are written' },
    { name: 'cloud', at: 'in the cloud' },
    { name: 'agent', at: 'coding agent' },
    { name: 'notout', at: 'not worked out' },
    { name: 'epcost', at: 'episode costs' },
    { name: 'guess', at: 'so I will' },
  ],
};

const COLS = [800, 1180, 1560], SLOT_Y = 420, LAB_Y = 580;   // the three slots and their name labels
const RX = 330;                                              // the finished render
const stroke = (color, w = 5) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
// bright inside [a, b), `floor` outside, smooth edges
const spot = (t, a, b, floor = 0.4) => lerp(floor, 1, fadeBetween(t, a, b));

function tick(parent, s = 1) {
  const it = new Item(parent, 34 * s, 26 * s);
  el(it.g, 'path', { d: 'M -15 0 L -4 11 L 16 -12', ...stroke(P.accent, 7), transform: `scale(${s})` });
  return it;
}
// THE VOICE (canon II): 9 accent rounded bars, 12 wide, pitch 34 (gap 22), up to 60 tall, centred on (0,0); scale with .at(x, y, s)
function wave(parent) {
  const it = new Item(parent, 8 * 34 + 12, 60);
  [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].forEach((k, i) => {
    const h = 60 * k;
    el(it.g, 'rect', { x: -136 + i * 34 - 6, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent });
  });
  return it;
}
// THE AGENT (canon): violet cloud (r 28/26/38, 3 px outline), pencil with ferrule at its lower right; returns the pencil too
function agent(parent) {
  const it = new Item(parent, 128, 82);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  it.pen = el(it.g, 'g', { transform: 'translate(40 40) rotate(-35)' });
  el(it.pen, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, fill: P.bg, stroke: P.violet, 'stroke-width': 3 });
  el(it.pen, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, stroke: P.violet, 'stroke-width': 3 });
  el(it.pen, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return it;
}
// THE CONTAINER BOX (canon): 360 x 420, rx 28, 4 px ink outline, 8 translucent cool layers 40 px high; scale with .at()
function containerBox(parent) {
  const it = new Item(parent, 360, 420);
  el(it.g, 'rect', { x: -180, y: -210, width: 360, height: 420, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  it.layers = Array.from({ length: 8 }, (_, i) => el(it.g, 'rect', {
    x: -158, y: 190 - (i + 1) * 48 + 6, width: 316, height: 40, rx: 10,
    fill: P.cool, 'fill-opacity': 0.18, stroke: P.cool, 'stroke-width': 2, opacity: 0,
  }));
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'first', delay: 0.5, dur: 1.4, x: 900, y: 480, z: 1.5 },    // the network
    { cue: 'second', delay: 0.5, dur: 1.4, x: 1400, y: 470, z: 1.2 },  // disk space (wider: room for the container box)
    { cue: 'third', delay: 0.5, dur: 1.4, x: 1320, y: 470, z: 1.4 },   // money
    { cue: 'epcost', delay: 0.5, dur: 1.3, x: 960, y: 540, z: 1 },     // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // THE FINISHED RENDER: a 16:9 frame with a play mark; an accent tick for the offline run
  S.render = new Item(W);
  el(S.render.g, 'rect', { x: RX - 160, y: SLOT_Y - 90, width: 320, height: 180, rx: 18, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(S.render.g, 'path', { d: `M ${RX - 22} ${SLOT_Y - 32} L ${RX + 34} ${SLOT_Y} L ${RX - 22} ${SLOT_Y + 32} Z`, fill: P.ink, 'fill-opacity': 0.2, ...stroke(P.ink, 5) });
  S.rTick = tick(W, 1.6).at(RX + 120, SLOT_Y - 50);
  S.rLab = label(W, 'this render', { size: type.label }).at(RX, LAB_Y);

  // three dashed slots
  S.slots = COLS.map((x) => {
    const it = new Item(W);
    el(it.g, 'rect', { x: x - 140, y: SLOT_Y - 120, width: 280, height: 240, rx: 26, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '12 10' });
    return it;
  });

  // slot 1, THE NETWORK: a download arrow into a small model box
  const A = COLS[0];
  S.net = new Item(W);
  S.netArrow = arrow(S.net.g, A, 300, A, 352, { color: P.ink, width: 5 });
  el(S.net.g, 'rect', { x: A - 75, y: 370, width: 150, height: 90, rx: 14, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  S.netFill = el(S.net.g, 'rect', { x: A - 63, y: 448, width: 126, height: 0, rx: 8, fill: P.ink, 'fill-opacity': 0.35 });
  S.models = label(W, 'models', { size: type.note }).at(A, 505);
  // the two downloaders (alignment, the checks) feed the model box: a thin dim connector each, dots flowing along it
  const feeds = [[1040, 320], [1040, 500]].map(([x, y]) => [[x, y], [A + 85, 415]]);
  S.netLinks = feeds.map(([[x1, y1], [x2, y2]]) => el(W, 'line', { x1, y1, x2, y2, ...stroke(P.dim, 3), opacity: 0 }));
  S.netDots = feeds.map((pts) => flow(W, pts, { n: 2, r: 7, color: P.ink, period: 1.4 }));

  // slot 2, DISK SPACE: a voice server (ink box with a little voice) over THE DISK, a cool weights slab that fills
  const B = COLS[1];
  S.srv = new Item(W);
  el(S.srv.g, 'rect', { x: B - 90, y: 320, width: 180, height: 110, rx: 14, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  wave(S.srv.g).at(B, 375, 0.55).show(1);
  // THE DISK: a cool slab that grows upward as the weights land (scene 07's slab, scaled)
  S.slab = el(S.srv.g, 'rect', { x: B - 120, y: 508, width: 240, height: 12, rx: 9, fill: P.cool, 'fill-opacity': 0.3, stroke: P.cool, 'stroke-width': 4 });
  S.srvArrow = arrow(W, B, 238, B, 308, { color: P.ink, width: 5 });
  S.srvDots = flow(W, [[B, 238], [B, 312]], { n: 3, r: 8, color: P.ink, period: 1.2 });

  // slot 3, MONEY: THE AGENT, a violet cloud with a pencil
  const C = COLS[2];
  S.agent = agent(W).at(C - 10, SLOT_Y - 10);

  // the three names, under the slots
  S.labs = ['a network', 'disk space', 'money'].map((s, i) => label(W, s, { size: type.label }).at(COLS[i], LAB_Y));

  // section 1 details: what downloads models the first time
  S.n1 = chip(W, 'alignment', { color: P.ink }).at(1180, 320);
  S.n2 = wave(W).at(1180, 395, 0.75);   // tucked under 'alignment': alignment with a real voice
  S.n3 = chip(W, 'the checks', { color: P.ink }).at(1180, 500);
  S.n4 = chip(W, 'first time', { color: P.ink }).at(A, 670);

  // section 2 details: the weights, their size, and the image
  // left-aligned right of the slot, level with the slab they describe
  const D_X = 1350, atLeft = (it, y) => it.at(D_X + it.w / 2, y);
  S.d1 = atLeft(label(W, 'weights', { size: type.note, color: P.cool, anchor: 'start' }), 495);
  S.d2 = atLeft(label(W, 'about three gigabytes', { size: type.note, anchor: 'start' }), 495);
  S.d3 = atLeft(chip(W, 'one voice option', { color: P.ink }), 575);
  S.box = containerBox(W).at(1900, 440, 0.5);
  S.d4 = label(W, 'its own image', { size: type.note }).at(1900, 600);

  // section 3 details: what the agent writes, where, and the honest gap
  S.m = ['the scenes', 'script critique', 'the reviews'].map((s, i) => chip(W, s, { color: P.violet }).at(1080, 320 + i * 90));
  S.mDots = flow(W, [[1440, 410], [1280, 410]], { n: 3, r: 8, color: P.violet, period: 1.3 });
  S.m4 = label(W, 'in the cloud', { size: type.note, color: P.violet }).at(C, 270);
  S.m5 = label(W, 'coding agent', { size: type.note, color: P.violet }).at(C, 270);
  S.m6 = chip(W, 'not measured', { color: P.dim, dashed: true, textColor: P.dim }).at(C, 670);

  const fin = 'each one costs you something';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56) }).at(960, 830);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  const first = c('first'), second = c('second'), third = c('third'), wide = c('epcost') + 0.5 + 1.3;
  const fin = reveal(t, c('guess'), 0.6);
  // visibility of each part of the frame: hidden while the camera is on another slot (so nothing is cut by the edge)
  const back = reveal(t, wide, 0.5);
  const onWide = (1 - ease.in(prog(t, first, 0.5))) + back;                          // render: before the sections, and at the close
  const sec = [
    (1 - ease.in(prog(t, second, 0.5))) + back,                                       // slot 1: until its section ends
    Math.max(onWide, fadeBetween(t, second + 0.5, third)),                            // slot 2: also in its own section
    Math.max(onWide, reveal(t, third + 0.5, 0.5)),                                    // slot 3: from its section on
  ];

  // the finished render: there from the start; the offline run gets its tick
  S.render.show(reveal(t, 0.1, 0.6) * Math.min(1, onWide)).dim(lerp(t < c('three') + 0.4 ? 1 : 0.6, 0.6, fin));
  S.rLab.show(reveal(t, c('render'), 0.5) * Math.min(1, onWide)).dim(lerp(spot(t, c('render'), c('network'), 0.6), 0.6, fin));
  S.rTick.show(reveal(t, c('offline'), 0.4) * Math.min(1, onWide));

  // the three slots: dim and waiting; a wave of light on "costs you"; each lit when it is named, and in its section
  const named = [c('network'), c('disk'), c('money')];
  const ends = [c('disk'), c('money'), first];
  const sections = [[first, second], [second, third], [third, c('guess')]];
  const icons = [S.net, S.srv, S.agent];
  COLS.forEach((_, i) => {
    const v = Math.min(1, sec[i]);
    const wave1 = 0.35 + 0.35 * fadeBetween(t, c('costs') + i * 0.3, c('costs') + i * 0.3 + 0.7, 0.35);
    const lit = Math.max(wave1, spot(t, named[i], ends[i], 0.35), spot(t, sections[i][0], sections[i][1], 0.35));
    const d = lerp(lit, 0.6, fin);
    S.slots[i].show(reveal(t, c('three') + i * 0.25, 0.5) * v).dim(d);
    icons[i].show(reveal(t, c('three') + i * 0.25, 0.5) * v).dim(d);
    S.labs[i].show(reveal(t, named[i], 0.5) * v).dim(lerp(Math.max(spot(t, named[i], ends[i], 0.45), spot(t, sections[i][0], sections[i][1], 0.45)), 0.7, fin));
  });
  S.netArrow.draw(1, 1);
  S.srvArrow.draw(1, reveal(t, c('downloads'), 0.4) * fadeBetween(t, c('downloads'), third));   // fade in whole: no lone arrowhead
  S.srvDots.update(t, fadeBetween(t, c('downloads') + 0.4, c('gb')) * 0.9);

  // section 1, the network: alignment, a real voice, the checks; their models download into the box the first time
  const out1 = 1 - ease.in(prog(t, second, 0.5));
  S.n1.show(reveal(t, c('align'), 0.5) * out1).dim(spot(t, c('align'), c('voice')));
  S.n2.show(reveal(t, c('voice'), 0.5) * out1).dim(spot(t, c('voice'), c('checks')));
  S.n3.show(reveal(t, c('checks'), 0.5) * out1).dim(spot(t, c('checks'), c('download')));
  S.n4.show(reveal(t, c('firsttime'), 0.5) * out1);
  S.models.show(reveal(t, c('download'), 0.5) * out1).dim(spot(t, c('download'), c('firsttime'), 0.6));
  const feed = fadeBetween(t, c('download'), second);
  S.netLinks.forEach((ln) => set(ln, { opacity: +(feed * 0.7).toFixed(3) }));
  S.netDots.forEach((f) => f.update(t, feed * 0.9));
  const fill = ease.inOut(prog(t, c('download') + 0.3, 2.4));
  set(S.netFill, { y: (448 - 66 * fill).toFixed(1), height: (66 * fill).toFixed(1) });

  // section 2, disk space: the weights fill the slab, about three gigabytes for one voice option, plus the image
  const out2 = 1 - ease.in(prog(t, third, 0.5));
  const slab = ease.inOut(prog(t, c('weights'), 2.2));
  const sh = lerp(12, 50, slab);
  set(S.slab, { y: (520 - sh).toFixed(1), height: sh.toFixed(1) });
  S.d1.show(fadeBetween(t, c('weights'), c('gb') - 0.5, 0.4) * out2);
  S.d2.show(reveal(t, c('gb'), 0.5) * out2).dim(spot(t, c('gb'), c('option')));
  S.d3.show(reveal(t, c('option'), 0.5) * out2).dim(spot(t, c('option'), c('image')));
  S.box.show(reveal(t, c('image'), 0.5) * out2);
  S.box.layers.forEach((r, k) => set(r, { opacity: +reveal(t, c('image') + 0.3 + k * 0.12, 0.25).toFixed(3) }));
  S.d4.show(reveal(t, c('image'), 0.5) * out2);

  // section 3, money: the agent writes the scenes, the critique and the reviews, in the cloud; the cost is not measured
  const out3 = 1 - ease.in(prog(t, c('epcost'), 0.5));
  const mc = [c('scenes'), c('critique'), c('reviews')];
  S.m.forEach((it, i) => it.show(reveal(t, mc[i], 0.5) * out3).dim(Math.max(spot(t, mc[i], mc[i + 1] ?? c('written')), spot(t, c('written'), c('cloud'), 0.4))));
  S.mDots.update(t, fadeBetween(t, c('written'), c('epcost')) * 0.9);
  const wig = fadeBetween(t, c('written'), c('notout'));
  set(S.agent.pen, { transform: `translate(40 40) rotate(${(-35 + 6 * Math.sin(t * 9) * wig).toFixed(2)})` });
  S.m4.show(fadeBetween(t, c('cloud'), c('agent') - 0.5, 0.4) * out3);
  S.m5.show(reveal(t, c('agent'), 0.5) * out3);
  S.m6.show(reveal(t, c('notout') + 0.3, 0.5)).dim(lerp(1, 0.6, fin));

  S.final.show(fin);
}
