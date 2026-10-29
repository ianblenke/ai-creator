// Transcribe the DELIVERED video's own audio and compare it with the whole script (catches anything that went wrong between the scene audio and
// the final file). Runs on the render host, where encode wrote the video. Usage: node tools/cli.js finalcheck <episode-dir> [video.mp4]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadScript } from '../script.js';
import { runAsr, asrProblems, mmss } from './asr.js';

export default async function finalcheck(episodeDir, args = []) {
  const name = path.basename(path.resolve(episodeDir));
  const file = args.find((a) => !a.startsWith('--')) || path.join(episodeDir, 'out', `${name}.mp4`);
  if (!fs.existsSync(file)) throw new Error(`no video at ${file} (run encode first)`);
  const wav = path.join(episodeDir, 'out', '.finalcheck.wav');
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-vn', '-ac', '1', '-ar', '16000', wav]);
  if (r.status) throw new Error('could not extract the audio from the video');
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const text = script.scenes.map((s) => s.spokenText).join(' ').replace(/\s+/g, ' ');
  const mustFile = path.join(episodeDir, 'must-hear.txt');
  const must = fs.existsSync(mustFile) ? fs.readFileSync(mustFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : [];
  const report = await runAsr([{ id: 'final', file: wav, text, must }]);
  fs.rmSync(wav, { force: true });
  const problems = asrProblems(report);
  const words = (report.final.heard || '').split(/\s+/).filter(Boolean).length;
  console.log(`FINAL AUDIO CHECK: issues ${problems.length} | words heard ${words}`);
  for (const p of problems) console.log(`  ${p.kind} @ ${mmss(p.time)} (${p.time}s) | script: ${p.script} | heard: ${p.heard}`);
  if (problems.length) process.exitCode = 1;
}
