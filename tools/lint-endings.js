// Pre-recording lint for WORD-ENDING SLIPS. The voice reliably drops or doubles a final '-ed' or plural '-s'/'-es' when the next word starts
// with a consonant ("turned the" -> "turn the", "two switches that" -> "two switcheses that"), and the transcript check cannot see an
// ADDED syllable. This finds the risky spots in the SPOKEN text before any voice time is spent.
//   error: a phrase the voice has actually garbled (project/endings.known.json)
//   warn : a phonetic pattern that tends to slip (past tense or a plural ending right before a consonant-initial word, no pause between)
// Usage: node tools/lint-endings.js <episode-dir> [--strict]   (exit 1 on an error; with --strict also on any warning)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScript } from './script.js';

// project/endings.known.json: phrases the voice has garbled in YOUR episodes (starts empty; add to it as you catch slips)
const KNOWN_FILE = path.join(process.cwd(), 'project', 'endings.known.json');
const KNOWN = fs.existsSync(KNOWN_FILE) ? JSON.parse(fs.readFileSync(KNOWN_FILE, 'utf8')).phrases : [];

// words ending in -ed that are not a past-tense ending, and -s words that are not a plural ending
const NOT_PAST = new Set(['need', 'needed', 'speed', 'feed', 'seed', 'indeed', 'proceed', 'exceed', 'succeed', 'bleed', 'breed', 'weed', 'hundred', 'red', 'bed', 'shed', 'sled', 'led', 'fed', 'wed', 'embed', 'ahead', 'instead', 'bread', 'thread', 'spread', 'head', 'dead', 'read']);
const NOT_PLURAL = new Set(['this', 'his', 'is', 'was', 'has', 'does', 'its', 'as', 'us', 'yes', 'always', 'perhaps', 'plus', 'thus', 'across', 'less', 'unless', 'process', 'business', 'access', 'class', 'pass', 'miss', 'guess', 'address', 'success', 'loss', 'cross', 'press', 'focus', 'bonus', 'status', 'bus', 'gas', 'lens', 'series', 'whereas', 'various', 'previous', 'serious', 'nervous', 'famous', 'obvious', 'anonymous', 'tedious', 'curious', 'seems', 'means', 'always', 'sometimes', 'towards', 'afterwards']);

const VOWEL = /^[aeiou]/;

/** Split spoken text into words, remembering whether punctuation (a pause) follows each word. */
export function tokenize(text) {
  const out = [];
  const re = /([A-Za-z][A-Za-z']*)([^A-Za-z']*)/g;
  let m;
  while ((m = re.exec(text))) out.push({ w: m[1].toLowerCase(), pause: /[.,;:!?—-]/.test(m[2]), at: m.index });
  return out;
}

/** Findings for one stretch of spoken text: [{ severity, rule, phrase, at, note }]. */
export function lintEndings(text, known = KNOWN) {
  const words = tokenize(text);
  const out = [];
  const norm = words.map((x) => x.w);
  // 1. known slips (ignore punctuation: they are acoustic)
  for (const k of known) {
    const kw = k.phrase.toLowerCase().split(/\s+/);
    for (let i = 0; i + kw.length <= norm.length; i++) {
      // the slips are acoustic and need the words to run together: a comma or full stop inside the phrase (a real pause) fixes it
      const noPause = k.ignorePause || kw.slice(0, -1).every((_, j) => !words[i + j].pause);
      if (noPause && kw.every((w, j) => norm[i + j] === w)) out.push({ severity: 'error', rule: 'known-slip', phrase: k.phrase, at: words[i].at, note: k.heard ? `heard as "${k.heard}"` : k.note || 'garbled before' });
    }
  }
  // 2. phonetic patterns (only with no pause between the two words)
  for (let i = 0; i + 1 < words.length; i++) {
    const a = words[i], b = words[i + 1];
    if (a.pause || !b.w) continue;
    const consonantNext = !VOWEL.test(b.w);
    // past tense right before a consonant: the '-ed' is often dropped ("turned the", "passed there")
    if (a.w.length >= 5 && a.w.endsWith('ed') && !NOT_PAST.has(a.w) && consonantNext) {
      out.push({ severity: 'warn', rule: 'past-before-consonant', phrase: `${a.w} ${b.w}`, at: a.at, note: 'the "-ed" may be dropped' });
    }
    // two-syllable plural endings (-ces, -ses, -xes, -zes, -ches, -shes, -ges): doubled as "switcheses"
    if (/(ces|ses|xes|zes|ches|shes|ges)$/.test(a.w) && a.w.length >= 6 && !NOT_PLURAL.has(a.w) && consonantNext) {
      out.push({ severity: 'warn', rule: 'sibilant-plural-before-consonant', phrase: `${a.w} ${b.w}`, at: a.at, note: 'the "-es" may be doubled ("switcheses")' });
    }
    // a consonant cluster ending in -s before a stop or sibilant: "tests passed" -> "test passed"
    if (/(sts|sks|sps|fts|xts)$/.test(a.w) && /^[tdkpbgs]|^th|^sh|^ch/.test(b.w)) {
      out.push({ severity: 'warn', rule: 'cluster-plural-before-stop', phrase: `${a.w} ${b.w}`, at: a.at, note: 'the final "s" may be dropped' });
    }
  }
  return out;
}

const sentenceAround = (text, at) => {
  const s = Math.max(text.lastIndexOf('.', at) + 1, text.lastIndexOf('?', at) + 1, text.lastIndexOf('!', at) + 1);
  let e = text.length;
  for (const c of ['.', '?', '!']) { const k = text.indexOf(c, at); if (k >= 0 && k < e) e = k + 1; }
  return text.slice(s, e).trim();
};

export function lintScript(script) {
  return script.scenes.map((s) => ({ scene: s.title, findings: lintEndings(s.spokenText).map((f) => ({ ...f, context: sentenceAround(s.spokenText, f.at) })) }));
}

/** { errors, warnings } counts for an episode directory (used by the CLI before tts and by validate). */
export function summarize(ep) {
  const res = lintScript(loadScript(path.join(ep, 'script.md')));
  let errors = 0, warnings = 0;
  for (const r of res) for (const f of r.findings) (f.severity === 'error' ? errors++ : warnings++);
  return { errors, warnings };
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const ep = args.find((a) => !a.startsWith('--'));
  if (!ep) throw new Error('usage: node tools/lint-endings.js <episode-dir> [--strict]');
  const res = lintScript(loadScript(path.join(ep, 'script.md')));
  let errors = 0, warns = 0;
  for (const r of res) {
    if (!r.findings.length) continue;
    console.log(`## ${r.scene}`);
    for (const f of r.findings) {
      (f.severity === 'error' ? errors++ : warns++);
      console.log(`  ${f.severity.toUpperCase().padEnd(5)} "${f.phrase}": ${f.note}\n        ${f.context.slice(0, 150)}`);
    }
  }
  console.log(`word-ending lint: ${errors} known-slip error(s), ${warns} warning(s)`);
  if (errors || (strict && warns)) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
