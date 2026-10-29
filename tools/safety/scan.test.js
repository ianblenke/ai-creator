import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { scanText, scanRenderedText, assertClean, mask, formatFindings, denylistStatus, loadDenylist, scanEpisode, scanTrackedNames, warnDenylist } from './scan.js';

const cats = (t, o) => scanText(t, o).map((f) => f.category);

test('detects internal hostnames', () => {
  assert.deepEqual(cats('connect to box.local now'), ['hostname']);
  assert.deepEqual(cats('the nas.home.arpa host'), ['hostname']);
  assert.ok(cats('curl localhost').includes('hostname'));
});

test('detects IPv4 but not versions or times', () => {
  assert.deepEqual(cats('at 192.168.1.20 today'), ['ipv4']);
  assert.deepEqual(cats('version 1.2.3 released'), []);
  assert.deepEqual(cats('meet at 12:30:45'), []);
  assert.deepEqual(cats('999.1.1.1 is not an address'), []);
});

test('detects IPv6', () => {
  assert.ok(cats('fe80::48ba:dbff:fead:d00d').includes('ipv6'));
  assert.ok(cats('2001:db8::1').includes('ipv6'));
  assert.deepEqual(cats('std::vector is C++'), []);
});

test('detects ports', () => {
  assert.ok(cats('serve on host:8000').includes('port'));
  assert.ok(cats('10.0.0.5:5000').includes('port'));
  assert.ok(cats('listening on port 8081').includes('port'));
  assert.deepEqual(cats('see https://huggingface.co/example-org/example-model'), []);
});

test('detects filesystem paths', () => {
  assert.ok(cats('stored in /home/someone/docker/app').includes('path'));
  assert.ok(cats('open ~/notes/file.txt').includes('path'));
  assert.ok(cats('C:\\Users\\someone\\x').includes('path'));
  assert.deepEqual(cats('a yes/no question and 24/7'), []);
});

test('detects MAC addresses and secrets', () => {
  assert.deepEqual(cats('mac aa:bb:cc:dd:ee:ff here'), ['mac']);
  assert.ok(cats('key sk-abcdefghijklmnopqrstuvwxyz123456').includes('secret'));
  assert.ok(cats('password = hunter2hunter2').includes('secret'));
  assert.ok(cats('-----BEGIN OPENSSH PRIVATE KEY-----').includes('secret'));
});

test('denylist matches whole words case-insensitively', () => {
  const denylist = ['Kitchen Hub', 'Alice'];
  assert.deepEqual(cats('the kitchen hub light', { denylist }), ['denylist']);
  assert.deepEqual(cats('Alice woke up', { denylist }), ['denylist']);
  assert.deepEqual(cats('Malice aforethought', { denylist }), []);
});

test('reports never echo the full value', () => {
  const [f] = scanText('host example-box.local here');
  assert.ok(!JSON.stringify(f).includes('example-box.local'));
  assert.equal(mask('abcdef'), 'ab…(6 chars)');
});

test('rendered text uses the same rules', () => {
  const f = scanRenderedText(['GPU box', 'ip 10.1.2.3'], { label: 'scene-04' });
  assert.equal(f[0].category, 'ipv4');
  assert.equal(f[0].file, 'scene-04');
});

test('assertClean throws with findings and passes when clean', () => {
  assert.throws(() => assertClean(scanText('10.1.2.3'), 'render'), /blocked "render"/);
  assert.doesNotThrow(() => assertClean(scanText('perfectly clean prose'), 'render'));
});

test('JS identifiers like n.home are not hostnames, but .local still is', () => {
  assert.deepEqual(cats('set(n.home, { opacity: 1 });', { file: 'scene.js' }), []);
  assert.ok(cats('const h = "box.local";', { file: 'scene.js' }).includes('hostname'));
  assert.ok(cats('the nas.home box', { file: 'script.md' }).includes('hostname'));
});

test('the settings file name .env.local is not a machine name, but env.local alone still is', () => {
  assert.deepEqual(cats('copy .env.example to .env.local first', { file: 'README.md' }), []);
  assert.ok(cats('ssh env.local', { file: 'README.md' }).includes('hostname'));
  assert.ok(cats('the box.env.local host', { file: 'README.md' }).includes('hostname'));
});

