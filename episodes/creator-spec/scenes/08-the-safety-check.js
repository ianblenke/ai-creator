// Scene 08: the safety check. Text -> the shield; the pipeline with a shield before each stop and the upload;
// it reads the episode folder and the drawn words; a finding with a masked sample; the banner rises, fades, the list stays unfinished.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, label, chip, arrow, flow, glow, makeStage, paintBackground, makeParticles, reveal, dimAfter, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'page', at: 'Everything so far' },
    { name: 'text', at: 'far is text' },
    { name: 'shield', at: 'safety check' },
    { name: 'reads', at: 'check reads' },
    { name: 'work', at: 'do its work' },
    { name: 'runs', at: 'It runs before' },
    { name: 'voice', at: 'the voice' },
    { name: 'pictures', at: 'the pictures' },
    { name: 'render', at: 'the render' },
    { name: 'again', at: 'and again' },
    { name: 'upload', at: 'every upload' },
    { name: 'files', at: 'every text file' },
    { name: 'frames', at: 'the frames' },
    { name: 'words', at: 'the words' },
    { name: 'finds', at: 'When it finds' },
    { name: 'something', at: 'finds something' },
    { name: 'fileline', at: 'the file and line' },
    { name: 'hint', at: 'a hint' },
    { name: 'sample', at: 'a sample' },
    { name: 'hidden', at: 'most of it hidden' },
    { name: 'never', at: 'never repeats' },
    { name: 'denylist', at: 'your denylist' },
    { name: 'names', at: 'own names' },
    { name: 'command', at: 'every command' },
    { name: 'banner', at: 'loud banner' },
    { name: 'marks', at: 'exclamation marks' },
    { name: 'once', at: 'once the banner' },
    { name: 'gone', at: 'is gone' },
    { name: 'exists', at: 'the list exists' },
    { name: 'complete', at: 'not that it is complete' },
  ],
};

const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z';
const bar = (g, x, y, w, h, color, op = 1) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color, opacity: op });
const fadeOut = (t, at, dur = 0.4) => 1 - ease.in(prog(t, at, dur));

/** THE PAGE (360 x 470). rows: [y, width, heading?]; bars are left-aligned like lines of text. */
function page(parent, rows) {
  const it = new Item(parent, 360, 470);
  el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  it.bars = rows.map(([y, w, head]) => bar(it.g, -140, y, w, head ? 22 : 14, P.ink, head ? 1 : 0.55));
  it.scan = el(it.g, 'rect', { x: -170, y: 0, width: 340, height: 5, fill: P.accent, opacity: 0 });
  return it;
}
const SCRIPT_ROWS = [[-175, 240, 1], [-130, 280], [-100, 250], [-70, 270], [-15, 200, 1], [30, 280], [65, 260], [95, 230], [150, 220, 1], [195, 260]];

