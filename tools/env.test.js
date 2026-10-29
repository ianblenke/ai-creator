import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv } from './env.js';

test('inline comments are stripped, quotes kept as Compose does, a bare # inside a word stays', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'env-')), '.env.local');
  fs.writeFileSync(f, '# top\nVOICE_TRANSPORT=http        # http or ssh\nVOICE_NAME=   # yours\nA="two words # not a comment"  # but this is\nB=x#y\n');
  assert.deepEqual(loadEnv(f), { VOICE_TRANSPORT: 'http', VOICE_NAME: '', A: 'two words # not a comment', B: 'x#y' });
});

test('the shipped .env.example parses to clean values', () => {
  const env = loadEnv('.env.example');
  for (const [k, v] of Object.entries(env)) assert.ok(!v.includes('#'), `${k}=${v}`);
  assert.equal(env.VOICE_TRANSPORT, 'fixture');
});
