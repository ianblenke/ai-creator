// Visual kit v2 for scenes: a camera, spotlight dimming, shapes that measure their own text and fit, flowing dots, counters.
// Everything here is a pure function of the time you pass in (no clocks, no random, no history), like the scenes themselves.
// Import as:  import { ... } from 'kit';   (and `style` for palette, font, prog, ease, el, set).
import { palette as P, font, prog, ease, lerp, clamp, el, set } from 'style';

/** Type scale v2: nothing on screen is smaller than `note` (38 px at 1080p), so it stays readable on a phone. */
export const type = { hero: 96, title: 72, label: 48, note: 38 };
export const MIN_TEXT = 36;
/** Where content may live: inside the safe margins and above the subtitle strip. */
export const FRAME = { left: 120, right: 1800, top: 90, bottom: 920 };

// ---------- measuring ----------
let measureCtx = null;
const widths = new Map();
/** Width in px of `text` at `size` (bold by default), using the same font the scene draws with. Cached. */
export function measure(text, size, weight = 700) {
  const key = `${weight}|${size}|${text}`;
  if (widths.has(key)) return widths.get(key);
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${weight} ${size}px "Media Sans"`;
  const w = measureCtx.measureText(text).width;
  widths.set(key, w);
  return w;
}
/** The largest size (<= max, >= min) at which `text` fits in `maxW`. */
export function fitSize(text, maxW, max = type.label, min = type.note, weight = 700) {
  for (let s = max; s > min; s -= 2) if (measure(text, s, weight) <= maxW) return s;
  return min;
}
/** Break text into lines no wider than maxW. Returns an array of strings. */
export function wrap(text, maxW, size, weight = 700) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, size, weight) > maxW) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// ---------- items: shapes with show / dim / place ----------
/** A group you can fade (`show`), spotlight-dim (`dim`) and move (`at`). Effective opacity = show * dim. */
export class Item {
  constructor(parent, w = 0, h = 0) {
    this.g = el(parent, 'g', { opacity: 0 });
    this.w = w; this.h = h;
    this.vis = 0; this.dimv = 1; this.x = 0; this.y = 0; this.s = 1; this.rot = 0;
  }
  /** Fade amount 0..1 (what the narration has revealed). */
  show(a) { this.vis = clamp(a); set(this.g, { opacity: +(this.vis * this.dimv).toFixed(3) }); return this; }
  /** Spotlight multiplier 0..1 (1 = in focus, ~0.3 = pushed back). */
  dim(d) { this.dimv = clamp(d); set(this.g, { opacity: +(this.vis * this.dimv).toFixed(3) }); return this; }
  /** Place the CENTER of the item at (x, y), with scale s. */
  at(x, y, s = 1, rot = 0) { this.x = x; this.y = y; this.s = s; this.rot = rot; set(this.g, { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s.toFixed(4)})` }); return this; }
  /** Draw this item above its siblings (z-order is DOM order): call after creating a panel that would otherwise cover it. */
  raise() { this.g.parentNode.appendChild(this.g); return this; }
  /** Left, right, top, bottom of the item in world coordinates (ignoring rotation). */
  box() { return { l: this.x - (this.w * this.s) / 2, r: this.x + (this.w * this.s) / 2, t: this.y - (this.h * this.s) / 2, b: this.y + (this.h * this.s) / 2 }; }
}

/** Text that is not boxed. Centered on (0,0) inside its Item. */
export function label(parent, text, { size = type.label, color = P.ink, weight = 700, anchor = 'middle' } = {}) {
  const it = new Item(parent, measure(text, size, weight), size * 1.2);
  el(it.g, 'text', { x: anchor === 'middle' ? 0 : anchor === 'start' ? -it.w / 2 : it.w / 2, y: size * 0.35, 'text-anchor': anchor, 'font-family': font.sans, 'font-size': size, 'font-weight': weight, fill: color }, text);
  return it;
}

