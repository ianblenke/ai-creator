import test from 'node:test';
import assert from 'node:assert/strict';
import { findGaps, findChoppy, scenesToRetake } from './audio-check.js';

const w = (text, start, end) => ({ text, start, end });
const tl = (words) => ({ scenes: [{ id: '02-x', start: 10, words }] });

test('flags a stall inside a phrase', () => {
  const g = findGaps(tl([w('That', 11, 11.2), w('takes', 12.3, 12.6)]));
  assert.equal(g.length, 1);
  assert.equal(g[0].kind, 'stall inside a phrase');
  assert.deepEqual(scenesToRetake(g), ['02']);
});
test('normal word gaps and sentence pauses pass', () => {
  assert.deepEqual(findGaps(tl([w('hello', 10, 10.3), w('there.', 10.4, 10.8), w('Next', 11.8, 12), w('one,', 12.1, 12.4), w('now', 13, 13.2)])), []);
});
test('a long pause after a clause is allowed up to a point, then flagged', () => {
  assert.equal(findGaps(tl([w('so,', 10, 10.2), w('then', 11.2, 11.4)])).length, 0);
  assert.equal(findGaps(tl([w('so,', 10, 10.2), w('then', 11.8, 12)])).length, 1);
});
test('several small breaks in a row are flagged as choppy even when each is under the stall limit', () => {
  const words = [w('so', 10, 10.2), w('treat', 10.5, 10.7), w('the', 10.75, 10.85), w('numbers', 11.15, 11.5), w('as', 11.55, 11.6), w('snapshot.', 11.65, 12.2)];
  const g = findGaps(tl(words));
  assert.equal(g.length, 1);
  assert.match(g[0].kind, /^choppy delivery/);
  assert.deepEqual(scenesToRetake(g), ['02']);
});
test('isolated small breaks, or breaks after punctuation, are not choppy', () => {
  // two 0.5 s breaks, but 6 s of tight speech between them
  const tight = Array.from({ length: 12 }, (_, i) => w('w' + i, 10.5 + i * 0.5, 10.9 + i * 0.5));
  assert.deepEqual(findChoppy(tl([w('so', 10, 10.2), ...tight, w('end', 17.2, 17.5)])), []);
  assert.deepEqual(findChoppy(tl([w('so,', 10, 10.2), w('treat', 10.7, 10.9), w('the', 11.4, 11.5)])), []);
});
test('a 0.38 s hole inside a phrase is a stall (heard as a comma-length pause)', () => {
  const g = findGaps(tl([w('the', 10, 10.1), w('model', 10.15, 10.5), w('writes', 10.88, 11.2)]));
  assert.equal(g.length, 1);
  assert.equal(g[0].kind, 'stall inside a phrase');
});
test('ordinary tight speech passes at the stricter limit', () => {
  assert.deepEqual(findGaps(tl([w('the', 10, 10.1), w('model', 10.15, 10.5), w('writes', 10.6, 10.9)])), []);
});

test('a word squeezed into the next one is flagged as fused ("a request" heard as "a re-request")', () => {
  const g = findGaps(tl([w('reads,', 10, 10.4), w('a', 11.1, 11.1), w('request', 11.1, 11.5), w('it', 11.6, 11.7)]));
  assert.equal(g.length, 1);
  assert.equal(g[0].kind, 'fused word');
  assert.equal(g[0].after, 'a');
  assert.deepEqual(findGaps(tl([w('reads,', 10, 10.4), w('a', 11, 11.09), w('request', 11.09, 11.5)])), []);
});
