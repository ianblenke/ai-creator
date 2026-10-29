// timeline-alignment: audio + script -> timeline.json, VTT/SRT, and the padded narration track.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadScript } from '../script.js';
import { buildTimeline, validateTimeline, toVtt, toSrt, SCENE_PAD } from '../timeline.js';
import { ffmpeg, probeDuration } from '../ffmpeg.js';
import { findGaps, formatGaps } from '../audio-check.js';
import { loadEnv } from '../env.js';

const PY = process.env.MEDIA_PYTHON || path.resolve('.venv-align/bin/python');

function runAligner(items) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(PY)) return reject(new Error(`alignment env missing (${PY}): run align in the tools container (docker compose run --rm media align <episode>), or set MEDIA_PYTHON to a Python with requirements-align.txt installed (python3 -m venv .venv-align && .venv-align/bin/pip install -r requirements-align.txt)`));
    const p = spawn(PY, [path.resolve('tools/align.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
    const out = [];
    p.stdout.on('data', (d) => out.push(d));
    p.on('close', (code) => {
      try {
        if (code !== 0) throw new Error(`aligner exited ${code}`);
        resolve(JSON.parse(Buffer.concat(out).toString()));
      } catch (e) {
        reject(e);
      }
    });
    p.stdin.end(JSON.stringify(items));
  });
}

/** Concatenate scene audio with fixed pads so audio time == timeline time. */
export async function buildNarration(files, out, pad = SCENE_PAD) {
  const args = [];
  const labels = [];
  // one label per input, so labels.length is the next input's index
  files.forEach((f, i) => {
    labels.push(`[${labels.length}:a]`);
    args.push('-i', f);
    if (i < files.length - 1) {
      labels.push(`[${labels.length}:a]`);
      args.push('-f', 'lavfi', '-t', String(pad), '-i', 'anullsrc=r=48000:cl=mono');
    }
  });
  await ffmpeg([...args, '-filter_complex', `${labels.join('')}concat=n=${labels.length}:v=0:a=1[a]`, '-map', '[a]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', out]);
}

/** Fixture lane: no recognizer. The committed timeline.json stays the clock and is never rewritten; only narration.wav is built. */
export async function alignFromTimeline(episodeDir, script, files, durations) {
  const tlFile = path.join(episodeDir, 'timeline.json');
  if (!fs.existsSync(tlFile)) throw new Error('VOICE_TRANSPORT=fixture needs timeline.json: run tts with VOICE_TRANSPORT=fixture first (it writes an estimated one)');
  const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
  for (const s of script.scenes) {
    const ts = tl.scenes.find((x) => x.id === s.id);
    if (!ts || Math.abs(ts.duration - durations[s.id]) > 0.02) {
      throw new Error(`scene ${s.id}: audio is ${durations[s.id].toFixed(2)} s, timeline.json says ${ts ? ts.duration : 'nothing'}; fixture mode never rewrites timeline.json, so re-run tts with VOICE_TRANSPORT=fixture (or unset it to align real audio)`);
    }
  }
  await buildNarration(files, path.join(episodeDir, 'audio', 'narration.wav'), tl.pad);
  console.log(`timeline: kept the ${tl.estimated ? 'estimated' : 'committed'} timeline.json (fixture mode), ${tl.scenes.length} scenes, ${tl.duration.toFixed(1)} s`);
}

export default async function align(episodeDir, args = [], cfg = { ...loadEnv(), ...process.env }) {
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const audioDir = path.join(episodeDir, 'audio');
  const files = script.scenes.map((s) => path.join(audioDir, `${s.id}.wav`));
  files.forEach((f) => { if (!fs.existsSync(f)) throw new Error(`missing audio ${path.basename(f)} (run tts first)`); });
  const durations = {};
  for (const [i, s] of script.scenes.entries()) durations[s.id] = await probeDuration(files[i]);
  if (cfg.VOICE_TRANSPORT === 'fixture') return alignFromTimeline(episodeDir, script, files, durations);
  const aligned = await runAligner(script.scenes.map((s, i) => ({ id: s.id, file: files[i], text: s.spokenText.replace(/\s+/g, ' ') })));
  const tl = buildTimeline(script, aligned, durations);
  const errors = validateTimeline(tl);
  if (errors.length) throw new Error(`timeline invalid:\n${errors.join('\n')}`);
  fs.mkdirSync(path.join(episodeDir, 'subs'), { recursive: true });
  fs.writeFileSync(path.join(episodeDir, 'timeline.json'), JSON.stringify(tl, null, 2));
  fs.writeFileSync(path.join(episodeDir, 'subs', 'episode.vtt'), toVtt(tl));
  fs.writeFileSync(path.join(episodeDir, 'subs', 'episode.srt'), toSrt(tl));
  await buildNarration(files, path.join(audioDir, 'narration.wav'));
  console.log(`timeline: ${tl.scenes.length} scenes, ${tl.duration.toFixed(1)} s`);
  const gaps = findGaps(tl);
  if (gaps.length) console.log(`narration check: ${gaps.length} possible glitch(es); retake those scenes with "media besttake ${episodeDir} <scene-number...>" (docs/tutorial/takes.md):\n${formatGaps(gaps)}`);
  else console.log('narration check: no stalls or unnatural pauses');
}
