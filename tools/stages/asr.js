// Narration verification: transcribe each scene's audio and compare with the script. Writes audio/asr-report.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadScript } from '../script.js';

const PY = process.env.MEDIA_PYTHON || path.resolve('.venv-align/bin/python');

export function runAsr(items) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(PY)) return reject(new Error('python env missing (.venv-align)'));
    const p = spawn(PY, [path.resolve('tools/asr-check.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
    const out = [];
    p.stdout.on('data', (d) => out.push(d));
    p.on('close', (code) => {
      try {
        if (code !== 0) throw new Error(`asr check exited ${code}`);
        resolve(JSON.parse(Buffer.concat(out).toString()));
      } catch (e) { reject(e); }
    });
    p.stdin.end(JSON.stringify(items));
  });
}

export const asrProblems = (report) => Object.entries(report).flatMap(([scene, r]) => r.issues.map((i) => ({ scene, ...i })));

export const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function formatAsr(problems, timeline) {
  return problems.map((p) => {
    const start = timeline?.scenes.find((s) => s.id === p.scene)?.start ?? 0;
    return `${mmss(start + p.time)} (${p.scene}, ${p.time}s in)  ${p.kind}: script "${p.script}" / heard "${p.heard}"`;
  }).join('\n');
}

export default async function asr(episodeDir, args = []) {
  const only = args.filter((a) => !a.startsWith('--'));
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const scenes = script.scenes.filter((s) => !only.length || only.some((o) => s.id.startsWith(o.padStart(2, '0'))));
  const mustFile = path.join(episodeDir, 'must-hear.txt');
  const must = fs.existsSync(mustFile) ? fs.readFileSync(mustFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : [];
  const items = scenes.map((s) => ({ id: s.id, file: path.join(episodeDir, 'audio', `${s.id}.wav`), text: s.spokenText.replace(/\s+/g, ' '), must }));
  const report = await runAsr(items);
  const reportFile = path.join(episodeDir, 'audio', 'asr-report.json');
  const prev = fs.existsSync(reportFile) && only.length ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : {};
  fs.writeFileSync(reportFile, JSON.stringify({ ...prev, ...report }, null, 2));
  const problems = asrProblems(report);
  const tlFile = path.join(episodeDir, 'timeline.json');
  const tl = fs.existsSync(tlFile) ? JSON.parse(fs.readFileSync(tlFile, 'utf8')) : null;
  console.log(problems.length ? `narration transcript check: ${problems.length} problem(s)\n${formatAsr(problems, tl)}` : `narration transcript check: ${scenes.length} scene(s) match the script`);
  if (problems.length) process.exitCode = 1;
}
