// Build a music bed from any track: strip silence, tame dynamics, normalize loudness, loop with crossfades to the narration length.
// Usage: node tools/cli.js music <episode> <track> [--lufs -28] [--out music-bed-name.wav]   ->  <episode>/audio/<out> (stereo 48 kHz)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ffmpeg, probeDuration, loudnormStats } from '../ffmpeg.js';

export const CROSSFADE = 4;

/** How many copies of a track (with crossfades) are needed to cover `target` seconds. */
export function loopCount(target, trackSeconds, xf = CROSSFADE) {
  if (trackSeconds <= xf * 2) throw new Error('track is too short to loop with crossfades');
  return Math.max(1, Math.ceil((target - trackSeconds) / (trackSeconds - xf)) + 1);
}

export default async function music(episodeDir, args = []) {
  const oi = args.indexOf('--out');
  const outName = oi >= 0 ? path.basename(args[oi + 1]) : 'music-bed.wav';
  const track = args.find((a, i) => !a.startsWith('--') && !/^-?\d+(\.\d+)?$/.test(a) && args[i - 1] !== '--out');
  const li = args.indexOf('--lufs');
  const lufs = li >= 0 ? parseFloat(args[li + 1]) : -28;
  if (!track || !fs.existsSync(track)) throw new Error('usage: music <episode> <track-file> [--lufs -28]');
  const narration = path.join(episodeDir, 'audio', 'narration.wav');
  const target = (await probeDuration(narration)) + 1;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bed-'));
  const base = path.join(tmp, 'base.wav');
  const shaped = path.join(tmp, 'shaped.wav');

  // 1) trim leading/trailing silence, flatten the loud section so it never dominates, 48 kHz stereo
  await ffmpeg(['-i', track, '-af',
    'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,' +
    'acompressor=threshold=0.063:ratio=3:attack=80:release=500', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', base]);
  // 2) two-pass linear loudness normalization to the bed level
  const m = await loudnormStats(base, `loudnorm=I=${lufs}:TP=-3:LRA=7:print_format=json`);
  await ffmpeg(['-i', base, '-af', `loudnorm=I=${lufs}:TP=-3:LRA=7:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
    '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', shaped]);
  // 3) loop with crossfades to cover the narration, fade in/out
  const len = await probeDuration(shaped);
  const n = loopCount(target, len);
  const inputs = Array.from({ length: n }, () => ['-i', shaped]).flat();
  let graph = '';
  let last = '[0:a]';
  for (let i = 1; i < n; i++) { graph += `${last}[${i}:a]acrossfade=d=${CROSSFADE}:c1=tri:c2=tri[x${i}];`; last = `[x${i}]`; }
  graph += `${last}atrim=0:${target.toFixed(2)},afade=t=in:st=0:d=2,afade=t=out:st=${(target - 6).toFixed(2)}:d=6[out]`;
  const out = path.join(episodeDir, 'audio', outName);
  await ffmpeg([...inputs, '-filter_complex', graph, '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`music bed: ${(await probeDuration(out)).toFixed(1)} s from a ${len.toFixed(1)} s track (${n} copies, ${CROSSFADE} s crossfades), about ${lufs} LUFS -> ${path.relative('.', out)}`);
}
