import test from 'node:test';
import assert from 'node:assert/strict';
import { snapToFrame } from './verifyclips.js';

test('sample times snap to whole frames, so a step like 0.37 s cannot straddle two frames', () => {
  assert.equal(snapToFrame(9.82, 60), 589 / 60); // frame 589.2 -> 589
  assert.ok(Math.abs(snapToFrame(0.57, 60) * 60 - Math.round(snapToFrame(0.57, 60) * 60)) < 1e-9);
  assert.equal(snapToFrame(1, 30), 1);
});
