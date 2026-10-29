import test from 'node:test';
import assert from 'node:assert/strict';
import { lintSource } from './lint-scene.js';

const ok = 'export const meta = { cues: [] };\nexport function render(ctx, t) { ctx.c2d.fillRect(0,0,1,1); }\n';

test('clean scene passes', () => assert.deepEqual(lintSource(ok), []));
test('rejects nondeterminism and network', () => {
  for (const bad of ['const d = new Date();', 'const r = Math.random();', 'fetch("/x")', 'setTimeout(f, 1)', 'performance.now()', 'requestAnimationFrame(f)']) {
    assert.ok(lintSource(ok + bad + '\n').length > 0, bad);
  }
});
test('rejects external URLs but allows the svg namespace', () => {
  assert.ok(lintSource(ok + 'const u = "https://example.com/a.png";\n').length > 0);
  assert.deepEqual(lintSource(ok + 'const ns = "http://www.w3.org/2000/svg";\n'), []);
});
test('requires meta and render exports', () => {
  assert.ok(lintSource('export function render() {}').some((i) => /meta/.test(i.message)));
  assert.ok(lintSource('export const meta = {};').some((i) => /render/.test(i.message)));
});
test('restricts imports', () => {
  assert.ok(lintSource(ok + 'import x from "lodash";\n').length > 0);
  assert.deepEqual(lintSource('import { clamp } from "style";\n' + ok), []);
});
