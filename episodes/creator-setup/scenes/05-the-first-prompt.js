// 05 - the first prompt: the terminal panel from scene 04 (same place and size) turns into THE PROMPT CARD (violet outline).
// Five chips fill its column as the prompt is spoken (read, check, settings, build and test, render), with short notes beside
// them; a hot STOP sits on "do not install / without asking" and a second one on "at any failure / show me the error".
// The read-only lock appears beside the card ("read files" yes, "run commands" struck out). The chips light again on
// "the same steps", then three question bubbles rise from THE AGENT (violet cloud with pencil): Docker, names, draft or final.
// No ticks anywhere: the agent did not run the steps. Ends wide on "so you can check its work".
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, measure, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'agent', at: 'ask the agent' },
    { name: 'prompt', at: 'This is the prompt' },
    { name: 'read', at: 'read the readme' },
    { name: 'check', at: 'check my machine' },
    { name: 'missing', at: 'what is missing' },
    { name: 'dont', at: 'Do not install' },
    { name: 'asking', at: 'without asking' },
    { name: 'settings', at: 'copy the settings' },
    { name: 'names', at: 'ask me for the names' },
    { name: 'build', at: 'build the image' },
    { name: 'tests', at: 'run the tests' },
    { name: 'render', at: 'render the offline' },
    { name: 'offline', at: 'offline example' },
    { name: 'failure', at: 'at any failure' },
    { name: 'error', at: 'show me the error' },
    { name: 'ran', at: 'I ran that prompt' },
    { name: 'fresh', at: 'fresh copy' },
    { name: 'readonly', at: 'read-only mode' },
    { name: 'files', at: 'read files' },
    { name: 'commands', at: 'not run commands' },
    { name: 'same', at: 'same steps' },
    { name: 'questions', at: 'right questions' },
    { name: 'docker', at: 'is Docker' },
    { name: 'qnames', at: 'which names' },
    { name: 'draft', at: 'the draft' },
    { name: 'notlet', at: 'I did not let' },
    { name: 'next', at: 'The next scenes' },
    { name: 'so', at: 'so you can' },
  ],
};

// the terminal / prompt card: 1100 x 520 centred at (960, 540), as in scenes 04 and 12
const CARD = { x: 410, y: 280, w: 1100, h: 520 };
const COL = 470;                                  // left edge of the chip column
const ROWS = [410, 490, 570, 650, 730];           // chip rows
const AG = [280, 250];                            // the agent, top left outside the card
const LK = [1670, 430];                           // the read-only lock, right of the card (labels clear the rim and the 1800 frame)
const BUB = [[600, 190], [900, 190], [1250, 190]]; // where the question bubbles settle, above the card
const WIRE_Y = 262;                               // the agent's dotted line to each bubble runs under the row, above the card
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
// bright inside [a, b), `floor` outside, smooth edges
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

