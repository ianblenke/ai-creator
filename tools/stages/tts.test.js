import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runTts, verifyLoudness, checkConfig, checkConsent, serverVoiceNotice, waitForServer, httpTransport, seedWarning } from './tts.js';
import align from './align.js';
import { ffmpeg, probeDuration } from '../ffmpeg.js';

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'));
  fs.writeFileSync(path.join(dir, 'script.md'), '# T\n\n## One\n\nHello there friend.\n\n## Two\n\nSecond scene here.\n');
  return dir;
}
let calls = 0;
const sine = async (text) => {
  calls++;
  const f = path.join(os.tmpdir(), `sine-${process.pid}-${calls}.wav`);
  await ffmpeg(['-f', 'lavfi', '-i', `sine=frequency=${200 + text.length * 10}:duration=1.5`, '-ar', '24000', '-ac', '1', f]);
  return fs.readFileSync(f);
};
const cfg = { VOICE_NAME: 'test' };

test('one audio file per scene, loudness within 1 LU', async () => {
  const dir = fixture();
  const m = await runTts(dir, {}, { transport: sine, cfg });
  assert.equal(m.length, 2);
  assert.ok(fs.existsSync(path.join(dir, 'audio', '01-one.wav')));
  assert.deepEqual(await verifyLoudness(m, dir), []);
});

test('unchanged scenes are cached; retake re-synthesizes only that scene', async () => {
  const dir = fixture();
  await runTts(dir, {}, { transport: sine, cfg });
  const before = calls;
  const again = await runTts(dir, {}, { transport: sine, cfg });
  assert.equal(calls, before);
  assert.deepEqual(again.map((x) => x.status), ['cached', 'cached']);
  const re = await runTts(dir, { retake: ['02'] }, { transport: sine, cfg });
  assert.equal(calls, before + 1);
  assert.deepEqual(re.map((x) => x.status), ['cached', 'retaken']);
});

test('server down fails non-zero-style and keeps cached audio', async () => {
  const dir = fixture();
  await runTts(dir, {}, { transport: sine, cfg });
  fs.appendFileSync(path.join(dir, 'script.md'), '\n## Three\n\nNew scene text.\n');
  const down = async () => { throw new Error('voice server unreachable'); };
  await assert.rejects(runTts(dir, {}, { transport: down, cfg }), /unreachable/);
  assert.ok(fs.existsSync(path.join(dir, 'audio', '01-one.wav')));
});

test('missing configuration names settings but no values', () => {
  assert.throws(() => checkConfig({}), /VOICE_NAME.*\.env\.local/);
});

test('a pause marker is honoured: two segments joined by the requested silence, and the marker is not narrated', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-pause-'));
  fs.writeFileSync(path.join(dir, 'script.md'), '# T\n\n## One\n\nHello there friend.\n\n{{pause: 1.0}}\n\nSecond part here.\n');
  const seen = [];
  const rec = async (text) => { seen.push(text); return sine(text); };
  const m = await runTts(dir, {}, { transport: rec, cfg });
  assert.deepEqual(seen, ['Hello there friend.', 'Second part here.']);
  assert.ok(Math.abs(m[0].seconds - (1.5 + 1.0 + 1.5)) < 0.15, `duration ${m[0].seconds}`);
});

test('ssh transport asks for its own settings', () => {
  assert.throws(() => checkConfig({ VOICE_TRANSPORT: 'ssh', VOICE_NAME: 'x' }), /VOICE_SSH_HOST/);
  assert.throws(() => checkConfig({ VOICE_TRANSPORT: 'carrier-pigeon' }), /unknown VOICE_TRANSPORT/);
  checkConfig({ VOICE_URL: 'http://voice:8000', VOICE_NAME: 'x' });
});

test('cloning refuses without a filled-in voice/CONSENT.md', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'consent-'));
  fs.mkdirSync(path.join(root, 'voice'));
  fs.writeFileSync(path.join(root, 'voice', 'CONSENT.example.md'), '- Whose voice:\n');
  assert.throws(() => checkConsent(root), /copy voice\/CONSENT.example.md/);
  fs.copyFileSync(path.join(root, 'voice', 'CONSENT.example.md'), path.join(root, 'voice', 'CONSENT.md'));
  assert.throws(() => checkConsent(root), /unedited example/);
  const ref = path.join(root, 'ref.wav');
  fs.writeFileSync(ref, 'x');
  const clone = { VOICE_REF: ref, VOICE_REF_TEXT: 'hi' };
  await assert.rejects(runTts(fixture(), {}, { transport: sine, cfg: clone, root }), /unedited example/);
  fs.writeFileSync(path.join(root, 'voice', 'CONSENT.md'), '- Whose voice: my own\n');
  checkConsent(root);
  assert.equal((await runTts(fixture(), {}, { transport: sine, cfg: clone, root })).length, 2);
});