test('CSS properties in style files are not host:port, but an IP:port still is', () => {
  assert.deepEqual(cats('.a{font-weight:700;width:1280px}', { file: 'x.html' }), []);
  assert.ok(cats('url(http://10.0.0.5:8080/x)', { file: 'x.html' }).includes('port'));
  assert.ok(cats('serve on host:8000', { file: 'x.md' }).includes('port'));
});

test('each finding names its rule and carries a hint', () => {
  const [f] = scanText('const token = "abcdefghijkl";', { file: 'scene.js' });
  assert.equal(f.rule, 'secret-assignment');
  assert.match(f.hint, /rename the variable/);
  assert.match(formatFindings([f]), /\[secret\/secret-assignment\] .*\n    hint: /);
  assert.equal(scanText('Alice', { denylist: ['Alice'] })[0].rule, 'denylist');
});

test('denylist status: missing, empty, still the example, or ok', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deny-'));
  const file = path.join(dir, 'denylist.txt');
  fs.copyFileSync('safety/denylist.example.txt', path.join(dir, 'denylist.example.txt'));
  assert.equal(denylistStatus(file), 'missing');
  fs.writeFileSync(file, '# only a comment\n\n');
  assert.equal(denylistStatus(file), 'empty');
  fs.copyFileSync('safety/denylist.example.txt', file);
  assert.equal(denylistStatus(file), 'example');
  fs.appendFileSync(file, 'my-real-box\n');
  assert.equal(denylistStatus(file), 'ok');
  fs.rmSync(dir, { recursive: true });
});

test('loadDenylist warns loudly once when the list is missing', (t) => {
  const lines = [];
  t.mock.method(console, 'error', (m) => lines.push(m));
  const file = path.join(os.tmpdir(), `no-such-denylist-${process.pid}.txt`);
  assert.deepEqual(loadDenylist(file), []);
  loadDenylist(file);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /WARNING: .* is MISSING[\s\S]*NOT your own private names/);
});

test('the example denylist does not trip on the shipped example episode', () => {
  const findings = scanEpisode('examples/ep01-kettle', { denylistFile: 'safety/denylist.example.txt' }).filter((f) => f.category === 'denylist');
  assert.deepEqual(findings, []);
});

const LOCAL_LIST = 'safety/denylist.txt';
test('your local denylist is filled in (not missing, empty or the example)', { skip: !fs.existsSync(LOCAL_LIST) && 'no safety/denylist.txt here (CI has none; the gate banner covers it)' }, () => {
  assert.equal(denylistStatus(LOCAL_LIST), 'ok');
});

test('the tracked-files name scan finds a listed name in text, skips binary files and the denylist itself', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'names-'));
  const git = (...a) => spawnSync('git', a, { cwd: dir });
  git('init', '-q');
  fs.mkdirSync(path.join(dir, 'safety'));
  fs.writeFileSync(path.join(dir, 'safety/denylist.example.txt'), 'Nightjar\n');
  fs.writeFileSync(path.join(dir, 'notes.md'), 'the nightjars flew\nthe nightjar box\n');
  fs.writeFileSync(path.join(dir, 'img.png'), Buffer.from([0x89, 0, 0x4e, 0x69, 0x67, 0x68, 0x74, 0x6a, 0x61, 0x72]));
  git('add', '-A');
  assert.deepEqual(scanTrackedNames(['Nightjar'], { cwd: dir }).map((f) => [f.file, f.line]), [['notes.md', 2]]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('no name from the example denylist appears in a tracked file (what CI checks without a DENYLIST secret)', () => {
  const r = spawnSync('node', ['tools/safety/scan.js', '--names', 'safety/denylist.example.txt'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('the banner says how to fix each state: copy when missing, edit when it is still the example', (t) => {
  const said = [];
  t.mock.method(console, 'error', (m) => said.push(m));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'banner-'));
  warnDenylist(path.join(dir, 'a.txt'), 'missing');
  warnDenylist(path.join(dir, 'b.txt'), 'example');
  assert.match(said[0], /Fix: cp safety\/denylist.example.txt/);
  assert.doesNotMatch(said[1], /cp safety/);
  assert.match(said[1], /EXAMPLE list[\s\S]*Fix: edit it and replace the invented names/);
});
