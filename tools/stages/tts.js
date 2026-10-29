// voice-synthesis: per-scene synthesis through the voice server (Chatterbox, OmniVoice, Kokoro), cached, retakeable, loudness-normalized.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { loadScript, estimateSeconds, tokenizeNarration } from '../script.js';
import { buildTimeline, toVtt, toSrt } from '../timeline.js';
import { loadEnv } from '../env.js';
import { normalize, measureLufs, probeDuration, ffmpeg } from '../ffmpeg.js';

// VOICE_URL defaults to the compose service name, so only VOICE_NAME is required
// cloning: VOICE_REF (path to your reference wav) + VOICE_REF_TEXT (its transcript) replace VOICE_NAME
// fixture: no voice at all; silent scene audio sized from the committed timeline.json (the GPU-free first run)
const REQUIRED = { http: ['VOICE_NAME'], ssh: ['VOICE_SSH_HOST', 'VOICE_CONTAINER', 'VOICE_NAME'], fixture: [] };
const transportName = (cfg) => cfg.VOICE_TRANSPORT || 'http';
const TARGET_LUFS = -16;
// Chatterbox reads these at server start (compose passes the same values to both containers); they are here only for the cache key.
const KNOBS = { exaggeration: 'VOICE_EXAGGERATION', cfg_weight: 'VOICE_CFG_WEIGHT', temperature: 'VOICE_TEMPERATURE', seed: 'VOICE_SEED' };
const hash = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 12);

const baseUrl = (cfg) => (cfg.VOICE_URL || 'http://voice:8080').replace(/\/$/, '');

/** A failed fetch, said plainly: a timeout, or the network error's own code (ECONNREFUSED, ENOTFOUND ...) instead of a bare "unreachable". */
export function fetchError(e, url, secs) {
  if (e?.name === 'TimeoutError') return new Error(`voice server did not answer within ${secs} s (${url}); a first request can carry the model download: see \`docker compose logs\` of the voice service`);
  return new Error(`voice server unreachable at ${url}: ${e?.cause?.code || e?.cause?.message || e?.message}`);
}

/** The useful part of an error response: FastAPI's {"detail": ...} or the start of a plain-text body. */
export function errorDetail(buf) {
  const text = buf.toString('utf8');
  try { const d = JSON.parse(text).detail; if (d) return typeof d === 'string' ? d : JSON.stringify(d); } catch { /* not JSON */ }
  return /^[\x09\x0a\x0d\x20-\x7e]*$/.test(text.slice(0, 300)) ? text.slice(0, 300).trim() : '';
}

/**
 * GET /health until the server is ready, so a model that is still loading (the first start downloads the weights) waits instead of
 * timing out. {ready: false} waits up to waitSecs; an {error} from the server fails at once; a refused connection is retried for
 * upSecs (the container may still be starting). A server whose /health has no `ready` (404, plain "ok") counts as ready.
 * Returns the parsed /health body ({} when it is not JSON).
 */
export async function waitForServer(cfg, { fetchFn = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), pollMs = 5000,
  waitSecs = Number(cfg.VOICE_READY_WAIT || 1800), upSecs = 30, log = console.error } = {}) {
  const url = `${baseUrl(cfg)}/health`;
  const t0 = Date.now();
  let said = false;
  for (;;) {
    let res, body = {};
    try {
      res = await fetchFn(url, { signal: AbortSignal.timeout(10000) });
      try { body = JSON.parse(await res.text()); } catch { body = {}; }
    } catch (e) {
      if (Date.now() - t0 >= upSecs * 1000) throw fetchError(e, url, 10);
      await sleep(pollMs);
      continue;
    }
    if (body.error) throw new Error(`voice server could not load its model: ${body.error}`);
    if (!res.ok || body.ready !== false) return body;
    if (Date.now() - t0 >= waitSecs * 1000) throw new Error(`voice server still loading its model after ${waitSecs} s (VOICE_READY_WAIT); see \`docker compose logs\` of the voice service`);
    if (!said) { log('tts: the voice server is still loading its model (the first start downloads the weights, about 3 GB); waiting'); said = true; }
    await sleep(pollMs);
  }
}

