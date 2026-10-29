#!/usr/bin/env node
// Static check: every cue anchor in each scene's `meta.cues` must still match the final narration (timeline.json).
// Rewording a script line breaks any cue anchored on the old words; this finds them in seconds instead of mid-render.
//   node tools/check-anchors.js episodes/ep01-kettle [episodes/ep02-example ...]     (exit 1 if any anchor is unresolved)
import fs from 'node:fs';
import path from 'node:path';
import { resolveAnchorLocal } from './stage/anchors.js';

const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\"/g, '"');

export function scanEpisode(dir) {
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  const problems = [];
  let total = 0;
  for (const sc of tl.scenes) {
    const f = path.join(dir, 'scenes', `${sc.id}.js`);
    if (!fs.existsSync(f)) { problems.push(`${sc.id}: no scene file`); continue; }
    const block = fs.readFileSync(f, 'utf8').match(/export const meta = \{[\s\S]*?\n\};/);
    if (!block) continue;
    for (const m of block[0].matchAll(/\{\s*name:\s*'([^']+)',\s*at:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|(\d+))\s*\}/g)) {
      total++;
      const a = m[2] ?? m[3] ?? +m[4];
      try { resolveAnchorLocal(sc, typeof a === 'string' ? unescape(a) : a); } catch { problems.push(`${sc.id}: cue '${m[1]}' anchor ${JSON.stringify(a)} not found in the narration`); }
    }
  }
  return { total, problems };
}

if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  let bad = 0;
  const dirs = process.argv.slice(2);
  if (!dirs.length) { console.log('usage: node tools/check-anchors.js <episode-dir...>'); process.exit(1); }
  for (const d of dirs) {
    const { total, problems } = scanEpisode(d);
    console.log(`${d}: ${total} cue anchors, ${problems.length} unresolved`);
    for (const p of problems) console.log(`  ${p}`);
    bad += problems.length;
  }
  process.exitCode = bad ? 1 : 0;
}
