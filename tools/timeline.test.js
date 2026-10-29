import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScript } from './script.js';
import { buildTimeline, validateTimeline, resolveAnchor, toVtt, toSrt, cues, wrap } from './timeline.js';

const script = parseScript('# T\n\n## A\n\nOn a {{spoken: thirty ninety|3090}} card.\n\n## B\n\nA single GPU works.\n');
const w = (n, d = 0.3) => Array.from({ length: n }, (_, i) => ({ word: 'x', start: i * d, end: i * d + d - 0.02 }));
const aligned = { '01-a': w(5), '02-b': w(4) };
const tl = buildTimeline(script, aligned, { '01-a': 1.6, '02-b': 1.3 });

test('timeline lists scenes with starts, durations and display words', () => {
  assert.equal(tl.scenes.length, 2);
  assert.deepEqual(tl.scenes[0].words.map((x) => x.text), ['On', 'a', '3090', 'card.']);
  assert.equal(tl.scenes[1].start, 2.2);
  assert.deepEqual(validateTimeline(tl), []);
});

test('override word spans both spoken words', () => {
  const t = tl.scenes[0].words[2];
  assert.equal(t.start, 0.6);
  assert.equal(t.end, 1.18);
});

test('validation catches overlap and out-of-order words', () => {
  const bad = structuredClone(tl);
  bad.scenes[1].start = 1;
  assert.ok(validateTimeline(bad).length > 0);
});

test('subtitles show display text', () => {
  assert.ok(toVtt(tl).includes('3090'));
  assert.ok(!toSrt(tl).includes('thirty'));
  assert.ok(toSrt(tl).startsWith('1\n00:00:00,000 -->'));
});

test('anchors resolve by phrase and index; missing anchor fails', () => {
  assert.equal(resolveAnchor(tl, '02-b', 'single GPU'), 2.5);
  assert.equal(resolveAnchor(tl, '02-b', 0), 2.2);
  assert.throws(() => resolveAnchor(tl, '02-b', 'nonexistent phrase'), /not found/);
});

test('word-count mismatch from the aligner is an error', () => {
  assert.throws(() => buildTimeline(script, { '01-a': w(2), '02-b': w(4) }, { '01-a': 1, '02-b': 1 }), /expected 5/);
});

test('no one-word orphan cues; cues break at sentences and stay within the line limit', () => {
  const words = 'Somewhere a twenty seven billion parameter model starts to think. On my setup a turn that uses tools can take a minute or more.'.split(' ').map((x, i) => ({ text: x, start: i * 0.3, end: i * 0.3 + 0.25 }));
  const cs = cues({ scenes: [{ id: '01-x', start: 0, duration: 9, words }] });
  assert.ok(cs.every((c) => c.text.split(' ').length >= 3), JSON.stringify(cs.map((c) => c.text)));
  assert.ok(cs.every((c) => c.text.length <= 108));
  assert.ok(cs[0].text.endsWith('think.'));
});
test('long cues are balanced over two lines', () => {
  const w = wrap('Somewhere, a twenty-seven billion parameter model starts to think.');
  assert.equal(w.split('\n').length, 2);
  assert.ok(w.split('\n').every((l) => l.length <= 42));
});
