// Scene linter: rejects nondeterminism, network access, timers and external resources.
import fs from 'node:fs';
import path from 'node:path';

const BANNED = [
  [/\bDate\b/, 'Date (use t)'],
  [/Math\.random\s*\(/, 'Math.random (use ctx.rand(seed))'],
  [/\bfetch\s*\(/, 'fetch'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bsetTimeout\s*\(/, 'setTimeout'],
  [/\bsetInterval\s*\(/, 'setInterval'],
  [/\brequestAnimationFrame\s*\(/, 'requestAnimationFrame'],
  [/performance\.now\s*\(/, 'performance.now'],
  [/\beval\s*\(/, 'eval'],
  [/\bimport\s*\(\s*['"`]https?:/, 'remote import'],
];
const URL_RE = /https?:\/\/(?!www\.w3\.org\/(?:2000\/svg|1999\/xlink))[^\s'"`)]+/g;

/** Returns [{line, message}]. */
export function lintSource(src) {
  const issues = [];
  src.split(/\r?\n/).forEach((text, i) => {
    const code = text.replace(/(^|\s)\/\/.*$/, '$1');
    for (const [re, msg] of BANNED) if (re.test(code)) issues.push({ line: i + 1, message: `forbidden: ${msg}` });
    for (const m of code.matchAll(URL_RE)) issues.push({ line: i + 1, message: `external URL not allowed (${m[0].slice(0, 24)}…)` });
    if (/^\s*import\b.*from\s+['"](?!\.|style|kit|three)/.test(code)) issues.push({ line: i + 1, message: 'import only ./relative, "style", "kit" or "three"' });
  });
  if (!/export\s+(const|let|var)\s+meta\b/.test(src)) issues.push({ line: 1, message: 'must export const meta' });
  if (!/export\s+(async\s+)?function\s+render\b|export\s+const\s+render\b/.test(src)) issues.push({ line: 1, message: 'must export function render(ctx, t, tl)' });
  return issues;
}

export const lintFile = (f) => lintSource(fs.readFileSync(f, 'utf8'));

// CLI: `node tools/lint-scene.js <file...>` prints findings and exits 1 if there are any (a bare run used to pass silently).
if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  let bad = 0;
  for (const f of process.argv.slice(2)) for (const i of lintFile(f)) { bad++; console.log(`${f}:${i.line} ${i.message}`); }
  if (!process.argv[2]) console.log('usage: node tools/lint-scene.js <scene.js...>');
  process.exitCode = bad || !process.argv[2] ? 1 : 0;
}
