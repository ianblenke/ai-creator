import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

// A throwaway repo with only the hooks and the repo check, so the real clone's git config is never touched.
function scratchRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
  const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.name', 'Demo');
  git('config', 'user.email', 'demo@example.com');
  for (const f of ['tools/hooks/pre-commit', 'tools/hooks/commit-msg', 'tools/hooks/install.sh', 'tools/safety/repo-check.js']) {
    fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true });
    fs.copyFileSync(f, path.join(dir, f));
  }
  execFileSync('sh', [path.join(dir, 'tools/hooks/install.sh')], { cwd: dir });
  return { dir, git };
}

test('install.sh sets core.hooksPath; pre-commit blocks audio; commit-msg drops only Claude-Session lines', () => {
  const { dir, git } = scratchRepo();
  assert.equal(git('config', 'core.hooksPath').trim(), 'tools/hooks');
  fs.writeFileSync(path.join(dir, 'ref.mp3'), 'not really audio');
  git('add', 'ref.mp3');
  const blocked = spawnSync('git', ['-C', dir, 'commit', '-q', '-m', 'add clip'], { encoding: 'utf8' });
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /ref\.mp3/);
  git('rm', '-q', '--cached', 'ref.mp3');
  git('add', 'tools');
  git('commit', '-q', '-m', 'hooks\n\nClaude-Session: https://example.com/s/1\nCo-Authored-By: Someone');
  const msg = git('log', '-1', '--format=%B');
  assert.ok(!msg.includes('Claude-Session'));
  assert.match(msg, /Co-Authored-By: Someone/); // documented: only Claude-Session lines are removed
  fs.rmSync(dir, { recursive: true, force: true });
});

test('pre-commit without node uses the tools container, and without docker either refuses with an install message', () => {
  const { dir, git } = scratchRepo();
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-bin-'));
  for (const t of ['git', 'sh', 'grep', 'mv']) {
    const where = spawnSync('sh', ['-c', `command -v ${t}`], { encoding: 'utf8' }).stdout.trim();
    fs.symlinkSync(where, path.join(bin, t));
  }
  git('add', 'tools');
  const r = spawnSync('git', ['-C', dir, 'commit', '-q', '-m', 'x'], { encoding: 'utf8', env: { ...process.env, PATH: bin } });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /neither node nor docker compose[\s\S]*Install Node/);
  // with docker on PATH it runs the same check in the tools container, against the index git is committing from
  const log = path.join(bin, 'args.txt');
  fs.writeFileSync(path.join(bin, 'docker'), `#!/bin/sh\necho "$@" >> ${log}\n`, { mode: 0o755 });
  const ok = spawnSync('git', ['-C', dir, 'commit', '-q', '-m', 'x'], { encoding: 'utf8', env: { ...process.env, PATH: bin } });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(fs.readFileSync(log, 'utf8'), /run --rm --no-deps -T -e GIT_INDEX_FILE=\/work\/\.git\/index\S* --entrypoint node media tools\/safety\/repo-check\.js --staged/);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(bin, { recursive: true, force: true });
});
