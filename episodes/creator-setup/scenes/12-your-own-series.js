// 12 - your own series: the SAME terminal panel as scenes 04 and 05 (canon place and size) becomes the second prompt card
// (violet rim). The prompt's chips arrive as spoken: the rules file (series name) and the new episode, then a question
// bubble "problem?" with a stop (ask before writing anything); a dim read-only lock sits right of the card. At "gave me"
// the card clears and its header becomes "right order": the agent's own list fills it (rules file, names, new episode,
// plan, facts). At "It held" the card narrows to its chips, a magenta line leaves it toward a blank script page and stops
// at the canon accent gate labelled "approve first". Ends wide on "you approve the script before any voice is recorded".
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, measure, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize, glow } from 'kit';

export const meta = {
  cues: [
    { name: 'own', at: 'your own series' },
    { name: 'agent', at: 'give the agent' },
    { name: 'prompt', at: 'second prompt' },
    { name: 'rules', at: 'template rules file' },
    { name: 'name', at: 'series name' },
    { name: 'episode', at: 'first episode folder' },
    { name: 'ask', at: 'ask me' },
    { name: 'problem', at: 'what problem' },
    { name: 'writing', at: 'writing anything' },
    { name: 'ro', at: 'read-only' },
    { name: 'gave', at: 'gave me' },
    { name: 'order', at: 'right order' },
    { name: 'rules2', at: 'the rules file' },
    { name: 'names', at: 'list of names' },
    { name: 'newep', at: 'new episode folder' },
    { name: 'plan', at: 'a plan' },
    { name: 'facts', at: 'then the facts' },
    { name: 'held', at: 'It held' },
    { name: 'approved', at: 'I approved' },
    { name: 'script', at: 'any script was written' },
    { name: 'habit', at: 'the habit' },
    { name: 'final', at: 'approve the script' },
  ],
};

// CANON terminal: 1100 x 520 at (410, 280), the same panel as scenes 04 and 05
const CARD = { x: 410, y: 280, w: 1100, h: 520 }, NARROW = 470;  // NARROW: card width once it holds only the order
const COL = 470, ROWS = [410, 490, 570, 650];        // chip column and rows, as in scene 05
const AG = [280, 250], LK = [1660, 430];             // the agent (top left) and the read-only lock (right), as in scene 05
const BUB = [520, 170], TIP = [330, 220];            // the question bubble, above the card; its tail points at the agent
const GX = 1100, GY = 650, PAGE = [1400, 620];       // the gate (on the facts row) and the blank script page
const stroke = (color, w = 6) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

