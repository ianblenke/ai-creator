// render-pipeline (capture): step scene time, screenshot, pipe frames to ffmpeg -> one clip per scene. Parallel, cached.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { run } from '../ffmpeg.js';
import { loadScript } from '../script.js';
import { openSession } from '../capture.js';
import { SCENE_PAD } from '../timeline.js';

/** PSNR in dB between two images (Infinity when identical). Filter rounding gives >100 dB; a visible glitch is far lower. */
async function psnr(bufA, bufB) {
  const [fa, fb] = [0, 1].map((i) => path.join(os.tmpdir(), `psnr-${process.pid}-${i}.jpg`));
  fs.writeFileSync(fa, bufA); fs.writeFileSync(fb, bufB);
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', fa, '-i', fb, '-lavfi', 'psnr', '-f', 'null', '-']);
  const m = stderr.match(/average:(\S+)/);
  return !m || m[1] === 'inf' ? Infinity : parseFloat(m[1]);
}
export const VISIBLE_PSNR = 60;

/** The failure text for `render --check`, with the remedy (thresholds: 60 dB default, 44 dB for glow rounding, 36 dB ghost gate). */
export function determinismFailure(bad, episodeDir, limit = +process.env.MEDIA_DETERMINISM_DB || VISIBLE_PSNR) {
  return [`nondeterministic frames: ${bad.join(', ')}`,
    `A swept frame must match a pure render above ${limit} dB (MEDIA_DETERMINISM_DB, default ${VISIBLE_PSNR}). A real ghost measures about 30 dB.`,
    'If every flagged frame is above 44 dB (faint edge rounding around glows and flow dots), confirm it is not a ghost:',
    `  docker compose run --rm --entrypoint node media tools/debug-determinism.js ${episodeDir} <scene-id> <t>`,
    '  (and -e DUMP_DIR=<dir> on the check keeps both frames to compare), then re-run the check with -e MEDIA_DETERMINISM_DB=44',
    '  (docker compose run --rm -e MEDIA_DETERMINISM_DB=44 media render <episode-dir> --check). Below 44 dB the scene keeps state between frames: fix the scene.',
    'After rendering, verifyclips (shipped clip vs fresh render, --step 0.35) flags any frame under 36 dB: look at each one.'].join('\n');
}

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export function parseArgs(args) {
  const o = { draft: false, check: false, step: 2, scenes: [], workers: Math.max(1, Math.min(6, Math.floor(os.cpus().length / 2))) };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--draft') o.draft = true;
    else if (args[i] === '--check') o.check = true;
    else if (args[i] === '--workers') o.workers = +args[++i];
    else if (args[i] === '--step') o.step = +args[++i];
    else if (!args[i].startsWith('--')) o.scenes.push(args[i]);
  }
  o.fps = o.draft ? 30 : 60;
  return o;
}

/** Cache key from the scene's code, its audio content and its duration (alignment jitter must not invalidate clips). */
/** Source of every ./relative module a scene imports (shared drawings), followed through nested imports, so editing one re-renders the scenes that use it. */
export function relativeImports(source, dir, seen = new Set()) {
  let out = '';
  for (const m of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const f = path.resolve(dir, m[1]);
    if (seen.has(f) || !fs.existsSync(f)) continue;
    seen.add(f);
    const src = fs.readFileSync(f, 'utf8');
    out += src + relativeImports(src, path.dirname(f), seen);
  }
  return out;
}

export function clipKey(source, tlScene, { fps, draft }, audioFile, sceneDir) {
  const audio = audioFile && fs.existsSync(audioFile) ? sha(fs.readFileSync(audioFile)) : JSON.stringify(tlScene.words.map((w) => w.text));
  // the renderer itself is part of the key: a harness/capture change (e.g. a repaint strategy) must invalidate every clip
  const renderer = ['tools/stage/style.js', 'tools/stage/harness.js', 'tools/stage/anchors.js', 'tools/capture.js'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const kit = /from\s+['"]kit['"]/.test(source) ? fs.readFileSync('tools/stage/kit.js', 'utf8') : ''; // only scenes that use the kit depend on it
  return sha(JSON.stringify([source, audio, +tlScene.duration.toFixed(1), fps, draft, renderer, ...(kit ? [kit] : []), ...(sceneDir ? [relativeImports(source, sceneDir)] : [])]));
}

export const frameCount = (duration, fps) => Math.round((duration + SCENE_PAD) * fps);

function ffmpegSink(out, fps, draft) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', draft ? '23' : '16', '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => { p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))); p.on('error', rej); });
  return { write: (buf) => new Promise((res) => (p.stdin.write(buf) ? res() : p.stdin.once('drain', res))), end: () => { p.stdin.end(); return done; } };
}

