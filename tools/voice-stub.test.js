import test from 'node:test';
import assert from 'node:assert/strict';
import { stubServer } from './voice-stub.js';
import { httpTransport } from './stages/tts.js';

test('http transport gets a WAV from the stub server', async () => {
  const s = stubServer();
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  try {
    const wav = await httpTransport({ VOICE_URL: `http://127.0.0.1:${s.address().port}`, VOICE_NAME: 'x' })('hello there my friend');
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  } finally { s.close(); }
});

test('http transport reports an unreachable server', async () => {
  await assert.rejects(httpTransport({ VOICE_URL: 'http://127.0.0.1:1', VOICE_NAME: 'x' })('hi'), /unreachable/);
});