/** Default transport (docker compose): POST to the voice server's HTTP API. Returns WAV bytes. */
export function httpTransport(cfg, { fetchFn = fetch, timeoutSecs = 600 } = {}) {
  return async (text) => {
    const base = baseUrl(cfg);
    const steps = String(Number(cfg.VOICE_NUM_STEP || 24));
    let url = `${base}/v1/audio/speech`, init;
    if (cfg.VOICE_REF) {
      const form = new FormData();
      form.set('input', text); form.set('ref_text', cfg.VOICE_REF_TEXT); form.set('language', 'en'); form.set('num_step', steps);
      form.set('ref_audio', new Blob([fs.readFileSync(cfg.VOICE_REF)], { type: 'audio/wav' }), 'ref.wav');
      url = `${base}/v1/audio/speech/clone`; init = { method: 'POST', body: form };
    } else init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: text, voice: cfg.VOICE_NAME, num_step: Number(steps) }) };
    let res;
    try {
      res = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutSecs * 1000) });
    } catch (e) { throw fetchError(e, url, timeoutSecs); }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok || buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') {
      const detail = res.ok ? '' : errorDetail(buf);
      throw new Error(`voice server request failed (status ${res.status}, ${buf.length} bytes)${detail ? `: ${detail}` : ''}`);
    }
    return buf;
  };
}

/** Alternative transport: POST to the server from inside its container, over SSH. Returns WAV bytes. */
export function sshTransport(cfg) {
  return (text) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ input: text, voice: cfg.VOICE_NAME, num_step: Number(cfg.VOICE_NUM_STEP || 24) });
    const p = spawn('ssh', ['-o', 'BatchMode=yes', cfg.VOICE_SSH_HOST, 'docker', 'exec', '-i', cfg.VOICE_CONTAINER,
      'curl', '-s', '-m', '600', '-X', 'POST', 'localhost:8000/v1/audio/speech', '-H', 'Content-Type:application/json', '--data-binary', '@-']);
    const out = [];
    p.stdout.on('data', (d) => out.push(d));
    p.on('error', () => reject(new Error('voice server unreachable')));
    p.on('close', (code) => {
      const buf = Buffer.concat(out);
      if (code !== 0 || buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF') {
        reject(new Error(`voice server request failed (exit ${code}, ${buf.length} bytes)`));
      } else resolve(buf);
    });
    p.stdin.end(body);
  });
}

export function checkConfig(cfg) {
  const kind = transportName(cfg);
  if (!REQUIRED[kind]) throw new Error(`unknown VOICE_TRANSPORT '${kind}' (use http, ssh or fixture)`);
  const cloning = kind === 'http' && cfg.VOICE_REF;
  if (cloning && !cfg.VOICE_REF_TEXT) throw new Error('missing local configuration: VOICE_REF_TEXT (the words spoken in VOICE_REF; set in .env.local)');
  const missing = cloning ? [] : REQUIRED[kind].filter((k) => !cfg[k]);
  if (missing.length) throw new Error(`missing local configuration: ${missing.join(', ')} (set in .env.local)`);
}

/**
 * Clone mode needs voice/CONSENT.md, filled in (not a byte copy of the example). A speed bump, not proof: no file can show the
 * speaker is you or agreed.
 */
export function checkConsent(root = '.') {
  const note = path.join(root, 'voice', 'CONSENT.md');
  if (!fs.existsSync(note)) throw new Error('cloning needs a consent note: copy voice/CONSENT.example.md to voice/CONSENT.md and fill it in');
  const example = path.join(root, 'voice', 'CONSENT.example.md');
  if (fs.existsSync(example) && fs.readFileSync(note).equals(fs.readFileSync(example))) {
    throw new Error('voice/CONSENT.md is still the unedited example: fill it in before cloning');
  }
}

/**
 * A timeline for an episode that has no narration yet: each scene as long as the script's word count at VOICE_WPM, its words spread
 * evenly, marked estimated. Real narration and align replace it.
 */
export function estimatedTimeline(script) {
  const aligned = {}, durations = {};
  for (const s of script.scenes) {
    const n = tokenizeNarration(s.rawText).reduce((k, t) => k + t.spoken, 0);
    const d = Math.max(1, +estimateSeconds({ scenes: [s] }, { pad: 0 }).toFixed(2));
    durations[s.id] = d;
    aligned[s.id] = Array.from({ length: n }, (_, k) => ({ start: (k * d) / n, end: ((k + 0.8) * d) / n }));
  }
  return { estimated: true, ...buildTimeline(script, aligned, durations) };
}

/**
 * Fixture lane: one silent WAV per scene, as long as the committed timeline.json says, so the rest of the pipeline runs offline.
 * With no timeline.json (a new episode), or only an estimated one, it writes an estimated timeline from the script first.
 */
