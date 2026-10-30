import test from 'node:test';
import assert from 'node:assert/strict';
import { shq, remoteConfig, buildRemoteCommand, pullPaths, EXCLUDES } from './remote.js';

test('shell quoting survives spaces and quotes', () => {
  assert.equal(shq("it's here"), `'it'\\''s here'`);
  assert.equal(shq('a b'), "'a b'");
});
test('remote config only when RENDER_HOST is set and not a remote child or forced local', () => {
  assert.equal(remoteConfig({}), null);
  assert.equal(remoteConfig({ RENDER_HOST: 'h', MEDIA_REMOTE_CHILD: '1' }), null);
  assert.equal(remoteConfig({ RENDER_HOST: 'h', MEDIA_LOCAL: '1' }), null);
  assert.equal(remoteConfig({ RENDER_HOST: 'h' }).host, 'h');
});
test('remote command marks the child so it never re-delegates', () => {
  const c = buildRemoteCommand('keyframes', 'episodes/e1', ['03'], remoteConfig({ RENDER_HOST: 'h' }));
  assert.match(c, /MEDIA_REMOTE_CHILD=1 'node' 'tools\/cli.js' 'keyframes' 'episodes\/e1' '03'/);
  assert.match(c, /^export PATH=/);
});
test('pull keyframes for keyframes, out for render and encode', () => {
  assert.deepEqual(pullPaths('keyframes'), ['keyframes/']);
  assert.deepEqual(pullPaths('render'), ['out/']);
  assert.deepEqual(pullPaths('align'), ['timeline.json', 'subs/', 'audio/narration.wav']);
});
test('sync excludes generated folders for both episodes/ and examples/', () => {
  for (const d of ['episodes', 'examples']) for (const sub of ['keyframes', 'out']) assert.ok(EXCLUDES.includes(`--exclude=${d}/*/${sub}`));
  assert.ok(EXCLUDES.includes('--exclude=/seo-reports'), 'SEO reports stay on this machine');
});
