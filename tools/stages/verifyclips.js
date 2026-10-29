// Verify the SHIPPED clips: sampled frames from each rendered clip must match a fresh (history-free) render of the same instant.
// A ghost copy of a moving element, a stale tile or a stray line shows up as a low PSNR. Usage: verifyclips <episode> [--step 1.5] [--draft]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadScript } from '../script.js';
import { openSession } from '../capture.js';
import { run } from '../ffmpeg.js';

// Healthy clips (x264 crf 16 on flat graphics) measure ~45+ dB against a pure render; a visible ghost measures ~25-30 dB.
export const MIN_PSNR = 36;

/** Snap a time to a whole frame so the clip frame and the fresh render show the same instant (otherwise fast motion falsely mismatches). */
export const snapToFrame = (t, fps) => Math.round(t * fps) / fps;

async function psnr(a, b) {
  const [fa, fb] = [0, 1].map((i) => path.join(os.tmpdir(), `vc-${process.pid}-${i}.png`));
  fs.writeFileSync(fa, a);
  fs.writeFileSync(fb, b);
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', fa, '-i', fb, '-lavfi', 'psnr', '-f', 'null', '-']);
  const m = stderr.match(/average:(\S+)/);
  return !m || m[1] === 'inf' ? Infinity : parseFloat(m[1]);
}

const clipFrame = async (clip, t) => (await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', clip, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])).stdout;

export default async function verifyclips(episodeDir, args = []) {
  const si = args.indexOf('--step');
  const step = si >= 0 ? +args[si + 1] : 1.5;
  const draft = args.includes('--draft');
  const mi = args.indexOf('--min');
  const minDb = mi >= 0 ? +args[mi + 1] : MIN_PSNR; // `--min 40` lists every frame under 40 dB (to inspect near-misses)
  const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--step' && args[i - 1] !== '--min');
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  const clipDir = path.join(episodeDir, 'out', draft ? 'clips-draft' : 'clips');
  const session = await openSession(episodeDir);
  const bad = [];
  let n = 0;
  let worst = Infinity;
  try {
    for (const s of script.scenes.filter((x) => !only.length || only.some((o) => x.id.startsWith(o.padStart(2, '0'))))) {
      const clip = path.join(clipDir, `${s.id}.mp4`);
      if (!fs.existsSync(clip)) { bad.push(`${s.id}: no clip`); continue; }
      const dur = tl.scenes.find((x) => x.id === s.id).duration;
      for (let t0 = 0.2; t0 < dur + 0.4; t0 += step) {
        const t = snapToFrame(t0, draft ? 30 : 60);
        await session.reset();
        await session.load(s.id);
        const pure = await session.frame(+t.toFixed(5), { type: 'png' });
        const db = await psnr(pure, await clipFrame(clip, +t.toFixed(5)));
        n++;
        worst = Math.min(worst, db);
        if (db < minDb) bad.push(`${s.id}@${t.toFixed(2)} (${db.toFixed(1)} dB)`);
      }
    }
  } finally { await session.close(); }
  console.log(`clip verification: ${n} sampled frames, worst ${Number.isFinite(worst) ? worst.toFixed(1) + ' dB' : 'identical'}, threshold ${minDb} dB`);
  if (bad.length) { console.log(`MISMATCHES (${bad.length}):\n  ${bad.join('\n  ')}`); process.exitCode = 1; } else console.log('all sampled frames match a fresh render');
}
