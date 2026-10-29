import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { scaffold, FILES } from './new.js';
import { loadScript, validateScript } from '../script.js';
import { scanEpisode } from '../safety/scan.js';
import { parseDraft, disclosureProblems, findPlaceholders } from '../youtube-lib.js';

test('new scaffolds a generic episode that validates, scans clean and keeps the voice disclosure', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-'));
  const dir = scaffold('episodes/ep02-topic', { root });
  assert.equal(dir, path.join(root, 'episodes', 'ep02-topic'));
  for (const f of Object.keys(FILES)) assert.ok(fs.existsSync(path.join(dir, f)), f);
  const all = fs.readdirSync(dir, { recursive: true });
  assert.ok(!all.some((f) => /kettle|timeline|keyframes|\.js$|\.png$/.test(f)), all.join(', '));
  for (const f of ['scenes/_brief/_bible.md', 'thumbnail/thumb.html']) assert.ok(!fs.readFileSync(path.join(dir, f), 'utf8').match(/kettle/i), f);
  assert.deepEqual(validateScript(loadScript(path.join(dir, 'script.md'))).errors, []);
  assert.deepEqual(scanEpisode(dir, { denylistFile: path.join(root, 'none.txt') }), []);
  const { description } = parseDraft(fs.readFileSync(path.join(dir, 'youtube-description.md'), 'utf8'));
  assert.deepEqual(disclosureProblems(description), []);
  assert.ok(findPlaceholders(description).length >= 3, 'unfilled parts stop the upload dry run');
});

test('cli new <id> creates episodes/<id> in the current directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-'));
  const cli = new URL('../cli.js', import.meta.url).pathname;
  const r = spawnSync('node', [cli, 'new', 'ep03-cli'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /created episodes\/ep03-cli/);
  assert.ok(fs.existsSync(path.join(root, 'episodes/ep03-cli/scenes/_brief/_bible.md')));
});

test('new refuses a bad id and an existing episode', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-'));
  assert.throws(() => scaffold('../escape', { root }), /lower-case letters/);
  assert.throws(() => scaffold('Ep 1', { root }), /lower-case letters/);
  scaffold('ep01-a', { root });
  assert.throws(() => scaffold('ep01-a', { root }), /already exists/);
});

test('the template script passes its own word-ending lint', async () => {
  const { summarize } = await import('../lint-endings.js');
  assert.deepEqual(summarize('templates'), { errors: 0, warnings: 0 });
});

test('thumbnail.js prints its usage without arguments and names the missing page', () => {
  const r = spawnSync('node', ['tools/thumbnail.js'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage: node tools\/thumbnail.js <episode-dir>/);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thumb-'));
  const m = spawnSync('node', ['tools/thumbnail.js', root], { encoding: 'utf8' });
  assert.equal(m.status, 1);
  assert.match(m.stderr, /copy templates\/thumb.html there/);
});