async function fixtureAudio(episodeDir, script, audioDir) {
  const tlFile = path.join(episodeDir, 'timeline.json');
  if (!fs.existsSync(tlFile) || JSON.parse(fs.readFileSync(tlFile, 'utf8')).estimated) {
    const est = estimatedTimeline(script);
    fs.writeFileSync(tlFile, JSON.stringify(est, null, 2));
    fs.mkdirSync(path.join(episodeDir, 'subs'), { recursive: true });
    fs.writeFileSync(path.join(episodeDir, 'subs', 'episode.vtt'), toVtt(est));
    fs.writeFileSync(path.join(episodeDir, 'subs', 'episode.srt'), toSrt(est));
    console.log(`timeline.json: ESTIMATED from the script (${est.duration.toFixed(1)} s at VOICE_WPM or 160 words a minute); real narration and align replace it`);
  }
  const prev = path.join(audioDir, 'manifest.json');
  if (fs.existsSync(prev) && JSON.parse(fs.readFileSync(prev, 'utf8')).some((m) => m.status !== 'fixture')) {
    throw new Error(`${path.relative('.', audioDir)} holds real narration: fixture mode would overwrite it with silence, so move it away first`);
  }
  const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
  const manifest = [];
  for (const scene of script.scenes) {
    const ts = tl.scenes.find((x) => x.id === scene.id);
    if (!ts) throw new Error(`timeline.json has no scene ${scene.id}: fixture mode needs the timeline that matches the script`);
    const final = path.join(audioDir, `${scene.id}.wav`);
    await ffmpeg(['-f', 'lavfi', '-t', String(ts.duration), '-i', 'anullsrc=r=48000:cl=mono', '-c:a', 'pcm_s16le', final]);
    manifest.push({ scene: scene.id, file: path.relative(episodeDir, final), key: 'fixture', seconds: await probeDuration(final), status: 'fixture' });
    console.log(`${scene.id}: fixture (${ts.duration} s of silence)`);
  }
  fs.writeFileSync(prev, JSON.stringify(manifest, null, 2));
  return manifest;
}

