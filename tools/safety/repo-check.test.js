import test from 'node:test';
import assert from 'node:assert/strict';
import { forbiddenFiles } from './repo-check.js';

test('flags local config, denylist, voice and audio files', () => {
  const bad = forbiddenFiles(['.env.local', 'safety/denylist.txt', 'voice/me.wav', 'episodes/e1/audio/s1.wav', 'voice/README.md', 'README.md', '.env.example', 'tools/cli.js']);
  assert.deepEqual(bad, ['.env.local', 'safety/denylist.txt', 'voice/me.wav', 'episodes/e1/audio/s1.wav']);
});

test('flags the YouTube OAuth credential folder', () => {
  assert.deepEqual(forbiddenFiles(['.secrets/client_secret.json', '.secrets/token.json', 'tools/youtube.js']), ['.secrets/client_secret.json', '.secrets/token.json']);
});

test('blocks every audio and video container anywhere, and generated folders of episodes and examples', () => {
  const media = ['a.mp3', 'x/b.FLAC', 'c.m4a', 'd.ogg', 'e.opus', 'f.aac', 'docs/ref.wav', 'g.mp4', 'h.webm'];
  assert.deepEqual(forbiddenFiles(media), media);
  const generated = ['examples/ep01-kettle/audio/s1.json', 'examples/ep01-kettle/out/x.json', 'episodes/e1/frames/1.png'];
  assert.deepEqual(forbiddenFiles(generated), generated);
  assert.deepEqual(forbiddenFiles(['examples/ep01-kettle/keyframes/01-the-hook/00-t0.05.png', 'examples/ep01-kettle/timeline.json', 'docs/audio.md']), []);
});
