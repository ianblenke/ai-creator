// Defects the transcript check cannot see (a mumbled word, an inserted syllable), found from each scene's audio and word times.
// Usage: node tools/cli.js takedefects <episode-dir> [scene-number...]   (needs timeline.json: run align first)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { buildItems } from './voicereview.js';
import { mmss } from './asr.js';

const PY = process.env.MEDIA_PYTHON || path.resolve('.venv-align/bin/python');

const runPy = (items) => new Promise((resolve, reject) => {
  const p = spawn(PY, [path.resolve('tools/take_defects.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
  const out = [];
  p.stdout.on('data', (d) => out.push(d));
  p.on('close', (code) => { try { if (code) throw new Error(`take defects exited ${code}`); resolve(JSON.parse(Buffer.concat(out).toString())); } catch (e) { reject(e); } });
  p.stdin.end(JSON.stringify({ items }));
});

/** [{scene, kind, time, local, detail, text}] for the whole episode (or the named scenes), in time order. */
export async function findDefects(episodeDir, only = []) {
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  const items = buildItems(episodeDir, tl, only).map(({ id, file, words }) => ({ id, file, words }));
  const starts = Object.fromEntries(tl.scenes.map((s) => [s.id, s.start]));
  const found = await runPy(items);
  return Object.entries(found).flatMap(([scene, list]) => list.map((f) => {
    const time = +(starts[scene] + f.t0).toFixed(2);
    return { scene, kind: f.kind, time, local: f.t0, detail: f.detail, text: `${mmss(time)} (${scene}, ${f.t0}s in)  ${f.kind}: ${f.detail}` };
  })).sort((a, b) => a.time - b.time);
}

export default async function takedefects(episodeDir, args = []) {
  const list = await findDefects(episodeDir, args.filter((a) => !a.startsWith('--')));
  console.log(list.length ? `take defects: ${list.length}\n${list.map((d) => d.text).join('\n')}` : 'take defects: none');
}
