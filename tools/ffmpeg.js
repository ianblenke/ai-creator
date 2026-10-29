import { spawn } from 'node:child_process';

/** Run a binary, resolve {stdout, stderr}; rejects on non-zero exit. */
export function run(cmd, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const out = [];
    const err = [];
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => err.push(d));
    p.on('error', reject);
    p.on('close', (code) => {
      const r = { stdout: Buffer.concat(out), stderr: Buffer.concat(err).toString() };
      code === 0 ? resolve(r) : reject(Object.assign(new Error(`${cmd} exited ${code}: ${r.stderr.slice(-400)}`), r));
    });
    p.stdin.on('error', () => {});
    p.stdin.end(input);
  });
}

export const ffmpeg = (args, o) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], o);

export async function probeDuration(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  return parseFloat(stdout.toString());
}

const TARGET = { I: -16, TP: -1.5, LRA: 11 };

export async function loudnormStats(file, filter = `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', filter, '-f', 'null', '-']);
  const json = stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1);
  return JSON.parse(json);
}

/** Integrated loudness (LUFS) of a file. */
export async function measureLufs(file) {
  return parseFloat((await loudnormStats(file)).input_i);
}

/** Two-pass, linear loudness normalization to -16 LUFS; writes mono 48 kHz PCM16 WAV. */
export async function normalize(input, output, { lufs = TARGET.I } = {}) {
  const m = await loudnormStats(input, `loudnorm=I=${lufs}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`);
  const f = `loudnorm=I=${lufs}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  await ffmpeg(['-i', input, '-af', f, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', output]);
}
