import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { videoProblems, openBrowser, parseRedirect, parseDraft, findPlaceholders, validateChapters, validateUpload, buildDescription, insertMetadata, toSeconds, disclosureProblems, SCOPES, ANALYTICS_SCOPES, authScopes } from './youtube-lib.js';

const DISCLOSED = 'Fine text.\nThe narration is a cloned copy of my own voice, generated with Chatterbox.\nVoice model: Chatterbox by Resemble AI, MIT licence (read 2026-10-29): https://github.com/resemble-ai/chatterbox';

const draft = `# Episode X: draft\n\n## Title options\n1. First title\n2. Second title\n\n## Description\n\nHello world.\n\nLinks:\n- [add your channel links here]\n\n## Chapters (paste)\n\n0:00 Hook\n0:30 Intro\n1:05 Middle\n\n## Tag ideas\na, b\n`;

test('parses titles, description and chapters from the draft', () => {
  const d = parseDraft(draft);
  assert.deepEqual(d.titles, ['First title', 'Second title']);
  assert.match(d.description, /^Hello world\./);
  assert.deepEqual(d.chapters, ['0:00 Hook', '0:30 Intro', '1:05 Middle']);
  assert.ok(!d.description.includes('Tag ideas'));
});

test('placeholders in brackets are caught, real bracketed text is not', () => {
  assert.deepEqual(findPlaceholders('see [add your channel links here] and [1] and [the sky]'), ['[add your channel links here]']);
  assert.deepEqual(findPlaceholders('plain text'), []);
});

test('chapters need 0:00 first, at least three, ascending and 10 s long', () => {
  assert.deepEqual(validateChapters(['0:00 a', '0:30 b', '1:00 c']), []);
  assert.ok(validateChapters(['0:05 a', '0:30 b', '1:00 c']).some((e) => /0:00/.test(e)));
  assert.ok(validateChapters(['0:00 a', '0:30 b']).some((e) => /at least 3/.test(e)));
  assert.ok(validateChapters(['0:00 a', '0:05 b', '1:00 c']).some((e) => /shorter than 10/.test(e)));
  assert.ok(validateChapters(['0:00 a', '1:00 b', '0:50 c']).some((e) => /not after/.test(e)));
  assert.equal(toSeconds('1:02:03'), 3723);
});

test('upload validation refuses placeholders and missing files, accepts a clean draft', () => {
  const d = parseDraft(draft);
  const bad = validateUpload({ title: 'T', description: d.description, chapters: d.chapters }, { video: '/nonexistent/v.mp4' });
  assert.ok(bad.some((p) => /placeholder/.test(p)));
  assert.ok(bad.some((p) => /missing video/.test(p)));
  const ok = validateUpload({ title: 'T', description: DISCLOSED, chapters: d.chapters }, {});
  assert.deepEqual(ok, []);
  assert.ok(validateUpload({ title: 'x'.repeat(101), description: DISCLOSED, chapters: d.chapters }, {}).some((p) => /title is 101/.test(p)));
});

test('description gets the chapter list appended; visibility can never be public', () => {
  assert.equal(buildDescription({ description: 'Hi.', chapters: ['0:00 a', '0:30 b'] }), 'Hi.\n\n0:00 a\n0:30 b\n');
  assert.equal(insertMetadata({ title: 'T', description: 'D', privacy: 'private' }).status.privacyStatus, 'private');
  assert.throws(() => insertMetadata({ title: 'T', description: 'D', privacy: 'public' }), /private or unlisted/);
});

test('a pasted redirect URL yields its code only when the state matches', () => {
  assert.equal(parseRedirect('http://127.0.0.1:8765/?state=abc&code=4%2F0AX&scope=x', 'abc'), '4/0AX');
  assert.throws(() => parseRedirect('http://127.0.0.1:8765/?state=zzz&code=1', 'abc'), /state mismatch/);
  assert.throws(() => parseRedirect('http://127.0.0.1:8765/?error=access_denied&state=abc', 'abc'), /access_denied/);
  assert.throws(() => parseRedirect('not a url', 'abc'), /not a URL/);
  assert.throws(() => parseRedirect('http://127.0.0.1:8765/?state=abc', 'abc'), /no code/);
});

test('the dry run refuses a description without the synthetic-voice line or the model credit', () => {
  const chapters = ['0:00 a', '0:30 b', '1:00 c'];
  assert.deepEqual(disclosureProblems(DISCLOSED), []);
  const none = validateUpload({ title: 'T', description: 'Fine text.', chapters }, {});
  assert.ok(none.some((p) => /synthetic-voice line/.test(p)) && none.some((p) => /model credit line/.test(p)));
  const noCredit = disclosureProblems('The narration is a cloned copy of my own voice, generated with Chatterbox.');
  assert.deepEqual(noCredit.length, 1);
  assert.match(noCredit[0], /model credit/);
  assert.ok(disclosureProblems('The narration is a cloned copy of my own voice, generated with Chatterbox.\nVoice model: Chatterbox, MIT licence').some((p) => /model credit/.test(p)), 'credit needs a link');
});

