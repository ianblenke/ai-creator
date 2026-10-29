import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scanEpisode } from './check-anchors.js';

test('finds a cue whose words are no longer in the narration, and passes the others', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anch-'));
  fs.mkdirSync(path.join(dir, 'scenes'));
  const words = 'the quick decisions are fast'.split(' ').map((text, i) => ({ text, start: i, end: i + 0.5 }));
  fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify({ scenes: [{ id: '01-a', start: 0, words }] }));
  fs.writeFileSync(path.join(dir, 'scenes', '01-a.js'), "export const meta = {\n  cues: [\n    { name: 'ok', at: 'are fast' },\n    { name: 'old', at: 'stuff is fast' },\n  ],\n};\n");
  const { total, problems } = scanEpisode(dir);
  assert.equal(total, 2);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /cue 'old'/);
});
