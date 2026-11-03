// 02 - intro: what the series builds. A video with narration, then four stage chips in a row (one job each: the voice,
// the ears, the writer, the producer). Three homes appear beneath as they are named (the graphics card, the ordinary
// processor, the cloud) and the chips drop into them. A row of what each model gets (name, good at, cannot do, license
// page, when) builds across the top, then gives way to the date stamp and "they will change".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'here', at: 'here is what' },
    { name: 'video', at: 'a video' },
    { name: 'narr', at: 'with narration' },
    { name: 'stage', at: 'every stage' },
    { name: 'job', at: 'one job' },
    { name: 'model', at: 'one model' },
    { name: 'gpu', at: 'graphics card' },
    { name: 'cpu', at: 'ordinary processor' },
    { name: 'claude', at: 'Claude models' },
    { name: 'name', at: 'name each one' },
    { name: 'good', at: 'good at' },
    { name: 'cannot', at: 'cannot do' },
    { name: 'main', at: 'main ones' },
    { name: 'license', at: 'license page' },
    { name: 'when', at: 'and when' },
    { name: 'models', at: 'These are the models' },
    { name: 'nov', at: 'early November' },
    { name: 'change', at: 'will change' },
  ],
};

const ROW_Y = 300;                         // the stage chips before they drop
const CHIP_X = [480, 800, 1440, 1120];   // the producer sits third in the row, so it drops straight down beside the processor and never crosses the cloud
const CW = 220, CH = 160;
const HOME_Y = 650, HOME_LAB_Y = 790;      // homes and their labels
const HOME_X = [480, 960, 1440];
const COL = [P.accent, P.ink, P.violet, P.ink]; // voice, ears, writer, producer (the producer runs on my machine: ink)
const MODEL_COL = [P.cool, P.cool, P.violet, P.violet]; // the model each stage hands its job to, in its home's colour
// where each chip lands (scale 0.6) and which home it belongs to; the producer parks beside the cloud, not in it
const DROP = [[480, 500, 0], [960, 500, 1], [1440, 470, 2], [1160, 690, 2]];
const TOP_Y = 280;                         // the per-model row, later the date stamp
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// THE VOICE: rounded accent bars (12 px on a 24 px pitch) centred on a baseline
function wave(parent, n, hmax) {
  const it = new Item(parent, n * 24, hmax);
  it.bars = Array.from({ length: n }, (_, i) => {
    const h = hmax * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    const b = el(it.g, 'rect', { x: (i - (n - 1) / 2) * 24 - 6, y: -h / 2, width: 12, height: h, rx: 6, fill: P.accent });
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

// a stage chip: a rounded tile in its job's colour holding the cast icon
function stageChip(parent, i) {
  const it = new Item(parent, CW, CH);
  it.edge = el(it.g, 'rect', { x: -CW / 2, y: -CH / 2, width: CW, height: CH, rx: 26, fill: P.bg2, stroke: COL[i], 'stroke-width': 4 });
  it.icon = el(it.g, 'g', { opacity: 0 });
  const g = it.icon;
  if (i === 0) wave(g, 7, 90).show(1);
  if (i === 1) { // the ears: two single arcs facing out (accent = the aligner, ink = the recognizer)
    el(g, 'path', { d: 'M -14 -34 A 40 40 0 0 0 -14 34', ...stroke(P.accent) });
    el(g, 'path', { d: 'M 14 -34 A 40 40 0 0 1 14 34', ...stroke(P.ink) });
  }
  if (i === 2) { // the writer: a pencil
    const p = el(g, 'g', { transform: 'rotate(-35)' });
    el(p, 'rect', { x: -50, y: -13, width: 80, height: 26, rx: 6, fill: P.violet, 'fill-opacity': 0.25, stroke: P.violet, 'stroke-width': 5 });
    el(p, 'path', { d: 'M 30 -13 L 56 0 L 30 13 Z', ...stroke(P.violet, 5) });
    el(p, 'line', { x1: -32, y1: -13, x2: -32, y2: 13, ...stroke(P.violet, 5) });
  }
  if (i === 3) { // the producer: a desk with one line up
    el(g, 'line', { x1: -60, y1: 30, x2: 60, y2: 30, ...stroke(P.ink, 6) });
    el(g, 'line', { x1: -46, y1: 30, x2: -46, y2: 54, ...stroke(P.ink, 5) });
    el(g, 'line', { x1: 46, y1: 30, x2: 46, y2: 54, ...stroke(P.ink, 5) });
    el(g, 'rect', { x: -30, y: -12, width: 44, height: 30, rx: 5, ...stroke(P.ink, 5) });
    el(g, 'line', { x1: 30, y1: 10, x2: 30, y2: -50, ...stroke(P.violet, 5) });
  }
  // "one model": a short line down to the model token it hands its job to
  it.model = el(it.g, 'g', { opacity: 0 });
  el(it.model, 'line', { x1: 0, y1: CH / 2 + 6, x2: 0, y2: CH / 2 + 34, ...stroke(P.dim, 4) });
  el(it.model, 'rect', { x: -18, y: CH / 2 + 38, width: 36, height: 36, rx: 9, fill: MODEL_COL[i], 'fill-opacity': 0.3, stroke: MODEL_COL[i], 'stroke-width': 4 });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 520, z: 1.06 },      // a little close on the video
    { cue: 'stage', dur: 1.4, x: 960, y: 540, z: 1 },   // out for the row of stages
    { cue: 'name', dur: 1.6, x: 960, y: 500, z: 1.04 }, // lean in on what each model gets
    { cue: 'models', dur: 1.6, x: 960, y: 540, z: 1 },  // wide for the date
  ], ctx.cue);
  const W = S.stage.world, HUD = S.stage.hud;

  // opening: what this series builds = a video with narration
  S.title = label(W, 'what this series builds', { size: type.label, color: P.ink }).at(960, 190);
  S.video = new Item(W, 640, 360);
  el(S.video.g, 'rect', { x: -320, y: -180, width: 640, height: 360, rx: 26, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  S.video.at(960, 480);
  S.vWave = wave(S.video.g, 13, 130);

  // the three homes
  S.homes = HOME_X.map(() => new Item(W));
  // THE CARD: slab, fan circle with three spokes, eight fins
  const cg = el(S.homes[0].g, 'g', { transform: `translate(${HOME_X[0]} ${HOME_Y})` });
  el(cg, 'rect', { x: -160, y: -42, width: 320, height: 84, rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(cg, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  S.fan = el(cg, 'g');
  for (let k = 0; k < 3; k++) el(S.fan, 'line', { x1: 0, y1: 0, x2: 20 * Math.cos((k * 2 * Math.PI) / 3), y2: 20 * Math.sin((k * 2 * Math.PI) / 3), stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round' });
  for (let k = 0; k < 8; k++) el(cg, 'line', { x1: -30 + k * 22, y1: -22, x2: -30 + k * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
  // THE PROCESSOR: a flat square chip with short pins on all four sides
  const pg = el(S.homes[1].g, 'g', { transform: `translate(${HOME_X[1]} ${HOME_Y})` });
  for (let k = 0; k < 4; k++) {   // 120 px square, inner square, 4 pins per side at a 24 px pitch (same drawing as the other scenes)
    const o = -36 + k * 24;
    el(pg, 'line', { x1: o, y1: -60, x2: o, y2: -78, ...stroke(P.cool, 5) });
    el(pg, 'line', { x1: o, y1: 60, x2: o, y2: 78, ...stroke(P.cool, 5) });
    el(pg, 'line', { x1: -60, y1: o, x2: -78, y2: o, ...stroke(P.cool, 5) });
    el(pg, 'line', { x1: 60, y1: o, x2: 78, y2: o, ...stroke(P.cool, 5) });
  }
  el(pg, 'rect', { x: -60, y: -60, width: 120, height: 120, rx: 12, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(pg, 'rect', { x: -30, y: -30, width: 60, height: 60, rx: 6, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  // THE CLOUD: three overlapping violet circles
  const kg = el(S.homes[2].g, 'g', { transform: `translate(${HOME_X[2]} ${HOME_Y}) scale(2.2)` });
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(kg, 'circle', { cx, cy, r, fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 4 / 2.2 }));
  S.homeLabs = [['graphics card', P.cool], ['ordinary processor', P.cool], ['Claude models', P.violet]]
    .map(([s, c], i) => label(S.homes[i].g, s, { size: type.label, color: c }).at(HOME_X[i], HOME_LAB_Y).show(1));

  // the four stage chips (created after the homes, so they sit in front when they land)
  S.chips = CHIP_X.map((_, i) => stageChip(W, i));
  // the producer stays on my machine and calls the cloud: one thin violet line up into it
  S.call = new Item(W);
  el(S.call.g, 'line', { x1: 1232, y1: 656, x2: 1322, y2: 626, ...stroke(P.violet, 4) });   // chip right edge 1226, cloud body from 1299

  // what each model gets: one row across the top, built word by word
  const words = [['name', P.ink], ['good at', P.accent], ['cannot do', P.dim], ['license page', P.ink], ['when', P.accent]];
  const gap = 40;
  const ws = words.map(([s]) => Math.ceil(measure(s, type.label) + 56));
  let x = 960 - (ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)) / 2;
  S.top = words.map(([s, c], i) => { const it = chip(W, s, { size: type.label, color: c }).at(x + ws[i] / 2, TOP_Y); x += ws[i] + gap; return it; });

  // the date and the closing phrase stay fixed on screen
  S.date = chip(HUD, 'early November of 2026', { size: 56, color: P.accent }).at(960, 290);
  S.final = label(HUD, 'they will change', { size: type.title, color: P.ink }).at(960, 165);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // opening: the title, the video, the narration playing in it; all gone before the stage chips come in
  const out = 1 - ease.inOut(prog(t, c('stage'), 0.4));
  S.title.show(reveal(t, 0.3, 0.5)).dim(lerp(dimAfter(t, c('video'), 0.35), 0, 1 - out));
  // the video is not dropped: it shrinks to the corner and waits there, dim, as what the stages make
  const park = ease.inOut(prog(t, c('stage'), 0.5));
  S.video.show(reveal(t, c('video'), 0.5)).at(lerp(960, 1660, park), lerp(480, 140, park), lerp(1, 0.25, park)).dim(lerp(1, 0.35, park));
  S.vWave.at(0, 0).show(reveal(t, c('narr'), 0.5)).play(t, reveal(t, c('narr') + 0.3, 0.4));

  // homes: each appears when named; the earlier ones dim, all dim for the per-model row, all bright again for the date
  const homeAt = [c('gpu'), c('cpu'), c('claude')];
  S.homes.forEach((h, i) => {
    const next = homeAt[i + 1] ?? c('name');
    const d = i < 2 ? dimAfter(t, next, 0.35) : dimAfter(t, c('name'), 0.35);
    h.show(reveal(t, homeAt[i], 0.6)).dim(lerp(Math.min(d, dimAfter(t, c('name'), 0.35)), 1, reveal(t, c('models'), 0.8)));
  });
  set(S.fan, { transform: `translate(-100 0) rotate(${((t * 140) % 360).toFixed(1)})` });

  // stage chips: come in on "every stage", get their job on "one job", pulse on "one model", then drop into their homes
  const dropAt = [c('gpu') + 0.5, c('cpu') + 0.45, c('claude') + 0.8, c('claude') + 0.4];
  S.chips.forEach((ch, i) => {
    const k = ease.inOut(prog(t, dropAt[i], 0.8));
    const [tx, ty, home] = DROP[i];
    const pulse = fadeBetween(t, c('name') + 0.2 + i * 0.3, c('name') + 0.5 + i * 0.3, 0.25);
    ch.show(reveal(t, c('stage') + 0.5 + i * 0.15, 0.5)).at(lerp(CHIP_X[i], tx, k), lerp(ROW_Y, ty, k), lerp(1, 0.6, k) * (1 + 0.1 * pulse));
    set(ch.icon, { opacity: +reveal(t, c('job') + i * 0.12, 0.4).toFixed(3) });
    // the model token shows on "one model" and fades as the chip drops (its home is the model)
    set(ch.model, { opacity: +(reveal(t, c('model') + i * 0.12, 0.4) * (1 - ease.out(prog(t, dropAt[i], 0.4)))).toFixed(3) });
    set(ch.edge, { 'stroke-width': +(4 + 4 * fadeBetween(t, c('model') + i * 0.12, c('model') + i * 0.12 + 0.6, 0.3)).toFixed(2) });
    // a chip is bright while its home is spoken, then waits back with the others; all lit for "each one"
    let d = lerp(1, 0.6, reveal(t, c('gpu'), 0.5));                       // waiting while the homes are named
    d = lerp(d, 1, reveal(t, dropAt[i] - 0.5, 0.5));                        // its own home is spoken
    if (home < 2) d = lerp(d, 0.6, reveal(t, homeAt[home + 1], 0.5));       // the next home takes the focus
    d = lerp(d, 1, reveal(t, c('name'), 0.4));                              // "each one": all of them
    d = lerp(d, 0.35, reveal(t, c('good'), 0.6));                            // the per-model row takes the focus
    ch.dim(lerp(d, 1, reveal(t, c('models'), 0.8)));
    if (i === 3) S.call.show(reveal(t, dropAt[3] + 0.8, 0.4)).dim(lerp(d, 1, reveal(t, c('models'), 0.8)));
  });

  // the per-model row: name, good at, cannot do; then (for the main ones) the license page and when
  const topAt = [c('name') + 0.1, c('good'), c('cannot'), c('license'), c('when')];
  const topOut = 1 - ease.inOut(prog(t, c('models'), 0.5));
  S.top.forEach((it, i) => {
    const d = i < 3 ? dimAfter(t, c('main'), 0.35) : i === 3 ? dimAfter(t, c('when'), 0.35) : 1;
    it.show(reveal(t, topAt[i], 0.5) * topOut).dim(d);
  });

  // the date, then the closing phrase over a quieter diagram
  S.date.show(reveal(t, c('nov'), 0.6));
  const fin = reveal(t, c('change'), 0.6);
  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.55, fin).toFixed(3) });
}
