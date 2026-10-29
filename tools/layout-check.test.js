import test from 'node:test';
import assert from 'node:assert/strict';
import { frameIssues, croppedIssues } from './layout-check.js';

const T = (text, l, r, t, b, fs = 48) => ({ text, l, r, t, b, fs, op: 1 });

test('clean frame has no issues', () => {
  assert.deepEqual(frameIssues([T('hello', 200, 500, 200, 260), T('world', 200, 500, 400, 460)]), []);
});
test('flags text that is too small for a phone', () => {
  const i = frameIssues([T('tiny', 200, 300, 200, 230, 24)]);
  assert.equal(i.length, 1);
  assert.equal(i[0].kind, 'small');
});
test('flags text outside the safe frame and in the subtitle strip', () => {
  assert.equal(frameIssues([T('edge', 40, 300, 200, 260)])[0].kind, 'margin');
  assert.equal(frameIssues([T('low', 200, 500, 900, 990)])[0].kind, 'margin');
  assert.equal(frameIssues([T('right', 1700, 1900, 200, 260)])[0].kind, 'margin');
});
test('flags overlapping text, but not text that only touches', () => {
  const o = frameIssues([T('the house', 300, 600, 300, 360), T('wrong', 500, 700, 320, 380)]);
  assert.equal(o.length, 1);
  assert.equal(o[0].kind, 'overlap');
  assert.deepEqual(frameIssues([T('a', 300, 600, 300, 360), T('b', 300, 600, 361, 420)]), []);
});

test('a shape cut by the frame edge is flagged once per frame; shapes fully inside or fully outside are not', () => {
  assert.equal(croppedIssues([]).length, 0);
  const i = croppedIssues([{ l: 700, r: 1300, t: -80, b: 120, op: 1 }, { l: 200, r: 300, t: -90, b: 60, op: 0.5 }]);
  assert.equal(i.length, 1);
  assert.equal(i[0].kind, 'cropped');
});
