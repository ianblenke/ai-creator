// Shared style kit for scenes: palette, type scale, safe margins, easing and seeded randomness.
export const W = 1920;
export const H = 1080;
export const SAFE = { x: 120, y: 90 }; // keep text/important shapes inside these margins

export const palette = {
  // AI Creator look "Signal": near-black, acid green and magenta
  bg: '#0b0d10', bg2: '#151a21', ink: '#eef2f4', dim: '#8b97a3',
  accent: '#b6ff3c', hot: '#ff2e9a', warm: '#ffb020', cool: '#4cc9f0', violet: '#a78bfa', good: '#b6ff3c',
};

export const font = {
  sans: '"Media Sans", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"Media Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  size: { title: 96, h1: 72, h2: 52, body: 40, label: 30, small: 24 },
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** Progress of t through [start, start+dur], clamped to 0..1. */
export const prog = (t, start, dur) => clamp((t - start) / dur);
export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  back: (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2),
  elastic: (x) => (x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

/** Deterministic PRNG (mulberry32). Same seed, same sequence. Use instead of Math.random. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const svgNS = 'http://www.w3.org/2000/svg';
/** Create an SVG element with attributes. */
export function el(parent, tag, attrs = {}, text) {
  const n = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  parent.appendChild(n);
  return n;
}
export const set = (node, attrs) => { for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); return node; };
