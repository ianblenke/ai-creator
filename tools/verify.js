import { run } from './ffmpeg.js';

/** ffprobe-based output verification. Returns [problem strings]; empty = OK. */
export async function verifyOutput(file, { fps = 60, width = 1920, height = 1080 } = {}) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  const j = JSON.parse(stdout.toString());
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const problems = [];
  if (!v) return ['no video stream'];
  if (+v.width !== width || +v.height !== height) problems.push(`resolution ${v.width}x${v.height}, expected ${width}x${height}`);
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  if (Math.abs(n / d - fps) > 0.01) problems.push(`fps ${(n / d).toFixed(2)}, expected ${fps}`);
  if (v.codec_name !== 'h264') problems.push(`video codec ${v.codec_name}`);
  if (!a) problems.push('no audio stream');
  else {
    if (a.codec_name !== 'aac') problems.push(`audio codec ${a.codec_name}`);
    const dv = parseFloat(v.duration ?? j.format.duration);
    const da = parseFloat(a.duration ?? j.format.duration);
    if (Math.abs(dv - da) > 1 / fps + 0.02) problems.push(`audio/video duration differ by ${Math.abs(dv - da).toFixed(3)} s`);
  }
  return problems;
}
