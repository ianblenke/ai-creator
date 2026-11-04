// Scene 09: what the reviews cannot catch. Two reviewers read the script but cannot hear; three hedged things they may
// miss; then the author reads the script aloud (a waveform leaves the mouth), keeps "I think" (mine), hears a hard phrase,
// and the cloned voice stumbles. Ends wide on "read the script out loud yourself".
import { palette as P, font, prog, ease, lerp, clamp, el, set } from 'style';
import { type, label, chip, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'record', at: 'before you record' },
    { name: 'script', at: 'a script that passes' },
    { name: 'both', at: 'both reviews' },
    { name: 'reading', at: 'passed a reading' },
    { name: 'text', at: 'read text' },
    { name: 'neither', at: 'and neither' },
    { name: 'hear', at: 'can hear' },
    { name: 'idonot', at: 'I do not think' },
    { name: 'sounds', at: 'sounds like you' },
    { name: 'joke', at: 'a joke lands' },
    { name: 'believe', at: 'actually believe' },
    { name: 'so', at: 'So you read' },
    { name: 'loud', at: 'out loud yourself' },
    { name: 'opinions', at: 'own opinions' },
    { name: 'yours', at: 'as yours' },
    { name: 'ithink', at: 'I think' },
    { name: 'itis', at: 'not it is' },
    { name: 'aloud', at: 'Reading it aloud' },
    { name: 'phrases', at: 'hear the phrases' },
    { name: 'phrasew', at: 'phrases that are' },
    { name: 'hard', at: 'hard to say' },
    { name: 'say', at: 'to say' },
    { name: 'matters', at: 'That matters' },
    { name: 'cloned', at: 'cloned copy' },
    { name: 'stumbles', at: 'which stumbles' },
    { name: 'ways', at: 'own ways' },
    { name: 'checks', at: 'Its checks' },
    { name: 'later', at: 'later part' },
  ],
};

// THE FIGURE (canon, as scene 08): circle head over a flat-topped, square-shouldered body, two ear arcs; the magnifier is
// held at the front on the figure's right, the pencil on its right. `lit` overlays accent ears; `slash` crosses them out.
function figure(parent, { outline = P.dim, magnifier = false, pencil = false, dashed = false } = {}) {
  const it = new Item(parent, 240, 230);
  const g = it.g, s = { stroke: outline, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(dashed ? { 'stroke-dasharray': '12 9' } : {}) };
  el(g, 'path', { d: 'M -62 110 L -62 0 Q -62 -34 -28 -34 L 28 -34 Q 62 -34 62 0 L 62 110 Z', fill: P.bg2, ...s });
  el(g, 'circle', { cx: 0, cy: -76, r: 34, fill: P.bg2, ...s });
  const EARS = 'M -40 -90 Q -54 -76 -40 -62 M 40 -90 Q 54 -76 40 -62';
  el(g, 'path', { d: EARS, fill: 'none', ...s });
  it.lit = el(g, 'path', { d: EARS, fill: 'none', ...s, stroke: P.accent, opacity: 0 });
  it.slash = el(g, 'g', { opacity: 0 });
  for (const dx of [-47, 47]) el(it.slash, 'line', { x1: dx - 14, y1: -92, x2: dx + 14, y2: -60, stroke: P.hot, 'stroke-width': 5, 'stroke-linecap': 'round' });
  if (magnifier) {
    el(g, 'line', { x1: 74, y1: 24, x2: 54, y2: 48, ...s, stroke: P.ink, 'stroke-width': 7 });
    el(g, 'circle', { cx: 90, cy: 6, r: 24, fill: P.bg, 'fill-opacity': 0.5, ...s, stroke: P.ink });
  }
  if (pencil) {
    const pg = el(g, 'g', { transform: 'translate(80 30) rotate(-35)' });
    el(pg, 'rect', { x: -9, y: -44, width: 18, height: 70, rx: 4, fill: P.ink });
    el(pg, 'path', { d: 'M -9 26 L 0 44 L 9 26 Z', fill: P.ink });
  }
  return it;
}

