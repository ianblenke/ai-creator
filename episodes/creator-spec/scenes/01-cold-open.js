// Scene 01: cold open. A planted line on a script page, a silent voice, a scan that rings three hot marks.
import { palette as P, ease, lerp, el, set, prog } from 'style';
import { type, chip, label, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'page', at: 'I added' },
    { name: 'line', at: 'one line' },
    { name: 'm1', at: 'machine name' },
    { name: 'm2', at: 'made-up address' },
    { name: 'm3', at: 'made-up port' },
    { name: 'reach', at: 'reached the voice' },
    { name: 'clone', at: 'my voice clone' },
    { name: 'loud', at: 'read it out loud' },
    { name: 'instead', at: 'Instead' },
    { name: 'check', at: 'safety check' },
    { name: 'caught', at: 'caught it' },
    { name: 'recording', at: 'before any recording' },
    { name: 'told', at: 'told me' },
    { name: 'which', at: 'which line' },
    { name: 'kind', at: 'what kind of thing' },
    { name: 'word', at: 'A word you' },
    { name: 'notice', at: 'not notice' },
    { name: 'public', at: 'public' },
    { name: 'check2', at: 'that check only' },
    { name: 'so', at: 'So most' },
    { name: 'before', at: 'comes before it' },
    { name: 'says', at: 'video says' },
    { name: 'fact', at: 'each fact' },
    { name: 'never', at: 'must never appear' },
  ],
};

// page geometry (bible: 360 x 470, rx 24); world centre x 760, the camera starts on it (screen x 960) and glides right when the voice arrives
const PX = 580, PY = 245, PW = 360, PH = 470;
const LINE_Y = 440;
const MARKS = [668, 760, 852]; // machine name, address, port (left to right, as spoken)
const QUIET = [872, 635]; // the unnoticed mark
const SWEEP_DUR = 1.8;
// sweep y = lerp(295, 695, ease.inOut(p)); LINE_Y is at fraction 0.3625 (< 0.5, so inOut(p) = 2p^2)
const LINE_P = Math.sqrt((LINE_Y - (PY + 50)) / (PH - 70) / 2);
const QUIET_F = (QUIET[1] - (PY + 50)) / (PH - 70);
const QUIET_P = 1 - Math.sqrt((1 - QUIET_F) / 2);
const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z'; // scene 08's shield
const SHIELD_S = 0.55; // scene 02's stop-icon scale
const WAVE_X = 1560, WAVE_Y = 480;
const HEIGHTS = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6];

