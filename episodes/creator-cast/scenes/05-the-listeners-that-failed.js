// 05 - the listeners that failed: a third listener should hear HOW the voice sounds.
// Two grey judges (the audio models) and a naturalness-score meter face eighteen clips (6 clean, 12 with a magenta defect, 4 of
// them sniffs). Both models stamp "yes" on every clip; the meter sits at the same mark on every clip. Then the plainer method:
// one episode of clips end to end, a baseline band, four small sniffs in quiet gaps poke past it, a scan rings them, two dim stray rings are false alarms.
// It ends wide and hedged: one test, one voice, not checked against my ears, only a candidate that I listen to.
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, measure } from 'kit';

export const meta = {
  cues: [
    { name: 'third', at: 'third listener' },
    { name: 'sounds', at: 'voice sounds' },
    { name: 'says', at: 'what it says' },
    { name: 'ran', at: 'So I ran' },
    { name: 'two', at: 'two AI models' },
    { name: 'audio', at: 'audio as input' },
    { name: 'score', at: 'naturalness score' },
    { name: 'clips', at: 'eighteen short clips' },
    { name: 'clean', at: 'some clean' },
    { name: 'sniff', at: 'with a sniff' },
    { name: 'loud', at: 'loud word' },
    { name: 'test', at: 'In my test' },
    { name: 'prompt', at: 'with my prompt' },
    { name: 'yes', at: 'said yes' },
    { name: 'pause', at: 'unnatural pause' },
    { name: 'every', at: 'to every clip' },
    { name: 'scoreGave', at: 'score gave' },
    { name: 'same', at: 'same number' },
    { name: 'cleanClips', at: 'the clean clips' },
    { name: 'broken', at: 'every broken one' },
    { name: 'what', at: 'What is promising' },
    { name: 'plainer', at: 'plainer' },
    { name: 'flag', at: 'flag a sound' },
    { name: 'stands', at: 'stands out' },
    { name: 'rest', at: 'the rest' },
    { name: 'episode', at: 'same episode' },
    { name: 'method', at: 'That method' },
    { name: 'four', at: 'four sniffs' },
    { name: 'alarms', at: 'two false alarms' },
    { name: 'oneTest', at: 'one test' },
    { name: 'oneVoice', at: 'one voice' },
    { name: 'notChecked', at: 'not checked' },
    { name: 'ears', at: 'my ears' },
    { name: 'flags', at: 'everything it flags' },
    { name: 'candidate', at: 'a candidate' },
  ],
};

const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const barH = (i, lo, hi) => lo + (hi - lo) * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));

// THE VOICE: rounded accent bars centred on a baseline (12 px on a 24 px pitch)
function wave(parent, n, hmax, gap = 24, bw = 12) {
  const it = new Item(parent, n * gap, hmax);
  it.bars = Array.from({ length: n }, (_, i) => {
    const h = barH(i, hmax * 0.25, hmax);
    const b = el(it.g, 'rect', { x: (i - (n - 1) / 2) * gap - bw / 2, y: -h / 2, width: bw, height: h, rx: bw / 2, fill: P.accent });
    b.h = h;
    return b;
  });
  it.play = (t, k) => it.bars.forEach((b, i) => {
    const g = Math.exp(-(((i - (((t / 1.8) % 1) * (n + 6) - 3)) ** 2) / 6));
    const h = b.h * (1 + 0.25 * g * k);
    set(b, { y: (-h / 2).toFixed(2), height: h.toFixed(2) });
  });
  return it;
}

// A LISTENER / JUDGE: dim head over a rounded body, about 226 px tall, never lit
function judge(parent) {
  const it = new Item(parent, 120, 226);
  const st = { fill: P.dim, 'fill-opacity': 0.22, stroke: P.dim, 'stroke-width': 4 };
  el(it.g, 'circle', { cx: 0, cy: -77, r: 36, ...st });
  el(it.g, 'rect', { x: -60, y: -33, width: 120, height: 146, rx: 30, ...st });
  return it;
}

