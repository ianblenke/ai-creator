// Script parser/validator: Markdown with "## Scene" headings, "> " visual notes, {{spoken: say | show}} overrides.
import fs from 'node:fs';

const WPM = 160; // measured on the author's cloned voice (about 163 words per minute of speech); set VOICE_WPM to your own rate
const SCENE_PAD_SECONDS = 0.6;
const OVERRIDE = /\{\{\s*spoken:\s*([^|}]+?)\s*\|\s*([^}]+?)\s*\}\}/g;
// {{pause: 0.9}} on its own paragraph: the text before and after is synthesized separately and joined with exactly that much silence.
const PAUSE = /\s*\{\{\s*pause:\s*([\d.]+)\s*\}\}\s*/g;

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const countWords = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function parseScript(markdown) {
  const lines = markdown.split(/\r?\n/);
  const title = (lines.find((l) => /^#\s+/.test(l)) || '').replace(/^#\s+/, '').trim();
  const scenes = [];
  let cur = null;
  for (const line of lines) {
    const h = line.match(/^##\s+(.*\S)\s*$/);
    if (h) {
      cur = { title: h[1], body: [], notes: [] };
      scenes.push(cur);
      continue;
    }
    if (!cur) continue;
    const note = line.match(/^>\s?(.*)$/);
    if (note) cur.notes.push(note[1].replace(/^VISUAL:\s*/i, '').trim());
    else if (line.trim()) cur.body.push(line.trim());
  }
  const out = scenes.map((s, i) => {
    const joined = s.body.join('\n\n');
    // split at pause markers: [text, seconds, text, seconds, text]
    const parts = joined.split(PAUSE);
    const segments = [];
    for (let k = 0; k < parts.length; k += 2) segments.push({ text: parts[k].replace(OVERRIDE, '$1').trim(), pauseAfter: k + 1 < parts.length ? parseFloat(parts[k + 1]) : 0 });
    const raw = parts.filter((_, k) => k % 2 === 0).join('\n\n');
    return {
      id: `${String(i + 1).padStart(2, '0')}-${slug(s.title)}`,
      title: s.title,
      slug: slug(s.title),
      rawText: raw,
      spokenText: raw.replace(OVERRIDE, '$1'),
      displayText: raw.replace(OVERRIDE, '$2'),
      segments, // [{text, pauseAfter}]: one segment unless the scene has pause markers
      notes: s.notes.filter(Boolean),
    };
  });
  const d = markdown.split(/^##\s/m)[0].match(/^Duration:\s*([\d.]+)\s*-\s*([\d.]+)\s*min/im);
  return { title, scenes: out, target: d ? { minMinutes: +d[1], maxMinutes: +d[2] } : undefined };
}

export function estimateSeconds(script, { wpm = Number(process.env.VOICE_WPM) || WPM, pad = SCENE_PAD_SECONDS } = {}) {
  return script.scenes.reduce((t, s) => t + (countWords(s.spokenText) / wpm) * 60 + pad, 0);
}

/** Returns {errors, warnings, seconds}. */
export function validateScript(script, { minMinutes = 5, maxMinutes = 8, ...rest } = {}) {
  ({ minMinutes = minMinutes, maxMinutes = maxMinutes } = { ...rest, ...script.target });
  const errors = [];
  const warnings = [];
  if (!script.scenes.length) errors.push('script has no scenes (expected "## Scene title" headings)');
  const seen = new Set();
  for (const s of script.scenes) {
    if (!countWords(s.spokenText)) errors.push(`scene "${s.title}" has no narration text`);
    if (seen.has(s.slug)) errors.push(`duplicate scene title "${s.title}"`);
    seen.add(s.slug);
  }
  const seconds = estimateSeconds(script);
  const minutes = seconds / 60;
  if (minutes < minMinutes) warnings.push(`estimated ${minutes.toFixed(1)} min is under the ${minMinutes}-${maxMinutes} min target`);
  if (minutes > maxMinutes) warnings.push(`estimated ${minutes.toFixed(1)} min is over the ${minMinutes}-${maxMinutes} min target`);
  return { errors, warnings, seconds };
}

export function loadScript(file) {
  return parseScript(fs.readFileSync(file, 'utf8'));
}

/**
 * Split raw narration into display tokens. Each token records how many spoken words it covers,
 * so aligned spoken-word times can be mapped back onto display text (e.g. "thirty ninety" -> "3090").
 */
export function tokenizeNarration(raw) {
  const tokens = [];
  const re = new RegExp(OVERRIDE.source, 'g');
  let last = 0;
  const plain = (chunk) => chunk.split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ display: w, spoken: 1 }));
  for (const m of raw.matchAll(re)) {
    // punctuation glued to the override (e.g. "{{...}},") stays attached to the display token
    plain(raw.slice(last, m.index));
    const after = raw.slice(m.index + m[0].length).match(/^[^\s{]*/)[0];
    tokens.push({ display: m[2] + after, spoken: m[1].split(/\s+/).filter(Boolean).length });
    last = m.index + m[0].length + after.length;
  }
  plain(raw.slice(last));
  return tokens;
}

/** Spoken words (whitespace-separated) exactly as sent to synthesis and alignment. */
export const spokenWords = (spokenText) => spokenText.split(/\s+/).filter(Boolean);
