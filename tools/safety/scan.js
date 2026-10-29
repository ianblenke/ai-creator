// Content-safety scanner: finds infrastructure details that must never reach published content.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OCTET = '(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)';
const IPV4 = new RegExp(`(?<![\\w.])${OCTET}(?:\\.${OCTET}){3}(?![\\w.]*\\w)`, 'g');
const IPV6 = [
  /(?<![\w:])(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}(?![\w:])/gi,
  /(?<![\w:])(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?::(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)(?![\w:])/gi,
  /(?<![\w:])(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)::(?![\w:])/gi,
];

// Each rule names itself in the report and carries a hint, so a reader can tell a real leak from a false positive (docs/safety.md).
const IP_HINT = 'an IP address; describe the machine instead ("the GPU box"). A dotted version like 1.2.3.4 also matches: write "version 1.2.3.4" as "v1.2.3.4"';
const RULES = [
  { category: 'hostname', rule: 'private-domain', hint: 'a LAN-style name (.local, .lan, .internal, .home ...); in scene code a property like n.home is skipped, a string is not', re: /\b(?:[a-z0-9][a-z0-9-]*\.)*[a-z0-9][a-z0-9-]*\.(?:local|lan|internal|home|home\.arpa|localdomain|corp|intranet|private)\b/gi, ambiguous: /\.(?:internal|home|corp|private)\b/i, skip: (m, line, i) => /^env\.local$/i.test(m) && line[i - 1] === '.' }, // the settings file name .env.local is not a machine
  { category: 'hostname', rule: 'localhost', hint: 'the word localhost; say "this machine" instead', re: /\blocalhost\b/gi },
  { category: 'port', rule: 'host-colon-port', hint: 'name:number looks like host:port; in code an object key with a number (a:10) can trip it: add a space after the colon', re: /\b(?:[a-z][\w-]*|\d{1,3}(?:\.\d{1,3}){3}):\d{2,5}\b(?!:)/gi, skip: (m) => /^(?:https?|ftp|ssh|file|mailto|tel)$/i.test(m.split(':')[0]) },
  { category: 'port', rule: 'port-number', hint: 'a spelled-out port number; leave the number out', re: /\bports?\s+(?:number\s+)?\d{2,5}\b/gi },
  { category: 'path', rule: 'unix-path', hint: 'an absolute or home path; use a repo-relative path or none', re: /(?<![\w/])(?:~|\/(?:home|etc|var|usr|opt|mnt|srv|root|tmp|data|docker|Users|Volumes|media|run|proc|dev))\/[\w.@%+-]+(?:\/[\w.@%+-]*)*/g },
  { category: 'path', rule: 'windows-path', hint: 'a drive path like C:\\...; use a repo-relative path or none', re: /\b[A-Za-z]:\\[\w\\. -]{2,}/g },
  { category: 'mac', rule: 'mac-address', hint: 'a hardware (MAC) address; never show one', re: /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi },
  { category: 'secret', rule: 'key-pattern', hint: 'looks like an API key or token; revoke it if it is real', re: /\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[\w-]{10,}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,})\b/g },
  { category: 'secret', rule: 'private-key', hint: 'a private key header; revoke the key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { category: 'secret', rule: 'secret-assignment', hint: 'key/token/secret/password followed by a value; a code variable named token = ... trips it too: rename the variable if it is not a secret', re: /\b(?:api[_-]?key|token|secret|password|passwd)\s*[:=]\s*["']?[^\s"']{8,}/gi },
];

/** Mask a match so reports never echo the full sensitive value. */
export function mask(value) {
  const v = String(value).trim();
  return v.length <= 3 ? '***' : `${v.slice(0, 2)}…(${v.length} chars)`;
}

const readEntries = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

/** 'missing', 'empty', 'example' (same entries as denylist.example.txt next to it) or 'ok'. */
export function denylistStatus(file) {
  if (!fs.existsSync(file)) return 'missing';
  const entries = readEntries(file);
  if (!entries.length) return 'empty';
  const example = path.join(path.dirname(file), 'denylist.example.txt');
  if (fs.existsSync(example) && path.resolve(example) !== path.resolve(file) && readEntries(example).join('\n') === entries.join('\n')) return 'example';
  return 'ok';
}

const warned = new Set();
const PROBLEM = { missing: 'is MISSING', empty: 'has NO entries', example: 'is still the EXAMPLE list (invented names only)' };
const FIX = {
  missing: 'Fix: cp safety/denylist.example.txt safety/denylist.txt, then replace the invented names with yours (checklist: docs/safety.md).',
  empty: 'Fix: add your names to it, one per line (checklist: docs/safety.md).',
  example: 'Fix: edit it and replace the invented names with yours (checklist: docs/safety.md).',
};

/** Loud stderr banner, once per file per process: the gate still runs, but without your private names. */
export function warnDenylist(file, status = denylistStatus(file)) {
  if (status === 'ok' || warned.has(path.resolve(file))) return status;
  warned.add(path.resolve(file));
  const bar = '!'.repeat(78);
  console.error(`${bar}\ncontent-safety WARNING: ${path.relative('.', file) || file} ${PROBLEM[status]}.\nThe gate still checks generic patterns (IPs, LAN names, paths, secrets) but NOT your own private names.\n${FIX[status]}\n${bar}`);
  return status;
}