/** Synthesize each segment separately and join them with the requested silence (a pause marker in the script). */
export async function synthesizeWithPauses(segments, transport, outFile) {
  const dir = fs.mkdtempSync(path.join(path.dirname(outFile), 'seg-'));
  try {
    const files = [];
    for (let i = 0; i < segments.length; i++) {
      const f = path.join(dir, `${i}.wav`);
      fs.writeFileSync(f, await transport(segments[i].text));
      files.push(f);
    }
    const args = files.flatMap((f) => ['-i', f]);
    const pads = files.map((_, i) => (segments[i].pauseAfter > 0 ? `[${i}:a]apad=pad_dur=${segments[i].pauseAfter}[p${i}]` : `[${i}:a]anull[p${i}]`));
    const chain = files.map((_, i) => `[p${i}]`).join('') + `concat=n=${files.length}:v=0:a=1[out]`;
    await ffmpeg([...args, '-filter_complex', [...pads, chain].join(';'), '-map', '[out]', '-ar', '24000', '-ac', '1', outFile]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * The consent check sees only VOICE_REF. A named server voice can itself be a clone (Chatterbox's CHATTERBOX_DEFAULT_REF, a saved
 * OmniVoice voice), made from a recording this tool never sees, so every named-voice run says so loudly.
 */
export function serverVoiceNotice(cfg) {
  if (cfg.VOICE_REF || transportName(cfg) === 'fixture') return null;
  const bar = '!'.repeat(78);
  return `${bar}\ntts: server voice "${cfg.VOICE_NAME}" (VOICE_NAME). The consent check did NOT run: it only checks VOICE_REF.\n` +
    'If this server voice was made from a recording (CHATTERBOX_DEFAULT_REF, a saved OmniVoice voice), it is a clone: it must be your\n' +
    `own voice or one you have written permission for, with voice/CONSENT.md filled in. docs/safety.md, "Cloning through a server voice".\n${bar}`;
}

/** A fixed VOICE_SEED makes the server reseed before every request, so a retake repeats the same take (identical on CPU). */
export function seedWarning(cfg) {
  return cfg.VOICE_SEED ? `warning: VOICE_SEED=${cfg.VOICE_SEED} is set, so every retake comes out the same (or nearly, on a GPU); unset it in .env and restart the voice service to get different takes` : null;
}

/** options: {retake: ['03', ...]}; deps: {transport, cfg, root, engine} for tests (root: where voice/CONSENT.md lives; engine: what /health would say). */
export async function runTts(episodeDir, { retake = [] } = {}, deps = {}) {
  const cfg = deps.cfg ?? { ...loadEnv(), ...process.env };
  if (!deps.transport) checkConfig(cfg);
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const audioDir = path.join(episodeDir, 'audio');
  if (!deps.transport && transportName(cfg) === 'fixture') { fs.mkdirSync(audioDir, { recursive: true }); return fixtureAudio(episodeDir, script, audioDir); }
  if (cfg.VOICE_REF) checkConsent(deps.root);
  else if (!deps.transport) console.error(serverVoiceNotice(cfg));
  // the engine is part of the cache key, so a take from another lane or another weights pin is never reused
  const health = deps.transport ? { engine: deps.engine } : transportName(cfg) === 'http' ? await waitForServer(cfg) : {};
  const engine = cfg.VOICE_ENGINE_TAG || health.engine || (transportName(cfg) === 'ssh' ? `ssh:${cfg.VOICE_CONTAINER}` : `unreported:${hash(baseUrl(cfg))}`);
  if (retake.length && seedWarning(cfg)) console.error(seedWarning(cfg));
  const transport = deps.transport ?? (transportName(cfg) === 'ssh' ? sshTransport(cfg) : httpTransport(cfg));
  const rawDir = path.join(audioDir, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });
  const manifestFile = path.join(audioDir, 'manifest.json');
  // a final whose last key differs (e.g. fixture silence) is re-made from the cached take
  const lastKey = fs.existsSync(manifestFile) ? Object.fromEntries(JSON.parse(fs.readFileSync(manifestFile, 'utf8')).map((m) => [m.scene, m.key])) : {};
  const knobs = Object.fromEntries(Object.entries(KNOBS).map(([k, v]) => [k, cfg[v] || undefined])); // unset knobs drop out of the key
  const manifest = [];
  for (const scene of script.scenes) {
    const settings = { engine, voice: cfg.VOICE_REF ? `clone:${hash([fs.readFileSync(cfg.VOICE_REF).toString('base64'), cfg.VOICE_REF_TEXT])}` : cfg.VOICE_NAME ?? 'test', num_step: cfg.VOICE_NUM_STEP ?? '24', ...knobs };
    const paused = scene.segments?.length > 1;
    const key = hash(paused ? { segments: scene.segments, ...settings } : { text: scene.spokenText, ...settings });
    const raw = path.join(rawDir, `${key}.wav`); // content-addressed: renumbering scenes must not invalidate audio
    const final = path.join(audioDir, `${scene.id}.wav`);
    const wanted = retake.some((r) => scene.id.startsWith(r.padStart(2, '0')) || scene.id === r);
    if (wanted) fs.rmSync(raw, { force: true });
    let status = 'cached';
    if (!fs.existsSync(raw)) {
      if (paused) await synthesizeWithPauses(scene.segments, transport, raw);
      else fs.writeFileSync(raw, await transport(scene.spokenText));
      fs.rmSync(final, { force: true });
      status = wanted ? 'retaken' : 'synthesized';
    }
    if (!fs.existsSync(final) || status !== 'cached' || lastKey[scene.id] !== key) await normalize(raw, final, { lufs: TARGET_LUFS });
    manifest.push({ scene: scene.id, file: path.relative(episodeDir, final), key, seconds: await probeDuration(final), status });
    console.log(`${scene.id}: ${status}`);
  }
  // drop final audio from scenes that no longer exist (e.g. after renumbering)
  const live = new Set([...script.scenes.map((x) => `${x.id}.wav`), 'narration.wav']);
  // only scene audio (NN-name.wav): other files in this folder (music beds, reports) are not ours to delete
  for (const f of fs.readdirSync(audioDir)) if (/^\d\d-.*\.wav$/.test(f) && !live.has(f)) fs.rmSync(path.join(audioDir, f));
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  return manifest;
}

export async function verifyLoudness(manifest, episodeDir, tolerance = 1) {
  const bad = [];
  for (const m of manifest) {
    const lufs = await measureLufs(path.join(episodeDir, m.file));
    if (Math.abs(lufs - TARGET_LUFS) > tolerance) bad.push(`${m.scene}: ${lufs.toFixed(1)} LUFS`);
  }
  return bad;
}

export default async function tts(episodeDir, args = []) {
  const retake = [];
  for (let i = 0; i < args.length; i++) if (args[i] === '--retake') retake.push(args[++i]);
  const manifest = await runTts(episodeDir, { retake });
  if (manifest.some((m) => m.status === 'fixture')) return console.log('fixture audio written (silence: no loudness check); next: align');
  const bad = await verifyLoudness(manifest, episodeDir);
  if (bad.length) throw new Error(`loudness out of tolerance: ${bad.join('; ')}`);
}