async function renderScene(session, s, tlScene, { fps, draft, clipDir, key }) {
  const out = path.join(clipDir, `${s.id}.mp4`);
  await session.load(s.id);
  const n = frameCount(tlScene.duration, fps);
  const sink = ffmpegSink(out, fps, draft);
  for (let i = 0; i < n; i++) await sink.write(await session.frame(i / fps, { type: 'jpeg' }));
  await sink.end();
  fs.writeFileSync(`${out}.key`, key);
  return n;
}

/**
 * A real render sweeps each scene's frames in ascending order. Every swept frame must equal a pure render of the same instant on a
 * brand-new page, otherwise the scene leaves stale state behind (a visible leftover element in the final video).
 */
async function determinismCheck(episodeDir, script, tl, { step = 2, only = [] } = {}) {
  const sweep = await openSession(episodeDir);
  const pure = await openSession(episodeDir);
  const bad = [];
  try {
    for (const s of script.scenes.filter((x) => !only.length || only.some((o) => x.id.startsWith(o.padStart(2, '0'))))) {
      const ts = tl.scenes.find((x) => x.id === s.id);
      const times = [];
      for (let t = 0.1; t < ts.duration + 0.5; t += step) times.push(+t.toFixed(2));
      times.push(+(ts.duration + 0.3).toFixed(2));
      await sweep.load(s.id);
      for (const t of times) {
        const swept = await sweep.frame(t, { type: 'jpeg' });
        await pure.reset();
        await pure.load(s.id);
        const ref = await pure.frame(t, { type: 'jpeg' });
        if (sha(swept) === sha(ref)) continue;
        const db = await psnr(ref, swept);
        if (db >= (+process.env.MEDIA_DETERMINISM_DB || VISIBLE_PSNR)) continue; // sub-visible filter rounding (60 dB by default; a real ghost is about 30 dB)
        bad.push(`${s.id}@${t} (${db.toFixed(1)} dB)`);
        if (process.env.DUMP_DIR) {
          fs.writeFileSync(`${process.env.DUMP_DIR}/${s.id}@${t}-sweep.jpg`, swept);
          fs.writeFileSync(`${process.env.DUMP_DIR}/${s.id}@${t}-pure.jpg`, ref);
        }
      }
    }
  } finally { await sweep.close(); await pure.close(); }
  return bad;
}

export default async function render(episodeDir, args = []) {
  const o = parseArgs(args);
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  if (o.check) {
    const bad = await determinismCheck(episodeDir, script, tl, { only: o.scenes, step: o.step });
    if (bad.length) throw new Error(determinismFailure(bad, episodeDir));
    console.log('determinism check passed: every swept frame matches a pure render of the same instant');
    return;
  }
  const clipDir = path.join(episodeDir, 'out', o.draft ? 'clips-draft' : 'clips');
  fs.mkdirSync(clipDir, { recursive: true });
  const jobs = script.scenes.filter((s) => !o.scenes.length || o.scenes.some((x) => s.id.startsWith(x.padStart(2, '0'))));
  const queue = [...jobs];
  const t0 = Date.now();
  const worker = async () => {
    const session = await openSession(episodeDir);
    try {
      for (let s; (s = queue.shift());) {
        const tlScene = tl.scenes.find((x) => x.id === s.id);
        const src = fs.readFileSync(path.join(episodeDir, 'scenes', `${s.id}.js`));
        const key = clipKey(src.toString(), tlScene, o, path.join(episodeDir, 'audio', `${s.id}.wav`), path.join(episodeDir, 'scenes'));
        const out = path.join(clipDir, `${s.id}.mp4`);
        if (fs.existsSync(out) && fs.existsSync(`${out}.key`) && fs.readFileSync(`${out}.key`, 'utf8') === key) { console.log(`${s.id}: up to date`); continue; }
        const n = await renderScene(session, s, tlScene, { fps: o.fps, draft: o.draft, clipDir, key });
        console.log(`${s.id}: ${n} frames @ ${o.fps} fps (${((Date.now() - t0) / 1000).toFixed(0)} s elapsed)`);
      }
    } finally { await session.close(); }
  };
  await Promise.all(Array.from({ length: Math.min(o.workers, jobs.length) }, worker));
}