const bar = (g, x1, x2, y, h, fill) => el(g, 'rect', { x: x1, y: y - h / 2, width: x2 - x1, height: h, rx: h / 2, fill });
const tick = (parent) => {
  const it = new Item(parent, 60, 50);
  el(it.g, 'path', { d: 'M -26 0 L -8 18 L 26 -20', fill: 'none', stroke: P.accent, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  return it;
};

// a small waveform whose bars run left from x0 at mouth height (y 428), a gap in front of the head
function wave(parent, x0) {
  const it = new Item(parent, 240, 80);
  it.bars = Array.from({ length: 9 }, (_, i) => el(it.g, 'rect', { x: x0 - i * 28 - 6, width: 12, rx: 6, fill: P.accent }));
  return it;
}

const CRITIC = [340, 480], FLOW = [600, 480], AUTHOR = [1180, 480];
const COPY = [960, 480], PAGE0 = [960, 440], PAGE1 = [1530, 440];
const ROWS = [-165, -35, 95]; // heading rows on the page (local)
let S;

export function setup(ctx) {
  const cue = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'record', delay: 0.6, dur: 1.6, x: 760, y: 470, z: 1.08 },
      { cue: 'idonot', delay: 0, dur: 1.2, x: 960, y: 480, z: 1 },
      { cue: 'so', delay: 0.4, dur: 1.6, x: 1040, y: 470, z: 1.05 },
      { cue: 'matters', delay: 0.2, dur: 1.6, x: 1050, y: 480, z: 1.07 },
      { cue: 'stumbles', delay: 0.6, dur: 1.2, x: 960, y: 540, z: 1 }, // wide before the end phrase
    ], cue),
  };
  const W = S.stage.world;
  // narration word intervals (scene-local), so the waveforms move only while words are spoken
  S.words = ctx.scene.words.map((w) => [w.start - ctx.scene.start, w.end - ctx.scene.start]);

  // ---- the two reviewers (read-only: magnifier, no pencil) ----
  S.critic = figure(W, { magnifier: true }).at(...CRITIC);
  S.flow = figure(W, { magnifier: true }).at(...FLOW);
  S.ticks = [tick(W).at(CRITIC[0], 330), tick(W).at(FLOW[0], 330)];
  S.lReading = label(W, 'only passed a reading', { size: type.label }).at(470, 700);
  S.cHear = chip(W, 'neither can hear', { color: P.hot }).at(470, 700);

  // ---- the script page: three heading bars on the left, text bars to their right ----
  S.page = new Item(W, 360, 470);
  const pg = S.page.g;
  el(pg, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.textBars = [];
  ROWS.forEach((y) => {
    bar(pg, -150, -112, y, 16, P.ink);
    [0, 34, 68].forEach((dy, j) => S.textBars.push(bar(pg, -92, j === 2 ? 70 : 150, y + dy, 12, P.ink)));
  });
  // reading: a thin ink outline that steps from one heading block to the next
  S.scan = el(pg, 'rect', { x: -170, y: 0, width: 340, height: 116, rx: 18, fill: 'none', stroke: P.ink, 'stroke-width': 4, opacity: 0 });
  // the phrase that is hard to say: one bar turns hot, with a small squiggle under it
  S.hardBar = bar(pg, -92, 150, ROWS[1] + 34, 12, P.hot);
  S.squiggle = el(pg, 'path', { d: 'M -92 ' + (ROWS[1] + 52) + ' q 15 -10 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0', fill: 'none', stroke: P.hot, 'stroke-width': 4, 'stroke-linecap': 'round' });

  // ---- what they may not tell (hedged: dashed, dim) ----
  S.hedge = [['sounds like you', 300], ['a joke lands', 440], ['what you believe', 580]].map(([s, y]) => chip(W, s, { color: P.dim, dashed: true, textColor: P.ink }).at(960, y));

  // ---- the author reads aloud ----
  S.author = figure(W, { outline: P.ink, pencil: true }).at(...AUTHOR);
  S.wave = wave(W, 1080);
  // the cloned copy of the voice: a dashed, dim duplicate with no pencil; its own waveform
  S.copy = figure(W, { dashed: true }).at(...COPY);
  S.copyWave = wave(W, 860);
  S.cLater = chip(W, 'a later part', { color: P.dim, dashed: true, textColor: P.ink }).at(930, 290);
  S.mine = new Item(W, 140, 80);
  el(S.mine.g, 'text', { x: 0, y: 14, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': type.label, 'font-weight': 700, fill: P.accent }, 'mine');
  el(S.mine.g, 'path', { d: 'M -60 34 q 15 -9 30 0 t 30 0 t 30 0 t 30 0', fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });
  S.cLoud = chip(W, 'out loud, once', { color: P.accent }).at(930, 700);
  S.cOpinions = chip(W, 'your own opinions', { color: P.ink }).at(930, 700);
  S.cThink = chip(W, 'I think', { color: P.accent }).at(820, 700);
  S.cIs = chip(W, 'it is', { color: P.dim }).at(1030, 700);
  S.isCross = el(W, 'g', { opacity: 0 });
  const cx = 1030, hw = S.cIs.w / 2 - 10; // ends inside the chip outline
  el(S.isCross, 'line', { x1: cx - hw, y1: 676, x2: cx + hw, y2: 724, stroke: P.hot, 'stroke-width': 5, 'stroke-linecap': 'round' });
  S.cHard = chip(W, 'hard to say', { color: P.hot }).at(930, 700);
  S.cCloned = chip(W, 'a cloned copy', { color: P.ink }).at(930, 700);

  // the end phrase, in screen space so the camera does not scale it
  S.lEnd = label(S.stage.hud, 'read the script out loud yourself', { size: 64 }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const endDim = dimAfter(t, c('checks'), 0.6);

  // ---------- reviewers ----------
  // carried over from the previous scene (shown from t = 0); they step aside while the cloned copy arrives, then return
  // dimmed further left for the closing wide view ("they only read, you hear")
  const away = ease.inOut(prog(t, c('matters'), 1));
  const revDim = lerp(1, 0.55, ease.inOut(prog(t, c('idonot'), 0.6))) * dimAfter(t, c('so'), 0.6) * (1 - away) + 0.35 * reveal(t, c('checks'), 0.6);
  const shift = away >= 1 ? -140 : 0; // moved only while invisible, clear of the copy's waveform
  S.critic.at(CRITIC[0] + shift, CRITIC[1]).show(1).dim(revDim);
  S.flow.at(FLOW[0] + shift - 20, FLOW[1]).show(1).dim(revDim);
  // the flow reviewer's lit ears (a listener) fade while "both reviewers read text", before the cross-out
  set(S.flow.lit, { opacity: +(1 - ease.inOut(prog(t, c('text') - 0.6, 0.9))).toFixed(3) });
  S.ticks.forEach((k, i) => k.show(reveal(t, c('both') + i * 0.25, 0.4) * (1 - away)).dim(dimAfter(t, c('reading'), 0.35) * revDim));
  [S.critic, S.flow].forEach((f) => set(f.slash, { opacity: +reveal(t, c('hear'), 0.4).toFixed(3) }));
  S.lReading.show(fadeBetween(t, c('reading'), c('neither'), 0.45));
  S.cHear.show(fadeBetween(t, c('hear'), c('so'), 0.45)).dim(dimAfter(t, c('sounds'), 0.35, 0.4));

  // ---------- the page: centre, then slides right to be read from ----------
  const slide = ease.inOut(prog(t, c('idonot') + 0.3, 1.4));
  const pageDim = lerp(1, 0.5, ease.inOut(prog(t, c('idonot'), 0.6))) + 0.5 * reveal(t, c('so'));
  S.page.at(lerp(PAGE0[0], PAGE1[0], slide), lerp(PAGE0[1], PAGE1[1], slide)).show(reveal(t, c('script'), 0.6))
    .dim(clamp(pageDim) * dimAfter(t, c('matters'), 0.6));
  // the reviewers read text: the outline sits on block 1, then 2, then 3 (snapped, fading between blocks)
  const k = prog(t, c('text'), 1.8) * 3, seg = Math.min(2, Math.floor(k));
  set(S.scan, { y: (ROWS[seg] + 34 - 58).toFixed(1), opacity: +(k >= 3 ? 0 : 0.4 * Math.sin(Math.PI * (k - seg))).toFixed(3) });
  const hardA = reveal(t, c('phrasew'), 0.5) * (1 - 0.6 * ease.inOut(prog(t, c('matters'), 0.6)));
  set(S.hardBar, { opacity: +hardA.toFixed(3) });
  set(S.squiggle, { opacity: +reveal(t, c('hard'), 0.4).toFixed(3) * (1 - 0.6 * ease.inOut(prog(t, c('matters'), 0.6))) });

  // ---------- hedged chips, each bright while spoken ----------
  const hc = ['sounds', 'joke', 'believe'];
  S.hedge.forEach((h, i) => h.show(fadeBetween(t, c(hc[i]), c('so') - 0.6, 0.45)).dim(i < 2 ? dimAfter(t, c(hc[i + 1]), 0.4) : 1));

  // ---------- the author reads it out loud ----------
  S.author.show(reveal(t, c('so'), 0.6));
  // you hear the phrases: the author's ears light while hearing, then settle at 0.6
  const earA = reveal(t, c('phrases'), 0.3) * (1 - 0.4 * ease.inOut(prog(t, c('say') + 0.5, 0.4)));
  set(S.author.lit, { opacity: +earA.toFixed(3) });
  // speech envelope: 1 while a word is spoken, falling to 0 within 0.25 s of the nearest word
  let d = 9;
  for (const [a, b] of S.words) d = Math.min(d, t < a ? a - t : t > b ? t - b : 0);
  const env = clamp(1 - d / 0.25);
  const drive = (wv, stumble) => wv.bars.forEach((b, i) => {
    const broken = i >= 3 && i <= 5 ? stumble : 0;
    // phase falls with i, so the peaks travel outward, away from the head
    const h = lerp(10, lerp(12 + 44 * Math.abs(Math.sin(t * 5.3 - i * 0.8)), 10, broken), env);
    set(b, { y: (428 - h / 2).toFixed(1), height: h.toFixed(1), fill: broken > 0.5 ? P.hot : P.accent, opacity: +(1 - i * 0.08).toFixed(3) });
  });
  S.wave.show(reveal(t, c('loud') - 0.2, 0.5) * (1 - ease.in(prog(t, c('cloned') - 0.45, 0.4)))).dim(endDim);
  drive(S.wave, 0);
  S.author.dim(endDim * lerp(1, 0.7, ease.inOut(prog(t, c('cloned'), 0.6))));
  S.copy.show(0.8 * reveal(t, c('cloned'), 0.5)).dim(endDim);
  S.copyWave.show(reveal(t, c('cloned') + 0.3, 0.5)).dim(endDim);
  drive(S.copyWave, fadeBetween(t, c('stumbles'), c('checks'), 0.3));
  S.cLater.show(reveal(t, c('later'), 0.5));
  S.mine.at(AUTHOR[0], 300, 1, -6).show(reveal(t, c('yours'), 0.5)).dim(endDim);

  S.cLoud.show(fadeBetween(t, c('loud') + 0.5, c('opinions') - 0.5, 0.45));
  S.cOpinions.show(fadeBetween(t, c('opinions'), c('ithink') - 0.5, 0.45));
  const thinkOut = c('aloud');
  S.cThink.show(fadeBetween(t, c('ithink'), thinkOut, 0.45));
  S.cIs.show(fadeBetween(t, c('itis'), thinkOut, 0.45));
  set(S.isCross, { opacity: +(reveal(t, c('itis') + 0.3, 0.4) * (1 - ease.in(prog(t, thinkOut, 0.45)))).toFixed(3) });
  S.cHard.show(fadeBetween(t, c('hard'), c('cloned') - 0.5, 0.45));
  S.cCloned.show(fadeBetween(t, c('cloned'), c('checks'), 0.45));

  S.lEnd.show(reveal(t, c('ways') + 0.6, 0.6));
}
