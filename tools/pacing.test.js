import test from 'node:test';
import assert from 'node:assert/strict';
import { pacingGaps } from './pacing.js';

test('reports gaps longer than 4 s', () => {
  assert.deepEqual(pacingGaps([2, 3], 10), [{ from: 3, to: 10 }]);
});
test('dense cues pass', () => assert.deepEqual(pacingGaps([3, 6, 9], 12), []));
