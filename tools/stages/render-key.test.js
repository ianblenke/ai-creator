import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { clipKey, relativeImports, determinismFailure } from './render.js';

test('editing a shared module a scene imports changes that scene\'s clip key', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'key-'));
  const src = "import { kettle } from './_kettle.js';\nexport function render() {}";
  fs.writeFileSync(path.join(dir, '_kettle.js'), 'export const kettle = 1;');
  const tl = { duration: 3, words: [{ text: 'a' }] };
  const a = clipKey(src, tl, { fps: 30, draft: true }, null, dir);
  fs.writeFileSync(path.join(dir, '_kettle.js'), 'export const kettle = 2;');
  assert.notEqual(a, clipKey(src, tl, { fps: 30, draft: true }, null, dir));
});

test('nested and missing imports are handled', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'key-'));
  fs.writeFileSync(path.join(dir, 'a.js'), "import { b } from './b.js'; export const a = 1;");
  fs.writeFileSync(path.join(dir, 'b.js'), 'export const b = 2;');
  const s = relativeImports("import x from './a.js'; import y from './nope.js';", dir);
  assert.ok(s.includes('export const b'));
});

test('a determinism failure names the frames and the remedy with its thresholds', () => {
  const msg = determinismFailure(['03-x@1.1 (58.6 dB)'], 'examples/ep01-kettle', 60);
  for (const want of ['03-x@1.1 (58.6 dB)', 'docker compose run --rm --entrypoint node media tools/debug-determinism.js', '-e MEDIA_DETERMINISM_DB=44', 'above 60 dB', '36 dB', 'debug-determinism.js examples/ep01-kettle']) assert.ok(msg.includes(want), want);
});
