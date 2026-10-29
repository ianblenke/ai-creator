// Cut a vertical (1080x1920) YouTube Short from an episode's final video: blurred backdrop, the 16:9 picture centred, large burned captions.
// Usage: node tools/make-short.js <episode-dir> <start-seconds> <end-seconds> <out.mp4>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function parseSrt(text) {
  return text.trim().split(/\n\s*\n/).map((b) => {
    const lines = b.split('\n');
    const m = lines[1]?.match(/(\d+):(\d+):(\d+)[,.](\d+) --> (\d+):(\d+):(\d+)[,.](\d+)/);
    if (!m) return null;
    const s = (h, mi, se, ms) => +h * 3600 + +mi * 60 + +se + +ms / 1000;
    return { start: s(m[1], m[2], m[3], m[4]), end: s(m[5], m[6], m[7], m[8]), text: lines.slice(2).join(' ') };
  }).filter(Boolean);
}
const ts = (t) => {
  const ms = Math.round(t * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

export function sliceSrt(cues, from, to) {
  return cues.filter((c) => c.end > from && c.start < to)
    .map((c, i) => `${i + 1}\n${ts(Math.max(c.start, from) - from)} --> ${ts(Math.min(c.end, to) - from)}\n${c.text}\n`).join('\n');
}

const assTs = (t) => {
  const cs = Math.round(t * 100);
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, '0')}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
};

/** Output time of source time t once the [a, b] spans in `cuts` (source seconds) are removed. */
export function remap(t, cuts) {
  let out = t;
  for (const [a, b] of cuts) out -= Math.max(0, Math.min(t, b) - a);
  return out;
}

/** Captions as ASS on a 1080x1920 canvas (SRT would be positioned on libass's 384x288 default canvas). `cuts` are source-time spans removed from the clip. */
export function sliceAss(cues, from, to, title = '', cuts = []) {
  const R = (t) => remap(t, cuts);
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Cap,Noto Sans,70,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,6,0,2,70,70,640,1\nStyle: Title,Noto Sans,84,&H0044E0F5,&H0044E0F5,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,7,0,8,60,60,240,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const titleLine = title ? `Dialogue: 1,${assTs(0)},${assTs(R(to) - R(from))},Title,,0,0,0,,${title}\n` : '';
  return head + titleLine + cues.filter((c) => c.end > from && c.start < to)
    .map((c) => `Dialogue: 0,${assTs(R(Math.max(c.start, from)) - R(from))},${assTs(R(Math.min(c.end, to)) - R(from))},Cap,,0,0,0,,${c.text.replace(/[{}]/g, '')}`).join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : ''; };
  const crop = opt('--crop'); // x:y:w:h in the 1920x1080 frame: zoom in on the part of the picture that matters
  const title = opt('--title');
  const plain = args.includes('--plain-bg') && !!args.splice(args.indexOf('--plain-bg'), 1); // plain gradient backdrop instead of a blurred copy of the picture
  const cuts = [];
  for (let c = opt('--cut'); c; c = opt('--cut')) cuts.push(c.split(':').map(Number)); // a:b in source seconds: removed from picture and sound
  cuts.sort((x, y) => x[0] - y[0]);
  const [dir, a, b, out] = args;
  if (!dir || !out) throw new Error('usage: node tools/make-short.js <episode-dir> <start> <end> <out.mp4>');
  const from = +a, to = +b;
  const fin = path.join(dir, 'out', 'final');
  const video = path.join(fin, fs.readdirSync(fin).find((f) => /-final\.mp4$/.test(f)));
  const cues = parseSrt(fs.readFileSync(path.join(dir, 'subs', 'episode.srt'), 'utf8'));
  const ass = `${out}.ass`;
  fs.writeFileSync(ass, sliceAss(cues, from, to, title, cuts));
  const fonts = fs.mkdtempSync(path.join(path.dirname(out), 'fonts-')); // only .ttf files: libass fails on the README and licence text in vendor/fonts
  for (const f of fs.readdirSync('vendor/fonts').filter((n) => n.endsWith('.ttf'))) fs.copyFileSync(path.join('vendor/fonts', f), path.join(fonts, f));
  const esc = (p) => p.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
  const len = to - from;
  const outLen = remap(to, cuts) - remap(from, cuts);
  // keep spans between the cuts (times relative to `from`)
  const keep = [];
  let at = 0;
  for (const [a, b] of cuts) { keep.push([at, a - from]); at = b - from; }
  keep.push([at, len]);
  const seg = keep.map(([x, y], i) => `[0:v]trim=${x}:${y},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=${x}:${y},asetpts=PTS-STARTPTS[a${i}]`).join(';');
  const join = keep.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${keep.length}:v=1:a=1[vc][ac]`;
  const bg = plain ? '[1:v]null[bg]' : '[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:6[bg]';
  const vf = [
    seg, join,
    plain ? '[vc]null[b]' : '[vc]split[a][b]',
    bg,
    `[b]${crop ? (([x, y, w, h]) => `crop=${w}:${h}:${x}:${y},`)(crop.split(':')) : ''}scale=1080:-2[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2-190,ass='${esc(ass)}':fontsdir='${esc(path.resolve(fonts))}'[v]`,
    `[ac]afade=t=out:st=${outLen - 0.4}:d=0.4[af]`,
  ].join(';');
  const inputs = ['-ss', String(from), '-t', String(len), '-i', video];
  if (plain) inputs.push('-f', 'lavfi', '-t', String(outLen + 1), '-i', 'gradients=s=1080x1920:c0=0b1020:c1=171d3b:x0=0:y0=0:x1=400:y1=1920:nb_colors=2:speed=0');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', vf, '-map', '[v]', '-map', '[af]', '-t', String(outLen),
    '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], { stdio: 'inherit' });
  fs.rmSync(ass, { force: true });
  fs.rmSync(fonts, { recursive: true, force: true });
  console.log(`${out}: ${outLen.toFixed(1)} s`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
