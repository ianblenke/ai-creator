// Usage: node tools/debug-determinism.js <episode> <scene-id> <t> [otherT ...]
// Renders scene at t on a fresh page, then again after visiting other times, and prints every SVG attribute that differs.
import { openSession } from './capture.js';

const [episode, sceneId, tArg, ...others] = process.argv.slice(2);
const t = +tArg;
const visit = others.length ? others.map(Number) : [0.1, t + 3, t + 6];

const snapshot = (session) => session.page.evaluate(() => {
  const out = {};
  const walk = (node, path) => {
    [...node.children].forEach((c, i) => {
      const p = `${path}/${c.tagName}[${i}]`;
      out[p] = [...c.attributes].map((a) => `${a.name}=${a.value}`).sort().join(' ') + ((c.children.length === 0 && c.textContent) ? ` text="${c.textContent.slice(0, 30)}"` : '');
      walk(c, p);
    });
  };
  walk(document.getElementById('svg'), 'svg');
  return out;
});

const pixels = async (session) => Buffer.from(await session.page.evaluate(() => {
  const d = document.getElementById('c2d').getContext('2d').getImageData(0, 0, 1920, 1080).data;
  let bin = ''; for (let i = 0; i < d.length; i += 0x8000) bin += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
  return btoa(bin);
}), 'base64');

const a = await openSession(episode);
const b = await openSession(episode);
try {
  await a.load(sceneId); await a.setTime(t);
  await b.load(sceneId);
  for (const o of visit) await b.setTime(o);
  await b.setTime(t);
  const [sa, sb] = [await snapshot(a), await snapshot(b)];
  let n = 0;
  for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
    if (sa[k] !== sb[k]) {
      n++;
      if (n <= 12) console.log(`DIFF ${k}\n  fresh : ${sa[k]}\n  after : ${sb[k]}`);
    }
  }
  console.log(n ? `${n} differing SVG node(s)` : 'SVG identical');
  const [pa, pb] = [await pixels(a), await pixels(b)];
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, count = 0;
  for (let i = 0; i < pa.length; i += 4) {
    if (pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2] || pa[i + 3] !== pb[i + 3]) {
      const x = (i / 4) % 1920, y = Math.floor(i / 4 / 1920);
      count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  console.log(count ? `canvas: ${count} differing pixels, bbox x ${minX}-${maxX}, y ${minY}-${maxY}` : 'canvas identical');
} finally { await a.close(); await b.close(); }