export function loadDenylist(file) {
  warnDenylist(file);
  try {
    return readEntries(file);
  } catch {
    return [];
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Scan text; returns [{file, line, category, sample}]. */
export function scanText(text, { file = '<text>', denylist = [] } = {}) {
  const findings = [];
  const isCode = /\.(?:m?js)$/i.test(file);
  const isStyle = /\.(?:css|html|svg)$/i.test(file); // `font-weight:700` is a CSS property, not host:port
  const denyRes = denylist.map((d) => new RegExp(`(?<![\\w])${escapeRe(d)}(?![\\w])`, 'i'));
  text.split(/\r?\n/).forEach((lineText, i) => {
    const add = (category, match, rule = category, hint = '') => findings.push({ file, line: i + 1, category, rule, hint, sample: mask(match) });
    for (const m of lineText.matchAll(IPV4)) add('ipv4', m[0], 'ipv4-address', IP_HINT);
    for (const re of IPV6) {
      for (const m of lineText.matchAll(re)) {
        if (/[a-f]/i.test(m[0]) || m[0].includes('::')) add('ipv6', m[0], 'ipv6-address', 'an IPv6 address; C++ std:: is skipped, other a::b hex pairs may trip it');
      }
    }
    for (const rule of RULES) {
      for (const m of lineText.matchAll(rule.re)) {
        if (rule.skip && rule.skip(m[0], lineText, m.index)) continue;
        if (isStyle && rule.category === 'port' && !/^\d/.test(m[0])) continue; // keep IP:port detection in style files
        // identifiers like `node.home` are common in code; on-screen text is covered by the rendered-text scan
        if (isCode && rule.ambiguous && rule.ambiguous.test(m[0]) && !/\.(?:local|lan|localdomain|home\.arpa|intranet)\b/i.test(m[0])) continue;
        add(rule.category, m[0], rule.rule, rule.hint);
      }
    }
    denyRes.forEach((re) => {
      const m = lineText.match(re);
      if (m) add('denylist', m[0], 'denylist', 'a name from your safety/denylist.txt; reword it generically');
    });
  });
  return dedupe(findings);
}

function dedupe(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const k = `${f.file}:${f.line}:${f.category}:${f.sample}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
}

const SCANNABLE = /\.(md|txt|json|js|mjs|css|html|svg|vtt|srt|yaml|yml)$/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (SCANNABLE.test(e.name)) out.push(p);
  }
  return out;
}

/** Files in an episode that feed generation, rendering or publishing. */
export function episodeFiles(episodeDir) {
  const skipDirs = ['audio', 'frames', 'out/frames'];
  return walk(episodeDir).filter((f) => {
    const rel = path.relative(episodeDir, f);
    return !skipDirs.some((d) => rel.startsWith(d + path.sep));
  });
}

export function scanFiles(files, { denylist = [] } = {}) {
  return files.flatMap((f) => scanText(fs.readFileSync(f, 'utf8'), { file: f, denylist }));
}

export function scanEpisode(episodeDir, { denylistFile = 'safety/denylist.txt' } = {}) {
  const denylist = loadDenylist(denylistFile);
  return scanFiles(episodeFiles(episodeDir), { denylist });
}

/** Scan strings extracted from rendered output (on-screen text). */
export function scanRenderedText(strings, { label = 'rendered', denylist = [] } = {}) {
  return scanText(strings.join('\n'), { file: label, denylist });
}

export function formatFindings(findings) {
  return findings.map((f) => `${f.file}:${f.line} [${f.category}/${f.rule}] ${f.sample}${f.hint ? `\n    hint: ${f.hint}` : ''}`).join('\n');
}

/** Throw if findings exist; used to gate expensive or outward steps. */
export function assertClean(findings, step) {
  if (findings.length) {
    const err = new Error(`content-safety gate blocked "${step}": ${findings.length} finding(s)\n${formatFindings(findings)}`);
    err.findings = findings;
    throw err;
  }
}

/** Denylist names in every tracked text file (binary files and the denylist files themselves are skipped). CI runs this. */
export function scanTrackedNames(denylist, { cwd = process.cwd() } = {}) {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8' }).split('\0').filter((f) => f && !/^safety\/denylist[^/]*\.txt$/.test(f));
  return files.flatMap((f) => {
    const buf = fs.readFileSync(path.join(cwd, f));
    return buf.includes(0) ? [] : scanText(buf.toString('utf8'), { file: f, denylist }).filter((x) => x.category === 'denylist');
  });
}

// node tools/safety/scan.js --names <denylist-file>: exit 1 if any tracked text file contains a name from the list
if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--names');
  if (i < 0 || !process.argv[i + 1]) {
    console.error('usage: node tools/safety/scan.js --names <denylist-file>');
    process.exit(2);
  }
  const list = readEntries(process.argv[i + 1]);
  const found = scanTrackedNames(list);
  if (found.length) {
    console.error(formatFindings(found));
    process.exit(1);
  }
  console.log(`no denylist name in any tracked file (${list.length} name(s) checked)`);
}
