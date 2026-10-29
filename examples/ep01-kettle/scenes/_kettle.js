// SHARED KETTLE: the one drawing of the kettle and its parts that every scene imports (`import { ... } from './_kettle.js'`).
// Conventions (see the bible, "SHARED KETTLE (authoritative)"): spout LEFT, handle RIGHT, never mirrored; the sensor sits in a
// housing on the TOP of the handle, fed by a short steam channel above the water line; curl +1 = cold dish (centre lowest),
// -1 = flipped (centre highest); the power circle sits just right of the base and is never spotlight-dimmed.
// Everything is a pure function of the values passed in (no clocks, no random, no history). No text: labels belong to scenes.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { Item } from 'kit';

// ---------- geometry (kettle-local px at scale 1; origin = middle of the body) ----------
const TOP = -150, FLOOR = 200, WATER_MAX = -60, WATER_MIN = FLOOR - 4;
const lx = (y) => -130 - (40 * (y - TOP)) / (FLOOR - TOP); // inner left wall x at height y
const rx = (y) => -lx(y);
export const KETTLE = {
  w: 620, h: 470,                     // Item size (a box that contains every part around the origin)
  spoutTip: [-292, -166],
  sensor: [212, -127],                // sensor disc centre, inside the housing on top of the handle
  channel: [[96, -120], [176, -126]], // steam channel: from the steam space, through the wall, into the housing
  element: [0, 160],                  // heating coil centre
  guard: [-48, 175], backup: [58, 177], // guard pressed under the coil; the fainter backup beside it
  power: [268, 219], switch: [206, 191],
  waterDefault: 0.6,                  // usual water level (water(level): 0 = empty, 1 = highest, still well under the channel)
};
export const POWER_SPOT = { x: 1700, y: 800 }; // where the power circle sits in scenes that do not show the kettle

// ---------- the disc curl convention ----------
/** curl: +1 = cold dish (centre LOWEST), 0 = flat, -1 = flipped (centre HIGHEST). `trip` = how far the slow bend gets before the snap. */
export const CURL = { cold: 1, trip: 0.35, flat: 0, flipped: -1 };
export const FLIP_DUR = 0.15;
/** The gradual bend: from `from` to `to` over [start, start+dur], eased. Default: cold dish flattening toward the trip point. */
export const bendCurl = (t, start, dur, from = CURL.cold, to = CURL.trip) => lerp(from, to, ease.inOut(prog(t, start, dur)));
/** The snap: one quick flip at time `at` (0.15 s). Default: trip point -> flipped. The reset is flipCurl(t, at, CURL.flipped, CURL.cold). */
export const flipCurl = (t, at, from = CURL.trip, to = CURL.flipped) => lerp(from, to, ease.in(prog(t, at, FLIP_DUR)));

