// Best-of-N narration takes. The voice model hesitates mid-phrase at random, and a blind retake is as likely to add a new hesitation as to
// remove one. For each named scene this makes up to N takes, scores each take's timing (mid-phrase stalls and choppy runs from
// tools/audio-check.js), keeps the cleanest, and restores it (raw take AND normalized scene file, so a later `tts` run keeps it).
// Usage: media besttake <episode-dir> <scene-number...> [--takes 8] [--keep-takes]   (or node tools/besttake.js with the same arguments)
// --keep-takes makes all N takes (no early stop at a clean one) and keeps every take in <episode>/audio/takes/ (voice audio: never committed).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { findGaps } from './audio-check.js';
import { loadEnv } from './env.js';
import { seedWarning } from './stages/tts.js';

/** Lower is better: the summed silence of every flagged gap, plus a small penalty per choppy run. */
export function scoreTake(gaps) {
  return gaps.reduce((s, g) => s + (g.kind.startsWith('choppy') ? 0.3 : g.gap), 0);
}

function newestRaw(rawDir) {
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.wav')).map((f) => ({ f, t: fs.statSync(path.join(rawDir, f)).mtimeMs }));
  return files.sort((a, b) => b.t - a.t)[0].f;
}

export function main(args = process.argv.slice(2)) {
  const takesIdx = args.indexOf('--takes');
  const takes = takesIdx >= 0 ? +args[takesIdx + 1] : 8;
  const keepTakes = args.includes('--keep-takes');
  const rest = args.filter((a, i) => (takesIdx < 0 || (i !== takesIdx && i !== takesIdx + 1)) && a !== '--keep-takes');
  const [episodeDir, ...scenes] = rest;
  if (!episodeDir || !scenes.length) throw new Error('usage: media besttake <episode-dir> <scene-number...> [--takes N] [--keep-takes]');
  const warn = seedWarning({ ...loadEnv(), ...process.env });
  if (warn) console.error(warn);
  const audioDir = path.join(episodeDir, 'audio');
  const rawDir = path.join(audioDir, 'raw');
  const keepDir = path.join(audioDir, 'takes');
  if (keepTakes && fs.existsSync(keepDir)) throw new Error(`${keepDir} already exists: move it away first, --keep-takes will not overwrite takes`);
  const tmp = fs.mkdtempSync(path.join(audioDir, 'besttake-'));
  const cli = (...a) => execFileSync('node', ['tools/cli.js', ...a], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
  const report = [];
  for (const sc of scenes) {
    const nn = sc.padStart(2, '0');
    let best = null;
    for (let i = 1; i <= takes; i++) {
      cli('tts', episodeDir, '--retake', nn);
      cli('align', episodeDir);
      const timeline = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
      const gaps = findGaps(timeline).filter((g) => g.scene.startsWith(nn));
      const score = scoreTake(gaps);
      const finalWav = fs.readdirSync(audioDir).find((f) => f.startsWith(nn + '-') && f.endsWith('.wav'));
      const raw = newestRaw(rawDir);
      const snap = { i, score, gaps: gaps.length, finalWav, raw, finalCopy: path.join(tmp, `${nn}-${i}.final.wav`), rawCopy: path.join(tmp, `${nn}-${i}.raw.wav`) };
      fs.copyFileSync(path.join(audioDir, finalWav), snap.finalCopy);
      fs.copyFileSync(path.join(rawDir, raw), snap.rawCopy);
      console.log(`scene ${nn} take ${i}: ${gaps.length} flagged gap(s), score ${score.toFixed(2)}`);
      if (!best || score < best.score) best = snap;
      if (score === 0 && !keepTakes) break;
    }
    fs.copyFileSync(best.finalCopy, path.join(audioDir, best.finalWav));
    fs.copyFileSync(best.rawCopy, path.join(rawDir, best.raw));
    report.push(`scene ${nn}: kept take ${best.i} (${best.gaps} flagged gap(s), score ${best.score.toFixed(2)})`);
  }
  cli('align', episodeDir); // rebuild the timeline, subtitles and narration.wav from the restored takes
  if (keepTakes) fs.renameSync(tmp, keepDir);
  else fs.rmSync(tmp, { recursive: true, force: true });
  console.log(report.join('\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
