// render-pipeline (encode): concat scene clips + narration (+ ducked music) -> 1080p MP4, sidecar and optional burned-in subtitles.
import fs from 'node:fs';
import path from 'node:path';
import { loadScript } from '../script.js';
import { ffmpeg, run } from '../ffmpeg.js';
import { verifyOutput } from '../verify.js';
import { parseArgs } from './render.js';

export default async function encode(episodeDir, args = []) {
  const o = parseArgs(args.filter((a) => a !== '--burn' && a !== '--music' && !/\.(mp3|wav|m4a|flac|ogg)$/i.test(a)));
  const burn = args.includes('--burn');
  const mi = args.indexOf('--music');
  const music = mi >= 0 ? args[mi + 1] : null;
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const name = path.basename(path.resolve(episodeDir));
  const clipDir = path.join(episodeDir, 'out', o.draft ? 'clips-draft' : 'clips');
  const clips = script.scenes.map((s) => path.resolve(clipDir, `${s.id}.mp4`));
  const outDir = path.resolve(episodeDir, 'out');
  clips.forEach((c) => { if (!fs.existsSync(c)) throw new Error(`missing clip ${path.basename(c)} (run render first)`); });
  const list = path.join(episodeDir, 'out', 'clips.txt');
  // relative to the list file, so no filesystem paths land in episode artifacts
  fs.writeFileSync(list, clips.map((c) => `file '${path.relative(outDir, c)}'`).join('\n'));
  const out = path.join(episodeDir, 'out', `${name}${o.draft ? '-draft' : ''}${music ? '-' + path.basename(music).replace(/^music-bed/, 'music').replace(/\.\w+$/, '') : ''}${burn ? '-subtitled' : ''}.mp4`);
  const narration = path.resolve(episodeDir, 'audio', 'narration.wav');
  const srt = path.resolve(episodeDir, 'subs', 'episode.srt');
  const args2 = ['-f', 'concat', '-safe', '0', '-i', list, '-i', narration];
  let audio = '[1:a]apad[a]';
  if (music) {
    args2.push('-i', path.resolve(music));
    // narration to stereo; the (already loudness-matched) bed is ducked a few dB whenever the voice is present
    audio = '[1:a]pan=stereo|c0=c0|c1=c0,asplit=2[n1][n2];[2:a]aformat=channel_layouts=stereo[m];[m][n1]sidechaincompress=threshold=0.02:ratio=4:attack=30:release=600[d];[d][n2]amix=inputs=2:duration=first:normalize=0[mix];[mix]apad[a]';
  }
  const vf = burn ? ['-vf', `subtitles=${srt.replace(/[:\\']/g, '\\$&')}:force_style='FontSize=22,Outline=2,MarginV=40'`] : [];
  await ffmpeg([...args2, '-filter_complex', audio, '-map', '0:v', '-map', '[a]', ...vf, ...(burn ? ['-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p'] : ['-c:v', 'copy']),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  fs.copyFileSync(srt, path.join(episodeDir, 'out', `${name}.srt`));
  const problems = await verifyOutput(out, { fps: o.fps });
  if (problems.length) throw new Error(`output verification failed: ${problems.join('; ')}`);
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', out]);
  console.log(`${path.relative('.', out)}  ${parseFloat(stdout).toFixed(1)} s  (verified ${o.fps} fps 1920x1080 h264/aac)`);
}
