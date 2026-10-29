// Keyframe review: lint, render PNGs (start, mid, each cue, end), check on-screen text and pacing, bound the revise rounds.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadScript } from '../script.js';
import { lintFile } from '../lint-scene.js';
import { openSession } from '../capture.js';
import { scanRenderedText, loadDenylist, formatFindings } from '../safety/scan.js';
import { pacingGaps } from '../pacing.js';
import { withRenderLock } from '../lock.js';

export const MAX_ROUNDS = 3;

/** A round is a new version of the scene code: a rerun on the same code keeps the count (and rounds.json) unchanged. */
// shortcut: hashes only the scene file, not helpers it imports (scenes/_*.js); bump rounds.json by hand if a helper change is a revision.
export function nextRound(prev, sceneHash) {
  if (prev && prev.scene === sceneHash) return prev;
  return { rounds: (prev?.rounds ?? 0) + 1, scene: sceneHash };
}

export default async function keyframes(episodeDir, args = []) {
  return withRenderLock(() => run(episodeDir, args));
}

async function run(episodeDir, args = []) {
  const only = args.filter((a) => !a.startsWith('--'));
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const denylist = loadDenylist('safety/denylist.txt');
  const session = await openSession(episodeDir);
  let failed = false;
  try {
    for (const s of script.scenes.filter((x) => !only.length || only.some((o) => x.id.startsWith(o.padStart(2, '0'))))) {
      const file = path.join(episodeDir, 'scenes', `${s.id}.js`);
      if (!fs.existsSync(file)) { console.log(`${s.id}: no scene file`); failed = true; continue; }
      const issues = lintFile(file);
      if (issues.length) { issues.forEach((i) => console.error(`${s.id}:${i.line} ${i.message}`)); failed = true; continue; }
      const dir = path.join(episodeDir, 'keyframes', s.id);
      const roundsFile = path.join(dir, 'rounds.json');
      fs.mkdirSync(dir, { recursive: true });
      const prev = fs.existsSync(roundsFile) ? JSON.parse(fs.readFileSync(roundsFile)) : null;
      const round = nextRound(prev, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16));
      const { rounds } = round;
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.rmSync(path.join(dir, f));
      const info = await session.load(s.id);
      const times = [...new Set([0.05, info.duration / 2, ...info.cues.map((c) => c.time + 0.4), info.duration - 0.05].map((t) => +Math.min(Math.max(t, 0), info.duration).toFixed(2)))].sort((a, b) => a - b);
      for (const [i, t] of times.entries()) fs.writeFileSync(path.join(dir, `${String(i).padStart(2, '0')}-t${t.toFixed(2)}.png`), await session.frame(t));
      if (round !== prev) fs.writeFileSync(roundsFile, JSON.stringify(round)); // counted only once frames were actually produced
      const findings = scanRenderedText(await session.texts(), { label: `${s.id}:on-screen`, denylist });
      const gaps = pacingGaps(info.cues.map((c) => c.time), info.duration);
      const notes = [];
      if (findings.length) { notes.push(`UNSAFE on-screen text:\n${formatFindings(findings)}`); failed = true; }
      if (gaps.length) notes.push(`pacing gaps > 4 s: ${gaps.map((g) => `${g.from}-${g.to}`).join(', ')}`);
      if (rounds > MAX_ROUNDS) notes.push(`NEEDS HUMAN ATTENTION: ${rounds - 1} review rounds already used`);
      console.log(`${s.id}: ${times.length} keyframes (round ${rounds}/${MAX_ROUNDS})${notes.length ? '\n  ' + notes.join('\n  ') : ''}`);
    }
  } finally {
    await session.close();
  }
  if (failed) process.exitCode = 1;
}
