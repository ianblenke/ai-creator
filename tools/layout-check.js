// Layout gate for scenes: steps through each scene's time and measures every VISIBLE svg <text> in the browser.
// Flags text that is too small for a phone, outside the safe frame (or in the subtitle strip), or overlapping other text.
// Usage: node tools/layout-check.js <episode-dir> [scene-id-prefix ...] [--step 0.5] [--min 36] [--quiet]
import fs from 'node:fs';
import path from 'node:path';
import { openSession } from './capture.js';

export const LIMITS = { minText: 36, left: 100, right: 1820, top: 70, bottom: 940, overlap: 0.12, minOpacity: 0.35 };

/** Runs in the page: every visible text with its box (vertically trimmed to the glyph body), effective size and opacity. */
export const collectTexts = (minOpacity) => {
  const out = [];
  for (const t of document.querySelectorAll('#svg text')) {
    let op = 1;
    for (let n = t; n && n.nodeType === 1 && n.id !== 'svg'; n = n.parentNode) {
      const a = n.getAttribute('opacity');
      if (a !== null) op *= +a;
      if (n.style && n.style.opacity) op *= +n.style.opacity;
    }
    if (op < minOpacity) continue;
    const r = t.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const ctm = t.getScreenCTM();
    const fs = parseFloat(getComputedStyle(t).fontSize) * (ctm ? Math.hypot(ctm.a, ctm.b) : 1);
    const trim = r.height * 0.2;
    out.push({ text: t.textContent.trim().slice(0, 60), l: r.left, r: r.right, t: r.top + trim, b: r.bottom - trim, fs, op });
  }
  return out;
};

/** Runs in the page: visible shapes (rect, circle, ellipse, path) that are cut by the frame edge: part inside, part outside. */
export const collectCropped = () => {
  const out = [];
  for (const n of document.querySelectorAll('#svg rect, #svg circle, #svg ellipse, #svg path')) {
    let op = 1;
    for (let m = n; m && m.nodeType === 1 && m.id !== 'svg'; m = m.parentNode) {
      const a = m.getAttribute('opacity');
      if (a !== null) op *= +a;
      if (m.style && m.style.opacity) op *= +m.style.opacity;
    }
    const fo = n.getAttribute('fill-opacity');
    if (op < 0.15 || (fo !== null && +fo < 0.02 && !n.getAttribute('stroke'))) continue;
    const r = n.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    if (r.width > 1700 && r.height > 900) continue; // a full-frame backdrop is meant to bleed
    const inW = Math.min(r.right, 1920) - Math.max(r.left, 0), inH = Math.min(r.bottom, 1080) - Math.max(r.top, 0);
    const cutX = (r.left < -4 || r.right > 1924) && inW > 8, cutY = (r.top < -4 || r.bottom > 1084) && inH > 8;
    if (inW > 0 && inH > 0 && (cutX || cutY)) out.push({ l: r.left, r: r.right, t: r.top, b: r.bottom, op });
  }
  return out;
};

/** Pure: issues for one frame's texts. */
export function frameIssues(texts, L = LIMITS) {
  const issues = [];
  for (const a of texts) {
    if (a.fs < L.minText) issues.push({ kind: 'small', key: `small|${a.text}`, detail: `${a.text}: ${a.fs.toFixed(0)} px (min ${L.minText})` });
    if (a.l < L.left || a.r > L.right || a.t < L.top || a.b > L.bottom) issues.push({ kind: 'margin', key: `margin|${a.text}`, detail: `${a.text}: x ${a.l.toFixed(0)}..${a.r.toFixed(0)}, y ${a.t.toFixed(0)}..${a.b.toFixed(0)}` });
  }
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (w <= 0 || h <= 0) continue;
      const frac = (w * h) / Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t));
      if (frac > L.overlap) issues.push({ kind: 'overlap', key: `overlap|${[a.text, b.text].sort().join('|')}`, detail: `"${a.text}" over "${b.text}" (${Math.round(frac * 100)}%)` });
    }
  }
  return issues;
}

/** Pure: one 'cropped' issue per frame if any visible shape is cut by the frame edge. */
export function croppedIssues(shapes) {
  if (!shapes.length) return [];
  const worst = shapes.reduce((a, b) => ((b.r - b.l) * (b.b - b.t) > (a.r - a.l) * (a.b - a.t) ? b : a));
  return [{ kind: 'cropped', key: `cropped|${Math.round(worst.l / 40)}|${Math.round(worst.t / 40)}`, detail: `${shapes.length} shape(s) cut by the frame edge, e.g. x ${worst.l.toFixed(0)}..${worst.r.toFixed(0)}, y ${worst.t.toFixed(0)}..${worst.b.toFixed(0)}` }];
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
  const step = +flag('--step', 0.5);
  const minText = +flag('--min', LIMITS.minText);
  const quiet = args.includes('--quiet') && !!args.splice(args.indexOf('--quiet'), 1);
  const [episode, ...prefixes] = args;
  if (!episode) throw new Error('usage: node tools/layout-check.js <episode-dir> [scene-id-prefix ...] [--step 0.5] [--min 36]');
  const tl = JSON.parse(fs.readFileSync(path.join(episode, 'timeline.json'), 'utf8'));
  const scenes = tl.scenes.filter((s) => !prefixes.length || prefixes.some((p) => s.id.startsWith(p)));
  const session = await openSession(episode);
  const L = { ...LIMITS, minText };
  let total = 0;
  for (const s of scenes) {
    await session.load(s.id);
    const seen = new Map(); // issue key -> { first, last, count, detail, kind }
    for (let t = 0; t <= s.duration + 0.6; t += step) {
      await session.setTime(Math.min(t, s.duration + 0.6));
      const texts = await session.page.evaluate(collectTexts, L.minOpacity);
      const shapes = await session.page.evaluate(collectCropped);
      for (const i of [...frameIssues(texts, L), ...croppedIssues(shapes)]) {
        const e = seen.get(i.key) ?? { first: t, last: t, count: 0, detail: i.detail, kind: i.kind };
        e.last = t; e.count++; seen.set(i.key, e);
      }
    }
    const by = { small: 0, margin: 0, overlap: 0, cropped: 0 };
    for (const e of seen.values()) by[e.kind]++;
    total += seen.size;
    console.log(`${s.id}: ${seen.size ? `${by.overlap} overlap, ${by.margin} margin, ${by.small} small, ${by.cropped} cropped` : 'clean'}`);
    if (!quiet) for (const e of seen.values()) console.log(`   ${e.kind.padEnd(7)} ${e.first.toFixed(1)}-${e.last.toFixed(1)} s  ${e.detail}`);
  }
  await session.close();
  console.log(total ? `${total} layout issue(s)` : 'layout clean');
  process.exit(total ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(2); });
