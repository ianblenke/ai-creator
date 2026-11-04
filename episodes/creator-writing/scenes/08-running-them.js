// Scene 08: running them. Each reviewer sees only its own input (the critic its facts, the flow review only the script),
// each in its own fresh folder; the flow review gets no fact sheet. Both run read-only inside a terminal agent.
// The three parts cross-fade in place (never an empty frame). Then the order: critic, fix, flow review, fix, a loop back, and a gate before recording.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, label, chip, arrow, curve, flow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, fitSize, measure, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'both', at: 'Both reviewers' },
    { name: 'critic', at: 'the critic its facts' },
    { name: 'flow', at: 'the flow review only' },
    { name: 'each', at: 'run each one' },
    { name: 'folder', at: 'fresh folder' },
    { name: 'input', at: 'input files' },
    { name: 'flowgets', at: 'The flow review gets' },
    { name: 'nofacts', at: 'no fact sheet' },
    { name: 'listener', at: 'a listener has none' },
    { name: 'stop', at: 'stop either one' },
    { name: 'agent', at: 'Claude Code agent' },
    { name: 'terminal', at: 'runs in a terminal' },
    { name: 'read', at: 'only to read files' },
    { name: 'cfirst', at: 'The critic goes' },
    { name: 'smoothing', at: 'smoothing a sentence' },
    { name: 'wrong', at: 'turns out to be wrong' },
    { name: 'fix1', at: 'fix what it found' },
    { name: 'flowrun', at: 'run the flow review and fix' },
    { name: 'fix2', at: 'fix again' },
    { name: 'high', at: 'high and every' },
    { name: 'medium', at: 'medium' },
    { name: 'more', at: 'once more' },
    { name: 'newscript', at: 'new script' },
    { name: 'before', at: 'before any recording' },
    { name: 'costs', at: 'costs nothing' },
    { name: 'later', at: 'changing it later' },
    { name: 'again', at: 'recording it again' },
  ],
};

const bar = (g, x, y, w, h, color, op = 1) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color, opacity: op });
const fadeOut = (t, at, dur = 0.35) => 1 - ease.in(prog(t, at, dur));
const STROKE = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

/** THE PAGE (360 x 470): 'script' (three heading bars on the left) or 'facts' (link, ruler and tilde tagged rows). */
function page(parent, kind) {
  const it = new Item(parent, 360, 470);
  el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  if (kind === 'script') {
    [-160, -10, 140].forEach((y) => {
      bar(it.g, -150, y - 10, 52, 22, P.ink); // short thick heading bar (bible canon)
      [[0, 210], [36, 240], [72, 180]].forEach(([dy, w]) => bar(it.g, -78, y + dy - 10, w, 14, P.ink, 0.55));
    });
  } else {
    const s = { ...STROKE, stroke: P.ink, 'stroke-width': 4 };
    [-120, 0, 120].forEach((y, i) => {
      el(it.g, 'rect', { x: -150, y: y - 28, width: 76, height: 56, rx: 14, fill: 'none', stroke: P.dim, 'stroke-width': 3 });
      if (i === 0) { el(it.g, 'ellipse', { cx: -122, cy: y, rx: 14, ry: 9, ...s }); el(it.g, 'ellipse', { cx: -102, cy: y, rx: 14, ry: 9, ...s }); }
      if (i === 1) { el(it.g, 'rect', { x: -138, y: y - 9, width: 52, height: 18, rx: 3, ...s }); [-126, -112, -98].forEach((x) => el(it.g, 'line', { x1: x, y1: y - 9, x2: x, y2: y - 1, ...s, 'stroke-width': 3 })); }
      if (i === 2) el(it.g, 'path', { d: `M -134 ${y + 4} Q -124 ${y - 10} -112 ${y} Q -100 ${y + 10} -90 ${y - 4}`, ...s });
      bar(it.g, -50, y - 12, 190, 14, P.ink, 0.55);
      bar(it.g, -50, y + 16, 140, 14, P.ink, 0.55);
    });
  }
  return it;
}

