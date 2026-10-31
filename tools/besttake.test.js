import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scoreTake, main } from './besttake.js';

test('a clean take scores zero and a worse take scores higher', () => {
  assert.equal(scoreTake([]), 0);
  const mild = [{ kind: 'stall inside a phrase', gap: 0.4 }];
  const bad = [{ kind: 'stall inside a phrase', gap: 0.5 }, { kind: 'stall inside a phrase', gap: 0.45 }, { kind: 'choppy delivery: 2 breaks within 3s', gap: 0.3 }];
  assert.ok(scoreTake(mild) > 0 && scoreTake(bad) > scoreTake(mild));
});

test('--keep-takes refuses to overwrite an existing takes folder, before any synthesis', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'besttake-'));
  fs.mkdirSync(path.join(dir, 'audio', 'takes'), { recursive: true });
  assert.throws(() => main([dir, '1', '--keep-takes']), /already exists/);
});