/** THE SHIELD (260 px tall) with its list: four slots, each a dashed empty outline and an ink bar. */
function shield(parent, full) {
  const it = new Item(parent, 220, 260);
  el(it.g, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  const ws = [120, 96, 120, 80], ys = [-62, -22, 18, 58];
  it.slots = ys.map((y, i) => ({
    box: el(it.g, 'rect', { x: -ws[i] / 2, y: y - 9, width: ws[i], height: 18, rx: 9, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 7', opacity: full ? 0 : 1 }),
    bar: el(it.g, 'rect', { x: -ws[i] / 2, y: y - 9, width: ws[i], height: 18, rx: 9, fill: P.ink, opacity: full ? 1 : 0 }),
  }));
  return it;
}

function icon(g, kind) {
  const s = { fill: 'none', stroke: P.ink, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (kind === 'voice') [0.5, 0.9, 1, 0.7, 0.4].forEach((h, i) => el(g, 'rect', { x: -41 + i * 18, y: -h * 26, width: 10, height: h * 52, rx: 5, fill: P.accent }));
  if (kind === 'scenes') { el(g, 'rect', { x: -24, y: -32, width: 48, height: 64, rx: 8, ...s, stroke: P.dim }); [-14, 0, 14].forEach((y) => bar(g, -14, y, 28, 6, P.ink)); }
  if (kind === 'frames') { el(g, 'rect', { x: -24, y: -30, width: 64, height: 40, rx: 6, ...s, stroke: P.dim }); el(g, 'rect', { x: -40, y: -14, width: 64, height: 40, rx: 6, ...s, fill: P.bg2 }); }
  if (kind === 'render') el(g, 'path', { d: 'M -18 -26 L 26 0 L -18 26 Z', fill: P.ink });
  if (kind === 'encode') { el(g, 'rect', { x: -40, y: -24, width: 80, height: 48, rx: 6, ...s }); for (let i = 0; i < 5; i++) for (const y of [-14, 14]) el(g, 'circle', { cx: -28 + i * 14, cy: y, r: 3.5, fill: P.ink }); }
  if (kind === 'upload') el(g, 'path', { d: 'M 0 26 L 0 -26 M -20 -8 L 0 -28 L 20 -8 M -28 34 L 28 34', ...s, 'stroke-width': 5 });
}
function stop(parent, kind) {
  const it = new Item(parent, 170, 130);
  el(it.g, 'rect', { x: -85, y: -65, width: 170, height: 130, rx: 26, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  icon(it.g, kind);
  return it;
}

let S;
export function setup(ctx) {
  const c = ctx.cue;
  const stage = makeStage(ctx.svg, [
    { cue: 'work', delay: 1.05, dur: 1.2, x: 960, y: 1540, z: 1 },
    { cue: 'upload', delay: 1.55, dur: 1.0, x: 2900, y: 1540, z: 1 },
    { cue: 'words', delay: 2.55, dur: 0.9, x: 2900, y: 540, z: 1 },
    { cue: 'never', delay: 1.85, dur: 0.9, x: 4800, y: 470, z: 1.1 },
    { cue: 'complete', delay: 0, dur: 0.95, x: 4800, y: 540, z: 1 },
  ], c);
  const w = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // A: text is what the check reads
  S.glowA = glow(w, { r: 200 }).at(1260, 470);
  S.pageA = page(w, SCRIPT_ROWS).at(720, 500);
  S.textA = label(w, 'text', { size: type.label }).at(720, 800);
  S.shieldA = shield(w, true).at(1260, 470);
  S.shieldLabelA = label(w, 'the safety check', { size: type.label }).at(1260, 670);
  S.arrowA = arrow(w, 915, 495, 1135, 475, { color: P.accent });

  // B: the pipeline, a shield before each stop, then the upload
  S.lineB = el(w, 'line', { x1: 210, y1: 1380, x2: 1560, y2: 1380, stroke: P.dim, 'stroke-width': 4, opacity: 0 });
  S.downB = el(w, 'line', { x1: 1560, y1: 1445, x2: 1560, y2: 1445, stroke: P.dim, 'stroke-width': 4, opacity: 0 });
  S.flowB = flow(w, [[210, 1380], [1560, 1380], [1560, 1720]], { n: 7, period: 3.2 });
  const xs = [360, 660, 960, 1260, 1560];
  S.stops = ['voice', 'scenes', 'frames', 'render', 'encode'].map((k, i) => stop(w, k).at(xs[i], 1380));
  S.miniShields = xs.map((x) => shield(w, true).at(x - 150, 1380, 0.38));
  S.upShield = shield(w, true).at(1560, 1550, 0.38);
  S.upStop = stop(w, 'upload').at(1560, 1720);
  S.labelsB = [label(w, 'voice', { size: type.note }).at(360, 1485), label(w, 'pictures', { size: type.note }).at(810, 1525),
    label(w, 'render', { size: type.note }).at(1260, 1485), label(w, 'upload', { size: type.note }).at(1560, 1830)];

  S.bracketB = el(w, 'path', { d: 'M 575 1460 L 575 1474 L 1045 1474 L 1045 1460', fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: 0 });

  // C: every text file in the episode folder, and the words the frames draw
  S.folder = new Item(w, 640, 464);
  // scene 03's notched-tab folder, scaled x2 (stroke kept at 5 px)
  el(S.folder.g, 'path', { d: 'M -300 258 L -300 -234 Q -300 -258 -276 -258 L -104 -258 L -64 -210 L 276 -210 Q 300 -210 300 -186 L 300 234 Q 300 258 276 258 Z', fill: P.bg2, 'fill-opacity': 0.7, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  S.minis = [-204, -68, 68, 204].map((x) => {
    const m = el(S.folder.g, 'g', { opacity: 0 });
    el(m, 'rect', { x: x - 45, y: -45, width: 90, height: 118, rx: 10, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
    [-16, 8, 32, 56].forEach((y, j) => bar(m, x - 30, y, j === 0 ? 50 : 60, 8, P.ink, j === 0 ? 1 : 0.55));
    return m;
  });
  S.folderScan = el(S.folder.g, 'rect', { x: -280, y: 0, width: 560, height: 5, fill: P.accent, opacity: 0 });
  S.folder.at(2520, 1480);
  S.filesLabel = label(w, 'every text file', { size: type.label }).at(2520, 1800);
  S.shieldC = shield(w, true).at(2955, 1440, 0.38); // the check that reads both
  S.frame = new Item(w, 480, 270);
  el(S.frame.g, 'rect', { x: -240, y: -135, width: 480, height: 270, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  el(S.frame.g, 'circle', { cx: 150, cy: 30, r: 46, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  S.frameBars = [[-70, 260], [-30, 200], [10, 230]].map(([y, bw]) => bar(S.frame.g, -190, y, bw, 18, P.ink));
  S.frameScan = el(S.frame.g, 'rect', { x: -230, y: 0, width: 460, height: 5, fill: P.accent, opacity: 0 });
  S.frame.at(3330, 1440);
  S.wordsLabel = label(w, 'the words', { size: type.label }).at(3330, 1650);

  // D: a finding: file and line, a hint, a masked sample
  S.pageD = page(w, SCRIPT_ROWS).at(2380, 500);
  S.ring = el(S.pageD.g, 'ellipse', { cx: -10, cy: 65, rx: 158, ry: 20, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });
  S.ringLen = 2 * Math.PI * Math.sqrt((158 ** 2 + 20 ** 2) / 2);
  S.ringTag = bar(S.pageD.g, 196, 65, 56, 14, P.hot, 0);
  S.shieldD = shield(w, true).at(2110, 500, 0.38);
  S.arrowD = arrow(w, 2660, 565, 2955, 470, { color: P.dim });
  S.card = new Item(w, 620, 440);
  el(S.card.g, 'rect', { x: -310, y: -220, width: 620, height: 440, rx: 26, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.card.at(3290, 470);
  const left = (it, y) => it.at(3030 + it.w / 2, y);
  S.row1 = left(chip(w, 'file and line', { color: P.ink, size: type.label }), 330);
  S.row2 = left(chip(w, 'a hint', { color: P.ink, size: type.label }), 450);
  S.sample = new Item(w, 400, 50);
  [-200, -140].forEach((x) => el(S.sample.g, 'rect', { x, y: -22, width: 44, height: 44, rx: 8, fill: P.ink })); // square ink blocks: the part shown
  S.dots = Array.from({ length: 8 }, (_, i) => el(S.sample.g, 'circle', { cx: -60 + i * 34, cy: 0, r: 8, fill: P.dim, opacity: 0 }));
  S.sample.at(3230, 580);
  S.neverLabel = label(w, 'never the whole secret', { size: type.label }).at(3290, 830);

  // E: the denylist, the banner, the unfinished list
  S.shieldE = shield(w, false).at(4500, 420);
  S.denyLabel = label(w, 'your denylist', { size: type.label }).at(4500, 625);
  S.cmd = page(w, [[-175, 160, 1], [-130, 260], [-100, 220], [-70, 250], [-15, 200], [30, 240]]).at(5120, 450);
  el(S.cmd.g, 'path', { d: 'M -150 -186 L -132 -175 L -150 -164', fill: 'none', stroke: P.accent, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  S.cmd.bars[0].setAttribute('x', -116);
  S.banner = new Item(w, 360, 80);
  S.marks = Array.from({ length: 9 }, (_, i) => {
    const m = el(S.banner.g, 'g', { opacity: 0 });
    el(m, 'rect', { x: -160 + i * 40 - 6, y: -30, width: 12, height: 38, rx: 6, fill: P.hot });
    el(m, 'circle', { cx: -160 + i * 40, cy: 24, r: 7, fill: P.hot });
    return m;
  });
  S.finalLabel = label(w, 'the list exists, not that it is complete', { size: 64 }).at(4800, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // A
  const aOut = fadeOut(t, c('work') + 0.6, 0.45); // gone exactly when the camera glide starts
  const tReads = c('reads') + 0.36;
  S.pageA.show(reveal(t, c('page')) * aOut).dim(lerp(dimAfter(t, c('shield'), 0.45), 1, reveal(t, tReads)));
  S.textA.show(reveal(t, c('text') + 0.18) * aOut).dim(dimAfter(t, c('shield'), 0.4));
  S.shieldA.show(reveal(t, c('shield')) * aOut);
  S.shieldLabelA.show(reveal(t, c('shield') + 0.1) * aOut);
  const pa = prog(t, tReads, 0.7);
  S.arrowA.draw(pa, pa > 0 ? aOut : 0); // no start cap before it draws
  const sa = prog(t, tReads, 1.6);
  set(S.pageA.scan, { y: lerp(-215, 210, sa).toFixed(1), opacity: sa > 0 && sa < 1 ? 1 : 0 });
  S.glowA.pulse(t, reveal(t, c('work')) * aOut);

  // B
  const bOut = fadeOut(t, c('upload') + 1.1);
  const rowDim = dimAfter(t, c('upload') + 0.3, 0.4);
  set(S.lineB, { opacity: (reveal(t, c('runs') - 0.1) * bOut * rowDim).toFixed(3) });
  const stopT = [c('voice') + 0.12, c('pictures') + 0.14, c('pictures') + 0.4, c('render') + 0.14, c('render') + 0.45];
  set(S.bracketB, { opacity: (reveal(t, stopT[1]) * bOut * rowDim).toFixed(3) });
  S.stops.forEach((s, i) => s.show(reveal(t, stopT[i]) * bOut).dim(rowDim));
  S.miniShields.forEach((s, i) => s.show(reveal(t, stopT[i] - 0.2) * bOut).dim(rowDim));
  const dn = prog(t, c('again') + 0.1, 1.2);
  set(S.downB, { y2: lerp(1445, 1655, dn).toFixed(1), opacity: (dn > 0 ? 1 : 0) * bOut });
  S.flowB.update(t, reveal(t, c('again')) * bOut);
  S.upShield.show(reveal(t, c('again') + 0.6) * bOut);
  S.upStop.show(reveal(t, c('upload') + 0.3) * bOut);
  [stopT[0], stopT[1], stopT[3], c('upload') + 0.3].forEach((at, i) => S.labelsB[i].show(reveal(t, at) * bOut).dim(i < 3 ? rowDim : 1));

  // C
  const cOut = fadeOut(t, c('words') + 2.1);
  const fDim = dimAfter(t, c('frames') + 0.14, 0.4);
  S.shieldC.show(reveal(t, c('files') + 0.5) * cOut);
  S.folder.show(reveal(t, c('files')) * cOut).dim(fDim);
  S.minis.forEach((m, i) => set(m, { opacity: reveal(t, c('files') + 0.2 + i * 0.25).toFixed(3) }));
  const sf = prog(t, c('files') + 0.9, 1.8);
  set(S.folderScan, { y: lerp(-190, 240, sf).toFixed(1), opacity: sf > 0 && sf < 1 ? 1 : 0 });
  S.filesLabel.show(reveal(t, c('files') + 0.3) * cOut).dim(fDim);
  S.frame.show(reveal(t, c('frames') + 0.14) * cOut);
  S.frameBars.forEach((b) => set(b, { opacity: lerp(0.3, 1, reveal(t, c('words') + 0.14)).toFixed(3) }));
  const sw = prog(t, c('words') + 0.5, 1.4);
  set(S.frameScan, { y: lerp(-125, 120, sw).toFixed(1), opacity: sw > 0 && sw < 1 ? 1 : 0 });
  S.wordsLabel.show(reveal(t, c('words') + 0.14) * cOut);

  // D
  const dOut = fadeOut(t, c('never') + 1.4);
  const tRing = c('something') + 0.36;
  S.pageD.show(reveal(t, c('finds')) * dOut).dim(dimAfter(t, c('fileline') + 0.18, 0.45));
  const sd = prog(t, c('finds') + 0.2, 0.55);
  set(S.pageD.scan, { y: lerp(-215, 65, sd).toFixed(1), opacity: sd > 0 && t < tRing + 0.3 ? 1 : 0 });
  const rp = prog(t, tRing, 0.5);
  set(S.ringTag, { opacity: reveal(t, tRing + 0.4).toFixed(3) });
  S.shieldD.show(reveal(t, c('finds')) * dOut);
  set(S.ring, { 'stroke-dasharray': `${S.ringLen.toFixed(1)} ${S.ringLen.toFixed(1)}`, 'stroke-dashoffset': (S.ringLen * (1 - rp)).toFixed(1), opacity: rp > 0 ? 1 : 0 });
  const tFile = c('fileline') + 0.18, tHint = c('hint') + 0.12, tSample = c('sample') + 0.12;
  const pd = prog(t, tFile, 0.5);
  S.arrowD.draw(pd, pd > 0 ? dOut : 0);
  S.card.show(reveal(t, tFile) * dOut);
  S.row1.show(reveal(t, tFile) * dOut).dim(dimAfter(t, tHint, 0.45));
  S.row2.show(reveal(t, tHint) * dOut).dim(dimAfter(t, tSample, 0.45));
  S.sample.show(reveal(t, tSample) * dOut);
  S.dots.forEach((d, i) => set(d, { opacity: reveal(t, c('hidden') + 0.1 + i * 0.05, 0.3).toFixed(3) }));
  S.neverLabel.show(reveal(t, c('never') + 0.1) * dOut);

  // E
  const tDeny = c('denylist') + 0.18;
  const sDim = lerp(dimAfter(t, c('command'), 0.4), 1, reveal(t, c('once')));
  S.shieldE.show(reveal(t, tDeny)).dim(sDim);
  const tFinal = c('complete') + 1.0;
  S.denyLabel.show(reveal(t, tDeny + 0.1)).dim(sDim * lerp(1, 0.35, reveal(t, tFinal)));
  const pulseNames = ease.out(prog(t, c('names') + 0.2, 0.3)) * (1 - ease.in(prog(t, c('command'), 0.3)));
  const pulseOpen = reveal(t, c('exists') + 0.5);
  const wave = 0.5 + 0.5 * Math.sin(t * 6);
  S.shieldE.slots.forEach((s, i) => {
    const filled = i < 2 ? reveal(t, c('once') + 0.18 + i * 0.3) : 0;
    const pulse = Math.max(pulseNames, i >= 2 ? pulseOpen : 0);
    set(s.bar, { opacity: filled.toFixed(3) });
    set(s.box, { opacity: ((1 - filled) * (1 - 0.65 * pulse * wave)).toFixed(3) });
  });
  S.cmd.show(reveal(t, c('command'))).dim(dimAfter(t, c('exists') + 0.5, 0.4));
  const tBan = c('banner') + 0.14;
  S.banner.show(1 - ease.in(prog(t, c('gone') + 0.12, 0.7))).at(5120, 150 + lerp(40, 0, ease.out(prog(t, tBan, 0.8))));
  const tMarks = c('marks') + 0.1;
  S.marks.forEach((m, i) => {
    const inner = Math.abs(i - 4) <= 2;
    const a = reveal(t, inner ? tBan + Math.abs(i - 4) * 0.1 : tMarks + (Math.abs(i - 4) - 3) * 0.12);
    const throb = 1 - 0.3 * reveal(t, tMarks) * (0.5 + 0.5 * Math.sin(t * 9 + i));
    set(m, { opacity: (a * throb).toFixed(3) });
  });
  S.finalLabel.show(reveal(t, tFinal));
}
