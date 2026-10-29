// Pure timeline logic: build timeline.json from aligned words, validate it, make subtitles, resolve cue anchors.
import { tokenizeNarration } from './script.js';

export const SCENE_PAD = 0.6;

/** aligned: {sceneId: [{word,start,end}]} in scene-local seconds; durations: {sceneId: seconds}. */
export function buildTimeline(script, aligned, durations, { pad = SCENE_PAD } = {}) {
  let t = 0;
  const scenes = script.scenes.map((s) => {
    const spoken = aligned[s.id];
    const tokens = tokenizeNarration(s.rawText ?? s.displayText);
    const need = tokens.reduce((n, x) => n + x.spoken, 0);
    if (!spoken || spoken.length !== need) {
      throw new Error(`scene ${s.id}: aligner returned ${spoken ? spoken.length : 0} words, expected ${need}`);
    }
    let i = 0;
    const words = tokens.map((tok) => {
      const first = spoken[i];
      const last = spoken[i + tok.spoken - 1];
      i += tok.spoken;
      return { text: tok.display, start: round(t + first.start), end: round(t + last.end) };
    });
    const scene = { id: s.id, title: s.title, start: round(t), duration: round(durations[s.id]), words };
    t += durations[s.id] + pad;
    return scene;
  });
  return { pad, duration: round(t - pad), scenes };
}

const round = (x) => Math.round(x * 1000) / 1000;

export function validateTimeline(tl) {
  const errors = [];
  let prevEnd = -Infinity;
  for (const s of tl.scenes) {
    if (s.start < prevEnd) errors.push(`scene ${s.id} overlaps the previous scene`);
    let prev = s.start;
    for (const w of s.words) {
      if (w.start < prev - 1e-6) errors.push(`scene ${s.id}: word "${w.text}" starts before the previous word`);
      if (w.end < w.start) errors.push(`scene ${s.id}: word "${w.text}" ends before it starts`);
      if (w.start < s.start - 1e-6 || w.end > s.start + s.duration + 0.05) errors.push(`scene ${s.id}: word "${w.text}" is outside the scene bounds`);
      prev = w.start;
    }
    prevEnd = s.start + s.duration;
  }
  return errors;
}

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Time of the first word of `anchor` (a phrase) in a scene; a number is a word index. */
export function resolveAnchor(tl, sceneId, anchor) {
  const scene = tl.scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error(`unknown scene ${sceneId}`);
  if (typeof anchor === 'number') {
    if (!scene.words[anchor]) throw new Error(`scene ${sceneId}: word index ${anchor} out of range`);
    return scene.words[anchor].start;
  }
  const want = anchor.split(/\s+/).map(clean).filter(Boolean);
  const have = scene.words.map((w) => clean(w.text));
  for (let i = 0; i + want.length <= have.length; i++) {
    if (want.every((w, k) => have[i + k] === w)) return scene.words[i].start;
  }
  throw new Error(`scene ${sceneId}: anchor "${anchor}" not found in narration`);
}

const ts = (sec, sep) => {
  const ms = Math.round(sec * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)}${sep}${p(ms % 1000, 3)}`;
};

const SENT = /[.?!]["')\]]*$/;
const CLAUSE = /[,;:\u2014]["')\]]*$/;
const textOf = (ws) => ws.map((w) => w.text).join(' ');

/**
 * Subtitle cues: one per sentence when it fits (<= maxChars), otherwise split at clause breaks (or the nearest word boundary),
 * then merge orphans (fewer than minWords or shorter than minSeconds) into a neighbour so a single word never flashes alone.
 */
export function cues(tl, { maxChars = 84, minWords = 3, minSeconds = 0.9 } = {}) {
  const out = [];
  for (const s of tl.scenes) {
    const sentences = [];
    let cur = [];
    for (const w of s.words) { cur.push(w); if (SENT.test(w.text)) { sentences.push(cur); cur = []; } }
    if (cur.length) sentences.push(cur);
    let chunks = [];
    for (const sent of sentences) {
      if (textOf(sent).length <= maxChars) { chunks.push(sent); continue; }
      let piece = [];
      sent.forEach((w, i) => {
        piece.push(w);
        const len = textOf(piece).length;
        const rest = sent.length - i - 1;
        // break at a clause boundary once the piece is a reasonable length, or when the line limit is reached
        if (rest > 0 && ((CLAUSE.test(w.text) && len >= 30) || len + (sent[i + 1].text.length + 1) > maxChars)) { chunks.push(piece); piece = []; }
      });
      if (piece.length) chunks.push(piece);
    }
    // merge orphans backwards (or forwards for a leading orphan)
    const merged = [];
    for (const ch of chunks) {
      const dur = ch[ch.length - 1].end - ch[0].start;
      const prev = merged[merged.length - 1];
      if (prev && (ch.length < minWords || dur < minSeconds) && textOf([...prev, ...ch]).length <= maxChars + 24) prev.push(...ch);
      else merged.push([...ch]);
    }
    if (merged.length > 1 && (merged[0].length < minWords)) { merged[1].unshift(...merged[0]); merged.shift(); }
    for (const ch of merged) out.push({ start: ch[0].start, end: ch[ch.length - 1].end, text: textOf(ch) });
  }
  // readable timing: show each cue at least minSeconds, without overlapping the next
  out.forEach((c, i) => { const next = out[i + 1]; c.end = Math.max(c.end, Math.min(c.start + minSeconds, next ? next.start - 0.02 : Infinity)); if (next) c.end = Math.min(c.end, next.start - 0.02); });
  return out;
}

/** Balance a long cue over two lines (about 42 characters each). */
export function wrap(text, lineChars = 42) {
  if (text.length <= lineChars) return text;
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) if (text[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? text : `${text.slice(0, best)}\n${text.slice(best + 1)}`;
}

export function toVtt(tl) {
  return 'WEBVTT\n\n' + cues(tl).map((c) => `${ts(c.start, '.')} --> ${ts(c.end, '.')}\n${wrap(c.text)}\n`).join('\n');
}

export function toSrt(tl) {
  return cues(tl).map((c, i) => `${i + 1}\n${ts(c.start, ',')} --> ${ts(c.end, ',')}\n${wrap(c.text)}\n`).join('\n');
}
