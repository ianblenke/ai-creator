// Shorten over-long silences between words (cap: 0.25 s in a phrase, 0.4 s before a conjunction, 0.6 s after a comma); sentence gaps are untouched.
// Usage: node tools/cli.js tighten <episode-dir> [scene-number...] [--restore]    Then run `align` (scene lengths change).
// Originals are copied to audio/pre-tighten/ the first time; `--restore` puts them back. Runs on the render host.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { buildItems } from './voicereview.js';

const PY = process.env.MEDIA_PYTHON || path.resolve('.venv-align/bin/python');

const runPy = (req) => new Promise((resolve, reject) => {
  const p = spawn(PY, [path.resolve('tools/tighten.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
  const out = [];
  p.stdout.on('data', (d) => out.push(d));
  p.on('close', (code) => { try { if (code) throw new Error(`tighten exited ${code}`); resolve(JSON.parse(Buffer.concat(out).toString())); } catch (e) { reject(e); } });
  p.stdin.end(JSON.stringify(req));
});

export default async function tighten(episodeDir, args = []) {
  const audio = path.join(episodeDir, 'audio');
  const backup = path.join(audio, 'pre-tighten');
  if (args.includes('--restore')) {
    if (!fs.existsSync(backup)) throw new Error('no audio/pre-tighten/ to restore from');
    const files = fs.readdirSync(backup).filter((f) => f.endsWith('.wav'));
    files.forEach((f) => fs.copyFileSync(path.join(backup, f), path.join(audio, f)));
    console.log(`restored ${files.length} scene file(s); run align to rebuild the timeline`);
    return;
  }
  const only = args.filter((a) => !a.startsWith('--'));
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  const items = buildItems(episodeDir, tl, only).map(({ id, file, words }) => ({ id, file, words }));
  const report = await runPy({ items, options: { backup_dir: backup } });
  const file = path.join(audio, 'tighten-report.json');
  const before = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  fs.writeFileSync(file, JSON.stringify({ ...before, ...report }, null, 2)); // a run on one scene keeps the other scenes' records
  const total = Object.values(report).reduce((n, r) => n + r.cuts.length, 0);
  const secs = Object.values(report).reduce((n, r) => n + r.cuts.reduce((m, c) => m + c.removed, 0), 0);
  console.log(`tighten: ${total} over-long pause(s) shortened in ${items.length} scene(s), ${secs.toFixed(1)} s removed; run align next`);
  for (const [k, r] of Object.entries(report)) for (const c of r.cuts) console.log(`  ${k.slice(0, 2)}: "${c.after}" | "${c.before}" -${c.removed}s${r.verified ? '' : ' (NOT WRITTEN)'}`);
}