// the verdict: a small speech bubble with "yes" in hot (placed relative to its judge)
function bubble(parent) {
  const size = 44, w = Math.ceil(measure('yes', size) + 48), h = 72;
  const it = new Item(parent, w, h + 18);
  const tl = -w / 2 + 22;   // tail base starts near the left corner and points down-left
  el(it.g, 'path', { d: `M ${-w / 2 + 18} ${-h / 2} H ${w / 2 - 18} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 18} V ${h / 2 - 18} Q ${w / 2} ${h / 2} ${w / 2 - 18} ${h / 2} H ${tl + 24} L ${tl - 8} ${h / 2 + 18} L ${tl} ${h / 2} H ${-w / 2 + 18} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 18} V ${-h / 2 + 18} Q ${-w / 2} ${-h / 2} ${-w / 2 + 18} ${-h / 2} Z`, fill: P.bg2, stroke: P.dim, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  el(it.g, 'text', { x: 0, y: size * 0.35, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: P.hot }, 'yes');
  return it;
}

// THE METER: a flat bar with a marker at a fixed place
function meter(parent, w = 130, mark = 0.62) {
  const it = new Item(parent, w, 24);
  el(it.g, 'rect', { x: -w / 2, y: -5, width: w, height: 10, rx: 5, fill: P.dim, 'fill-opacity': 0.45 });
  el(it.g, 'circle', { cx: -w / 2 + w * mark, cy: 0, r: 11, fill: P.ink });
  return it;
}

// the grid of eighteen clips (facts: 6 clean, 12 with a planted defect, 4 of them sniffs): 9 x 2 squares, each a tiny waveform;
// a defective clip carries one magenta bar out of place (tiny = sniff, tall = the other planted defects)
const SNIFFS = [1, 6, 10, 15], CLEAN = [3, 5, 8, 12, 13, 17];
const KIND = Array.from({ length: 18 }, (_, i) => (SNIFFS.includes(i) ? 'sniff' : CLEAN.includes(i) ? 'clean' : 'loud'));
const SQ = { w: 150, h: 170 };
const sqPos = (i) => [280 + (i % 9) * 170, i < 9 ? 585 : 775];
const FIGX = [260, 480], FIGY = 300, METER = [800, 300], COLX = 1330, COLY = [190, 280, 370];

// the episode: clips laid end to end (dim dividers), centred on y = 540; a small sniff in a quiet gap in four clips,
// two false alarms on ordinary bars in clips without a sniff
const EPN = 56, EPGAP = 26, EPX = (i) => 960 + (i - (EPN - 1) / 2) * EPGAP;
// a ring (r 68, about 2.6 bars) clears both the sniff tips (55 px) and the nearest divider
const SNIFF = [7, 21, 34, 48], FALSE = [14, 41], DIVIDE = [10.5, 17.5, 27.5, 37.5, 44.5], RING_R = 68;
const BAND = 44, SNIFF_H = 110;   // the band holds the ordinary bars (at most 80 px); a sniff (110 px) pokes just past it

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 540, z: 1.2 },          // close on the voice and the wished-for listener
    { cue: 'ran', dur: 1.4, x: 960, y: 540, z: 1 },        // wide: three judges and eighteen clips
    { cue: 'plainer', dur: 1.6, x: 960, y: 540, z: 1.12 }, // in on the one episode
    { cue: 'oneTest', dur: 1.6, x: 960, y: 540, z: 1 },    // wide again for the hedge
  ], ctx.cue);
  const W = S.stage.world;

  // opening: the voice, a third (dim) listener beside it, how it sounds vs what it says
  S.open = new Item(W);
  S.oWave = wave(S.open.g, 21, 160).at(1060, 470);
  S.oListener = judge(S.open.g).at(600, 470);
  S.oThird = label(S.open.g, 'a third listener', { size: type.label, color: P.dim }).at(600, 290);
  S.oSounds = label(S.open.g, 'how the voice sounds', { size: type.label, color: P.accent }).at(1060, 660);
  S.oSays = label(S.open.g, 'what it says', { size: type.note, color: P.dim }).at(1060, 750);

  // two judges (the audio models) with "yes" bubbles; the naturalness score is a meter, not a judge
  S.figs = FIGX.map((x) => judge(W).at(x, FIGY));
  S.bubbles = [0, 1].map((i) => bubble(W).at(FIGX[i] + 100, FIGY - 150));
  S.fMeter = meter(W, 220).at(...METER);
  // the audio going in: a tiny voice at each judge's feet, pushed back so the judges stay neutral
  S.inWaves = [0, 1].map((i) => wave(W, 5, 40, 16, 8).at(FIGX[i], FIGY + 158));

  // the clip grid
  S.sq = KIND.map((k, i) => {
    const it = new Item(W, SQ.w, SQ.h);
    it.frame = el(it.g, 'rect', { x: -SQ.w / 2, y: -SQ.h / 2, width: SQ.w, height: SQ.h, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
    it.wave = wave(it.g, 7, 46, 16, 8).at(0, -42).show(1);
    if (k !== 'clean') {
      const h = k === 'sniff' ? 16 : 72;
      it.mark = el(it.g, 'rect', { x: -4, y: -42 - h / 2, width: 8, height: h, rx: 4, fill: P.hot, opacity: 0 });
    }
    it.yes = el(it.g, 'text', { x: 0, y: 32, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': type.note, 'font-weight': 700, fill: P.hot, opacity: 0 }, 'yes');
    it.meter = meter(it.g, 110).at(0, 62);
    it.kind = k;
    return it.at(...sqPos(i));
  });

  // the label column on the right, in three successive sets
  const col = (list) => list.map(([s, color], i) => label(W, s, { size: type.label, color }).at(COLX, COLY[i]));
  S.colB = col([['two AI models', P.ink], ['a naturalness score', P.ink], ['eighteen short clips', P.ink]]);
  S.colC = col([['in my test', P.dim], ['with my prompt', P.dim], ['unnatural pause', P.hot]]);
  S.colD = col([['the same number', P.ink], ['the clean clips', P.accent], ['every broken one', P.hot]]);

  // the episode: band behind, bars, the four sniffs, the scan, the rings
  S.ep = new Item(W);
  S.band = el(S.ep.g, 'rect', { x: EPX(0) - 30, y: 540 - BAND, width: EPX(EPN - 1) - EPX(0) + 60, height: 2 * BAND, rx: 16, fill: P.accent, 'fill-opacity': 0.08, stroke: P.accent, 'stroke-opacity': 0.45, 'stroke-width': 3, opacity: 0 });
  S.dividers = DIVIDE.map((d) => el(S.ep.g, 'line', { x1: EPX(d), x2: EPX(d), y1: 470, y2: 610, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }));
  S.epBars = Array.from({ length: EPN }, (_, i) => {
    if (SNIFF.includes(i)) return null;
    // a quiet gap around each sniff, so the small magenta mark stands out by place as well as height
    const h = SNIFF.some((s) => Math.abs(s - i) <= 2) ? 14 : barH(i, 20, 80);
    return el(S.ep.g, 'rect', { x: EPX(i) - 6, y: 540 - h / 2, width: 12, height: h, rx: 6, fill: P.accent, opacity: 0 });
  });
  S.sniffBars = SNIFF.map((i) => el(S.ep.g, 'rect', { x: EPX(i) - 6, y: 520, width: 12, height: 40, rx: 6, fill: P.hot, opacity: 0 }));
  S.scan = el(S.ep.g, 'line', { x1: 0, y1: 440, x2: 0, y2: 640, ...stroke(P.accent, 4), opacity: 0 });
  S.rings = SNIFF.map((i) => el(S.ep.g, 'circle', { cx: EPX(i), cy: 540, r: RING_R, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 }));
  S.falseRings = FALSE.map((i) => el(S.ep.g, 'circle', { cx: EPX(i), cy: 540, r: RING_R, fill: 'none', stroke: P.dim, 'stroke-width': 3, opacity: 0 }));
  S.eFlag = label(W, 'flag a sound', { size: type.label, color: P.ink }).at(960, 200);
  S.eStands = label(W, 'stands out', { size: type.label, color: P.hot }).at(960, 290);
  S.eEpisode = label(W, 'the same episode', { size: type.label, color: P.accent }).at(960, 760);
  S.eFour = label(W, 'all four sniffs', { size: type.label, color: P.hot }).at(960, 200);
  S.eAlarms = label(W, 'two false alarms', { size: type.label, color: P.dim }).at(960, 290);

  // the hedge
  S.gTest = chip(W, 'one test', { size: type.label, color: P.dim }).at(800, 200);
  S.gVoice = chip(W, 'one voice', { size: type.label, color: P.dim }).at(1130, 200);
  S.gNot = label(W, 'not checked', { size: type.label, color: P.dim }).at(960, 290);
  S.gEars = label(W, 'against my ears', { size: type.label, color: P.ink }).at(960, 365);

  S.final = label(S.stage.hud, 'only a candidate that I listen to', { size: 64, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // opening: the voice plays; the third listener is wished for; how it sounds is bright, what it says is the old, dim job
  S.open.show(1 - ease.inOut(prog(t, c('ran'), 0.5)));
  S.oWave.show(1);
  S.oWave.play(t, reveal(t, c('sounds'), 0.4));
  S.oListener.show(reveal(t, c('third'), 0.6));
  S.oThird.show(reveal(t, c('third'), 0.5)).dim(dimAfter(t, c('sounds'), 0.35));
  S.oSounds.show(reveal(t, c('sounds'), 0.5)).dim(dimAfter(t, c('says'), 0.6));
  S.oSays.show(reveal(t, c('says'), 0.5));

  // everything of the judging part leaves together on "What is promising"
  const out = 1 - ease.inOut(prog(t, c('what'), 0.7));

  // judges on "two AI models", the meter on "naturalness score"; the one being spoken is bright
  const mFocus = Math.max(1 - reveal(t, c('score'), 0.5), fadeBetween(t, c('yes'), c('scoreGave')));
  const sFocus = Math.max(fadeBetween(t, c('score'), c('clips')), reveal(t, c('scoreGave'), 0.5));
  S.figs.forEach((f, i) => f.show(reveal(t, c('two') + 0.3 + i * 0.2, 0.6) * out).dim(lerp(0.35, 1, mFocus)));
  S.bubbles.forEach((b, i) => b.show(reveal(t, c('yes') + i * 0.2, 0.4) * out).dim(lerp(0.35, 1, mFocus)));
  S.fMeter.show(reveal(t, c('score') + 0.3, 0.5) * out).dim(lerp(0.35, 1, sFocus));
  S.inWaves.forEach((w, i) => {
    w.show(fadeBetween(t, c('audio') + i * 0.15, c('clips'))).dim(0.45);
    w.play(t, 1);
  });

  // the grid: squares appear on "eighteen", clean ones glint on "some clean", magenta marks on "sniff" and "loud word"
  S.sq.forEach((s, i) => {
    s.show(reveal(t, c('clips') + i * 0.04, 0.4) * out);
    const glint = s.kind === 'clean' ? fadeBetween(t, c('clean'), c('sniff'), 0.3) : 0;
    set(s.frame, { stroke: glint > 0.5 ? P.accent : P.dim, 'stroke-width': +(3 + 2 * glint).toFixed(2) });
    if (s.mark) set(s.mark, { opacity: +reveal(t, c(s.kind === 'sniff' ? 'sniff' : 'loud') + (i % 9) * 0.03, 0.4).toFixed(3) });
    set(s.yes, { opacity: +reveal(t, c('every') + i * 0.06, 0.25).toFixed(3) });
    s.meter.show(reveal(t, c('same') + i * 0.05, 0.3));
    const isClean = s.kind === 'clean';
    const dCl = isClean ? 1 : 0.4, dBr = isClean ? 0.4 : 1;
    const k1 = reveal(t, c('cleanClips'), 0.4), k2 = reveal(t, c('broken'), 0.4);
    s.dim(lerp(lerp(1, dCl, k1), dBr, k2));
  });

  // label column: three sets, each fades fully out before the next fades in
  const colSet = (list, cues, inT, outT) => list.forEach((l, i) => l.show(reveal(t, c(cues[i]), 0.5) * (1 - ease.in(prog(t, outT, 0.4)))).dim(i < 2 ? dimAfter(t, c(cues[i + 1]), 0.35) : 1));
  colSet(S.colB, ['two', 'score', 'clips'], 0, c('test') - 0.45);
  colSet(S.colC, ['test', 'prompt', 'pause'], 0, c('scoreGave') - 0.45);
  colSet(S.colD, ['same', 'cleanClips', 'broken'], 0, c('what'));

  // the episode: bars build on "plainer", sniffs rise on "stands out", the band of the rest, the scan and the rings
  S.ep.show(1);
  S.epBars.forEach((b, i) => { if (b) set(b, { opacity: +reveal(t, c('plainer') + (i / EPN) * 0.9, 0.3).toFixed(3) }); });
  const rise = ease.out(prog(t, c('stands'), 0.8));
  S.sniffBars.forEach((b, k) => {
    const h = lerp(40, SNIFF_H, rise);
    set(b, { y: (540 - h / 2).toFixed(2), height: h.toFixed(2), opacity: +reveal(t, c('plainer') + (SNIFF[k] / EPN) * 0.9, 0.3).toFixed(3) });
  });
  set(S.band, { opacity: +reveal(t, c('rest'), 0.6).toFixed(3) });
  S.dividers.forEach((d) => set(d, { opacity: +(0.6 * reveal(t, c('episode'), 0.6)).toFixed(3) }));
  const scanStart = c('method') + 0.3, scanDur = 1.8;
  const sc = prog(t, scanStart, scanDur);
  const x0 = EPX(0) - 20, x1 = EPX(EPN - 1) + 20, scx = lerp(x0, x1, ease.inOut(sc));
  set(S.scan, { x1: scx.toFixed(1), x2: scx.toFixed(1), opacity: +(sc > 0 && sc < 1 ? Math.min(1, sc * 8, (1 - sc) * 8) : 0).toFixed(3) });
  // the time the scan passes a bar (inverse of the eased sweep, found by bisection)
  const passT = (x) => { let lo = 0, hi = 1; for (let n = 0; n < 20; n++) { const m = (lo + hi) / 2; if (lerp(x0, x1, ease.inOut(m)) < x) lo = m; else hi = m; } return scanStart + lo * scanDur; };
  const pulse = fadeBetween(t, c('flags'), c('flags') + 0.6, 0.3);
  S.rings.forEach((r, k) => {
    const p = ease.out(prog(t, passT(EPX(SNIFF[k])), 0.4));
    set(r, { r: lerp(RING_R + 40, RING_R, p).toFixed(2), opacity: +(p > 0 ? Math.min(1, p * 2) : 0).toFixed(3), 'stroke-width': +(3 + 2 * pulse).toFixed(2) });
  });
  S.falseRings.forEach((r, k) => {
    const p = ease.out(prog(t, c('alarms') + 0.3 + k * 0.3, 0.4));
    set(r, { r: lerp(RING_R + 30, RING_R, p).toFixed(2), opacity: +(p > 0 ? Math.min(1, p * 2) : 0).toFixed(3), 'stroke-width': +(3 + 2 * pulse).toFixed(2) });
  });
  const eOut1 = 1 - ease.in(prog(t, c('method'), 0.4));
  S.eFlag.show(reveal(t, c('flag'), 0.5) * eOut1).dim(dimAfter(t, c('stands'), 0.35));
  S.eStands.show(reveal(t, c('stands'), 0.5) * eOut1);
  S.eEpisode.show(reveal(t, c('episode'), 0.5) * (1 - ease.in(prog(t, c('flags') - 0.6, 0.4)))).dim(dimAfter(t, c('method'), 0.35));
  const eOut2 = 1 - ease.in(prog(t, c('oneTest') - 0.45, 0.4));
  S.eFour.show(reveal(t, c('four'), 0.5) * eOut2).dim(dimAfter(t, c('alarms'), 0.35));
  S.eAlarms.show(reveal(t, c('alarms'), 0.5) * eOut2);

  // the hedge: one test, one voice, not checked against my ears
  S.gTest.show(reveal(t, c('oneTest') + 0.2, 0.5)).dim(dimAfter(t, c('notChecked'), 0.5));
  S.gVoice.show(reveal(t, c('oneVoice'), 0.5)).dim(dimAfter(t, c('notChecked'), 0.5));
  S.gNot.show(reveal(t, c('notChecked'), 0.5));
  S.gEars.show(reveal(t, c('ears'), 0.5));

  // the closing phrase dominates; the rest drops back to half
  const fin = reveal(t, c('candidate'), 0.6);
  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.5, fin).toFixed(3) });
}