let S;
const group = (parent) => new Item(parent);

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 760, y: 500, z: 1 },
    { cue: 'reach', dur: 1.2, x: 960, y: 500, z: 1 },
    { cue: 'told', dur: 1.6, x: 1100, y: 470, z: 1.15 },
    { cue: 'word', dur: 1.6, x: 960, y: 500, z: 1 },
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // the script page
  S.page = group(W);
  el(S.page.g, 'rect', { x: PX, y: PY, width: PW, height: PH, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.bars = group(S.page.g);
  const bar = (y, w, head) => el(S.bars.g, 'rect', { x: 630, y: y - (head ? 9 : 7), width: w, height: head ? 18 : 14, rx: 7, fill: P.ink, opacity: head ? 0.9 : 0.4 });
  // rows keep clear lanes at y 376/398 and 488 for the leader lines
  bar(295, 200, true); bar(340, 260); bar(530, 210);
  bar(590, 180, true); bar(635, 260); bar(675, 150);
  // the planted line, its three hot marks, the unnoticed mark
  S.line = el(S.page.g, 'rect', { x: 630, y: LINE_Y - 7, width: 260, height: 14, rx: 7, fill: P.ink, opacity: 0.4 });
  S.marks = MARKS.map((x) => el(S.page.g, 'rect', { x: x - 18, y: LINE_Y - 9, width: 36, height: 18, rx: 6, fill: P.hot, opacity: 0 }));
  S.quiet = el(S.page.g, 'rect', { x: QUIET[0] - 18, y: QUIET[1] - 9, width: 36, height: 18, rx: 6, fill: P.hot, opacity: 0 });
  S.quietRing = el(S.page.g, 'circle', { cx: QUIET[0], cy: QUIET[1], r: 64, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '10 10', opacity: 0 });
  S.bracket = el(S.page.g, 'rect', { x: 612, y: 400, width: 296, height: 80, rx: 16, fill: 'none', stroke: P.accent, 'stroke-width': 3, opacity: 0 });
  S.rings = MARKS.map((x) => el(S.page.g, 'circle', { cx: x, cy: LINE_Y, r: 32, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 }));
  // the scan line
  S.scan = el(S.page.g, 'g', { opacity: 0 });
  el(S.scan, 'rect', { x: PX + 14, y: -36, width: PW - 28, height: 36, fill: P.accent, opacity: 0.12 });
  el(S.scan, 'line', { x1: PX + 14, x2: PX + PW - 14, y1: 0, y2: 0, stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });

  // the safety check: the series shield (scene 08's outline and denylist) as a small icon, with its name
  S.shield = new Item(W, 220, 260).at(565, 165, SHIELD_S);
  el(S.shield.g, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': +(6 / SHIELD_S).toFixed(2), 'stroke-linejoin': 'round' });
  [[120, -62], [96, -22], [120, 18], [80, 58]].forEach(([w, y]) => el(S.shield.g, 'rect', { x: -w / 2, y: y - 9, width: w, height: 18, rx: 9, fill: P.ink }));
  S.checkChip = chip(W, 'the safety check', { color: P.accent });
  S.checkChip.at(650 + S.checkChip.w / 2, 170);

  // what kind of thing it found: labels at the right, with leader lines
  // leader k starts at mark k and runs out through the clear lanes, then outside the page (x 965)
  S.leaders = [
    [[668, 408], [668, 376], [965, 376], [965, 330], [990, 330]],
    [[760, 408], [760, 398], [977, 398], [977, 440], [990, 440]],
    [[852, 472], [852, 488], [965, 488], [965, 550], [990, 550]],
  ].map((pts) => el(W, 'polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 }));
  S.labels = [['a machine name', 330], ['an address', 440], ['a port', 550]].map(([txt, y]) => {
    const c = chip(W, txt, { color: P.hot });
    return c.at(1000 + c.w / 2, y);
  });

  // the voice, flat and silent
  S.wave = group(W);
  el(S.wave.g, 'line', { x1: WAVE_X - 142, x2: WAVE_X + 142, y1: WAVE_Y, y2: WAVE_Y, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' });
  S.ghost = group(W);
  HEIGHTS.forEach((h, i) => {
    const bh = h * 60;
    el(S.ghost.g, 'rect', { x: WAVE_X - 136 + i * 34 - 6, y: WAVE_Y - bh / 2, width: 12, height: bh, rx: 4, fill: P.dim });
  });
  S.voiceChip = chip(W, 'my voice clone', { color: P.accent }).at(WAVE_X, 580);
  S.reach = el(W, 'line', { x1: 905, y1: LINE_Y, x2: 1400, y2: WAVE_Y, stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '12 12', 'stroke-linecap': 'round', opacity: 0 });

  // "before any recording": a dim stop cross on the path to the voice
  S.stop = el(W, 'g', { opacity: 0, stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round' });
  el(S.stop, 'line', { x1: 1126, y1: 436, x2: 1174, y2: 484 });
  el(S.stop, 'line', { x1: 1174, y1: 436, x2: 1126, y2: 484 });

  // the word nobody noticed
  S.pubLeader = el(W, 'line', { x1: QUIET[0] + 22, y1: QUIET[1], x2: 1000, y2: QUIET[1], stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 8', opacity: 0 });
  S.pubChip = chip(W, 'ends up public', { color: P.dim, dashed: true });
  S.pubChip.at(1010 + S.pubChip.w / 2, QUIET[1]);

  // the close
  S.title = label(W, 'What comes before it', { size: 64 }).at(1360, 300);
  S.closers = [['what a video says', P.ink], ['where facts come from', P.accent], ['what must never appear', P.hot]]
    .map(([txt, c], i) => chip(W, txt, { color: c }).at(1360, 430 + i * 100));
}

export function render(ctx, t) {
  const cue = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const so = cue('so');

  // page and bars; spotlight the line, push the page back at the close
  S.page.show(reveal(t, cue('page'), 0.7)).dim(lerp(1, 0.5, ease.inOut(prog(t, so, 0.8))));
  const ringPhase = fadeBetween(t, cue('which'), cue('word'), 0.6);
  set(S.bars.g, { opacity: +(1 - 0.6 * ringPhase).toFixed(3) });
  set(S.line, { opacity: +lerp(0.4, 1, reveal(t, cue('line'), 0.5)).toFixed(3) });
  S.marks.forEach((m, i) => set(m, { opacity: +reveal(t, cue(['m1', 'm2', 'm3'][i]), 0.4).toFixed(3) }));
  set(S.quiet, { opacity: +(reveal(t, cue('notice'), 0.5) * 0.5).toFixed(3) });
  set(S.bracket, { opacity: +fadeBetween(t, cue('which'), cue('kind'), 0.4).toFixed(3) });

  // scan sweeps: once for the check, once for "only knows what it has been taught"
  const sweep = (t0, dur) => {
    const p = prog(t, t0, dur);
    return { y: lerp(PY + 50, PY + PH - 20, ease.inOut(p)), a: p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 8) : 0 };
  };
  const t1 = cue('caught') - 0.3, t2 = cue('check2') + 0.2;
  const s1 = sweep(t1, SWEEP_DUR), s2 = sweep(t2, SWEEP_DUR);
  const s = s1.a > 0 ? s1 : s2;
  set(S.scan, { opacity: +s.a.toFixed(3), transform: `translate(0 ${s.y.toFixed(1)})` });

  // rings close the moment the first sweep crosses the line; labels follow on "what kind of thing"
  const kind = cue('kind');
  const tCross = t1 + SWEEP_DUR * LINE_P;
  const flash = s2.a > 0 ? Math.max(0, 1 - Math.abs(s2.y - LINE_Y) / 60) : 0; // second sweep re-lights the found marks only
  MARKS.forEach((_, k) => {
    const p = ease.out(prog(t, tCross + k * 0.12, 0.45));
    const d = lerp(1, 0.35, ease.inOut(prog(t, cue('notice'), 0.6)));
    const a = p * Math.max(d, flash) * (1 - 0.5 * ease.inOut(prog(t, so, 0.8)));
    set(S.rings[k], { r: lerp(72, 32, p).toFixed(2), opacity: +a.toFixed(3) });
    const la = reveal(t, kind + 0.4 + k * 0.4, 0.4) * (1 - ease.in(prog(t, so, 0.5)));
    set(S.leaders[k], { opacity: +(la * d).toFixed(3) });
    S.labels[k].show(la).dim(d);
  });
  // the second sweep passes the unnoticed mark: it brightens, a dashed ring starts and never closes
  const qf = Math.sin(Math.PI * prog(t, t2 + SWEEP_DUR * QUIET_P - 0.25, 0.9));
  set(S.quietRing, { r: lerp(72, 54, qf).toFixed(2), opacity: +(0.8 * qf * (1 - ease.in(prog(t, so, 0.5)))).toFixed(3) });

  // the voice: flat, never speaks; the "would have" ghost is dim filled bars
  const voiceOut = 1 - ease.in(prog(t, so, 0.5));
  S.wave.show(reveal(t, cue('reach') + 0.8, 0.5) * voiceOut).dim(dimAfter(t, cue('told'), 0.6));
  S.voiceChip.show(reveal(t, cue('clone'), 0.5) * voiceOut).dim(dimAfter(t, cue('told'), 0.4));
  set(S.reach, { opacity: +(fadeBetween(t, cue('reach'), cue('told'), 0.5) * dimAfter(t, cue('instead'), 0.6, 0.5)).toFixed(3) });
  set(S.stop, { opacity: +fadeBetween(t, cue('recording'), cue('told'), 0.4).toFixed(3) });
  S.ghost.show(0.5 * fadeBetween(t, cue('loud'), cue('instead'), 0.5));

  const chk = lerp(dimAfter(t, cue('told'), 0.5), 0.35, ease.inOut(prog(t, so, 0.8)));
  S.shield.show(reveal(t, cue('check'), 0.5)).dim(chk);
  S.checkChip.show(reveal(t, cue('check'), 0.5)).dim(chk);

  // the word nobody noticed
  const pub = reveal(t, cue('public'), 0.5) * (1 - ease.in(prog(t, so, 0.5)));
  set(S.pubLeader, { opacity: +pub.toFixed(3) });
  S.pubChip.show(pub);

  // the close: what comes before the check
  S.title.show(reveal(t, cue('before'), 0.6));
  const cs = ['says', 'fact', 'never'].map((n) => cue(n));
  S.closers.forEach((c, i) => c.show(reveal(t, cs[i], 0.5)).dim(i < 2 ? dimAfter(t, cs[i + 1], 0.35) : 1));
}
