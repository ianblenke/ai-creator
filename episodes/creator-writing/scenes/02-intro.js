// 02-intro: the script page holds itself together with headings and layout; a listener gets neither (headings crossed out),
// so everything has to be said out loud. Then the route of this part: five stepping stones lit as they are named.
import { palette as P, font, ease, lerp, prog, el, set } from 'style';
import { label, chip, makeStage, paintBackground, makeParticles, reveal, dimAfter, flow, Item, measure } from 'kit';

export const meta = {
  cues: [
    { name: 'page', at: 'The first version' },
    { name: 'gaps', at: 'its gaps' },
    { name: 'headings', at: 'where headings' },
    { name: 'layout', at: 'and layout hold' },
    { name: 'listener', at: 'A listener hears' },
    { name: 'noHead', at: 'no headings and' },
    { name: 'noLayout', at: 'sees no layout' },
    { name: 'so', at: 'So this part' },
    { name: 'idea', at: 'a listener cannot see' },
    { name: 'subject', at: 'change of subject' },
    { name: 'reason', at: 'every reason' },
    { name: 'loud', at: 'said out loud' },
    { name: 'route', at: 'I will show you' },
    { name: 'wrong', at: 'goes wrong' },
    { name: 'bridge', at: 'a bridge' },
    { name: 'story', at: 'one story' },
    { name: 'reviewers', at: 'two reviewers' },
    { name: 'critic', at: 'the critic' },
    { name: 'flow', at: 'flow review' },
    { name: 'last', at: 'Last comes' },
    { name: 'end', at: 'what neither' },
  ],
};

const io = ease.inOut;
const PAGE_X0 = 960, PAGE_X = 600, PAGE_Y = 480, LIS_X = 1350, LIS_Y = 480;
// route stones: six 240 px rounded squares (the two reviewers get one each), 280 px apart inside the safe frame
const SY = 450, SH = 240, XS = [0, 1, 2, 3, 4, 5].map((i) => 960 + (i - 2.5) * 280);
const STROKE = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
let S;

