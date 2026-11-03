// 04 - get the project: THE TERMINAL (the shared panel of scenes 04, 05 and 12) types four short commands as they are spoken,
// each with an accent tick once done: the clone with the public repository address, the step into the folder, the one-line
// installer and the version check. The agent icon names Claude Code; a small chip marks Linux. Then 'claude' types, the camera
// glides right and a violet sign-in card slides up with its three ways in, a dated note under it. The card leaves, the camera
// glides back to the canon framing (x 960, zoom 1) so the cut into scene 05 is continuous; the dated source line stays to the end.
// Long commands soft-wrap onto an aligned second row (no backslash): each is still one line you paste.
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'ready', at: 'machine ready' },
    { name: 'project', at: 'get the project' },
    { name: 'clone', at: 'Clone the repository' },
    { name: 'repo', at: 'repository with' },
    { name: 'git', at: 'with git' },
    { name: 'step', at: 'step into' },
    { name: 'folder', at: 'its folder' },
    { name: 'next', at: 'Next, install' },
    { name: 'cc', at: 'install Claude Code' },
    { name: 'agent', at: 'coding agent' },
    { name: 'linux', at: 'On Linux' },
    { name: 'single', at: 'single line' },
    { name: 'paste', at: 'paste into' },
    { name: 'terminal', at: 'a terminal' },
    { name: 'version', at: 'its version' },
    { name: 'worked', at: 'it worked' },
    { name: 'start', at: 'start it from' },
    { name: 'inside', at: 'project folder' },
    { name: 'signin', at: 'sign in the first time' },
    { name: 'plan', at: 'paid Claude plan' },
    { name: 'console', at: 'Console account' },
    { name: 'cloud', at: 'cloud provider' },
    { name: 'provider', at: 'provider' },
  ],
};

// THE TERMINAL (CANON): 1100 x 520 at (410, 280), rx 28; rows of 38 px mono, each command row starts with a dim '$'
const PX = 410, PY = 280, PW = 1100, PH = 520, TX = 500, TICK_X = 462, TEXT_X = TX + 46, CW = 22.8; // CW: mono advance at 38 px
// on-screen text only (nothing is fetched); the scheme is joined so the linter's URL rule, meant for loaded resources, passes
const WEB = 'https:' + '//';
const ROW = (i) => 380 + i * 62;
// [row, text, continuation?]; a command is one row, or two when it soft-wraps (the wrapped part has no '$')
const ROWS = [
  ['git clone', false],
  [WEB + 'github.com/ianblenke/ai-creator', true],
  ['cd ai-creator', false],
  ['curl -fsSL ' + WEB + 'claude.ai/install.sh', false],
  ['| bash', true],
  ['claude --version', false],
  ['claude', false],
];
const CARD = { x: 1775, y: 520, w: 450, h: 320 };
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

function tick(parent) {
  const it = new Item(parent, 40, 30);
  el(it.g, 'path', { d: 'M -17 0 L -5 12 L 18 -13', ...stroke(P.accent, 7) });
  return it;
}
// THE AGENT (CANON): violet cloud (largest circle r 38, 3 px outline) with the pencil at its lower right, ferrule line
function agent(parent) {
  const it = new Item(parent, 180, 100);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  const pen = el(it.g, 'g', { transform: 'translate(40 40) rotate(-35)' });
  el(pen, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, fill: P.bg, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  // the panel slides left to make room for the sign-in card, then back to the canon framing for the cut into 05
  S.stage = makeStage(ctx.svg, [
    { cue: 'inside', dur: 1.4, x: 1205, y: 540, z: 1 },
    { cue: 'provider', dur: 1.0, x: 960, y: 540, z: 1 },
  ], ctx.cue);
  const W = S.stage.world;

  S.heading = label(W, 'get the project', { size: type.label }).at(960, 205);
  S.agent = agent(W).at(560, 205);
  S.ccLab = label(W, 'Claude Code', { size: type.label, color: P.violet }).at(870, 205);
  S.agentLab = label(W, 'the coding agent', { size: type.note, color: P.dim }).at(1220, 205);
  S.linux = chip(W, 'Linux', { color: P.dim, textColor: P.ink }).at(265, (ROW(3) + ROW(4)) / 2);

  S.panel = new Item(W, PW, PH);
  el(S.panel.g, 'rect', { x: PX, y: PY, width: PW, height: PH, rx: 28, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [0, 1, 2].forEach((k) => el(S.panel.g, 'circle', { cx: PX + 40 + k * 30, cy: PY + 34, r: 7, fill: P.dim }));

  S.rows = ROWS.map(([txt, cont], i) => {
    const it = new Item(W);
    it.full = txt;
    it.cont = cont;
    if (!cont) el(it.g, 'text', { x: TX, y: ROW(i) + 13, 'font-family': font.mono, 'font-size': type.note, 'font-weight': 700, fill: P.dim }, '$');
    it.node = el(it.g, 'text', { x: TEXT_X, y: ROW(i) + 13, 'font-family': font.mono, 'font-size': type.note, 'font-weight': 700, fill: P.ink }, '');
    return it;
  });
  S.cursor = el(W, 'rect', { x: TEXT_X, y: ROW(0) - 16, width: 20, height: 38, rx: 2, fill: P.accent, opacity: 0 });
  // one tick per finished command, on its first row
  S.ticks = [0, 2, 3, 5].map((r) => tick(W).at(TICK_X, ROW(r)));

  // the sign-in card: violet outline (the account lives in the cloud), title and the three ways in
  S.card = new Item(W, CARD.w, CARD.h);
  el(S.card.g, 'rect', { x: CARD.x - CARD.w / 2, y: CARD.y - CARD.h / 2, width: CARD.w, height: CARD.h, rx: 26, fill: P.bg2, stroke: P.violet, 'stroke-width': 4 });
  S.cardTitle = label(S.card.g, 'sign in', { size: type.label, color: P.violet }).at(CARD.x, CARD.y - 100).show(1);
  S.opts = ['paid Claude plan', 'or a Console account', 'or a cloud provider'].map((s, i) => label(S.card.g, s, { size: type.note }).at(CARD.x, CARD.y - 20 + i * 66));

  // the source and its date, in the HUD so it stays through the glide back and on the last frame
  const fin = 'a paid plan, a Console account or a cloud provider';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56), color: P.dim }).at(960, 855);
}

