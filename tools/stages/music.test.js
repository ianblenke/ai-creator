import test from 'node:test';
import assert from 'node:assert/strict';
import { loopCount } from './music.js';

test('a track longer than the target needs one copy', () => assert.equal(loopCount(100, 120), 1));
test('loops cover the target with crossfade overlap', () => {
  const n = loopCount(461, 160, 4);
  assert.ok(160 + (n - 1) * (160 - 4) >= 461);
  assert.ok(160 + (n - 2) * (160 - 4) < 461);
});
test('refuses tracks too short to crossfade', () => assert.throws(() => loopCount(100, 5, 4)));