/** A REVIEWER: the neutral figure (about 220 px tall) with a magnifier; `ears` lights the listener's ears. */
function reviewer(parent) {
  const it = new Item(parent, 240, 230);
  el(it.g, 'path', { d: 'M -62 110 L -62 0 Q -62 -34 -28 -34 L 28 -34 Q 62 -34 62 0 L 62 110 Z', fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  el(it.g, 'circle', { cx: 0, cy: -76, r: 34, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  const ear = (c) => el(it.g, 'path', { d: 'M -40 -90 Q -54 -76 -40 -62 M 40 -90 Q 54 -76 40 -62', ...STROKE, stroke: c, 'stroke-width': 5 });
  ear(P.dim);
  it.ears = ear(P.accent);
  el(it.g, 'line', { x1: 74, y1: 24, x2: 54, y2: 48, ...STROKE, stroke: P.ink, 'stroke-width': 7 });
  el(it.g, 'circle', { cx: 90, cy: 6, r: 24, fill: P.bg, 'fill-opacity': 0.5, stroke: P.ink, 'stroke-width': 5 });
  it.waves = el(it.g, 'path', { d: 'M -66 -98 Q -82 -76 -66 -54 M -84 -110 Q -106 -76 -84 -42', ...STROKE, stroke: P.accent, 'stroke-width': 5, opacity: 0 });
  it.lit = (a) => set(it.ears, { opacity: +a.toFixed(3) });
  it.lit(0);
  return it;
}

/** A fresh folder (700 x 610 with its tab), the tab labelled. */
function folder(parent) {
  const it = new Item(parent, 700, 620);
  const T = -326 + measure('fresh folder', type.label) + 48; // tab end fits its 48 px label (38 px on screen at zoom 0.8)
  el(it.g, 'path', { d: `M -350 305 L -350 -231 Q -350 -255 -326 -255 L -326 -291 Q -326 -315 -302 -315 L ${T - 20} -315 Q ${T} -315 ${T + 8} -295 L ${T + 18} -255 L 326 -255 Q 350 -255 350 -231 L 350 281 Q 350 305 326 305 Z`, fill: 'none', stroke: P.accent, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  label(it.g, 'fresh folder', { size: type.label, color: P.accent }).show(1).at((-326 + T) / 2 + 4, -284);
  return it;
}

function pencil(parent) {
  const it = new Item(parent, 160, 160);
  const g = el(it.g, 'g', { transform: 'rotate(-45)' });
  el(g, 'rect', { x: -70, y: -14, width: 110, height: 28, rx: 6, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  el(g, 'path', { d: 'M 40 -14 L 70 0 L 40 14', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(it.g, 'path', { d: 'M -62 -62 L 62 62 M 62 -62 L -62 62', ...STROKE, stroke: P.hot, 'stroke-width': 7, opacity: 0.7 });
  return it;
}

function mic(parent) {
  const it = new Item(parent, 100, 160);
  const s = { ...STROKE, stroke: P.ink, 'stroke-width': 5 };
  el(it.g, 'rect', { x: -26, y: -70, width: 52, height: 92, rx: 26, ...s });
  el(it.g, 'path', { d: 'M -42 -4 Q -42 48 0 48 Q 42 48 42 -4 M 0 48 L 0 72 M -28 72 L 28 72', ...s });
  it.ring = el(it.g, 'circle', { cx: 0, cy: -2, r: 94, fill: 'none', stroke: P.hot, 'stroke-width': 4, opacity: 0 });
  return it;
}

/** A step box of the route: a dim outline with an accent outline on top that lights when named. */
function stepBox(parent, text) {
  const it = new Item(parent, 290, 150);
  el(it.g, 'rect', { x: -145, y: -75, width: 290, height: 150, rx: 28, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  it.on = el(it.g, 'rect', { x: -145, y: -75, width: 290, height: 150, rx: 28, fill: P.accent, 'fill-opacity': 0.1, stroke: P.accent, 'stroke-width': 5, opacity: 0 });
  label(it.g, text, { size: fitSize(text, 250, type.label, 42) }).show(1).at(0, 0);
  return it;
}

let S;
export function setup(ctx) {
  const c = ctx.cue;
  const stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 560, z: 1.06 },
    { cue: 'each', dur: 1.0, x: 960, y: 560, z: 1 },
    { cue: 'flowgets', delay: 0.35, dur: 1.05, x: 1225, y: 560, z: 0.8 }, // wide enough for both folders and the crossed-out sheet
    { cue: 'stop', delay: 0.5, dur: 1.1, x: 960, y: 540, z: 1 },
    { cue: 'cfirst', delay: 0.2, dur: 1.2, x: 760, y: 540, z: 1 }, // centre the short route row
    { cue: 'flowrun', delay: -0.2, dur: 1.4, x: 960, y: 540, z: 1 },
    { cue: 'before', delay: 0, dur: 1.4, x: 960, y: 550, z: 0.94 },
  ], c);
  const w = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // A: two folders, each reviewer with only its input
  S.folderC = folder(w).at(560, 475);
  S.folderF = folder(w).at(1360, 475);

  // B: the terminal agent (drawn under the reviewers, who move inside it)
  S.term = new Item(w, 1360, 730);
  el(S.term.g, 'rect', { x: -680, y: -365, width: 1360, height: 730, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.term.g, 'line', { x1: -680, y1: -290, x2: 680, y2: -290, stroke: P.dim, 'stroke-width': 3 });
  [-640, -608, -576].forEach((x) => el(S.term.g, 'circle', { cx: x, cy: -328, r: 9, fill: P.dim }));
  label(S.term.g, 'Claude Code').show(1).at(0, -328);
  S.term.at(960, 505);
  S.caret = el(w, 'path', { d: 'M 1000 272 L 1024 290 L 1000 308', ...STROKE, stroke: P.accent, 'stroke-width': 6, opacity: 0 });
  S.cursor = el(w, 'rect', { x: 1044, y: 272, width: 22, height: 36, fill: P.accent, opacity: 0 });
  S.readChip = chip(w, 'only to read files', { size: type.label }).at(1300, 290);
  S.readPage = page(w, 'script').at(1300, 620);
  el(S.readPage.g, 'line', { x1: 82, y1: 12, x2: 132, y2: 62, ...STROKE, stroke: P.ink, 'stroke-width': 9 });
  el(S.readPage.g, 'circle', { cx: 30, cy: -40, r: 72, fill: P.bg, 'fill-opacity': 0.4, stroke: P.ink, 'stroke-width': 6 });

  S.facts = page(w, 'facts').at(690, 495);
  S.script = page(w, 'script').at(1490, 495);
  S.critic = reviewer(w).at(330, 520);
  S.flowR = reviewer(w).at(1130, 520);
  S.pencil = pencil(w).at(630, 395); // centred over both reviewers once they stand in the terminal
  S.labCritic = label(w, 'the critic').at(560, 850);
  S.labFlow = label(w, 'the flow review').at(1360, 850);
  S.flowC = flow(w, [[505, 470], [430, 500]], { n: 3, r: 8, period: 1.4 });
  S.flowF = flow(w, [[1305, 470], [1230, 500]], { n: 3, r: 8, period: 1.4 });
  S.noFacts = page(w, 'facts').at(2060, 495);
  S.noCross = el(S.noFacts.g, 'path', { d: 'M -120 -150 L 120 150 M 120 -150 L -120 150', ...STROKE, stroke: P.hot, 'stroke-width': 8 });
  S.labNo = label(w, 'no fact sheet').at(2060, 850);

  // C: the route and the gate before recording (same place as B; it builds while B fades)
  const xs = [300, 660, 1020, 1380];
  S.boxes = ['critic', 'fix', 'flow review', 'fix'].map((s, i) => stepBox(w, s).at(xs[i], 500));
  S.links = [0, 1, 2].map((i) => arrow(w, xs[i] + 152, 500, xs[i + 1] - 152, 500, { color: P.dim, head: 16 }));
  S.gate = el(w, 'rect', { x: 1582, y: 380, width: 16, height: 240, rx: 8, fill: P.dim, opacity: 0 });
  S.mic = mic(w).at(1700, 500);
  S.gateLab = label(w, 'before recording', { size: 42, color: P.accent }).at(1590, 340);
  S.sentence = new Item(w, 300, 70);
  bar(S.sentence.g, -120, 0, 240, 18, P.ink, 0.7);
  S.ring = el(S.sentence.g, 'ellipse', { cx: 0, cy: 0, rx: 150, ry: 34, fill: 'none', stroke: P.hot, 'stroke-width': 4, opacity: 0 });
  S.ringLen = 2 * Math.PI * Math.sqrt((150 ** 2 + 34 ** 2) / 2);
  S.sentence.at(300, 680);
  // stacked under the last fix, clear of the gate: fixed before recording
  S.high = chip(w, 'high', { size: 42, color: P.hot }).at(1380, 650);
  S.medium = chip(w, 'medium', { size: 42, color: P.ink }).at(1380, 735);
  S.loop = curve(w, 1380, 420, 1020, 420, { bend: 150, color: P.accent });
  S.loopDot = el(w, 'circle', { r: 11, fill: P.accent, opacity: 0 });
  S.newChip = chip(w, 'new script', { size: 42 }).at(1200, 290);
  S.costs = chip(w, 'costs nothing', { size: 42 }).at(840, 680);
  S.againLab = label(w, 'recording it again', { size: 42, color: P.hot }).at(1610, 680);

  S.endPhrase = label(stage.hud, 'before any recording', { size: 64 }).at(960, 840);
}

/** Spotlight for step box i: events [{t, idx}] where idx is the lit box (-1 = all equal). Returns [opacity, lit]. */
function boxState(t, i, events) {
  let v = 0.35, on = 0;
  for (const e of events) {
    const k = ease.inOut(prog(t, e.t, 0.4));
    v = lerp(v, e.idx === i ? 1 : e.idx === -1 ? 0.75 : 0.35, k);
    on = lerp(on, e.idx === i ? 1 : 0, k);
  }
  return [v, on];
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // ---- A: the critic's folder dims (kept for the comparison), the flow review's stays lit ----
  const fA = fadeOut(t, c('stop') - 0.1, 0.45); // folders gone before the reviewers start to move
  const fB = fadeOut(t, c('cfirst') - 0.55, 0.5); // the terminal is gone before the route row fades in
  const critDim = lerp(dimAfter(t, c('flow'), 0.35), 1, reveal(t, c('each'))) * dimAfter(t, c('flowgets'), 0.35);
  const flowDim = lerp(dimAfter(t, c('critic'), 0.35), 1, reveal(t, c('flow')));
  const both = reveal(t, c('both'));
  // the reviewers walk from their folders into the terminal body; dim while the folders fade, brighten when the agent appears
  const mv = ease.inOut(prog(t, c('stop') + 0.4, 1.3));
  S.critic.at(lerp(330, 480, mv), lerp(520, 650, mv));
  S.flowR.at(lerp(1130, 780, mv), lerp(520, 650, mv));
  const inB = reveal(t, c('stop'), 0.5);
  const bDim = lerp(0.35, 0.85, reveal(t, c('agent')));
  S.critic.show(both * fB).dim(lerp(critDim, bDim, inB));
  S.flowR.show(both * fB).dim(lerp(flowDim, bDim, inB));
  S.flowR.lit(reveal(t, c('flow')));
  set(S.flowR.waves, { opacity: +(fadeBetween(t, c('listener'), c('stop'), 0.4) * (0.6 + 0.4 * Math.sin((t - c('listener')) * 5))).toFixed(3) });
  S.facts.show(reveal(t, c('critic')) * fA).dim(critDim);
  S.labCritic.show(reveal(t, c('critic')) * fA).dim(critDim);
  S.folderC.show(reveal(t, c('folder')) * fA).dim(critDim);
  S.flowC.update(t, reveal(t, c('input')) * fA * critDim);
  S.script.show(reveal(t, c('flow')) * fA);
  S.labFlow.show(reveal(t, c('flow')) * fA);
  S.folderF.show(reveal(t, c('folder')) * fA);
  S.flowF.update(t, reveal(t, c('input')) * fA);
  S.noFacts.show(reveal(t, c('nofacts')) * fA * 0.75);
  set(S.noCross, { opacity: +(0.6 * reveal(t, c('nofacts') + 0.3)).toFixed(3) });
  S.labNo.show(reveal(t, c('nofacts')) * fA);

  // ---- B: read-only, inside the terminal agent ----
  S.pencil.show(reveal(t, c('stop') + 0.4) * fB).dim(lerp(1, 0.6, reveal(t, c('agent'))));
  S.term.show(reveal(t, c('agent')) * fB);
  set(S.caret, { opacity: +(reveal(t, c('terminal'), 0.3) * fB).toFixed(3) });
  const blink = Math.sin(t * 6) > 0 ? 1 : 0.25;
  set(S.cursor, { opacity: +(fadeBetween(t, c('terminal') + 0.3, c('read'), 0.3) * blink).toFixed(3) });
  const rd = reveal(t, c('read'), 0.5);
  S.readChip.show(rd * fB).at(lerp(1250, 1300, rd), 290);
  S.readPage.show(rd * fB).at(lerp(1440, 1300, rd), 620);

  // ---- C: each box appears at its word ----
  const cIn = c('cfirst') + 0.1;
  const boxAt = [cIn, c('fix1'), c('flowrun') - 0.1, c('fix2')];
  const events = [
    { t: cIn, idx: 0 }, { t: c('fix1'), idx: 1 }, { t: c('flowrun'), idx: 2 }, { t: c('fix2'), idx: 3 },
    { t: c('more'), idx: 2 }, { t: c('before'), idx: -1 },
  ];
  S.boxes.forEach((b, i) => { const [v, on] = boxState(t, i, events); b.show(reveal(t, boxAt[i], 0.4)).dim(v); set(b.on, { opacity: +on.toFixed(3) }); });
  S.links.forEach((l, i) => { const p = ease.inOut(prog(t, boxAt[i + 1] - 0.1, 0.4)); l.draw(p, p > 0 ? 0.8 : 0); });
  const row = reveal(t, c('flowrun') + 1.2); // mic and gate join once the camera has returned
  const gateOn = reveal(t, c('before'));
  set(S.gate, { opacity: +(row * lerp(0.35, 1, gateOn)).toFixed(3), fill: gateOn > 0.5 ? P.accent : P.dim });
  S.mic.show(row).dim(lerp(0.35, 1, reveal(t, c('later'))));
  set(S.mic.ring, { opacity: +reveal(t, c('later')).toFixed(3) });
  S.gateLab.show(reveal(t, c('before'))).dim(dimAfter(t, c('before') + 1.4, 0.5)); // stays, dim, so the gate keeps its label
  const late = fadeOut(t, c('costs') - 0.7, 0.5); // clear stale items before the wide ending
  S.sentence.show(reveal(t, c('smoothing')) * late).dim(dimAfter(t, c('fix1'), 0.35) * dimAfter(t, c('before'), 0.57));
  const rp = ease.inOut(prog(t, c('wrong'), 0.7));
  set(S.ring, { opacity: rp > 0 ? 1 : 0, 'stroke-dasharray': `${S.ringLen} ${S.ringLen}`, 'stroke-dashoffset': (S.ringLen * (1 - rp)).toFixed(1) });
  const sevOut = fadeOut(t, c('before'), 0.5);
  S.high.show(reveal(t, c('high')) * sevOut);
  S.medium.show(reveal(t, c('medium')) * sevOut);
  const lp = ease.inOut(prog(t, c('more'), 0.8));
  S.loop.draw(lp, lp > 0 ? lerp(1, 0.5, reveal(t, c('before'))) : 0); // hidden (no stray cap) until it draws
  const dq = prog(t, c('more') + 0.6, 1.2);
  const dp = S.loop.point(dq);
  set(S.loopDot, { cx: dp.x.toFixed(1), cy: dp.y.toFixed(1), opacity: +(dq > 0 && dq < 1 ? 1 : 0).toFixed(3) });
  S.newChip.show(reveal(t, c('newscript')) * late).dim(dimAfter(t, c('before'), 0.2));
  S.costs.show(reveal(t, c('costs'))).dim(dimAfter(t, c('later'), 0.5));
  S.againLab.show(reveal(t, c('again')));

  S.endPhrase.show(reveal(t, c('before') + 0.6));
}