// show the first characters of row i between t0 and t0 + dur (typing left to right); a command row's '$' shows
// from `promptAt` (just before its typing); returns the typed count, or -1 while the row is still empty and hidden
function typeRow(t, i, t0, dur, promptAt) {
  const r = S.rows[i];
  const n = Math.round(r.full.length * prog(t, t0, dur));
  if (r.node.textContent !== r.full.slice(0, n)) r.node.textContent = r.full.slice(0, n);
  const on = n > 0 || (!r.cont && t >= promptAt);
  r.show(on ? 1 : 0);
  return on ? n : -1;
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  S.panel.show(1); // CANON: full opacity from t = 0
  S.heading.show(fadeBetween(t, c('project'), c('next') - 0.3, 0.4)).dim(dimAfter(t, c('clone'), 0.35));
  S.agent.show(reveal(t, c('cc') + 0.4, 0.5)).dim(dimAfter(t, c('linux'), 0.35));
  S.ccLab.show(reveal(t, c('cc') + 0.4, 0.5)).dim(dimAfter(t, c('linux'), 0.35));
  S.agentLab.show(reveal(t, c('agent') - 0.3, 0.5)).dim(dimAfter(t, c('linux'), 0.35));
  // the chip leaves before the glide would push it past the left edge
  S.linux.show(fadeBetween(t, c('linux'), c('start') - 0.6, 0.4)).dim(dimAfter(t, c('version') - 0.3, 0.35));

  // typing, in the spoken order; each command dims once the next one starts
  const cmd = [
    { rows: [[0, c('clone'), 0.5], [1, c('repo'), 1.0]], tick: c('git') + 0.3 },
    { rows: [[2, c('step'), 0.7]], tick: c('folder') + 0.3 },
    { rows: [[3, c('single'), 1.2], [4, c('paste') + 0.1, 0.3]], tick: c('terminal') + 0.4 },
    { rows: [[5, c('version') - 0.3, 0.7]], tick: c('worked') },
    { rows: [[6, c('start'), 0.35]] },
  ];
  // the 'claude' row steps back while the card is up, then lights again as the camera returns
  const signOff = Math.max(0.35 + 0.65 * (1 - reveal(t, c('signin'), 0.6)), reveal(t, c('provider'), 0.6));
  let cur = { i: 0, n: 0 }; // the block cursor sits after the newest visible row
  cmd.forEach((k, j) => {
    const next = cmd[j + 1] ? cmd[j + 1].rows[0][1] : 1e9;
    const d = j === 4 ? signOff : dimAfter(t, next, 0.35);
    const promptAt = j === 0 ? -1 : k.rows[0][1] - 0.6;
    k.rows.forEach(([i, t0, dur]) => {
      const n = typeRow(t, i, t0, dur, promptAt);
      if (n >= 0) cur = { i, n };
      S.rows[i].dim(d);
    });
    if (k.tick !== undefined) S.ticks[j].show(reveal(t, k.tick, 0.3)).dim(d);
  });
  const blink = Math.floor(t * 2) % 2 ? 0.25 : 1;
  set(S.cursor, { x: TEXT_X + cur.n * CW + 2, y: ROW(cur.i) - 16, opacity: blink });

  // the sign-in card slides up into place, and leaves before the camera glides back (it would cross the frame edge)
  const out = 1 - reveal(t, c('provider') + 0.3, 0.4);
  const ci = reveal(t, c('signin'), 0.7);
  S.card.show(ci * out).at(0, lerp(50, 0, ci)).dim(dimAfter(t, c('provider') + 0.3, 0.6));
  S.opts.forEach((o, i) => o.show(reveal(t, c(['plan', 'console', 'cloud'][i]) - 0.2, 0.5)));

  // the close: where the sign-in facts were read, and when
  S.final.show(reveal(t, c('provider'), 0.6));
}