// THE AGENT (canon): violet cloud, largest circle r 38, 3 px outline, pencil with ferrule at the lower right
function agent(parent) {
  const it = new Item(parent, 128, 92);
  const st = { fill: P.violet, 'fill-opacity': 0.16, stroke: P.violet, 'stroke-width': 3 };
  [[-36, 8, 28], [38, 10, 26], [0, -8, 38]].forEach(([cx, cy, r]) => el(it.g, 'circle', { cx, cy, r, ...st }));
  const pen = el(it.g, 'g', { transform: 'translate(40 40) rotate(-35)' });
  el(pen, 'rect', { x: 0, y: -7, width: 56, height: 14, rx: 3, fill: P.bg, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'line', { x1: 12, y1: -7, x2: 12, y2: 7, stroke: P.violet, 'stroke-width': 3 });
  el(pen, 'path', { d: 'M 56 -7 L 72 0 L 56 7 Z', fill: P.bg, stroke: P.violet, 'stroke-width': 3, 'stroke-linejoin': 'round' });
  return it;
}
// THE READ-ONLY LOCK: the same padlock as scene 05 (with keyhole slot)
function lock(parent) {
  const it = new Item(parent, 80, 100);
  el(it.g, 'path', { d: 'M -22 -8 L -22 -30 A 22 22 0 0 1 22 -30 L 22 -8', ...stroke(P.dim, 7) });
  el(it.g, 'rect', { x: -38, y: -8, width: 76, height: 60, rx: 10, fill: P.dim, 'fill-opacity': 0.15, stroke: P.dim, 'stroke-width': 5 });
  el(it.g, 'circle', { cx: 0, cy: 16, r: 7, fill: P.dim });
  el(it.g, 'line', { x1: 0, x2: 0, y1: 20, y2: 34, ...stroke(P.dim, 5) });
  return it;
}
// A STOP: r 32, stroke 5, hot fill 0.18, hot bar
function stop(parent, r = 32) {
  const it = new Item(parent, r * 2, r * 2);
  const pts = Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + (k * Math.PI) / 4; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  el(it.g, 'polygon', { points: pts, fill: P.hot, 'fill-opacity': 0.18, stroke: P.hot, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(it.g, 'line', { x1: -r * 0.45, y1: 0, x2: r * 0.45, y2: 0, ...stroke(P.hot, 6) });
  return it;
}
// A QUESTION BUBBLE: bg2 fill, violet stroke 4, pill radius h/2, tail from the lower left to tip (relative to the centre)
function bubble(parent, text, tip) {
  const w = Math.ceil(measure(text, type.note) + 56), h = 72;
  const it = new Item(parent, w, h);
  el(it.g, 'path', { d: `M ${-w / 2 + 24} ${h / 2 - 8} L ${tip[0]} ${tip[1]} L ${-w / 2 + 54} ${h / 2 - 2}`, fill: P.bg2, ...stroke(P.violet, 4) });
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: P.bg2, stroke: P.violet, 'stroke-width': 4 });
  label(it.g, text, { size: type.note, color: P.ink }).show(1);
  return it;
}
const chipAt = (c, row, x = COL) => c.at(x + c.w / 2, row);
const leftAt = (it, x, y) => it.at(x + it.w / 2, y);

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'rules', dur: 1.6, x: 950, y: 540, z: 1.04 },        // lean into the card as the prompt is read
    { cue: 'ro', dur: 1.4, x: 1000, y: 520, z: 1 },             // over to the right for the lock
    { cue: 'held', dur: 1.4, x: 980, y: 560, z: 1 },            // down to the gate and the script page
    { cue: 'habit', dur: 1.6, x: 960, y: 540, z: 1 },           // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // the panel: the canon terminal (dim outline, window dots), a violet prompt-card rim fades over it
  S.panel = el(W, 'rect', { x: CARD.x, y: CARD.y, width: CARD.w, height: CARD.h, rx: 28, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.rim = el(W, 'rect', { x: CARD.x, y: CARD.y, width: CARD.w, height: CARD.h, rx: 28, fill: 'none', stroke: P.violet, 'stroke-width': 4, opacity: 0 });
  [0, 1, 2].forEach((k) => el(W, 'circle', { cx: CARD.x + 40 + k * 30, cy: CARD.y + 34, r: 7, fill: P.dim }));  // CANON II
  // the terminal's empty prompt row, before it becomes the card
  S.term = new Item(W);
  el(S.term.g, 'text', { x: 500, y: 380 + 13, 'font-family': font.mono, 'font-size': 38, 'font-weight': 700, fill: P.dim }, '$');
  S.cursor = el(S.term.g, 'rect', { x: 546, y: 380 - 16, width: 20, height: 38, rx: 2, fill: P.accent });  // CANON II: '$' x 500, text x 546

  S.title = label(W, 'your own series', { size: type.title }).at(960, 560);
  S.head = leftAt(label(W, 'second prompt', { size: type.label, color: P.violet }), 530, 330);
  S.head2 = leftAt(label(W, 'right order', { size: type.label, color: P.violet }), 530, 330);

  // what the second prompt asks
  S.rules = chipAt(chip(W, 'rules file', { color: P.ink }), ROWS[0]);
  S.nameNote = leftAt(label(W, 'series name', { size: type.note, color: P.dim }), S.rules.box().r + 30, ROWS[0]);
  S.newep = chipAt(chip(W, 'new episode', { color: P.ink }), ROWS[1]);

  // the order the agent gave back (its own list, built fresh on the cleared card)
  S.rules2 = chipAt(chip(W, 'rules file', { color: P.ink }), ROWS[0]);
  S.names = chipAt(chip(W, 'names', { color: P.ink }), ROWS[1]);
  S.newep2 = chipAt(chip(W, 'new episode', { color: P.ink }), ROWS[2]);
  S.plan = chipAt(chip(W, 'plan', { color: P.ink }), ROWS[3]);
  S.facts = chipAt(chip(W, 'facts', { color: P.ink }), ROWS[3], S.plan.box().r + 26);

  // the agent, its question and the read-only lock
  S.agent = agent(W).at(...AG);
  S.bubble = bubble(W, 'problem?', [TIP[0] - BUB[0], TIP[1] - BUB[1]]).at(...BUB);
  S.stop = stop(W).at(S.bubble.box().r + 70, BUB[1]);
  S.lock = lock(W).at(...LK);
  S.lockLab = label(W, 'read-only', { size: type.note, color: P.dim }).at(LK[0], 535);

  // the magenta line from the card's edge toward the page, stopped at the gate
  S.lineX = [CARD.x + NARROW + 14, GX - 14];
  S.line = el(W, 'line', { x1: S.lineX[0], y1: GY, x2: S.lineX[0], y2: GY, ...stroke(P.hot, 6), opacity: 0 });
  S.dash = el(W, 'line', { x1: GX + 18, y1: GY, x2: PAGE[0] - 118, y2: GY, ...stroke(P.dim, 4), 'stroke-dasharray': '10 12', opacity: 0 });
  // THE GATE (canon): one thin accent bar, 14 x 260, soft glow
  S.glow = glow(W, { rx: 40, ry: 190, color: P.accent, strength: 0.45 }).at(GX, GY);
  S.gate = new Item(W);
  el(S.gate.g, 'rect', { x: GX - 7, y: GY - 130, width: 14, height: 260, rx: 7, fill: P.accent });
  S.gateLab = label(W, 'approve first', { size: type.label, color: P.accent }).at(GX, GY - 180);

  // the blank script page
  S.page = new Item(W);
  const [px, py] = PAGE, pw = 200, ph = 260, f = 40;
  el(S.page.g, 'path', { d: `M ${px - pw / 2} ${py - ph / 2} L ${px + pw / 2 - f} ${py - ph / 2} L ${px + pw / 2} ${py - ph / 2 + f} L ${px + pw / 2} ${py + ph / 2} L ${px - pw / 2} ${py + ph / 2} Z`, fill: P.bg2, stroke: P.dim, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  el(S.page.g, 'path', { d: `M ${px + pw / 2 - f} ${py - ph / 2} L ${px + pw / 2 - f} ${py - ph / 2 + f} L ${px + pw / 2} ${py - ph / 2 + f}`, ...stroke(P.dim, 4) });
  S.pageLab = label(W, 'script', { size: type.note, color: P.ink }).at(px, py + ph / 2 + 40);

  const fin = 'you approve the script before any voice is recorded';
  // the close dims the world under an opaque veil (world opacity would let background particles show through the panels)
  S.veil = el(ctx.svg, 'rect', { x: 0, y: 0, width: 1920, height: 1080, fill: P.bg, opacity: 0 });
  ctx.svg.insertBefore(S.veil, S.stage.hud);
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56) }).at(960, 860);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const fin = reveal(t, c('final'), 0.7);
  const held = reveal(t, c('held'), 0.6);

  // terminal -> second prompt card; at "It held" the card narrows to its chips
  const w = lerp(CARD.w, NARROW, ease.inOut(prog(t, c('held'), 0.8))).toFixed(1);
  set(S.panel, { width: w });
  set(S.rim, { width: w, opacity: +(reveal(t, c('prompt'), 0.8) * lerp(1, 0.7, held)).toFixed(3) });
  S.term.show(1 - ease.inOut(prog(t, c('prompt') + 0.4, 0.6)));
  set(S.cursor, { opacity: Math.floor(t * 2) % 2 ? 0.2 : 1 });
  S.title.show(fadeBetween(t, c('own'), c('prompt') - 0.5));
  S.head.show(fadeBetween(t, c('prompt'), c('gave'))).dim(spot(t, c('prompt'), c('rules'), 0.6));
  S.head2.show(reveal(t, c('gave') + 0.5, 0.5)).dim(spot(t, c('gave') + 0.5, c('rules2'), 0.6) * lerp(1, 0.7, held));

  // the agent and what the prompt asks of it (cleared at "gave me")
  S.agent.show(reveal(t, c('agent'), 0.6)).dim(Math.max(spot(t, c('agent'), c('rules'), 0.4), spot(t, c('ask'), c('ro'), 0.4)));  // lit again while it asks
  S.rules.show(fadeBetween(t, c('rules') + 0.45, c('gave'))).dim(spot(t, c('rules'), c('episode')));
  S.nameNote.show(fadeBetween(t, c('name') + 0.3, c('gave'))).dim(spot(t, c('name'), c('episode')));
  S.newep.show(fadeBetween(t, c('episode') + 0.5, c('gave'))).dim(spot(t, c('episode'), c('ask')));

  // the question before writing
  const qd = spot(t, c('ask'), c('ro'), 0.5);
  S.bubble.show(fadeBetween(t, c('problem'), c('gave'))).dim(qd);
  S.stop.show(fadeBetween(t, c('writing'), c('gave'))).at(S.stop.x, S.stop.y, 1 + 0.12 * Math.sin(Math.PI * prog(t, c('writing'), 0.5))).dim(spot(t, c('writing'), c('ro'), 0.5));
  // the read-only lock: drawn dim, brightest when spoken
  const la = reveal(t, c('ro'), 0.5), ld = spot(t, c('ro'), c('gave'), 0.5);
  S.lock.show(la).dim(ld);
  S.lockLab.show(la).dim(ld);

  // the agent's own order
  const after = lerp(1, 0.7, held);
  S.rules2.show(reveal(t, c('rules2') + 0.15, 0.5)).dim(spot(t, c('rules2'), c('names')) * after);
  S.names.show(reveal(t, c('names') + 0.4, 0.5)).dim(spot(t, c('names'), c('newep')) * after);
  S.newep2.show(reveal(t, c('newep') + 0.15, 0.5)).dim(spot(t, c('newep'), c('plan')) * after);
  S.plan.show(reveal(t, c('plan'), 0.5)).dim(spot(t, c('plan'), c('facts')) * after);
  S.facts.show(reveal(t, c('facts') + 0.3, 0.5)).dim(lerp(spot(t, c('facts'), c('held')), 0.8, held));

  // it held: the line runs toward the page and stops at the gate
  S.gate.show(reveal(t, c('held'), 0.5));
  S.gateLab.show(reveal(t, c('approved'), 0.5));
  const lp = ease.inOut(prog(t, c('held') + 0.6, 1.0));
  set(S.line, { x2: lerp(S.lineX[0], S.lineX[1], lp).toFixed(1), opacity: +reveal(t, c('held') + 0.6, 0.2).toFixed(3) });
  const pg = reveal(t, c('script') + 0.2, 0.5);
  S.page.show(pg);
  S.pageLab.show(pg);
  set(S.dash, { opacity: +(0.6 * pg).toFixed(3) });
  S.glow.pulse(t, reveal(t, c('habit'), 0.8));

  S.final.show(fin);
  set(S.veil, { opacity: +(0.4 * fin).toFixed(3) });
}