/** A rounded pill that fits its text exactly. `color` = outline/text color; `fill` optional. */
export function chip(parent, text, { size = type.note, color = P.accent, fill = null, dashed = false, textColor = null, padX = 28, padY = 16 } = {}) {
  const tw = measure(text, size);
  const w = Math.ceil(tw + padX * 2), h = Math.ceil(size + padY * 2);
  const it = new Item(parent, w, h);
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: fill ?? color, 'fill-opacity': fill ? 1 : 0.12, stroke: color, 'stroke-width': 3, ...(dashed ? { 'stroke-dasharray': '10 8' } : {}) });
  el(it.g, 'text', { x: 0, y: size * 0.35, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: textColor ?? (fill ? P.bg : P.ink) }, text);
  return it;
}

/** A rounded box with a title and optional lines of text; sized to its content unless w/h are given. */
export function card(parent, title, lines = [], { color = P.cool, w = null, size = type.label, lineSize = type.note, pad = 30, fillOpacity = 0.14 } = {}) {
  const tw = Math.max(measure(title, size), ...lines.map((l) => measure(l, lineSize)));
  const W = Math.ceil(w ?? tw + pad * 2);
  const H = Math.ceil(pad * 2 + size * 1.2 + lines.length * lineSize * 1.35);
  const it = new Item(parent, W, H);
  el(it.g, 'rect', { x: -W / 2, y: -H / 2, width: W, height: H, rx: 26, fill: color, 'fill-opacity': fillOpacity, stroke: color, 'stroke-width': 4 });
  el(it.g, 'text', { x: 0, y: -H / 2 + pad + size * 0.85, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: P.ink }, title);
  lines.forEach((l, i) => el(it.g, 'text', { x: 0, y: -H / 2 + pad + size * 1.2 + (i + 0.95) * lineSize * 1.35, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': lineSize, 'font-weight': 500, fill: P.dim }, l));
  return it;
}

/** A small "tool" icon: a rounded card with three thin lines (generic, never a real tool). */
export function toolIcon(parent, { color = P.accent, size = 56 } = {}) {
  const it = new Item(parent, size, size * 0.8);
  const w = size, h = size * 0.8;
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: size * 0.16, fill: color, 'fill-opacity': 0.16, stroke: color, 'stroke-width': Math.max(2, size * 0.05) });
  for (let i = 0; i < 3; i++) el(it.g, 'line', { x1: -w * 0.3, x2: w * (i === 1 ? 0.1 : 0.3), y1: -h * 0.2 + i * h * 0.22, y2: -h * 0.2 + i * h * 0.22, stroke: color, 'stroke-width': Math.max(2, size * 0.06), 'stroke-linecap': 'round' });
  return it;
}

/** A line with an arrowhead from (x1,y1) to (x2,y2); `draw(p)` reveals it from 0..1. */
export function arrow(parent, x1, y1, x2, y2, { color = P.dim, width = 5, dashed = false, head = 22 } = {}) {
  const g = el(parent, 'g', { opacity: 1 });
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const line = el(g, 'line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', ...(dashed ? { 'stroke-dasharray': '12 12' } : {}) });
  const tip = el(g, 'path', { d: `M ${-head} ${-head * 0.6} L 0 0 L ${-head} ${head * 0.6}`, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return {
    g,
    /** Reveal 0..1 along the line; fade with `a`. */
    draw(p, a = 1) {
      const q = clamp(p);
      set(line, { x2: x1 + (x2 - x1) * q, y2: y1 + (y2 - y1) * q });
      set(tip, { transform: `translate(${x1 + (x2 - x1) * q} ${y1 + (y2 - y1) * q}) rotate(${(ang * 180) / Math.PI})`, opacity: q > 0.05 ? 1 : 0 });
      set(g, { opacity: +clamp(a).toFixed(3) });
    },
  };
}

// ---------- flow, counters ----------
/** Dots drifting along a polyline [[x,y],...]; `update(t, a)` places them from time alone (loops every `period` s). */
export function flow(parent, pts, { n = 5, r = 9, color = P.accent, period = 2.4 } = {}) {
  const g = el(parent, 'g', { opacity: 0 });
  const dots = Array.from({ length: n }, () => el(g, 'circle', { r, fill: color }));
  const seg = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
  const pos = (u) => {
    let d = u * total;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const k = seg[i] ? d / seg[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= seg[i]; }
    return pts[pts.length - 1];
  };
  return {
    g,
    update(t, a = 1) {
      set(g, { opacity: +clamp(a).toFixed(3) });
      dots.forEach((c, i) => { const u = (((t / period) + i / n) % 1 + 1) % 1; const [x, y] = pos(u); set(c, { cx: x.toFixed(1), cy: y.toFixed(1), opacity: +(Math.sin(u * Math.PI) ** 0.6).toFixed(3) }); });
    },
  };
}
/** Number counting up: text for value `to` reached at p = 1 (eased). `fmt` formats the number. */
export const countTo = (p, to, from = 0, fmt = (v) => String(Math.round(v))) => fmt(lerp(from, to, ease.out(clamp(p))));

// ---------- camera ----------
/**
 * Two layers: `world` (moves with the camera) and `hud` (fixed on screen). Put diagram content in `world`.
 * `moves` = [{ t, dur, x, y, z }]: at time t the camera starts gliding to look at world point (x, y) at zoom z, arriving after dur seconds.
 * The camera starts at the middle of the frame (960, 540) at zoom 1.
 */
export function makeStage(svg, moves = [], cueFn = null) {
  const world = el(svg, 'g');
  const hud = el(svg, 'g');
  // a move may start at a cue: { cue: 'name', delay: 0.2, ... } (pass ctx.cue as cueFn), so camera moves follow the narration
  const start = (m) => (m.cue !== undefined ? cueFn(m.cue) + (m.delay ?? 0) : m.t);
  const state = (t) => {
    const sorted = moves.map((m) => ({ ...m, t: start(m) })).sort((a, b) => a.t - b.t);
    let cur = { x: 960, y: 540, z: 1 };
    for (const m of sorted) {
      const k = ease.inOut(prog(t, m.t, m.dur ?? 1.4));
      if (t < m.t) break;
      const next = { x: lerp(cur.x, m.x, k), y: lerp(cur.y, m.y, k), z: lerp(cur.z, m.z ?? 1, k) };
      if (k < 1) return next;
      cur = { x: m.x, y: m.y, z: m.z ?? 1 };
    }
    return cur;
  };
  return {
    world, hud,
    /** Apply the camera for time t. Returns {x, y, z} (use x, y to drift the background for parallax). */
    camera(t) {
      const c = state(t);
      set(world, { transform: `translate(960 540) scale(${c.z.toFixed(4)}) translate(${(-c.x).toFixed(2)} ${(-c.y).toFixed(2)})` });
      return c;
    },
  };
}

// ---------- background ----------
/** The series background (vertical gradient + slow particles) on the 2D canvas; `cam` shifts the particles for a little parallax. */
export function paintBackground(ctx, t, particles, cam = { x: 960, y: 540, z: 1 }) {
  const c = ctx.c2d;
  const g = c.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, P.bg); g.addColorStop(1, P.bg2);
  c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = P.cool;
  for (const p of particles) {
    const x = ((((p.x + p.vx * t - (cam.x - 960) * p.depth) % 1920) + 1920) % 1920);
    const y = ((((p.y + p.vy * t - (cam.y - 540) * p.depth) % 1080) + 1080) % 1080);
    c.globalAlpha = p.a; c.beginPath(); c.arc(x, y, p.r, 0, 6.2832); c.fill();
  }
  c.globalAlpha = 1;
}
/** Seeded particles for paintBackground; call once in setup: `const parts = makeParticles(ctx.rand(7))`. */
export function makeParticles(r, n = 30) {
  return Array.from({ length: n }, () => ({ x: r() * 1920, y: r() * 1080, vx: (r() - 0.5) * 8, vy: -2 - r() * 5, r: 1.5 + r() * 2.5, a: 0.1 + r() * 0.2, depth: 0.05 + r() * 0.1 }));
}

// ---------- small helpers ----------
/** Fade-in progress for something revealed at cue time `at` over `dur` seconds, eased. */
export const reveal = (t, at, dur = 0.6) => ease.out(prog(t, at, dur));
/** 1 until `at`, then fades to `floor` over `dur`: use for spotlight dimming after something is no longer the focus. */
export const dimAfter = (t, at, floor = 0.3, dur = 0.6) => lerp(1, floor, ease.inOut(prog(t, at, dur)));

/** 0 -> 1 at `inT`, back to 0 at `outT` (seconds, e.g. two cue times): one call replaces a hand-written fade-in/fade-out pair. */
export const fadeBetween = (t, inT, outT, dur = 0.5) => ease.out(prog(t, inT, dur)) * (1 - ease.in(prog(t, outT, dur)));

/** A soft glow behind something (a disc with r, or a wide ellipse with rx, ry); `pulse(t, a)` breathes (about 1.6 s per breath). Place it with .at(x, y). */
export function glow(parent, { r = 90, rx = r, ry = r, color = P.accent, strength = 0.5 } = {}) {
  const it = new Item(parent, rx * 2, ry * 2);
  const id = `glow${Math.round(rx)}x${Math.round(ry)}${color.replace('#', '')}`;
  let defs = parent.ownerSVGElement?.querySelector('defs') ?? el(parent.ownerSVGElement ?? parent, 'defs');
  if (!defs.querySelector(`#${id}`)) {
    const rg = el(defs, 'radialGradient', { id });
    el(rg, 'stop', { offset: '0', 'stop-color': color, 'stop-opacity': strength });
    el(rg, 'stop', { offset: '1', 'stop-color': color, 'stop-opacity': 0 });
  }
  el(it.g, 'ellipse', { cx: 0, cy: 0, rx, ry, fill: `url(#${id})` });
  it.pulse = (t, a = 1) => { it.show(a * (0.75 + 0.25 * Math.sin(t * 3.9))); it.at(it.x, it.y, 1 + 0.06 * Math.sin(t * 3.9)); };
  return it;
}

/** A curved arrow from (x1,y1) to (x2,y2); `bend` (px, signed) sets the curvature. `draw(p, a)` reveals it from 0..1. */
export function curve(parent, x1, y1, x2, y2, { bend = 120, color = P.dim, width = 5, dashed = false, head = 22 } = {}) {
  const g = el(parent, 'g', { opacity: 1 });
  const mx = (x1 + x2) / 2 + (-(y2 - y1) / Math.hypot(x2 - x1, y2 - y1)) * bend, my = (y1 + y2) / 2 + ((x2 - x1) / Math.hypot(x2 - x1, y2 - y1)) * bend;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const path = el(g, 'path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', ...(dashed ? { 'stroke-dasharray': '12 12' } : {}) });
  const tip = el(g, 'path', { d: `M ${-head} ${-head * 0.6} L 0 0 L ${-head} ${head * 0.6}`, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const len = path.getTotalLength();
  const at = (q) => { const pt = path.getPointAtLength(len * q); const pt2 = path.getPointAtLength(Math.max(0, len * q - 2)); return { x: pt.x, y: pt.y, ang: Math.atan2(pt.y - pt2.y, pt.x - pt2.x) }; };
  return {
    g,
    /** {x, y, ang} at fraction q (0..1) along the curve, so flow dots can follow it. */
    point: (q) => at(clamp(q, 0.001, 1)),
    draw(p, a = 1) {
      const q = clamp(p);
      if (!dashed) set(path, { 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': (len * (1 - q)).toFixed(2) });
      else set(path, { opacity: q > 0 ? 1 : 0 });
      const e = at(Math.max(q, 0.001));
      set(tip, { transform: `translate(${e.x.toFixed(1)} ${e.y.toFixed(1)}) rotate(${((e.ang * 180) / Math.PI).toFixed(1)})`, opacity: q > 0.05 ? 1 : 0 });
      set(g, { opacity: +clamp(a).toFixed(3) });
    },
  };
}

/** A box of several lines where `reveal(k)` shows the first k lines (fractional k fades the next one in); lines sit one under another. */
export function lines(parent, list, { size = type.note, color = P.ink, width = null, lineGap = 1.35, align = 'middle', weight = 700 } = {}) {
  const W = Math.ceil(width ?? Math.max(...list.map((l) => measure(l, size, weight))));
  const H = Math.ceil(list.length * size * lineGap);
  const it = new Item(parent, W, H);
  const rows = list.map((l, i) => el(it.g, 'text', { x: align === 'middle' ? 0 : align === 'start' ? -W / 2 : W / 2, y: -H / 2 + (i + 0.8) * size * lineGap, 'text-anchor': align, 'font-family': font.sans, 'font-size': size, 'font-weight': weight, fill: color, opacity: 0 }, l));
  it.reveal = (k, a = 1) => { rows.forEach((r, i) => set(r, { opacity: +clamp(k - i).toFixed(3) })); it.show(a); };
  it.rows = rows;
  return it;
}
