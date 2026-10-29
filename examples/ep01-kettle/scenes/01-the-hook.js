// 01 - the hook: a kettle heats, boils and switches itself off (the switch pops up by itself); no clock, no screen;
// so how does it know? The steam rising from the spout. The kettle, steam and base close-up come from the shared _kettle.js.
// The sensor and its channel stay hidden here (scene 02 introduces them at "a small pipe").
import { palette as P, prog, ease, clamp, el, set } from 'style';
import { type, Item, label, glow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';
import { kettle, kettleBase, steam, KETTLE } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'kettle', at: 'a kettle' },
    { name: 'notice', at: 'you never notice' },   // camera glides onto the base
    { name: 'heats', at: 'heats water' },         // the switch clicks down, power ON, coil hot
    { name: 'until', at: 'until the water' },     // pull back to watch it heat
    { name: 'boils', at: 'water boils' },
    { name: 'nobody', at: 'nobody touching' },    // glide back onto the untouched switch
    { name: 'stops', at: 'it stops' },            // the switch pops up by itself, power OFF
    { name: 'clock', at: 'no clock' },
    { name: 'screen', at: 'no screen' },
    { name: 'how', at: 'how does a plain kettle' },
    { name: 'ready', at: 'is ready' },
    { name: 'kettles', at: 'In many kettles' },
    { name: 'see', at: 'something you can see' },
    { name: 'rising', at: 'rising from the spout' },
  ],
};

const KX = 960, KY = 540, KS = 1.1;  // the shared kettle, spout left, handle right
// close-up on the base: the 48 px rocker shows at 48 * KS * 3 = 158 px; the whole base strip and power ring stay inside the frame
const CLOSE = { x: KX + 40, y: KY + 205 * KS, z: 3 };
let S;

// A strike-through icon (clock or screen) with a hot slash that draws in.
function crossed(parent, w, h, drawIcon) {
  const it = new Item(parent, w, h);
  drawIcon(it.g);
  it.slash = el(it.g, 'line', { x1: -w / 2, y1: -h / 2, x2: w / 2, y2: h / 2, stroke: P.hot, 'stroke-width': 9, 'stroke-linecap': 'round' });
  it.len = Math.hypot(w, h);
  set(it.slash, { 'stroke-dasharray': `${it.len} ${it.len}` });
  return it;
}

