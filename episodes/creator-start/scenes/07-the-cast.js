// 07 - the cast: the opening holds the catch from scene 06 (the ghost in the picture, ringed): it took a machine.
// Then one persistent diagram builds: three job panels in a row, each with its own colour and sign (the speaker: the voice
// waveform over the card; the listener: an ear comparing against the script page; the cloud writer: a cloud with a code bracket
// and a picture). A cloud agent appears above, runs the whole row (arrows with flowing dots), a scan checks each panel, and a
// loop arrow returns from the end of the row to the agent. Ends wide on "someone checks the checkers".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, flow, arrow, measure, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'machine', at: 'took a machine' },
    { name: 'setup', at: 'whole setup' },
    { name: 'jobs', at: 'Three different jobs' },
    { name: 'model', at: 'different model' },
    { name: 'speaks', at: 'One speaks' },
    { name: 'voice', at: 'in my voice' },
    { name: 'card', at: 'graphics card' },
    { name: 'listens', at: 'One listens' },
    { name: 'compares', at: 'compares' },
    { name: 'script', at: 'the script' },
    { name: 'cloud', at: 'A cloud model' },
    { name: 'pictures', at: 'the pictures' },
    { name: 'agent', at: 'cloud agent' },
    { name: 'runs', at: 'runs the pipeline' },
    { name: 'work', at: 'checks the work' },
    { name: 'loop', at: 'someone checks' },
  ],
};

// world layout: three panels in a row, the agent above, labels below, the closing phrase at the bottom
const PX = [470, 960, 1450], PY = 515, PW = 400, PH = 280;   // panel centres and size (y 375..655)
const COL = [P.accent, P.ink, P.violet];                     // speaker = voice, listener = script ink, writer = cloud
const LAB_Y = 715, FINAL_Y = 835, AG = [1080, 170];          // panel labels, closing phrase, agent cloud (its name to its left)
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// THE VOICE: rounded accent bars (12 px on a 24 px pitch, as in every scene) centred on a baseline
function wave(parent, n, hmax, gap = 24, bw = 12) {
  const it = new Item(parent, n * gap, hmax);
  it.bars = Array.from({ length: n }, (_, i) => {
    const h = hmax * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    const x = (i - (n - 1) / 2) * gap - bw / 2;
    const b = el(it.g, 'rect', { x, y: -h / 2, width: bw, height: h, rx: bw / 2, fill: P.accent });
    b.h = h;
    return b;
  });
  // playing = a soft highlight sweeping left to right: bars stay bright, the ones under it lift (k = how much the play shows)
  it.play = (t, k) => it.bars.forEach((b, i) => {
    const g = Math.exp(-(((i - (((t / 1.8) % 1) * (n + 6) - 3)) ** 2) / 6));
    const h = b.h * (1 + 0.25 * g * k);
    set(b, { y: (-h / 2).toFixed(2), height: h.toFixed(2), opacity: +lerp(1, 0.8 + 0.2 * g, k).toFixed(3) });
  });
  return it;
}

// THE CLOUD: scene 03's drawing (three visible translucent violet circles, 4 px outline), scaled
function cloud(parent, s = 1) {
  const it = new Item(parent, 128 * s, 82 * s);
  const g = el(it.g, 'g', { transform: `scale(${s})` });
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 4 / s };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(g, 'circle', { cx, cy, r, ...st }));
  it.inner = g;
  return it;
}

