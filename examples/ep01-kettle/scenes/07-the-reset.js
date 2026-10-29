// Scene 07: the reset. The kettle refills from the dry end of scene 06 and trips (its sensor flips, the switch pops up). The
// sensor disc is lifted out, cools from glow to calm while the temperature dot slides down a full gap (no digits) below the
// switching line, and only then springs back by itself. In other designs a fingertip presses a small round push button on the
// kettle's base, which resets the kettle's disc. Ends wide, both resets side by side, under "ready for the next morning".
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { type, Item, label, glow, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';
import { kettle, sensorDisc, KETTLE, CURL, flipCurl } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'ready', at: 'ready for the next morning' },
    { name: 'trip', at: 'After a trip' },
    { name: 'disc', at: 'the disc cools' },
    { name: 'one', at: 'in one design' },
    { name: 'springs', at: 'springs back by itself' },
    { name: 'once', at: 'once it has cooled' },
    { name: 'below', at: 'below its switching' },
    { name: 'switching', at: 'switching temperature' },
    { name: 'other', at: 'In other designs' },
    { name: 'press', at: 'press a reset' },
    { name: 'reset', at: 'reset knob' },
  ],
};

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})`; };

// world layout (the final wide view is the identity camera)
const K = { x: 1460, y: 590, s: 0.85 };           // the kettle, right half
const DISC = { x: 400, y: 520, w: 360 };          // the lifted-out sensor disc, left half
const TRACK = { x: 760, top: 360, bot: 720, line: 420, gap: 180 }; // temperature track: switching line, gap below it
const BTN = { x: -200, y: 219, r: 18, out: 14, inn: 3 }; // round push button on the left end of the base (kettle-local), bulging left

let S;
export function setup(ctx) {
  const parts = makeParticles(ctx.rand(7));
  const stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: K.x, y: 600, z: 1.2 },                   // open on the kettle
    { cue: 'trip', dur: 0.9, x: 1560, y: 560, z: 1.4 },             // lean toward the sensor on the handle
    { cue: 'disc', dur: 1.0, x: 560, y: 540, z: 1.2 },              // follow the disc to the left panel
    { cue: 'switching', delay: 0.4, dur: 1.0, x: 960, y: 540, z: 1 }, // wide before the right panel returns
  ], ctx.cue);
  const W = stage.world;

  // RIGHT: the shared kettle, plus a scene-level round push button and a fingertip
  const k = kettle(W).at(K.x, K.y, K.s);
  const button = new Item(W, 2 * BTN.r, 2 * BTN.r);
  const dome = el(button.g, 'path', { fill: P.bg2, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  const finger = new Item(W, 190, 44); // origin = fingertip, pointing right
  const fs = { fill: P.bg, stroke: P.ink, 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  el(finger.g, 'path', { d: 'M -190 -20 L -20 -20 Q 0 -20 0 0 Q 0 20 -20 20 L -190 20', ...fs });
  el(finger.g, 'path', { d: 'M -46 -20 Q -30 -6 -14 -14', fill: 'none', stroke: P.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }); // nail
  el(finger.g, 'path', { d: 'M -110 -12 L -110 12', fill: 'none', stroke: P.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }); // knuckle

  // LEFT: hot glow, the big sensor disc (handed off from the kettle's sensor), the temperature track with a gap marker
  const heat = glow(W, { r: 200, color: P.hot, strength: 0.55 });
  const disc = sensorDisc(W, { w: DISC.w });
  const track = new Item(W, 130, TRACK.bot - TRACK.top);
  const mid = (TRACK.top + TRACK.bot) / 2;
  el(track.g, 'rect', { x: -14, y: TRACK.top - mid, width: 28, height: TRACK.bot - TRACK.top, rx: 14, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  const swLine = el(track.g, 'line', { x1: -60, x2: 60, y1: TRACK.line - mid, y2: TRACK.line - mid, stroke: P.warm, 'stroke-width': 5, 'stroke-linecap': 'round' });
  const dot = el(track.g, 'circle', { cx: 0, r: 20 });
  track.at(TRACK.x, mid);
  const gap = el(W, 'path', { fill: 'none', stroke: P.ink, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });

  const L = {
    oneHead: label(W, 'one design', { size: type.label }).at(430, 330),
    cools: label(W, 'the disc cools', { size: type.label, color: P.cool }).at(DISC.x, 680),
    springs: label(W, 'springs back by itself', { size: type.label, color: P.cool }).at(DISC.x, 680),
    sw: label(W, 'switching temperature', { size: type.label, color: P.warm }).at(760, 790),
    otherHead: label(W, 'other designs', { size: type.label }).at(K.x, 330),
    press: label(W, 'press a reset knob', { size: type.label }).at(1250, 850),
  };
  const title = label(stage.hud, 'ready for the next morning', { size: type.title }).at(960, 150);

  S = { parts, stage, k, button, dome, finger, heat, disc, track, swLine, dot, gap, L, title };
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const { k, L } = S;
  const flipBack = c('below') + 0.05;                               // the self-reset: only once the dot has slid down the full gap
  const pressT = c('press'), push = ease.inOut(prog(t, pressT, 0.25));
  const endUp = reveal(t, c('reset') + 0.5, 0.4);                    // the closing overview

  // the kettle: picks up from scene 06 (dry, switched on, power off) and refills; on "trip" its sensor flips and the switch pops up
  k.show((1 - ease.inOut(prog(t, c('disc'), 0.35))) + reveal(t, c('other'), 0.5));
  k.water(KETTLE.waterDefault * ease.inOut(prog(t, 0, 0.9))).click(1 - ease.out(prog(t, c('trip'), 0.15))).power(0);
  k.sensor.curl(t < pressT + 0.25 ? flipCurl(t, c('trip'), CURL.cold, CURL.flipped) : flipCurl(t, pressT + 0.25, CURL.flipped, CURL.cold));
  S.title.show(fadeBetween(t, c('ready'), c('trip')) + endUp);

  // hand-off: the sensor disc grows out of the kettle's sensor housing and travels to the left panel with the camera
  const [sx, sy] = k.toWorld(KETTLE.sensor);
  const fly = ease.inOut(prog(t, c('disc'), 1.0));
  const dx = lerp(sx, DISC.x, fly), dy = lerp(sy, DISC.y, fly), ds = lerp((60 / DISC.w) * K.s, 1, fly);
  const left = lerp(1, 0.35, ease.inOut(prog(t, c('other'), 0.5))) + 0.65 * endUp; // bright until "other designs"
  S.disc.at(dx, dy, ds).curl(t < flipBack ? CURL.flipped : flipCurl(t, flipBack, CURL.flipped, CURL.cold)).show(reveal(t, c('disc'), 0.25)).dim(left);
  const cool = 1 - ease.inOut(prog(t, c('disc') + 0.6, flipBack - (c('disc') + 0.6)));
  S.heat.pulse(t, reveal(t, c('trip'), 0.4) * cool);
  S.heat.at(dx, dy, ds * (1 + 0.06 * Math.sin(t * 3.9))); // pulse() resets the scale; keep the glow sized to the disc

  L.oneHead.show(reveal(t, c('one'))).dim(left);
  L.cools.at(dx, dy + 160).show(fadeBetween(t, c('disc') + 0.3, c('springs') - 0.5, 0.4)); // rides with the disc during the glide
  // named on "springs" (half bright: not yet), full when the disc actually flips back; pushed back while the line is named
  const springsDim = lerp(0.5, 1, reveal(t, flipBack, 0.3)) * lerp(1, 0.45, ease.inOut(prog(t, c('switching'), 0.5)));
  L.springs.show(reveal(t, c('springs'), 0.4)).dim(Math.max(springsDim * left, endUp));

  // temperature track: the dot starts at the switching line (hot) and slides down the full gap, reaching the bottom as the disc flips back
  S.track.show(reveal(t, c('disc') + 0.6, 0.4)).dim(left);
  const fall = ease.inOut(prog(t, c('disc') + 0.6, flipBack - (c('disc') + 0.6)));
  const lv = lerp(TRACK.line, TRACK.line + TRACK.gap, fall);
  set(S.dot, { cy: (lv - (TRACK.top + TRACK.bot) / 2).toFixed(1), fill: mix(P.hot, P.cool, fall) });
  const g0 = TRACK.line, g1 = Math.max(g0, lv), gx = TRACK.x + 80, hot = reveal(t, c('once'), 0.4);
  set(S.gap, {
    d: `M ${gx - 22} ${g0} L ${gx} ${g0} L ${gx} ${g1.toFixed(1)} L ${gx - 22} ${g1.toFixed(1)}`,
    'stroke-width': lerp(5, 8, hot).toFixed(2),
    opacity: +(reveal(t, c('disc') + 0.8, 0.4) * lerp(0.5, 1, hot) * left).toFixed(3),
  });
  const swOn = reveal(t, c('switching'), 0.4);
  set(S.swLine, { 'stroke-width': lerp(5, 10, swOn).toFixed(2) });
  L.sw.show(swOn * (1 - reveal(t, c('reset') + 0.1, 0.4))).dim(left); // a detail: gone before the closing overview

  // right: a fingertip presses the round button on the base; the dome sinks in and the kettle's disc flips back to a cold dish
  const bulge = lerp(BTN.out, BTN.inn, push);
  const [bx, by] = k.toWorld([BTN.x, BTN.y]);
  set(S.dome, { d: `M 0 ${-BTN.r} A ${bulge} ${BTN.r} 0 0 0 0 ${BTN.r} Z` });
  S.button.at(bx, by, K.s).show(reveal(t, c('other'), 0.5));
  L.otherHead.show(reveal(t, c('other')));
  const approach = 80 * (1 - ease.out(prog(t, pressT - 0.4, 0.4)));
  S.finger.at(bx - bulge * K.s - approach, by, K.s).show(reveal(t, pressT - 0.4, 0.3));
  L.press.show(reveal(t, c('reset'), 0.4));
}
