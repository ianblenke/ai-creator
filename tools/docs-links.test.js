// Docs must not point at files that do not exist: every relative Markdown link and every backticked repo path in a tracked .md file.
// A path that git ignores (your .env.local, voice/CONSENT.md, an episode's out/) is a file you create, so it is not required to exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// backticked tokens are checked only when they start with one of these folders (not episodes/: those are names you choose; not `audio/raw/`: episode-relative)
const ROOTS = new Set(['docs', 'tools', 'examples', 'docker', 'voice', 'safety', 'project', 'prompts', 'templates', 'openspec', '.github', 'vendor']);

/** Candidate paths in one Markdown text: [{ref, from}] where from is 'link' (relative to the file) or 'code' (relative to the repo). */
export function references(md) {
  const out = [];
  for (const m of md.matchAll(/\]\(([^)\s]+)\)/g)) {
    const ref = m[1].split('#')[0];
    if (ref && !/^[a-z][a-z0-9+.-]*:/i.test(ref)) out.push({ ref, from: 'link' });
  }
  for (const m of md.matchAll(/`([^`\n]+)`/g)) {
    for (let tok of m[1].split(/\s+/)) {
      tok = tok.replace(/^['"(]+|['"),.;:]+$/g, '');
      if (!tok.includes('/') || /[<>*{}$|?\[\]=]|:\/\/|\.\.\./.test(tok) || !ROOTS.has(tok.split('/')[0])) continue;
      out.push({ ref: tok.replace(/:\d+(-\d+)?$/, ''), from: 'code' });
    }
  }
  return out;
}

test('references: picks relative links and backticked repo paths, skips URLs, placeholders and episode-relative paths', () => {
  const md = 'See [a](docs/x.md#top), [web](https://example.com), `node tools/cli.js render`, `episodes/my-ep`, `audio/raw/`, `tools/a.js:12`.';
  assert.deepEqual(references(md), [
    { ref: 'docs/x.md', from: 'link' },
    { ref: 'tools/cli.js', from: 'code' },
    { ref: 'tools/a.js', from: 'code' },
  ]);
});

test('every path the docs name exists (or is a gitignored file you create)', (t) => {
  const ls = spawnSync('git', ['ls-files', '*.md'], { encoding: 'utf8' });
  if (ls.status !== 0) return t.skip('not a git checkout');
  const missing = [];
  for (const file of ls.stdout.split('\n').filter(Boolean)) {
    if (!fs.existsSync(file)) continue; // deleted in the working tree, not yet committed
    for (const { ref, from } of references(fs.readFileSync(file, 'utf8'))) {
      const p = path.normalize(from === 'link' ? path.join(path.dirname(file), ref) : ref);
      if (!fs.existsSync(p)) missing.push({ file, ref: p });
    }
  }
  const ignored = new Set(missing.length ? spawnSync('git', ['check-ignore', '--no-index', '--stdin'], { input: missing.map((m) => m.ref).join('\n'), encoding: 'utf8' }).stdout.split('\n') : []);
  const broken = missing.filter((m) => !ignored.has(m.ref)).map((m) => `${m.file}: ${m.ref}`);
  assert.deepEqual(broken, [], `docs name paths that do not exist:\n${broken.join('\n')}`);
});