test('a Chatterbox knob is part of the cache key; a final made from other settings is re-made', async () => {
  const dir = fixture();
  const a = await runTts(dir, {}, { transport: sine, cfg });
  const other = (text) => sine(text + ' differs'); // another take sounds different
  const b = await runTts(dir, {}, { transport: other, cfg: { ...cfg, VOICE_EXAGGERATION: '0.6', VOICE_SEED: '' } });
  assert.notEqual(a[0].key, b[0].key);
  assert.deepEqual(b.map((x) => x.status), ['synthesized', 'synthesized']);
  // back to the first settings: the take is cached, but the final file on disk came from the other take, so it is re-made
  const f = path.join(dir, 'audio', '01-one.wav');
  const before = fs.readFileSync(f);
  const c = await runTts(dir, {}, { transport: sine, cfg });
  assert.deepEqual(c.map((x) => x.status), ['cached', 'cached']);
  assert.notDeepEqual(fs.readFileSync(f), before);
});

test('fixture lane: silent audio sized from timeline.json, align keeps the timeline and builds the narration', async () => {
  const dir = fixture();
  const tl = { pad: 0.6, duration: 3.3, scenes: [{ id: '01-one', title: 'One', start: 0, duration: 1.2, words: [] }, { id: '02-two', title: 'Two', start: 1.8, duration: 1.5, words: [] }] };
  fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(tl, null, 2));
  const committed = fs.readFileSync(path.join(dir, 'timeline.json'));
  const fx = { VOICE_TRANSPORT: 'fixture' };
  checkConfig(fx); // no VOICE_NAME needed
  const m = await runTts(dir, {}, { cfg: fx });
  assert.deepEqual(m.map((x) => [x.status, +x.seconds.toFixed(2)]), [['fixture', 1.2], ['fixture', 1.5]]);
  await align(dir, [], fx);
  assert.deepEqual(fs.readFileSync(path.join(dir, 'timeline.json')), committed);
  assert.ok(Math.abs(await probeDuration(path.join(dir, 'audio', 'narration.wav')) - 3.3) < 0.02);
  // audio that does not match the timeline is refused, not re-aligned over the committed file
  await ffmpeg(['-f', 'lavfi', '-t', '2', '-i', 'anullsrc=r=48000:cl=mono', path.join(dir, 'audio', '01-one.wav')]);
  await assert.rejects(align(dir, [], fx), /never rewrites timeline.json/);
  // real narration in audio/ is never overwritten by fixture silence
  await runTts(dir, {}, { transport: sine, cfg });
  await assert.rejects(runTts(dir, {}, { cfg: fx }), /holds real narration/);
});

test('a named server voice gets the loud consent notice; cloning and fixture do not', () => {
  assert.match(serverVoiceNotice({ VOICE_TRANSPORT: 'http', VOICE_NAME: 'me' }), /consent check did NOT run[\s\S]*CHATTERBOX_DEFAULT_REF/);
  assert.equal(serverVoiceNotice({ VOICE_TRANSPORT: 'http', VOICE_REF: 'voice/ref.wav' }), null);
  assert.equal(serverVoiceNotice({ VOICE_TRANSPORT: 'fixture' }), null);
});

const reply = (status, body) => ({ ok: status < 400, status, text: async () => body, arrayBuffer: async () => Buffer.from(body) });
const noSleep = async () => {};

test('waitForServer waits while the model loads, then returns the health body', async () => {
  const seq = [reply(200, '{"ok":true,"ready":false}'), reply(200, '{"ok":true,"ready":false}'), reply(200, '{"ok":true,"ready":true,"engine":"e1"}')];
  const said = [];
  const h = await waitForServer({}, { fetchFn: async () => seq.shift(), sleep: noSleep, log: (m) => said.push(m) });
  assert.equal(h.engine, 'e1');
  assert.equal(said.length, 1);
  assert.match(said[0], /still loading its model/);
});

test('waitForServer: a load error fails at once, a 404 or plain "ok" counts as ready, not-ready gives up after the wait', async () => {
  await assert.rejects(waitForServer({}, { fetchFn: async () => reply(200, '{"ready":false,"error":"OSError: disk full"}'), sleep: noSleep }), /could not load its model: OSError: disk full/);
  assert.deepEqual(await waitForServer({}, { fetchFn: async () => reply(404, 'not found'), sleep: noSleep }), {});
  assert.deepEqual(await waitForServer({}, { fetchFn: async () => reply(200, 'ok'), sleep: noSleep }), {});
  await assert.rejects(waitForServer({}, { fetchFn: async () => reply(200, '{"ready":false}'), sleep: noSleep, waitSecs: 0, log: () => {} }), /still loading its model after 0 s/);
});