// a curved band between offsets y0 < y1 below the parabola centre line y = depth*curl*(1 - u^2) (ends at y = 0), half-width hw
function band(hw, depth, curl, y0, y1, n = 24) {
  const pt = (x, off) => `${x.toFixed(1)} ${(depth * curl * (1 - (x / hw) ** 2) + off).toFixed(1)}`;
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) { const x = -hw + (2 * hw * i) / n; top.push(pt(x, y0)); bot.unshift(pt(x, y1)); }
  return `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
}

// ---------- discs ----------
/** THE SENSOR DISC: two layers, amber (warm) on top, blue (cool) below, one shared centre line. `.curl(k)` shapes it (see CURL). */
export function sensorDisc(parent, { w = 320, depth = w * 0.11, layer = w * 0.055 } = {}) {
  const it = new Item(parent, w, 2 * depth + 2 * layer);
  const amber = el(it.g, 'path', { fill: P.warm, stroke: P.warm, 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const blue = el(it.g, 'path', { fill: P.cool, stroke: P.cool, 'stroke-width': 2, 'stroke-linejoin': 'round' });
  it.curl = (k) => { set(amber, { d: band(w / 2, depth, k, -layer, 0) }); set(blue, { d: band(w / 2, depth, k, 0, layer) }); it.k = k; return it; };
  /** Local y of the top face at the centre (where a rod rests). */
  it.topY = () => depth * it.k - layer;
  it.curl(CURL.cold).show(1);
  return it;
}

/** THE GUARD DISC: the same dish shape outlined in violet. `faint: true` = the backup. `.curl(k)` as the sensor disc. */
export function guardDisc(parent, { w = 120, depth = w * 0.11, thick = w * 0.09, faint = false } = {}) {
  const it = new Item(parent, w, 2 * depth + thick);
  const p = el(it.g, 'path', { fill: P.violet, 'fill-opacity': faint ? 0.06 : 0.2, stroke: P.violet, 'stroke-opacity': faint ? 0.45 : 1, 'stroke-width': Math.max(3, w * 0.035), 'stroke-linejoin': 'round' });
  it.curl = (k) => { set(p, { d: band(w / 2, depth, k, -thick / 2, thick / 2) }); it.k = k; return it; };
  it.curl(CURL.cold).show(1);
  return it;
}

// ---------- power ----------
/** THE POWER CIRCLE: `.set(p)` 1 = ON (accent fill + soft ring), 0 = OFF (dim outline); fractions crossfade. Never dimmed (its colour is the state). */
export function powerLight(parent, { r = 22 } = {}) {
  const it = new Item(parent, r * 4, r * 4);
  const ring = el(it.g, 'circle', { r: r * 1.8, fill: P.accent, opacity: 0 });
  const off = el(it.g, 'circle', { r, fill: 'none', stroke: P.dim, 'stroke-width': Math.max(3, r * 0.22) });
  const on = el(it.g, 'circle', { r, fill: P.accent, stroke: P.accent, 'stroke-width': Math.max(3, r * 0.22), opacity: 0 });
  it.set = (v) => { const a = clamp(v); set(on, { opacity: +a.toFixed(3) }); set(off, { opacity: +(1 - a).toFixed(3) }); set(ring, { opacity: +(0.18 * a).toFixed(3) }); return it; };
  it.dim = () => it; // exempt from spotlight dimming
  it.set(0).show(1);
  return it;
}

// ---------- steam ----------
/** STEAM: low-opacity ink wisps (never solid) drifting from `from` to `to` ([x, y]); `.update(t, amount)` places them from t alone. */
export function steam(parent, { from, to, n = 5, period = 3, sway = 14, size = 1 } = {}) {
  const it = new Item(parent, Math.abs(to[0] - from[0]) + 2 * sway, Math.abs(to[1] - from[1]));
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const dx = (to[0] - from[0]) / len, dy = (to[1] - from[1]) / len, px = -dy, py = dx;
  const L = 38 * size, bow = 10 * size;
  const wisps = Array.from({ length: n }, () => el(it.g, 'path', { fill: 'none', stroke: P.ink, 'stroke-width': 8 * size, 'stroke-linecap': 'round', opacity: 0 }));
  it.update = (t, amount = 1) => {
    wisps.forEach((w, i) => {
      const ph = i / n + ((i * 0.618) % 1) * 0.08;
      const u = (((t / period + ph) % 1) + 1) % 1;
      const s = sway * Math.sin(u * 5 + i * 2.3);
      const cx = lerp(from[0], to[0], u) + px * s, cy = lerp(from[1], to[1], u) + py * s;
      const x0 = cx - (dx * L) / 2, y0 = cy - (dy * L) / 2;
      const c = (k, sign) => `${(x0 + dx * L * k + px * bow * sign).toFixed(1)} ${(y0 + dy * L * k + py * bow * sign).toFixed(1)}`;
      set(w, { d: `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c(1 / 3, 1)} ${c(2 / 3, -1)} ${c(1, 0)}`, opacity: +(0.38 * clamp(amount) * Math.sin(u * Math.PI) ** 1.2).toFixed(3) });
    });
    return it;
  };
  it.update(0, 0).show(1);
  return it;
}

// ---------- contacts ----------
/** A contact pair (fixed bar above, moving bar below): `.set({ open, weld })` open 0..1 = gap, weld 0..1 = a hot spot that holds it shut. */
export function contacts(parent, { w = 90, gapMax = w * 0.22 } = {}) {
  const it = new Item(parent, w, gapMax + 30);
  const sw = Math.max(5, w * 0.08);
  const up = el(it.g, 'line', { x1: -w / 2, x2: w / 2, stroke: P.ink, 'stroke-width': sw, 'stroke-linecap': 'round' });
  const dn = el(it.g, 'line', { x1: -w / 2, x2: w / 2, stroke: P.ink, 'stroke-width': sw, 'stroke-linecap': 'round' });
  const spot = el(it.g, 'circle', { r: sw * 1.4, fill: P.hot, opacity: 0 });
  it.set = ({ open = 0, weld = 0 } = {}) => {
    const g = gapMax * clamp(open) * (1 - clamp(weld)), y = sw / 2 + g / 2;
    set(up, { y1: -y, y2: -y }); set(dn, { y1: y, y2: y }); set(spot, { opacity: +clamp(weld).toFixed(3) });
    return it;
  };
  it.set().show(1);
  return it;
}

// ---------- the kettle ----------
// the base strip and the rocker switch (kettle-local); returns click(p): 0 popped up .. 1 down. Shared by kettle() and kettleBase().
function drawBase(g) {
  el(g, 'rect', { x: -200, y: 204, width: 430, height: 30, rx: 10, fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  const sw = el(g, 'rect', { x: -24, y: -7, width: 48, height: 14, rx: 6, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  return (p) => set(sw, { transform: `translate(${KETTLE.switch[0]} ${KETTLE.switch[1] + 4 * clamp(p)}) rotate(${(-12 + 24 * clamp(p)).toFixed(2)})` });
}

/** THE BASE CLOSE-UP: the kettle's base strip and rocker switch alone (same geometry). Place it with the kettle's own .at(x, y, s) over a
 *  dimmed kettle, so a camera close-up on the click does not crop the whole jug at the frame edge. `.click(p)` as the kettle's. */
export function kettleBase(parent) {
  const it = new Item(parent, KETTLE.w, KETTLE.h);
  const clickSw = drawBase(it.g);
  it.click = (p) => { clickSw(p); return it; };
  return it.click(0);
}

/**
 * THE KETTLE (cutaway). Returns an Item (show / dim / at) with:
 *  water(level) 0..1, boil(t, a) bubbles, heat(h) coil 0..1, click(p) switch 0 up .. 1 down, power(p) 0 OFF .. 1 ON,
 *  steamOut / steamIn / steamToSensor: steam Items (call .update(t, amount)), channel: Item (the pipe + housing, fade it in),
 *  sensor: sensorDisc (.curl), guard / backup: guardDisc (.curl, .show; hidden until shown), powerLight: the circle,
 *  toWorld([x, y]) -> world point of a kettle-local point (e.g. KETTLE.sensor) for camera moves and hand-offs.
 * dim(d) pushes back everything except the power circle.
 */
export function kettle(parent) {
  const k = new Item(parent, KETTLE.w, KETTLE.h);
  const inner = el(k.g, 'g');
  const ink = { fill: 'none', stroke: P.ink, 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  const body = `M ${lx(TOP)} ${TOP} L ${rx(TOP)} ${TOP} L ${rx(FLOOR)} ${FLOOR} L ${lx(FLOOR)} ${FLOOR} Z`;

  el(inner, 'path', { d: body, fill: P.bg, stroke: 'none' });
  const water = el(inner, 'polygon', { fill: P.cool, 'fill-opacity': 0.3 });
  const surface = el(inner, 'line', { stroke: P.cool, 'stroke-width': 5 });
  const bubbles = Array.from({ length: 12 }, (_, i) => ({ x: lerp(-105, 105, (i * 0.618) % 1), sp: 0.7 + ((i * 0.37) % 1) * 0.6, ph: (i * 0.29) % 1, r: 5 + (i % 3) * 3, n: el(inner, 'circle', { r: 6, fill: 'none', stroke: P.ink, 'stroke-width': 3, opacity: 0 }) }));
  const zig = 'M -110 168 L -88 152 L -66 168 L -44 152 L -22 168 L 0 152 L 22 168 L 44 152 L 66 168 L 88 152 L 110 168';
  el(inner, 'path', { d: zig, fill: 'none', stroke: P.dim, 'stroke-width': 6, 'stroke-linejoin': 'round', opacity: 0.6 });
  const coilHot = el(inner, 'path', { d: zig, fill: 'none', stroke: P.hot, 'stroke-width': 7, 'stroke-linejoin': 'round', opacity: 0 });
  k.steamIn = steam(inner, { from: [-10, -40], to: [40, -140], n: 4, period: 2.6, sway: 40 });

  el(inner, 'path', { d: body, ...ink });
  el(inner, 'path', { d: 'M -96 -150 Q 0 -192 96 -150', ...ink });
  el(inner, 'rect', { x: -18, y: -200, width: 36, height: 16, rx: 6, ...ink });
  el(inner, 'path', { d: `M ${lx(-50).toFixed(1)} -50 Q -240 -70 -300 -172 L -280 -160 Q -230 30 ${lx(70).toFixed(1)} 70`, ...ink, fill: P.bg }); // spout, LEFT
  el(inner, 'path', { d: `M ${rx(-118).toFixed(1)} -118 L 222 -118 Q 262 -118 262 -78 L 262 70 Q 262 122 ${rx(135).toFixed(1)} 135`, ...ink, 'stroke-width': 14 }); // handle, RIGHT

  // steam channel (a tube that opens through the wall) and the sensor housing on top of the handle
  k.channel = new Item(inner, 200, 80);
  const tube = KETTLE.channel.map((p) => p.join(',')).join(' ');
  el(k.channel.g, 'polyline', { points: tube, fill: 'none', stroke: P.ink, 'stroke-width': 18, 'stroke-linecap': 'round' });
  el(k.channel.g, 'polyline', { points: tube, fill: 'none', stroke: P.bg, 'stroke-width': 8, 'stroke-linecap': 'round' });
  el(k.channel.g, 'rect', { x: 170, y: -158, width: 84, height: 56, rx: 14, fill: P.bg, stroke: P.ink, 'stroke-width': 5 });
  k.channel.show(1);
  k.steamToSensor = steam(inner, { from: [92, -112], to: [200, -128], n: 3, period: 1.6, sway: 4, size: 0.55 });
  k.sensor = sensorDisc(inner, { w: 60, depth: 8, layer: 6 }).at(...KETTLE.sensor);

  // guard and backup under the element (hidden until a scene shows them)
  k.backup = guardDisc(inner, { w: 90, faint: true }).at(...KETTLE.backup).show(0);
  k.guard = guardDisc(inner, { w: 90 }).at(...KETTLE.guard).show(0);

  const clickSw = drawBase(inner);
  k.steamOut = steam(inner, { from: KETTLE.spoutTip, to: [KETTLE.spoutTip[0] - 70, KETTLE.spoutTip[1] - 200], n: 6, period: 3.2, sway: 16 });

  k.powerLight = powerLight(k.g, { r: 18 }).at(...KETTLE.power);

  let waterY = lerp(WATER_MIN, WATER_MAX, KETTLE.waterDefault);
  k.water = (level) => {
    waterY = lerp(WATER_MIN, WATER_MAX, clamp(level));
    const vis = level > 0.005 ? 1 : 0;
    set(water, { points: `${lx(waterY) + 6},${waterY} ${rx(waterY) - 6},${waterY} ${rx(WATER_MIN) - 6},${WATER_MIN} ${lx(WATER_MIN) + 6},${WATER_MIN}`, opacity: vis });
    set(surface, { x1: lx(waterY) + 6, x2: rx(waterY) - 6, y1: waterY, y2: waterY, opacity: vis });
    return k;
  };
  /** Bubbles rising from the coil to the surface; a = how hard it boils (0..1). Call after water(). */
  k.boil = (t, a) => {
    const count = Math.round(bubbles.length * clamp(a));
    bubbles.forEach((b, i) => {
      const u = (((t * b.sp + b.ph) % 1) + 1) % 1, y = lerp(150, waterY + 10, u);
      const ok = i < count && waterY < 140;
      set(b.n, { cx: (b.x + 6 * Math.sin(u * 9 + i)).toFixed(1), cy: y.toFixed(1), r: (b.r * (0.6 + 0.4 * u)).toFixed(1), opacity: ok ? +(Math.sin(u * Math.PI)).toFixed(3) : 0 });
    });
    return k;
  };
  k.heat = (h) => { set(coilHot, { opacity: +clamp(h).toFixed(3) }); return k; };
  k.click = (p) => { clickSw(p); return k; };
  k.power = (p) => { k.powerLight.set(p); return k; };
  k.dim = (d) => { set(inner, { opacity: +clamp(d).toFixed(3) }); return k; };
  k.toWorld = ([x, y]) => [k.x + x * k.s, k.y + y * k.s];

  k.water(KETTLE.waterDefault).boil(0, 0).heat(0).click(0).power(0);
  return k;
}

// ---------- the snap mechanism (disc -> rod -> seesaw lever -> contacts) ----------
// Local layout at scale 1 (origin = lever pivot): the disc is lower left, the rod stands on its centre, the lever's left end rests
// on the rod; once the lever passes level its right end pushes the moving contact arm down. Everything follows the disc: cold dish -> lever tilted left end down,
// contacts closed; flipped -> rod up, lever tips past the middle, right end pushes the arm down, contacts open.
export const SNAP = { w: 1000, h: 600, disc: [-300, 240], pivot: [0, 0], contact: [420, 0] };
const LEFT = 300, RIGHT = 300, BEAM = 9, D_W = 320, D_DEPTH = 36, D_LAYER = 18, PAD_H = 22;
const ROD = D_DEPTH - D_LAYER + SNAP.disc[1] - LEFT * Math.sin((6 * Math.PI) / 180) - BEAM; // lever at -6 deg when the disc is cold

/**
 * Returns an Item with `.set({ curl, middle })`: curl drives the whole chain; middle 0..1 shows the dashed balance line. `.gap` and `.open` (0..1) after set.
 * Optional (defaults keep the original behaviour): `flipTilt` = lever angle in degrees when the disc is fully flipped (shortens the rod,
 * e.g. -2 = held just short of level); `slack` = local px the lever's right end travels past the arm's rest before it pushes it.
 * `.set({ tilt })` (degrees) lets the lever tip over centre further than the rod pushes it (it lifts off the rod; never below the rod).
 */
export function snapSwitch(parent, { flipTilt, slack = 0 } = {}) {
  const it = new Item(parent, SNAP.w, SNAP.h);
  const g = it.g;
  const part = { fill: P.ink, 'fill-opacity': 0.18, stroke: P.ink, 'stroke-width': 4, 'stroke-linejoin': 'round' };
  const CX = SNAP.contact[0];
  const mid = el(g, 'line', { x1: -360, y1: 0, x2: 480, y2: 0, stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '14 12', opacity: 0 });
  it.disc = sensorDisc(g, { w: D_W, depth: D_DEPTH, layer: D_LAYER }).at(...SNAP.disc);
  const rodLen = flipTilt === undefined ? ROD : SNAP.disc[1] - D_DEPTH - D_LAYER - (BEAM - LEFT * Math.sin((flipTilt * Math.PI) / 180));
  const rod = el(g, 'rect', { x: SNAP.disc[0] - 12, width: 24, height: rodLen, rx: 6, ...part });
  el(g, 'path', { d: `M 0 6 L -44 72 L 44 72 Z`, ...part });
  const beam = el(g, 'g');
  el(beam, 'rect', { x: -LEFT, y: -BEAM, width: LEFT + RIGHT, height: 2 * BEAM, rx: BEAM, ...part });
  el(beam, 'circle', { r: 12, fill: P.bg, stroke: P.ink, 'stroke-width': 4 });
  const armRest = BEAM; // the arm's top touches the lever's right end when the lever is level
  el(g, 'rect', { x: CX - 70, y: armRest - 2 * PAD_H - 30, width: 200, height: 30, rx: 6, ...part }); // fixed bracket
  el(g, 'rect', { x: CX - 35, y: armRest - 2 * PAD_H, width: 70, height: PAD_H, rx: 4, fill: P.warm }); // fixed contact
  const arm = el(g, 'g');
  el(arm, 'rect', { x: RIGHT - 60, y: PAD_H, width: CX - RIGHT + 160, height: 16, rx: 6, ...part });
  el(arm, 'rect', { x: CX - 35, y: 0, width: 70, height: PAD_H, rx: 4, fill: P.warm }); // moving contact
  it.set = ({ curl = CURL.cold, middle = 0, tilt } = {}) => {
    it.disc.curl(curl);
    const rodTop = SNAP.disc[1] + it.disc.topY() - rodLen;
    let th = Math.asin(clamp((0 - (rodTop - BEAM)) / LEFT, -1, 1));
    if (tilt !== undefined) th = Math.max(th, (tilt * Math.PI) / 180);
    set(rod, { y: rodTop.toFixed(2) });
    set(beam, { transform: `rotate(${((th * 180) / Math.PI).toFixed(3)})` });
    const armTop = Math.max(armRest, RIGHT * Math.sin(th) + BEAM - slack);
    set(arm, { transform: `translate(0 ${(armTop - PAD_H).toFixed(2)})` });
    it.gap = armTop - armRest;
    it.open = clamp(it.gap / 30);
    set(mid, { opacity: +(0.8 * clamp(middle)).toFixed(3) });
    return it;
  };
  it.set().show(1);
  return it;
}