// a small accent check mark (good / checked)
function tick(parent, halo = null) {
  const it = new Item(parent, 34, 26);
  const d = 'M -15 0 L -4 11 L 16 -12';
  if (halo) el(it.g, 'path', { d, ...stroke(halo, 17) });   // a dark halo so cloud outlines do not cut the strokes
  el(it.g, 'path', { d, ...stroke(P.accent, 7) });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 515, z: 1.2 },                  // close on the catch
    { cue: 'setup', dur: 1.4, x: 960, y: 520, z: 1.06 },           // out to the whole setup
    { cue: 'speaks', dur: 1.2, x: 900, y: 520, z: 1.06 },          // lean toward each job as it is named
    { cue: 'listens', dur: 1.2, x: 960, y: 520, z: 1.06 },
    { cue: 'cloud', dur: 1.2, x: 1040, y: 520, z: 1.06 },
    { cue: 'agent', dur: 1.4, x: 960, y: 540, z: 1 },              // wide: the agent above the row
  ], ctx.cue);
  const W = S.stage.world;

  // opening: the voice with a slip, the scan and the ring (THE CHECK), and the phrase
  S.open = new Item(W);
  // THE PICTURE as scene 06 left it: outline, ground line, the ball and its faint magenta leftover one step behind, ringed
  const pic = el(S.open.g, 'g', { transform: 'translate(960 480)' });
  el(pic, 'rect', { x: -220, y: -124, width: 440, height: 248, rx: 22, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(pic, 'line', { x1: -170, x2: 170, y1: 74, y2: 74, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round' });
  el(pic, 'circle', { cx: -24, cy: 40, r: 30, fill: P.hot, opacity: 0.55 });
  el(pic, 'circle', { cx: 40, cy: 40, r: 30, fill: P.ink });
  S.oRing = el(pic, 'circle', { cx: -24, cy: 40, r: 48, fill: 'none', stroke: P.hot, 'stroke-width': 3 });
  S.oLab = label(S.open.g, 'it took a machine', { size: type.label }).at(960, 680);

  // the three panels: a dim empty slot that takes its job's colour
  S.panels = PX.map((x, i) => {
    const p = new Item(W);
    const r = { x: x - PW / 2, y: PY - PH / 2, width: PW, height: PH, rx: 26 };
    el(p.g, 'rect', { ...r, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.dim, 'stroke-width': 3 });
    p.edge = el(p.g, 'rect', { ...r, fill: COL[i], 'fill-opacity': 0.06, stroke: COL[i], 'stroke-width': 4, opacity: 0 });
    return p;
  });
  const [p1, p2, p3] = S.panels.map((p) => p.g);

  // 1: the speaker = the voice over the card
  S.wave = wave(p1, 13, 100).at(PX[0], 480);
  // the card: the same drawing as scene 03 (slab, fan circle with three spinning spokes, eight fins), at 0.8 scale
  S.card = new Item(p1, 256, 67);
  const cg = el(S.card.g, 'g', { transform: 'scale(0.8)' });
  el(cg, 'rect', { x: -160, y: -42, width: 320, height: 84, rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(cg, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  S.fan = el(cg, 'g');
  for (let k = 0; k < 3; k++) el(S.fan, 'line', { x1: 0, y1: 0, x2: 20 * Math.cos((k * 2 * Math.PI) / 3), y2: 20 * Math.sin((k * 2 * Math.PI) / 3), stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round' });
  for (let k = 0; k < 8; k++) el(cg, 'line', { x1: -30 + k * 22, y1: -22, x2: -30 + k * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });

  // 2: the listener = an ear, a compare mark, the script page
  S.ear = new Item(p2, 90, 150);
  const eg = el(S.ear.g, 'g', { transform: 'scale(1.4)' });
  el(eg, 'path', { d: 'M -28 -18 C -28 -52 28 -60 34 -18 C 38 8 14 18 12 36 C 10 54 -10 60 -18 46', ...stroke(P.ink, 6 / 1.4) });
  el(eg, 'path', { d: 'M -10 -16 C -8 -34 18 -34 18 -14 C 18 0 4 4 4 16', ...stroke(P.ink, 6 / 1.4) });
  S.ear.at(865, PY);
  S.cmp = new Item(p2, 56, 40);
  el(S.cmp.g, 'path', { d: 'M -26 -12 L 26 -12 M 14 -22 L 26 -12 L 14 -2', ...stroke(P.accent, 5) });
  el(S.cmp.g, 'path', { d: 'M 26 12 L -26 12 M -14 2 L -26 12 L -14 22', ...stroke(P.accent, 5) });
  S.cmp.at(960, PY);
  S.page = new Item(p2, 100, 130);
  el(S.page.g, 'rect', { x: -50, y: -65, width: 100, height: 130, rx: 12, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [60, 70, 50, 64, 40].forEach((w, k) => el(S.page.g, 'rect', { x: -34, y: -44 + k * 20, width: w, height: 8, rx: 4, fill: P.ink }));
  S.page.at(1055, PY);

  // 3: the cloud writer = a cloud with a code bracket, and the picture it writes
  S.wCloud = cloud(p3, 1.3).at(1360, 505);
  // the sign over a dark halo of itself, so the circle outlines underneath do not tangle with it
  S.bracket = el(S.wCloud.inner, 'g', { opacity: 0, transform: 'scale(0.8)' });
  const bd = 'M -22 -10 L -38 6 L -22 22 M 22 -10 L 38 6 L 22 22 M 8 -14 L -8 26';
  el(S.bracket, 'path', { d: bd, ...stroke('#1b1a2b', 16) });
  el(S.bracket, 'path', { d: bd, ...stroke(P.ink, 6) });
  S.pic = new Item(p3, 140, 80);
  el(S.pic.g, 'rect', { x: -70, y: -40, width: 140, height: 80, rx: 10, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.pic.g, 'path', { d: 'M -46 26 L -12 -10 L 14 16 L 28 2 L 50 26 Z', fill: P.dim });
  el(S.pic.g, 'circle', { cx: 32, cy: -16, r: 9, fill: P.ink });

  // labels under the panels (inside each panel group so they dim with it)
  const LAB = ['speaks', 'listens', 'writes the pictures'];
  S.labs = LAB.map((s, i) => label(S.panels[i].g, s, { size: fitSize(s, 500, type.label), color: COL[i] }).at(PX[i], LAB_Y));

  // the agent above the row: a cloud and its name; arrows and flow dots down to every panel
  S.agent = new Item(W);
  cloud(S.agent.g, 1.4).at(...AG).show(1);
  const agW = measure('cloud agent', type.label);
  label(S.agent.g, 'cloud agent', { size: type.label, color: P.violet }).at(AG[0] - 125 - agW / 2, AG[1]).show(1);
  S.agTick = tick(W, '#1b1a2b').at(AG[0], AG[1] + 4, 1.3);   // the agent's job is the check
  const ax = (i) => AG[0] - 50 + i * 50;
  S.runs = PX.map((x, i) => arrow(W, ax(i), AG[1] + 66, x, PY - PH / 2 - 18, { color: P.violet, width: 4 }));
  S.dots = PX.map((x, i) => flow(W, [[ax(i), AG[1] + 66], [x, PY - PH / 2 - 24]], { n: 3, r: 8, color: P.violet, period: 2 }));

  // the check: a scan across the row and a tick on each panel
  S.scan = el(W, 'line', { x1: 0, y1: PY - PH / 2 + 10, x2: 0, y2: PY + PH / 2 - 10, ...stroke(P.ink, 4), opacity: 0 });
  S.ticks = PX.map((x) => tick(W).at(x + 172, PY - PH / 2 + 28));

  // the loop back from the end of the row to the agent, with dots riding it
  // a cubic (not the kit's quadratic curve) so it bows out around the right of the row instead of cutting the last panel
  const lx = AG[0] + 120;
  // in the hud (the camera is at rest, world = screen, before it appears) so it is not dimmed with the diagram at the end
  const HUD = S.stage.hud;
  S.loopPath = el(HUD, 'path', { d: `M 1672 ${PY} C 1790 ${PY}, 1790 ${AG[1] + 10}, ${lx} ${AG[1] + 10}`, ...stroke(P.accent, 5), opacity: 0 });
  S.loopTip = el(HUD, 'path', { d: 'M -22 -13 L 0 0 L -22 13', ...stroke(P.accent, 5), opacity: 0 });
  S.loopLen = S.loopPath.getTotalLength();
  S.loopDots = Array.from({ length: 3 }, () => el(HUD, 'circle', { r: 8, fill: P.accent, opacity: 0 }));

  S.final = label(S.stage.hud, 'someone checks the checkers', { size: type.title, color: P.ink }).at(960, FINAL_Y);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // opening: the caught ghost holds (the ring breathes once on "machine"), then it all fades for the setup
  set(S.oRing, { 'stroke-width': +(3 + 2 * fadeBetween(t, c('machine'), c('machine') + 0.5, 0.3)).toFixed(2) });
  S.oLab.show(reveal(t, c('machine'), 0.5));
  S.open.show(1 - ease.inOut(prog(t, c('setup'), 0.4)));

  // panels: dim slots appear one by one on "whole setup", take their colour on "jobs", and pulse on "different model"
  const focus = [[c('speaks'), c('listens')], [c('listens'), c('cloud')], [c('cloud'), c('agent')]];
  S.panels.forEach((p, i) => {
    p.show(reveal(t, c('setup') + 0.3 + i * 0.2, 0.5));
    set(p.edge, { opacity: +reveal(t, c('jobs') + i * 0.15, 0.5).toFixed(3), 'stroke-width': +(4 + 3 * fadeBetween(t, c('model') + i * 0.15, c('model') + i * 0.15 + 0.6, 0.3)).toFixed(2) });
    // spotlight: the job being spoken is bright, the others pushed back; the whole row lights when the agent runs it
    const d = 1 - 0.65 * reveal(t, c('speaks'), 0.5) + 0.65 * fadeBetween(t, focus[i][0], focus[i][1]);
    p.dim(lerp(d, 0.9, reveal(t, c('runs'), 0.8)));
    S.labs[i].show(reveal(t, focus[i][0], 0.5));
  });

  // 1: the voice appears, plays in my voice, the card slides in under it
  S.wave.show(reveal(t, c('speaks'), 0.5));
  S.wave.play(t, reveal(t, c('voice'), 0.4) * (1 - reveal(t, c('listens'), 0.4)));
  const cd = reveal(t, c('card'), 0.6);
  S.card.show(cd).at(PX[0], lerp(625, 595, cd));
  set(S.fan, { transform: `translate(-100 0) rotate(${((t * 140) % 360).toFixed(1)})` });

  // 2: the ear listens, compares, against the script
  S.ear.show(reveal(t, c('listens'), 0.5));
  S.cmp.show(reveal(t, c('compares'), 0.5));
  const pg = reveal(t, c('script'), 0.5);
  S.page.show(pg).at(lerp(1085, 1055, pg), PY);

  // 3: the cloud, its code bracket, and the picture sliding out of it
  S.wCloud.show(reveal(t, c('cloud'), 0.5));
  set(S.bracket, { opacity: +reveal(t, c('cloud') + 0.15, 0.5).toFixed(3) });
  const pc = reveal(t, c('pictures'), 0.6);
  S.pic.show(pc).at(lerp(1480, 1565, pc), PY + 10);

  // the agent appears, then runs the pipeline: arrows draw down, dots flow
  S.agent.show(reveal(t, c('agent'), 0.6));
  S.runs.forEach((a, i) => a.draw(ease.inOut(prog(t, c('runs') + i * 0.15, 0.7)), reveal(t, c('runs') + i * 0.15, 0.2)));
  S.dots.forEach((f) => f.update(t, reveal(t, c('runs') + 0.7, 0.5) * 0.9));

  // checks the work: one scan across the row, a tick lands as it passes each panel
  const sc = prog(t, c('work'), 1.2);
  const scx = lerp(PX[0] - PW / 2 + 20, PX[2] + PW / 2 - 20, ease.inOut(sc));
  set(S.scan, { x1: scx.toFixed(1), x2: scx.toFixed(1), opacity: +(sc > 0 && sc < 1 ? Math.min(1, sc * 8, (1 - sc) * 8) : 0).toFixed(3) });
  S.ticks.forEach((k, i) => k.show(reveal(t, c('work') + 0.15 + i * 0.45, 0.35)));
  S.agTick.show(reveal(t, c('work'), 0.4));

  // someone checks the checkers: the loop returns to the agent, the closing phrase
  const lp = ease.inOut(prog(t, c('loop'), 1.0));
  const L = S.loopLen, pt = (q) => S.loopPath.getPointAtLength(L * q);
  set(S.loopPath, { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': (L * (1 - lp)).toFixed(2), opacity: +reveal(t, c('loop'), 0.2).toFixed(3) });
  const e = pt(Math.max(lp, 0.002)), e0 = pt(Math.max(lp - 0.01, 0));
  set(S.loopTip, { transform: `translate(${e.x.toFixed(1)} ${e.y.toFixed(1)}) rotate(${((Math.atan2(e.y - e0.y, e.x - e0.x) * 180) / Math.PI).toFixed(1)})`, opacity: lp > 0.05 ? 1 : 0 });
  const la = reveal(t, c('loop') + 1.0, 0.5);
  S.loopDots.forEach((d, i) => { const q = pt((((t / 1.6) + i / 3) % 1) * 0.92); /* stop short of the arrowhead */ set(d, { cx: q.x.toFixed(1), cy: q.y.toFixed(1), opacity: +(la * 0.9).toFixed(3) }); });
  // the phrase dominates the end: the diagram drops back to half (the loop lives in the hud, so it stays bright)
  const fin = reveal(t, c('loop') + 0.3, 0.6);
  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.5, fin).toFixed(3) });
}