test('the synthetic-voice line accepts each honest variant and refuses a line that does not say synthetic', () => {
  const credit = '\nVoice model: Kokoro-82M by hexgrad, Apache-2.0 licence (read 2026-10-29): https://huggingface.co/hexgrad/Kokoro-82M';
  for (const line of [
    'The narration is a cloned copy of my own voice, generated with Chatterbox.',
    "The narration is a cloned copy of my colleague's voice, used with written permission, generated with Chatterbox.",
    'The narration is a synthetic preset voice (af_heart), generated with Kokoro-82M.',
    'Narration: a synthetic copy of my own voice, made with Chatterbox (Resemble AI).',
  ]) assert.deepEqual(disclosureProblems(line + credit), [], line);
  for (const line of ['The narration is my own voice.', 'Voice model: Chatterbox, generated with care.', 'The narration was generated with Chatterbox.']) {
    assert.ok(disclosureProblems(line + credit).some((p) => /synthetic-voice line/.test(p)), line);
  }
});

test('every upload declares synthetic media', () => {
  assert.equal(insertMetadata({ title: 'T', description: 'D', privacy: 'unlisted' }).status.containsSyntheticMedia, true);
});

test('the shipped example description has a synthetic-voice line and leaves the voice model credit to fill in', () => {
  const d = parseDraft(fs.readFileSync('examples/ep01-kettle/youtube-description.md', 'utf8'));
  assert.ok(d.titles.length >= 1);
  const problems = validateUpload({ title: d.titles[0], description: buildDescription(d), chapters: d.chapters }, {});
  assert.equal(problems.length, 2, problems.join('\n'));
  assert.match(problems[0], /placeholder still present: \[fill in: the voice model/);
  assert.match(problems[1], /model credit line/);
});

test('a missing browser opener (an async spawn error) prints the link instead of crashing; macOS uses open', () => {
  const said = [];
  const used = [];
  const fakeSpawn = (cmd) => { used.push(cmd); const p = new EventEmitter(); p.unref = () => {}; setImmediate(() => p.emit('error', new Error('spawn ENOENT'))); return p; };
  openBrowser('https://accounts.example/x', fakeSpawn, 'linux', (m) => said.push(m));
  openBrowser('https://accounts.example/x', fakeSpawn, 'darwin', () => {});
  assert.deepEqual(used, ['xdg-open', 'open']);
  return new Promise((r) => setImmediate(r)).then(() => assert.match(said[0], /open this link yourself:\nhttps:\/\/accounts.example\/x/));
});

test('the dry run refuses a video file that is too small or not an MP4, and checks a real one with ffprobe', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-'));
  const f = (name, buf) => { const p = path.join(dir, name); fs.writeFileSync(p, buf); return p; };
  const tiny = f('tiny.mp4', Buffer.alloc(2000, 7));
  assert.ok(validateUpload({ title: 'T', description: DISCLOSED, chapters: ['0:00 a', '0:30 b', '1:00 c'] }, { video: tiny }).some((p) => /only 2000 bytes/.test(p)));
  assert.match(videoProblems(f('noise.mp4', Buffer.alloc(200 * 1024, 7)))[0], /no ftyp box/);
  const fake = Buffer.alloc(200 * 1024); fake.write('ftypisom', 4, 'latin1');
  assert.deepEqual(videoProblems(f('fake.mp4', fake), { probe: () => null }), []); // no ffprobe: the box check is all there is
  assert.match(videoProblems(f('fake2.mp4', fake), { probe: () => ({ video: false, duration: 0 }) })[0], /no video stream/);
  const real = path.join(dir, 'real.mp4');
  if (spawnSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=2:r=10', '-pix_fmt', 'yuv420p', real]).status === 0) {
    assert.deepEqual(videoProblems(real, { minBytes: 0 }), []);
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the upload sign-in is unchanged; --analytics only adds the two read-only scopes', () => {
  assert.deepEqual(authScopes(), ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl']);
  assert.deepEqual(authScopes(true), [...SCOPES, 'https://www.googleapis.com/auth/yt-analytics.readonly', 'https://www.googleapis.com/auth/youtube.readonly']);
  assert.ok(ANALYTICS_SCOPES.every((s) => s.endsWith('.readonly')));
});