export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'notice', delay: 0, dur: 1.4, ...CLOSE },                 // onto the base before the click
    { cue: 'until', delay: 0, dur: 0.9, x: 960, y: 540, z: 1 },      // back out to see it heat and boil
    { cue: 'nobody', delay: 0, dur: 0.9, ...CLOSE },                 // onto the untouched switch for the pop-up
    { cue: 'stops', delay: 0.8, dur: 0.9, x: 960, y: 540, z: 1 },    // back out for "no clock / no screen"
    { cue: 'how', delay: 0.1, dur: 1.4, x: 960, y: 420, z: 1.25 },   // up to the question over the lid
    { cue: 'ready', delay: 0, dur: 1.2, x: 960, y: 560, z: 1.25 },   // down to the water
    { cue: 'kettles', delay: 0, dur: 1.4, x: 960, y: 600, z: 0.95 }, // end wide, room for the closing phrase
  ], ctx.cue);
  const W = S.stage.world;
  const ink = { fill: 'none', stroke: P.ink, 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

  S.counter = el(W, 'line', { x1: 520, y1: 801, x2: 1400, y2: 801, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 });
  S.waterGlow = glow(W, { rx: 200, ry: 90, color: P.cool, strength: 0.4 }).at(KX, KY + 135);
  S.k = kettle(W).at(KX, KY, KS);
  S.k.channel.show(0);
  S.k.sensor.show(0);
  S.base = kettleBase(W).at(KX, KY, KS).show(0);
  const tip = S.k.toWorld(KETTLE.spoutTip);
  S.spoutGlow = glow(W, { r: 130, color: P.ink, strength: 0.16 }).at(tip[0] - 40, tip[1] - 110);
  S.wisp = steam(W, { from: tip, to: [tip[0] - 90, tip[1] - 260], n: 1, period: 3.6, sway: 16, size: 2 });

  // the click: a few short marks around the switch when it pops up by itself
  const [sx, sy] = S.k.toWorld(KETTLE.switch);
  S.tick = el(W, 'path', { d: `M ${sx - 40} ${sy - 22} L ${sx - 54} ${sy - 36} M ${sx} ${sy - 24} L ${sx} ${sy - 42} M ${sx + 40} ${sy - 22} L ${sx + 54} ${sy - 36}`, ...ink, 'stroke-width': 5, opacity: 0 });

  S.question = label(W, '?', { size: 120, color: P.ink }).at(KX, 250);

  S.clock = crossed(W, 160, 160, (g) => {
    el(g, 'circle', { cx: 0, cy: 0, r: 72, ...ink });
    el(g, 'path', { d: 'M 0 0 L 0 -46 M 0 0 L 34 18', ...ink });
  }).at(360, 400);
  S.clockLabel = label(W, 'no clock', { size: type.label }).at(360, 540);
  S.screen = crossed(W, 200, 140, (g) => {
    el(g, 'rect', { x: -100, y: -70, width: 200, height: 140, rx: 16, ...ink });
    el(g, 'path', { d: 'M -60 -20 L 60 -20 M -60 20 L 30 20', ...ink, stroke: P.dim });
  }).at(1560, 400);
  S.screenLabel = label(W, 'no screen', { size: type.label }).at(1560, 540);

  const H = S.stage.hud;
  S.lblStops = label(H, 'it stops', { size: 56 }).at(960, 862);
  S.lblSee = label(H, 'something you can see', { size: 56 }).at(960, 792);
  S.lblRising = label(H, 'rising from the spout', { size: type.title }).at(960, 872);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const k = S.k;

  set(S.counter, { opacity: +(0.7 * reveal(t, 0, 0.5)).toFixed(3) });

  // close-up amount from the camera zoom: the jug fades to a ghost (so nothing bright is cropped) and the base close-up takes over
  const zk = clamp((cam.z - 1.25) / 0.3);

  // a faint kettle from the first frame, fully there on "a kettle"; it steps back for "no clock / no screen", returns at the question
  const kIn = 0.4 * reveal(t, 0, 0.4) + 0.6 * reveal(t, c('kettle'), 0.5);
  const kDim = 1 - (1 - dimAfter(t, c('clock'), 0.4)) * (1 - reveal(t, c('how')));
  k.show(kIn).dim(kDim * (1 - 0.9 * zk));
  S.base.show(zk);

  // the switch: clicks down on "heats" (power ON), pops back up by itself on "it stops" (power OFF), and the heat and boil stop with it
  const stop = c('stops') + 0.1;
  const down = prog(t, c('heats'), 0.12) * (1 - ease.out(prog(t, stop, 0.15)));
  k.click(down).power(prog(t, c('heats'), 0.1) * (1 - prog(t, stop, 0.1)));
  S.base.click(down);
  set(S.tick, { opacity: +fadeBetween(t, stop, stop + 0.7, 0.12).toFixed(3) });
  k.heat(reveal(t, c('heats'), 0.8) * (1 - ease.in(prog(t, stop, 0.3))));
  const boil = Math.max(0.25 * reveal(t, c('heats') + 0.6, 0.8), reveal(t, c('boils'), 0.5)) * (1 - ease.inOut(prog(t, stop, 0.8)));
  k.boil(t, boil);
  k.steamIn.update(t, reveal(t, c('boils'), 0.5) * (1 - ease.inOut(prog(t, stop, 1.2))));

  // steam from the spout: a burst at the boil, gone soon after the stop; one highlighted wisp returns on "rising from the spout"
  k.steamOut.update(t, reveal(t, c('boils'), 0.6) * (1 - ease.inOut(prog(t, stop, 1.2))) * (1 - zk));
  S.wisp.update(t - c('rising') + 0.18, reveal(t, c('rising'), 0.4)); // starts low at the spout on the word, still rising at the end
  S.spoutGlow.pulse(t, reveal(t, c('rising'), 0.5));

  // the question: a faint "?" over the lid from "how", the water glowing on "ready"; it gives way to the answer on "In many kettles"
  S.question.show(fadeBetween(t, c('how'), c('kettles'), 0.6)).dim(0.55);
  S.waterGlow.pulse(t, fadeBetween(t, c('ready'), c('kettles')));

  // no clock, no screen: each appears when spoken, struck through, gone at the question
  const gone = 1 - ease.in(prog(t, c('how'), 0.6));
  for (const [it, lb, cue, d] of [[S.clock, S.clockLabel, 'clock', dimAfter(t, c('screen'), 0.4)], [S.screen, S.screenLabel, 'screen', 1]]) {
    const a = reveal(t, c(cue), 0.5) * gone;
    it.show(a).dim(d);
    lb.show(a).dim(d);
    set(it.slash, { 'stroke-dashoffset': (it.len * (1 - ease.out(prog(t, c(cue) + 0.3, 0.3)))).toFixed(1) });
  }

  S.lblStops.show(fadeBetween(t, c('stops'), c('clock') - 0.55));
  S.lblSee.show(reveal(t, c('see'), 0.5));
  S.lblRising.show(reveal(t, c('rising'), 0.5));
}