const bar = (g, x, y, w, h, color) => el(g, 'rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: color });

/** The canon figure (shoulder figure, as in 08) centred at (x, y), scale k (k = 1 is 220 px tall): circle head over a
 *  flat-topped body with square shoulders, two ear arcs; a reviewer holds the magnifier at the front, on its RIGHT. Returns its ears. */
function figure(parent, x, y, k, { magnifier = false } = {}) {
  const g = el(parent, 'g', { transform: `translate(${x} ${y}) scale(${k})` });
  el(g, 'path', { d: 'M -62 110 L -62 0 Q -62 -34 -28 -34 L 28 -34 Q 62 -34 62 0 L 62 110 Z', fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  el(g, 'circle', { cx: 0, cy: -76, r: 34, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  const ears = el(g, 'path', { d: 'M -40 -90 Q -54 -76 -40 -62 M 40 -90 Q 54 -76 40 -62', ...STROKE, stroke: P.dim, 'stroke-width': 5 });
  if (magnifier) {
    el(g, 'line', { x1: 74, y1: 24, x2: 54, y2: 48, ...STROKE, stroke: P.ink, 'stroke-width': 7 });
    el(g, 'circle', { cx: 90, cy: 6, r: 24, fill: P.bg, 'fill-opacity': 0.5, stroke: P.ink, 'stroke-width': 5 });
  }
  return [ears];
}

/** Two small topic blocks with an empty gap between them (the bridge vocabulary of scene 04, as an icon). */
function blocks(g, inner = 45, w = 60) {
  [-1, 1].forEach((sx) => {
    const x = sx > 0 ? inner : -inner - w;
    el(g, 'rect', { x, y: -46, width: w, height: 92, rx: Math.min(14, w / 3), fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
    bar(g, x + 10, -18, w - 20, 12, P.dim);
    bar(g, x + 10, 4, Math.max(8, w - 30), 12, P.dim);
  });
}

function scriptPage(parent) {
  const it = new Item(parent, 360, 470);
  it.frame = el(it.g, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  it.heads = []; it.cross = [];
  // three topic blocks; the gap between block 2 and block 3 is a clear hole (about three times the normal spacing)
  [-180, -75, 110].forEach((y) => {
    it.heads.push(bar(it.g, -150, y, 60, 26, P.ink));
    bar(it.g, -70, y - 10, 210, 14, P.dim);
    bar(it.g, -70, y + 18, 180, 14, P.dim);
    bar(it.g, -70, y + 46, 200, 14, P.dim);
    // hidden headings: an ink X over the heading bar (the normal state for a listener, not an error)
    it.cross.push(el(it.g, 'path', { d: `M -162 ${y - 22} L -78 ${y + 22} M -162 ${y + 22} L -78 ${y - 22}`, ...STROKE, stroke: P.ink, 'stroke-width': 6, opacity: 0 }));
  });
  it.q = el(it.g, 'text', { x: 30, y: 50, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 44, 'font-weight': 700, fill: P.hot, opacity: 0 }, '?');
  return it;
}

function stone(parent, i) {
  const w = SH;
  const it = new Item(parent, w, SH);
  it.box = el(it.g, 'rect', { x: -w / 2, y: -SH / 2, width: w, height: SH, rx: 40, fill: P.bg2, stroke: P.dim, 'stroke-width': 5 });
  it.icon = el(it.g, 'g', {});
  return it.at(XS[i], SY);
}

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { cue: 'so', delay: 0, dur: 2.0, x: 975, y: 500, z: 1.08 },
      // back to the wide view while "said out loud" is on screen, so the route appears already in place
      { cue: 'loud', delay: 0.5, dur: 1.3, x: 960, y: 540, z: 1 },
    ], c),
  };
  const W = S.stage.world, H = S.stage.hud;

  // part 1: the page and the listener
  S.page = scriptPage(W).at(PAGE_X0, PAGE_Y);
  S.lis = new Item(W, 150, 220);
  S.ears = figure(S.lis.g, 0, 0, 1);
  S.lis.at(LIS_X, LIS_Y);
  S.voice = flow(W, [[PAGE_X + 200, PAGE_Y - 20], [LIS_X - 90, LIS_Y - 80]], { n: 5, color: P.accent, period: 1.6 });
  S.idea = label(H, 'a listener cannot see your headings', { size: 56 }).at(960, 830);
  S.subj = chip(H, 'every change of subject', { size: 48, color: P.ink }).at(700, 830);
  S.reas = chip(H, 'every reason', { size: 48, color: P.ink }).at(1310, 830);
  S.loud = label(H, 'said out loud', { size: 64, color: P.accent }).at(960, 830);

  // part 2: the route
  S.stones = XS.map((_, i) => stone(W, i));
  // 1: goes wrong = a gap between two blocks with a small magenta question mark in it
  { const g = S.stones[0].icon; blocks(g);
    el(g, 'text', { x: 0, y: 18, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 56, 'font-weight': 700, fill: P.hot }, '?'); }
  // 2: the bridge = the same two blocks spread apart, with the lit "because" plank spanning the gap at mid-height (as in scene 04)
  { const g = S.stones[1].icon; const pw = Math.ceil(measure('because', 38)) + 20;
    blocks(g, pw / 2, 26);
    el(g, 'rect', { x: -pw / 2, y: -28, width: pw, height: 56, rx: 12, fill: P.accent, stroke: P.accent, 'stroke-width': 4 });
    el(g, 'text', { x: 0, y: 13, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 38, 'font-weight': 700, fill: P.bg }, 'because'); }
  // 3: one story arrow
  { const g = S.stones[2].icon;
    el(g, 'line', { x1: -66, y1: 0, x2: 60, y2: 0, stroke: P.accent, 'stroke-width': 9, 'stroke-linecap': 'round' });
    el(g, 'path', { d: 'M 34 -28 L 64 0 L 34 28', fill: 'none', stroke: P.accent, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); }
  // 4 and 5: the critic (ears dim) and the flow review (ears light as it listens), each on its own stone, magnifier at the front right
  figure(S.stones[3].icon, -24, 0, 0.8, { magnifier: true });
  S.flowEars = figure(S.stones[4].icon, -24, 0, 0.8, { magnifier: true });
  // 6: a question mark (unlabelled: the narration names it)
  { el(S.stones[5].icon, 'text', { x: 0, y: 44, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 128, 'font-weight': 700, fill: P.ink }, '?'); }

  S.labels = ['goes wrong', 'a bridge', 'one story', 'the critic', 'flow review'].map((s, i) =>
    label(W, s, { size: 40 }).at(XS[i], SY + SH / 2 + 50));
  // the end phrase restates the scene's idea (the tail after "catch" is too short to swap phrases; the ? stone carries the teaser)
  S.end = label(H, 'said out loud', { size: 64, color: P.ink }).at(960, 840);
}
export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // ---- part 1 ----
  const out1 = 1 - io(prog(t, c('route'), 0.45));
  const pg = S.page;
  pg.show(reveal(t, c('page')) * out1).at(lerp(PAGE_X0, PAGE_X, io(prog(t, c('listener') - 0.2, 1.0))), PAGE_Y);
  set(pg.q, { opacity: +(reveal(t, c('gaps'), 0.4) * (1 + 0.25 * Math.sin(Math.PI * prog(t, c('subject'), 0.8)))).toFixed(3), 'font-size': (44 * (1 + 0.25 * Math.sin(Math.PI * prog(t, c('subject'), 0.8)))).toFixed(1) });
  const headLit = reveal(t, c('headings'), 0.4) * (1 - reveal(t, c('noHead'), 0.4));
  pg.heads.forEach((h) => set(h, { fill: headLit > 0.5 ? P.accent : t >= c('noHead') ? P.dim : P.ink }));
  pg.cross.forEach((x, i) => set(x, { opacity: +reveal(t, c('noHead') + i * 0.15, 0.3).toFixed(3) }));
  const layLit = reveal(t, c('layout'), 0.4) * (1 - reveal(t, c('noLayout'), 0.4));
  set(pg.frame, { stroke: layLit > 0.5 ? P.accent : P.dim, 'stroke-dasharray': t >= c('noLayout') ? '14 12' : 'none', 'stroke-opacity': +lerp(1, 0.45, reveal(t, c('noLayout'), 0.5)).toFixed(3) });

  S.lis.show(reveal(t, c('listener')) * out1);
  const listening = t >= c('noHead');
  S.ears.forEach((e) => set(e, { stroke: listening ? P.accent : P.dim }));
  S.voice.update(t, reveal(t, c('loud'), 0.5) * out1);

  S.idea.show(reveal(t, c('idea'), 0.5) * (1 - ease.in(prog(t, c('subject') - 0.6, 0.4))));
  const chipsOut = 1 - ease.in(prog(t, c('loud') - 0.45, 0.4));
  S.subj.show(reveal(t, c('subject'), 0.4) * chipsOut).dim(dimAfter(t, c('reason'), 0.35));
  S.reas.show(reveal(t, c('reason'), 0.4) * chipsOut);
  S.loud.show(reveal(t, c('loud'), 0.4) * (1 - ease.in(prog(t, c('route'), 0.4))));

  // ---- part 2: the route ----
  const lit = [c('wrong'), c('bridge'), c('story'), c('reviewers'), c('reviewers'), c('last')];
  const next = [c('bridge'), c('story'), c('reviewers'), c('flow'), c('last'), Infinity];
  const ghost = 0.22 * reveal(t, c('route') + 0.5, 0.4); // only after the page and listener are gone
  S.stones.forEach((s, i) => {
    let v = lerp(ghost, 1, reveal(t, lit[i], 0.5));
    v = lerp(v, 0.35, io(prog(t, next[i], 0.6)));
    // the flow review waits a step back while the critic is named
    if (i === 4) v *= lerp(1, 0.5, reveal(t, c('critic'), 0.3) * (1 - reveal(t, c('flow'), 0.3)));
    s.show(v);
    const on = t >= (i === 4 ? c('flow') : lit[i]) && t < next[i];
    set(s.box, { stroke: on ? (i === 5 ? P.ink : P.accent) : P.dim }); // the last stone is a limit, not something good: ink ring
    set(s.icon, { opacity: +reveal(t, lit[i], 0.5).toFixed(3) });
  });
  S.flowEars.forEach((e) => set(e, { stroke: t >= c('flow') ? P.accent : P.dim }));

  const lt = [c('wrong'), c('bridge'), c('story'), c('critic'), c('flow')];
  S.labels.forEach((l, k) => l.show(reveal(t, lt[k], 0.4)).dim(dimAfter(t, next[k], 0.35)));
  S.end.show(reveal(t, c('end'), 0.5));
}
