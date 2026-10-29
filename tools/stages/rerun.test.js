// A rerun with identical inputs must leave committed example files unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import scenes from './scenes.js';
import { nextRound } from './keyframes.js';

const EX = 'examples/ep01-kettle';

test('scenes writes exactly the example\'s committed briefs and _inputs.json', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scenes-'));
  fs.mkdirSync(path.join(tmp, 'scenes/_brief'), { recursive: true });
  for (const f of ['script.md', 'timeline.json', 'scenes/_brief/_bible.md']) fs.copyFileSync(path.join(EX, f), path.join(tmp, f));
  const log = console.log; console.log = () => {};
  try { await scenes(tmp); } finally { console.log = log; }
  for (const f of fs.readdirSync(path.join(EX, 'scenes/_brief')).map((n) => `scenes/_brief/${n}`).concat('scenes/_inputs.json')) {
    assert.equal(fs.readFileSync(path.join(tmp, f), 'utf8'), fs.readFileSync(path.join(EX, f), 'utf8'), f);
  }
  fs.rmSync(tmp, { recursive: true });
});

test('a keyframes rerun on unchanged scene code is not a new round', () => {
  const r1 = nextRound(null, 'aaa');
  assert.deepEqual(r1, { rounds: 1, scene: 'aaa' });
  assert.equal(nextRound(r1, 'aaa'), r1);
  assert.deepEqual(nextRound(r1, 'bbb'), { rounds: 2, scene: 'bbb' });
  assert.deepEqual(nextRound({ rounds: 3 }, 'ccc'), { rounds: 4, scene: 'ccc' });
});

test('every committed rounds.json records the scene code it counted', () => {
  for (const d of fs.readdirSync(path.join(EX, 'keyframes'))) {
    const r = JSON.parse(fs.readFileSync(path.join(EX, 'keyframes', d, 'rounds.json'), 'utf8'));
    assert.match(r.scene ?? '', /^[0-9a-f]{16}$/, `${d}/rounds.json has no scene hash: a keyframes run would bump it`);
  }
});
