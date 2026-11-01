import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('usage prints the pipeline order; listening checks refuse fixture audio', () => {
  const usage = spawnSync('node', ['tools/cli.js'], { encoding: 'utf8' });
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /pipeline order: validate, lint-endings, safety, tts, align, besttake \(scenes align flagged\), tighten, align, desniff, align, asr, takedefects, fixaudio \(only if something is flagged\), voicereview, scenes/);
  // every name in the usage line is a stage file or a built-in command (none is "not implemented yet")
  const names = usage.stderr.match(/usage: media <([^>]+)>/)[1].split('|');
  const src = fs.readFileSync('tools/cli.js', 'utf8');
  for (const n of names) assert.ok(fs.existsSync(`tools/stages/${n}.js`) || new RegExp(`^  (?:async )?'?${n}'?\\(`, 'm').test(src), n);
  const asr = spawnSync('node', ['tools/cli.js', 'asr', 'examples/ep01-kettle'], { encoding: 'utf8', env: { ...process.env, VOICE_TRANSPORT: 'fixture' } });
  assert.equal(asr.status, 1);
  assert.match(asr.stderr, /fixture audio is silence/);
});
