// Narration quality gate: finds TTS glitches from the aligned timeline. A voice that stalls mid-phrase or clips a word leaves a
// silent gap where a natural reader would not pause.

const SENTENCE_END = /[.?!]["')\]]*$/;
const CLAUSE_END = /[,;:—-]["')\]]*$/;

// This voice naturally pauses ~1 s at colons and commas; only a stall INSIDE a phrase (no punctuation) is a real glitch.
// Unpunctuated gaps are normally 0.02 to 0.15 s; 0.38 s between "model" and "writes" was heard as a comma-length pause,
// so the limit is 0.35 s. (It was 0.55 s at first, which let those through.)
export const LIMITS = { midPhrase: 0.35, afterClause: 1.3, afterSentence: 1.8 };
// Several smaller breaks (each under the midPhrase stall limit) within a few seconds sound like the voice breaking up.
export const CHOPPY = { gap: 0.25, count: 2, window: 3 };

/** Returns [{scene, time, gap, after, before, kind}] sorted by time. */
export function findGaps(timeline, limits = LIMITS) {
  const out = [];
  for (const s of timeline.scenes) {
    for (let i = 0; i < s.words.length - 1; i++) {
      const [a, b] = [s.words[i], s.words[i + 1]];
      const gap = b.start - a.end;
      const limit = SENTENCE_END.test(a.text) ? limits.afterSentence : CLAUSE_END.test(a.text) ? limits.afterClause : limits.midPhrase;
      if (gap > limit) {
        out.push({ scene: s.id, time: +a.end.toFixed(2), local: +(a.end - s.start).toFixed(2), gap: +gap.toFixed(2), after: a.text, before: b.text,
          kind: SENTENCE_END.test(a.text) ? 'long pause after sentence' : CLAUSE_END.test(a.text) ? 'long pause after clause' : 'stall inside a phrase' });
      }
    }
  }
  out.push(...findChoppy(timeline), ...findFused(timeline));
  return out.sort((a, b) => a.time - b.time);
}

// A word that starts within FUSED_MIN of the NEXT word's start was swallowed into it ("a request" heard as "a re-request"):
// the transcript is fine but a listener hears a stumble. Real one-syllable words last 0.08 s or more.
export const FUSED_MIN = 0.05;

/** Words squeezed into the next word's onset. gap is a nominal penalty so take selection treats it like a stall. */
export function findFused(timeline, min = FUSED_MIN) {
  const out = [];
  for (const s of timeline.scenes) {
    for (let i = 0; i < s.words.length - 1; i++) {
      const [a, b] = [s.words[i], s.words[i + 1]];
      if (b.start - a.start < min) {
        out.push({ scene: s.id, time: +a.start.toFixed(2), local: +(a.start - s.start).toFixed(2), gap: 0.5, after: a.text, before: b.text, kind: 'fused word' });
      }
    }
  }
  return out;
}

/** Runs of small mid-phrase breaks (>= CHOPPY.gap) that are too close together: flagged once per run, at the last break. */
export function findChoppy(timeline, c = CHOPPY) {
  const out = [];
  for (const s of timeline.scenes) {
    const breaks = [];
    for (let i = 0; i < s.words.length - 1; i++) {
      const [a, b] = [s.words[i], s.words[i + 1]];
      if (SENTENCE_END.test(a.text) || CLAUSE_END.test(a.text)) continue;
      const gap = b.start - a.end;
      if (gap >= c.gap) breaks.push({ t: a.end, gap, a, b });
    }
    for (let i = c.count - 1; i < breaks.length; i++) {
      const run = breaks.slice(i - c.count + 1, i + 1);
      if (run[run.length - 1].t - run[0].t <= c.window && !(out.length && out[out.length - 1].scene === s.id && Math.abs(out[out.length - 1].time - +run[run.length - 1].t.toFixed(2)) < c.window)) {
        const last = run[run.length - 1];
        out.push({ scene: s.id, time: +last.t.toFixed(2), local: +(last.t - s.start).toFixed(2), gap: +last.gap.toFixed(2), after: last.a.text, before: last.b.text,
          kind: `choppy delivery: ${run.length} breaks within ${c.window}s` });
      }
    }
  }
  return out;
}

const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function formatGaps(gaps) {
  return gaps.map((g) => g.kind === 'fused word' ? `${mmss(g.time)} (${g.scene}, ${g.local}s in)  fused word: "${g.after}" is squeezed into "${g.before}"` : `${mmss(g.time)} (${g.scene}, ${g.local}s in)  ${g.kind}: ${g.gap}s of silence between "${g.after}" and "${g.before}"`).join('\n');
}

/** Scene numbers (as retake arguments) that need a new take. */
export const scenesToRetake = (gaps) => [...new Set(gaps.map((g) => g.scene.slice(0, 2)))];
