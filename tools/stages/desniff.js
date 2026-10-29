// Remove sniffs and breaths from the silence between spoken words (and nothing else). Runs on the render host.
// Usage: node tools/cli.js desniff <episode-dir> [scene-number...] [--no-tags] [--restore]
// Originals are copied to audio/pre-desniff/ the first time; `--restore` puts them back. After a desniff run `align` to rebuild narration.wav
// (lengths never change, so the timeline, subtitles and cues stay valid) and then render: the clip cache re-renders only changed scenes.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { buildItems } from './voicereview.js';

const PY = process.env.MEDIA_PYTHON || path.resolve('.venv-align/bin/python');

const runPy = (req) => new Promise((resolve, reject) => {
  const p = spawn(PY, [path.resolve('tools/desniff.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
  const out = [];
  p.stdout.on('data', (d) => out.push(d));
  p.on('close', (code) => { try { if (code) throw new Error(`desniff exited ${code}`); resolve(JSON.parse(Buffer.concat(out).toString())); } catch (e) { reject(e); } });
  p.stdin.end(JSON.stringify(req));
});

export default async function desniff(episodeDir, args = []) {
  const audio = path.join(episodeDir, 'audio');
  const backup = path.join(audio, 'pre-desniff');
  if (args.includes('--restore')) {
    if (!fs.existsSync(backup)) throw new Error('no audio/pre-desniff/ to restore from');
    const files = fs.readdirSync(backup).filter((f) => f.endsWith('.wav'));
    files.forEach((f) => fs.copyFileSync(path.join(backup, f), path.join(audio, f)));
    console.log(`restored ${files.length} scene file(s) from audio/pre-desniff/; run align to rebuild narration.wav`);
    return;
  }
  const only = args.filter((a) => !a.startsWith('--'));
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  const items = buildItems(episodeDir, tl, only).map(({ id, file, words }) => ({ id, file, words }));
  const report = await runPy({ items, options: { tags: !args.includes('--no-tags'), backup_dir: backup, reel: path.join(audio, 'review') } });
  fs.writeFileSync(path.join(audio, 'desniff-report.json'), JSON.stringify(report, null, 2));
  const total = Object.values(report).reduce((n, r) => n + r.regions.length, 0);
  const bad = Object.entries(report).filter(([, r]) => !r.verified).map(([k]) => k);
  console.log(`desniff: ${total} stretch(es) attenuated in ${items.length} scene(s); speech samples verified identical${bad.length ? ` EXCEPT ${bad.join(', ')} (NOT WRITTEN)` : ''}`);
  for (const [k, r] of Object.entries(report)) if (r.regions.length) console.log(`  ${k.slice(0, 2)}: ${r.regions.map((x) => `${x.t0}-${x.t1}s ${x.kind}`).join(', ')}${r.left_findings ? `  (${r.left_findings} burst finding(s) remain)` : ''}`);
  console.log(`before/after reel: ${path.join(audio, 'review', 'desniff-reel.wav')}`);
}
