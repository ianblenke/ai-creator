import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScript, validateScript, estimateSeconds } from './script.js';

const md = `# Title

Preamble ignored.

## One

Hello {{spoken: thirty ninety | 3090}} world.

> VISUAL: a box

## Two

Second scene text.
`;

test('parses scenes from headings in order', () => {
  const s = parseScript(md);
  assert.equal(s.title, 'Title');
  assert.deepEqual(s.scenes.map((x) => x.id), ['01-one', '02-two']);
});

test('visual notes are excluded from narration', () => {
  const [a] = parseScript(md).scenes;
  assert.deepEqual(a.notes, ['a box']);
  assert.ok(!a.spokenText.includes('box'));
});

test('spoken-form overrides split spoken and display text', () => {
  const [a] = parseScript(md).scenes;
  assert.equal(a.spokenText, 'Hello thirty ninety world.');
  assert.equal(a.displayText, 'Hello 3090 world.');
});

test('validation fails on empty scenes and duplicate titles', () => {
  const bad = parseScript('# T\n\n## A\n\n## A\n\ntext\n');
  const v = validateScript(bad);
  assert.ok(v.errors.some((e) => /no narration/.test(e)));
  assert.ok(v.errors.some((e) => /duplicate/.test(e)));
});

test('duration warning when outside target range', () => {
  const v = validateScript(parseScript(md));
  assert.ok(v.warnings[0].includes('under'));
  assert.ok(estimateSeconds(parseScript(md)) > 0);
});

import { tokenizeNarration, spokenWords } from './script.js';

test('tokenizer maps spoken words onto display tokens', () => {
  const raw = 'A {{spoken: thirty ninety|3090}}, card.';
  const t = tokenizeNarration(raw);
  assert.deepEqual(t.map((x) => x.display), ['A', '3090,', 'card.']);
  assert.deepEqual(t.map((x) => x.spoken), [1, 2, 1]);
  const spoken = parseScript(`# T\n\n## S\n\n${raw}\n`).scenes[0].spokenText;
  assert.equal(spokenWords(spoken).length, t.reduce((n, x) => n + x.spoken, 0));
});

test('a {{pause: N}} paragraph splits the scene into segments and never appears in the narration text', () => {
  const s = parseScript('# T\n\n## One\n\nFirst part.\n\n{{pause: 0.9}}\n\nSecond part.\n');
  const sc = s.scenes[0];
  assert.deepEqual(sc.segments, [{ text: 'First part.', pauseAfter: 0.9 }, { text: 'Second part.', pauseAfter: 0 }]);
  assert.ok(!/pause/.test(sc.spokenText) && !/pause/.test(sc.displayText) && !/pause/.test(sc.rawText));
  assert.equal(sc.spokenText.replace(/\s+/g, ' '), 'First part. Second part.');
});

test('VOICE_WPM sets the speaking rate of the length estimate', () => {
  const s = parseScript(md);
  const old = process.env.VOICE_WPM;
  try {
    process.env.VOICE_WPM = '80';
    const slow = estimateSeconds(s);
    process.env.VOICE_WPM = '160';
    assert.ok(Math.abs(slow - 2 * estimateSeconds(s) + 2 * 0.6) < 1e-9); // twice the speech time, the same per-scene pads
    process.env.VOICE_WPM = 'fast';
    assert.equal(estimateSeconds(s), estimateSeconds(s, { wpm: 160 })); // not a number: the default
  } finally { if (old === undefined) delete process.env.VOICE_WPM; else process.env.VOICE_WPM = old; }
});
