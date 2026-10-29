import test from 'node:test';
import assert from 'node:assert/strict';
import { lintEndings, tokenize } from './lint-endings.js';

const KNOWN = [{ phrase: 'two switches that', heard: 'two switcheses that' }, { phrase: 'lids and the steam', heard: 'lids in the steam' }]; // invented fixture slips
const rules = (t) => lintEndings(t).map((f) => f.rule);

test('flags a phrase the voice has garbled as an error', () => {
  const f = lintEndings('The kettle has two switches that can fail.', KNOWN);
  assert.ok(f.some((x) => x.severity === 'error' && x.rule === 'known-slip' && /switcheses/.test(x.note)));
});
test('flags past tense and sibilant plurals right before a consonant', () => {
  assert.ok(rules('I turned the dial.').includes('past-before-consonant'));
  assert.ok(rules('The devices that report it.').includes('sibilant-plural-before-consonant'));
  assert.ok(rules('Two lists to check.').includes('cluster-plural-before-stop'));
});
test('does not flag a pause, a vowel next, or a word that only looks like past tense', () => {
  assert.deepEqual(rules('It passed, there it was.'), []);
  assert.deepEqual(rules('It passed on the stub.'), []);
  assert.deepEqual(rules('You need the key and a hundred things.'), []);
});
test('tokenize remembers pauses', () => {
  const t = tokenize('one, two three.');
  assert.deepEqual(t.map((x) => x.pause), [true, false, true]);
});

test('a pause inside a known phrase (a comma) clears it', () => {
  assert.deepEqual(lintEndings('There is the top: lids, and the steam above.', KNOWN).filter((f) => f.severity === 'error'), []);
  assert.equal(lintEndings('There is the top: lids and the steam above.', KNOWN).filter((f) => f.severity === 'error').length, 1);
});