test('waitForServer retries a refused connection, then reports the real network error', async () => {
  const refused = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
  let n = 0;
  const h = await waitForServer({}, { fetchFn: async () => { if (n++ < 2) throw refused; return reply(200, '{"ready":true}'); }, sleep: noSleep });
  assert.equal(h.ready, true);
  await assert.rejects(waitForServer({ VOICE_URL: 'http://voice:8080' }, { fetchFn: async () => { throw refused; }, sleep: noSleep, upSecs: 0 }), /unreachable at http:\/\/voice:8080\/health: ECONNREFUSED/);
});

test('httpTransport: a timeout says so, and an error response carries the server\'s detail text', async () => {
  const timeout = Object.assign(new Error('aborted'), { name: 'TimeoutError' });
  await assert.rejects(httpTransport({ VOICE_NAME: 'x' }, { fetchFn: async () => { throw timeout; } })('hi'), /did not answer within 600 s/);
  const clone = httpTransport({ VOICE_NAME: 'x' }, { fetchFn: async () => reply(400, '{"detail":"this lane is clone-only: send a reference clip"}') });
  await assert.rejects(clone('hi'), /status 400, \d+ bytes\): this lane is clone-only/);
  await assert.rejects(httpTransport({ VOICE_NAME: 'x' }, { fetchFn: async () => reply(501, 'This CPU fallback (Kokoro) cannot clone') })('hi'), /501.*cannot clone/);
});

test('the engine is part of the cache key: another lane or weights pin re-synthesizes; VOICE_ENGINE_TAG overrides what /health says', async () => {
  const dir = fixture();
  const a = await runTts(dir, {}, { transport: sine, cfg, engine: 'chatterbox-cpu chatterbox-tts==0.1.7 weights@aaa' });
  const b = await runTts(dir, {}, { transport: sine, cfg, engine: 'omnivoice-cpu omnivoice==0.1.5 k2-fsa/OmniVoice' });
  assert.notEqual(a[0].key, b[0].key);
  assert.deepEqual(b.map((x) => x.status), ['synthesized', 'synthesized']);
  const c = await runTts(dir, {}, { transport: sine, cfg, engine: 'chatterbox-cpu chatterbox-tts==0.1.7 weights@bbb' });
  assert.deepEqual(c.map((x) => x.status), ['synthesized', 'synthesized']);
  const d = await runTts(dir, {}, { transport: sine, cfg: { ...cfg, VOICE_ENGINE_TAG: 'mine' }, engine: 'ignored' });
  const e = await runTts(dir, {}, { transport: sine, cfg: { ...cfg, VOICE_ENGINE_TAG: 'mine' }, engine: 'other' });
  assert.equal(d[0].key, e[0].key);
  assert.deepEqual(e.map((x) => x.status), ['cached', 'cached']);
});

test('a fixed VOICE_SEED warns that retakes repeat; unset or empty does not', () => {
  assert.match(seedWarning({ VOICE_SEED: '7' }), /VOICE_SEED=7 .*every retake comes out the same/);
  assert.equal(seedWarning({ VOICE_SEED: '' }), null);
  assert.equal(seedWarning({}), null);
});

test('fixture lane on a new episode: an estimated timeline from the script, kept by align, rebuilt when the script changes', async () => {
  const dir = fixture();
  const fx = { VOICE_TRANSPORT: 'fixture' };
  const m = await runTts(dir, {}, { cfg: fx });
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  assert.equal(tl.estimated, true);
  assert.deepEqual(tl.scenes.map((s) => [s.id, s.words.length]), [['01-one', 3], ['02-two', 3]]);
  assert.deepEqual(m.map((x) => +x.seconds.toFixed(2)), tl.scenes.map((s) => s.duration));
  assert.ok(fs.existsSync(path.join(dir, 'subs', 'episode.vtt')));
  const written = fs.readFileSync(path.join(dir, 'timeline.json'));
  await align(dir, [], fx);
  assert.deepEqual(fs.readFileSync(path.join(dir, 'timeline.json')), written);
  fs.appendFileSync(path.join(dir, 'script.md'), '\n## Three\n\nA third scene with more words in it.\n');
  await runTts(dir, {}, { cfg: fx });
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')).scenes.length, 3);
});