// THE AGENT: a small violet cloud with a pencil
function agent(parent) {
  const it = new Item(parent, 160, 100);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  const pen = el(it.g, 'g', { transform: 'translate(40 40) rotate(-35)' });
  el(pen, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, fill: P.bg, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return it;
}
// a STOP: a small hot octagon with a hot bar
function stop(parent, r = 32) {
  const it = new Item(parent, r * 2, r * 2);
  const pts = Array.from({ length: 8 }, (_, k) => { const a = ((22.5 + 45 * k) * Math.PI) / 180; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; });
  el(it.g, 'polygon', { points: pts.join(' '), fill: P.hot, 'fill-opacity': 0.18, stroke: P.hot, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(it.g, 'line', { x1: -r * 0.45, x2: r * 0.45, y1: 0, y2: 0, ...stroke(P.hot, 6) });
  return it;
}
// THE READ-ONLY LOCK: a small dim padlock
function lock(parent) {
  const it = new Item(parent, 80, 100);
  el(it.g, 'path', { d: 'M -22 -8 L -22 -30 A 22 22 0 0 1 22 -30 L 22 -8', ...stroke(P.dim, 7) });
  el(it.g, 'rect', { x: -38, y: -8, width: 76, height: 60, rx: 10, fill: P.dim, 'fill-opacity': 0.15, stroke: P.dim, 'stroke-width': 5 });
  el(it.g, 'circle', { cx: 0, cy: 16, r: 7, fill: P.dim });
  el(it.g, 'line', { x1: 0, x2: 0, y1: 20, y2: 34, ...stroke(P.dim, 5) });
  return it;
}
// A QUESTION BUBBLE: violet outline, one short phrase, a small tail at the lower left
function bubble(parent, text) {
  const w = Math.ceil(measure(text, type.note) + 56), h = 72;
  const it = new Item(parent, w, h);
  el(it.g, 'path', { d: `M ${-w / 2 + 30} ${h / 2 - 2} L ${-w / 2 + 22} ${h / 2 + 18} L ${-w / 2 + 50} ${h / 2 - 2}`, fill: P.bg2, ...stroke(P.violet, 4) });
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: P.bg2, stroke: P.violet, 'stroke-width': 4 });
  label(it.g, text, { size: type.note, color: P.ink }).show(1);
  return it;
}
// a note left-aligned at x (its Item is centred, so shift by half its width)
const note = (parent, text, x, y, color = P.ink) => { const it = label(parent, text, { size: type.note, color }); return it.at(x + it.w / 2, y); };

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    // the card stays at its shared place (CANON): the camera starts wide at 960, z 1 and only pans <= 40 px
    { cue: 'ran', dur: 1.4, x: 1000, y: 540, z: 1 },          // a touch right for the lock
    { cue: 'questions', dur: 1.6, x: 980, y: 510, z: 1 },     // a touch up for the bubbles above the card
    { cue: 'next', dur: 1.6, x: 960, y: 540, z: 1 },          // wide for the close
    { cue: 'so', dur: 1.0, x: 960, y: 580, z: 1 },            // card up 40 px: clear space above the closing phrase
  ], ctx.cue);
  const W = S.stage.world;

  // the panel: terminal outline (dim) with a violet prompt-card outline that fades over it
  el(W, 'rect', { x: CARD.x, y: CARD.y, width: CARD.w, height: CARD.h, rx: 28, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.violetRim = el(W, 'rect', { x: CARD.x, y: CARD.y, width: CARD.w, height: CARD.h, rx: 28, fill: 'none', stroke: P.violet, 'stroke-width': 4, opacity: 0 });
  // three dim window dots (CANON), kept while the panel becomes the card
  [0, 1, 2].forEach((k) => el(W, 'circle', { cx: 450 + 30 * k, cy: 314, r: 7, fill: P.dim }));
  // the terminal's empty prompt row (CANON: row 0 at y 380, dim 38 px "$", accent block cursor), before it becomes the card
  S.term = new Item(W);
  el(S.term.g, 'text', { x: 500, y: 380 + 13, 'font-family': font.mono, 'font-size': type.note, 'font-weight': 700, fill: P.dim }, '$');
  S.cursor = el(S.term.g, 'rect', { x: 548, y: 380 - 16, width: 20, height: 38, rx: 2, fill: P.accent });
  S.title = label(W, 'the prompt', { size: type.label, color: P.violet });
  S.title.at(540 + S.title.w / 2, 314); // on the dots' line, right of them (clear of the dots and the first chip)

  // the five chips and their notes
  S.chips = ['read', 'check', 'settings', 'build and test', 'render'].map((txt, i) => {
    const c = chip(W, txt, { color: P.violet });
    return c.at(COL + c.w / 2, ROWS[i]);
  });
  // 'build' alone until "run the tests", then it becomes 'build and test' (same left edge)
  S.buildOnly = chip(W, 'build', { color: P.violet });
  S.buildOnly.at(COL + S.buildOnly.w / 2, ROWS[3]);
  const right = (i) => S.chips[i].box().r + 26;
  S.missing = note(W, 'what is missing', right(1), ROWS[1]);
  S.names = note(W, 'names to block', right(2), ROWS[2], P.hot);
  S.offline = note(W, 'offline example', right(4), ROWS[4]);

  // stop 1: do not install without asking; stop 2: at any failure, show me the error
  S.stop1 = stop(W).at(1030, 464);
  S.dont = note(W, 'do not install', 1090, 438);
  S.asking = note(W, 'without asking', 1090, 490);
  S.stop2 = stop(W).at(1030, 690);
  S.failure = note(W, 'at any failure', 1090, 664);
  S.error = note(W, 'show me the error', 1090, 716);

  // the agent and its questions
  S.agent = agent(W).at(...AG);
  S.bubbles = ['Docker', 'names', 'draft or final'].map((q) => bubble(W, q));
  // the agent's dotted line to the lit bubble, and its arrow to the chip column on "the same steps"
  S.wire = el(W, 'path', { d: '', ...stroke(P.violet, 4), 'stroke-dasharray': '2 14', opacity: 0 });
  S.toChips = el(W, 'g', { opacity: 0 });
  el(S.toChips, 'path', { d: 'M 262 312 Q 262 570 388 570', ...stroke(P.violet, 4) });
  el(S.toChips, 'path', { d: 'M 372 554 L 392 570 L 372 586', ...stroke(P.violet, 4) });

  // the read-only lock
  S.fresh = label(W, 'fresh copy', { size: type.note, color: P.ink }).at(LK[0], 330);
  S.lock = lock(W).at(...LK);
  S.ro = label(W, 'read-only', { size: type.note, color: P.dim }).at(LK[0], 535);
  S.files = label(W, 'read files', { size: type.note, color: P.ink }).at(LK[0], 605);
  S.cmds = label(W, 'commands', { size: type.note, color: P.dim }).at(LK[0], 670);
  S.strike = el(W, 'line', { x1: LK[0] - S.cmds.w / 2 - 6, x2: LK[0] - S.cmds.w / 2 - 6, y1: 670, y2: 670, ...stroke(P.hot, 5), opacity: 0 });

  const fin = 'so you can check its work';
  S.final = label(S.stage.hud, fin, { size: 64, color: P.ink }).at(960, 850);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // terminal -> prompt card
  const toCard = reveal(t, c('prompt'), 0.8);
  set(S.violetRim, { opacity: +toCard.toFixed(3) });
  S.term.show(1 - ease.inOut(prog(t, c('prompt'), 0.45)));
  set(S.cursor, { opacity: Math.floor(t * 2) % 2 ? 0.2 : 1 });
  S.title.show(reveal(t, c('prompt') + 0.45, 0.45)).dim(spot(t, -1, c('read'), 0.6));

  // chips: each bright from its cue until the next chip; all bright again on "the same steps"
  const chipAt = ['read', 'check', 'settings', 'build', 'render'].map(c);
  const ends = [chipAt[1], c('dont'), chipAt[3], chipAt[4], c('failure')];
  const again = spot(t, c('same'), c('questions'), 0);
  const lit = S.chips.map((ch, i) => {
    const d = Math.max(spot(t, chipAt[i], ends[i]), again);
    const r = i === 3 ? reveal(t, c('tests'), 0.4) : reveal(t, chipAt[i], 0.5);
    ch.show(r).dim(d);
    return d;
  });
  S.buildOnly.show(reveal(t, chipAt[3], 0.5) * (1 - reveal(t, c('tests'), 0.4))).dim(lit[3]);
  S.missing.show(reveal(t, c('missing'), 0.5)).dim(lit[1]);
  S.names.show(reveal(t, c('names'), 0.5)).dim(lit[2]);
  S.offline.show(reveal(t, c('offline'), 0.5)).dim(lit[4]);

  const s1 = Math.max(spot(t, c('dont'), c('settings')), again);
  S.stop1.show(reveal(t, c('dont'), 0.4)).at(1030, 464, 1 + 0.12 * Math.sin(Math.PI * prog(t, c('dont'), 0.5))).dim(s1);
  S.dont.show(reveal(t, c('dont'), 0.5)).dim(s1);
  S.asking.show(reveal(t, c('asking'), 0.5)).dim(s1);
  const s2 = Math.max(spot(t, c('failure'), c('ran')), again);
  S.stop2.show(reveal(t, c('failure') + 0.6, 0.4)).at(1030, 690, 1 + 0.12 * Math.sin(Math.PI * prog(t, c('failure') + 0.6, 0.5))).dim(s2);
  S.failure.show(reveal(t, c('failure'), 0.5)).dim(s2);
  S.error.show(reveal(t, c('error'), 0.5)).dim(s2);

  // the lock: fresh copy, read-only, read files yes, run commands struck; lit again on "I did not let it run them"
  const lk = Math.max(spot(t, c('fresh'), c('same')), spot(t, c('notlet'), c('next')));
  S.fresh.show(reveal(t, c('fresh'), 0.5)).dim(spot(t, c('fresh'), c('readonly')));
  S.lock.show(reveal(t, c('readonly'), 0.5)).dim(lk);
  S.ro.show(reveal(t, c('readonly'), 0.5)).dim(lk);
  S.files.show(reveal(t, c('files'), 0.5)).dim(lk);
  S.cmds.show(reveal(t, c('commands'), 0.5)).dim(lk);
  const sk = ease.inOut(prog(t, c('commands') + 0.3, 0.6));
  set(S.strike, { x2: (LK[0] - S.cmds.w / 2 - 6 + (S.cmds.w + 12) * sk).toFixed(1), opacity: +(reveal(t, c('commands') + 0.3, 0.2) * lk).toFixed(3) });

  // the agent: bright when introduced, when its plan matches ("the same steps") and while it asks
  S.agent.show(reveal(t, c('agent'), 0.6)).dim(Math.max(spot(t, c('agent'), c('prompt')), spot(t, c('same'), c('notlet'))));
  set(S.toChips, { opacity: +(fadeBetween(t, c('same'), c('questions'))).toFixed(3) });
  // its questions rise one by one, each sliding in from the agent's side into its own slot (no bubble crosses another)
  let wire = '', wireA = 0;
  ['docker', 'qnames', 'draft'].forEach((q, i) => {
    const t0 = c(q) - 0.3, k = ease.out(prog(t, t0, 0.9));
    const [bx, by] = BUB[i], end = i < 2 ? c(['qnames', 'draft'][i]) - 0.3 : c('notlet');
    const b = S.bubbles[i].show(reveal(t, t0, 0.4)).at(lerp(bx - 50, bx, k), lerp(by + 24, by, k)).dim(spot(t, t0, end));
    const a = reveal(t, t0 + 0.5, 0.3) * (1 - reveal(t, end, 0.3));
    if (a > 0) { const tx = b.box().l + 22; wire = `M 400 ${WIRE_Y} L ${tx.toFixed(1)} ${WIRE_Y} L ${tx.toFixed(1)} ${by + 54}`; wireA = a; }
  });
  set(S.wire, { d: wire || 'M 0 0', opacity: +wireA.toFixed(3) });

  // close: wide, the phrase dominates
  const fin = reveal(t, c('so'), 0.6);
  S.final.show(fin);
  set(S.stage.world, { opacity: +lerp(1, 0.15, fin).toFixed(3) });
}
