import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreTake } from './besttake.js';

test('a clean take scores zero and a worse take scores higher', () => {
  assert.equal(scoreTake([]), 0);
  const mild = [{ kind: 'stall inside a phrase', gap: 0.4 }];
  const bad = [{ kind: 'stall inside a phrase', gap: 0.5 }, { kind: 'stall inside a phrase', gap: 0.45 }, { kind: 'choppy delivery: 2 breaks within 3s', gap: 0.3 }];
  assert.ok(scoreTake(mild) > 0 && scoreTake(bad) > scoreTake(mild));
});
