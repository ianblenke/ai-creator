// Adversarial review of the narration audio: sniffs and breaths, odd emphasis, drawn-out words, pitch resets and low-confidence words.
// Usage: node tools/cli.js voicereview <episode-dir> [scene-number...] [--no-ast] [--no-whisper] [--min 0.3] [--top 25] [--reel 12]
// Writes audio/voice-review.json and short clips of the worst spots to audio/review/. Findings are CANDIDATES: listen to the clips.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { mmss } from './asr.js';

const PY = process.env.MEDIA_PYTHON || path.resolve('.venv-align/bin/python');

export function buildItems(episodeDir, timeline, only = []) {
  return timeline.scenes
    .filter((s) => !only.length || only.some((o) => s.id.startsWith(o.padStart(2, '0'))))
    .map((s) => ({ id: s.id, file: path.join(episodeDir, 'audio', `${s.id}.wav`), start: s.start,
      words: s.words.map((w) => ({ text: w.text, start: +(w.start - s.start).toFixed(3), end: +(w.end - s.start).toFixed(3) })) }));
}

const runPy = (req) => new Promise((resolve, reject) => {
  if (!fs.existsSync(PY)) return reject(new Error('python env missing (.venv-align)'));
  const p = spawn(PY, [path.resolve('tools/voice_review.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
  const out = [];
  p.stdout.on('data', (d) => out.push(d));
  p.on('close', (code) => { try { if (code) throw new Error(`voice review exited ${code}`); resolve(JSON.parse(Buffer.concat(out).toString())); } catch (e) { reject(e); } });
  p.stdin.end(JSON.stringify(req));
});

export function formatFindings(report, starts, top = 40) {
  const rows = Object.entries(report).flatMap(([scene, r]) => r.findings.map((f) => ({ scene, ...f })));
  rows.sort((a, b) => b.severity - a.severity || a.t0 - b.t0);
  return rows.slice(0, top).map((f) => `${mmss((starts[f.scene] ?? 0) + f.t0)} ${f.severity.toFixed(2)} ${f.kind.padEnd(15)} (${f.scene.slice(0, 2)} ${f.t0}s) ${f.between}: ${f.detail}${f.clip ? `  [${f.clip}]` : ''}`).join('\n');
}

export default async function voicereview(episodeDir, args = []) {
  const opt = (name, d) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : d; };
  const only = args.filter((a, i) => !a.startsWith('--') && !['--min', '--top', '--reel'].includes(args[i - 1]));
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  const items = buildItems(episodeDir, tl, only);
  const options = { ast: !args.includes('--no-ast'), whisper: !args.includes('--no-whisper'), min_severity: +opt('--min', 0.3), clips: path.join(episodeDir, 'audio', 'review'), reel: +opt('--reel', 12) };
  const report = await runPy({ items: items.map(({ id, file, words }) => ({ id, file, words })), options });
  fs.writeFileSync(path.join(episodeDir, 'audio', 'voice-review.json'), JSON.stringify(report, null, 2));
  const starts = Object.fromEntries(items.map((i) => [i.id, i.start]));
  const total = Object.values(report).reduce((n, r) => n + r.findings.length, 0);
  console.log(`voice review: ${total} candidate(s) in ${items.length} scene(s); worst first (time, severity, kind). Listen to ${options.clips}/reel.wav (the ${options.reel} worst, in order) or the single clips`);
  const text = formatFindings(report, starts, +opt('--top', 25));
  if (text) console.log(text);
  console.log('penalty per scene: ' + Object.entries(report).map(([k, r]) => `${k.slice(0, 2)}=${r.penalty}`).join(' '));
}
