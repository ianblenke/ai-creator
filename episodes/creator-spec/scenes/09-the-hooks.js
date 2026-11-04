// Scene 09: the two git hooks. A path into a commit box with two small gates; the first stops a locked folder and a film
// strip and lets a script page through, the second removes one bar from a message card. A switch "on once" sits beside them.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { type, label, chip, Item, glow, curve, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'check', at: 'The check guards' },
    { name: 'notSave', at: 'but not what you save' },
    { name: 'save', at: 'save into' },
    { name: 'history', at: 'history' },
    { name: 'hooks', at: 'two small git hooks' },
    { name: 'gitHooks', at: 'git hooks' },
    { name: 'turnOn', at: 'You turn them on once' },
    { name: 'once', at: 'on once' },
    { name: 'command', at: 'one command' },
    { name: 'first', at: 'The first refuses' },
    { name: 'byName', at: 'by name' },
    { name: 'settings', at: 'settings' },
    { name: 'names', at: 'names to block' },
    { name: 'voice', at: 'voice files' },
    { name: 'av', at: 'audio or video' },
    { name: 'never', at: 'It never reads' },
    { name: 'above', at: 'check above' },
    { name: 'text', at: 'text check' },
    { name: 'second', at: 'The second deletes' },
    { name: 'line', at: 'kind of line' },
    { name: 'message', at: 'commit message' },
    { name: 'ai', at: 'AI coding assistant' },
    { name: 'link', at: 'link back' },
    { name: 'chat', at: 'its chat' },
    { name: 'stays', at: 'Every other line stays' },
    { name: 'read', at: 'read the message yourself' },
    { name: 'skip', at: 'skipping the hooks' },
  ],
};

const PATH_Y = 600, G1 = 760, G2 = 1160, BOX_X = 1580, LOW_Y = 800, CARD_X = G2 - 150, HOLD_X = 1305;
// scene 08's shield outline (bible CANON: one shield in every scene)
const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z';
const mv = (t, t0, dur, a, b) => lerp(a, b, ease.inOut(prog(t, t0, dur)));
/** Spotlight level: starts at v0, then eases to each [time, value] in turn. */
const spot = (t, v0, ...pairs) => pairs.reduce((v, [at, to]) => lerp(v, to, ease.inOut(prog(t, at, 0.6))), v0);
const bump = (t, at) => (t < at ? 0 : Math.exp(-(t - at) * 5) * Math.sin(Math.min(1, (t - at) / 0.15) * Math.PI / 2));

function shape(parent, w, h, draw) { const it = new Item(parent, w, h); draw(it.g); return it; }

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'first', delay: 0.1, dur: 1.4, x: 920, y: 540, z: 1.06 },
    { cue: 'above', delay: -0.2, dur: 1.4, x: 920, y: 500, z: 1.04 },
    { cue: 'second', delay: 0.1, dur: 1.4, x: 1000, y: 560, z: 1.06 },
    { cue: 'read', delay: -0.2, dur: 1.6, x: 960, y: 560, z: 1.0 },
  ], ctx.cue);
  const W = stage.world;
  S = { stage, parts: makeParticles(ctx.rand(7)) };

  S.path = el(W, 'line', { x1: 200, y1: PATH_Y, x2: BOX_X - 130, y2: PATH_Y, stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 });

  // the shield (the check), above the first gate
  S.shield = shape(W, 220, 260, (g) => {
    el(g, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    [[-62, 120], [-22, 96], [18, 120], [58, 80]].forEach(([y, w]) => el(g, 'rect', { x: -w / 2, y: y - 9, width: w, height: 18, rx: 9, fill: P.ink }));
  }).at(G1, 270);
  S.checkChip = chip(W, 'the check', { color: P.accent }).at(1040, 230);
  S.textChip = chip(W, 'text check', { color: P.accent }).at(1040, 230);

  // the commit box (history)
  S.box = shape(W, 260, 220, (g) => {
    S.boxRect = el(g, 'rect', { x: -130, y: -110, width: 260, height: 220, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 5 });
  }).at(BOX_X, PATH_Y);
  S.history = label(W, 'history', { size: type.label }).at(BOX_X, PATH_Y);

  // the two gates
  // each gate: a solid accent bar, and a dashed dim outline shown once "skipping the hooks" is said
  S.gateFill = []; S.gateOff = [];
  const gate = (x) => shape(W, 16, 170, (g) => {
    S.gateFill.push(el(g, 'rect', { x: -8, y: -85, width: 16, height: 170, rx: 8, fill: P.accent }));
    S.gateOff.push(el(g, 'rect', { x: -8, y: -85, width: 16, height: 170, rx: 8, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0 }));
  }).at(x, PATH_Y);
  S.g1 = gate(G1); S.g2 = gate(G2);
  // skipping the hooks: a dashed dim path that goes around both gates into the box
  S.bypass = curve(W, 560, 640, 1440, 660, { bend: 230, dashed: true, color: P.dim, width: 4 });
  S.hooksChip = chip(W, 'git hooks', { color: P.accent }).at((G1 + G2) / 2, 800);

  // the switch, on once
  S.swGlow = glow(W, { r: 110 }).at(BOX_X, 290);
  S.sw = shape(W, 150, 70, (g) => {
    S.track = el(g, 'rect', { x: -75, y: -35, width: 150, height: 70, rx: 35, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
    S.knob = el(g, 'circle', { cx: -38, cy: 0, r: 25, fill: P.dim });
  }).at(BOX_X, 270);
  S.onceLabel = label(W, 'on once', { size: type.label }).at(BOX_X, 370);
  S.cmdLabel = label(W, 'one command', { size: type.note }).at(BOX_X, 432);

  // what the first gate refuses: four named kinds, said one by one
  S.byName = chip(W, 'by name', { color: P.hot, dashed: true }).at(370, 165);
  S.kinds = ['settings', 'names to block', 'voice files', 'audio or video'].map((s, i) =>
    chip(W, s, { color: P.hot }).at(370, 245 + i * 75));

  // the locked folder: scene 03's notched-tab folder at half scale (10 px stroke -> 5 px), in hot, with a padlock
  S.folder = shape(W, 150, 129, (g) => {
    el(el(g, 'g', { transform: 'scale(0.5)' }), 'path', { d: 'M -150 129 L -150 -117 Q -150 -129 -138 -129 L -52 -129 L -32 -105 L 138 -105 Q 150 -105 150 -93 L 150 117 Q 150 129 138 129 Z', fill: P.bg2, stroke: P.hot, 'stroke-width': 10, 'stroke-linejoin': 'round' });
    el(g, 'rect', { x: -18, y: 0, width: 36, height: 30, rx: 5, fill: 'none', stroke: P.hot, 'stroke-width': 4 });
    el(g, 'path', { d: 'M -11 0 L -11 -10 A 11 11 0 0 1 11 -10 L 11 0', fill: 'none', stroke: P.hot, 'stroke-width': 4 });
  });
  S.film = shape(W, 150, 100, (g) => {
    el(g, 'rect', { x: -75, y: -50, width: 150, height: 100, rx: 10, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
    for (let i = 0; i < 6; i++) for (const y of [-42, 32]) el(g, 'rect', { x: -65 + i * 24, y, width: 10, height: 10, rx: 2, fill: P.ink });
    el(g, 'rect', { x: -52, y: -22, width: 104, height: 44, rx: 4, fill: 'none', stroke: P.dim, 'stroke-width': 3 });
  });

  // the script page (series page drawing at half scale, a prop on the path; 8 px stroke -> 4 px on screen)
  S.page = shape(W, 180, 235, (g) => {
    const p = el(g, 'g', { transform: 'scale(0.5)' });
    el(p, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 8 });
    const bar = (y, w, h, op) => el(p, 'rect', { x: -140, y: y - h / 2, width: w, height: h, rx: h / 2, fill: P.ink, opacity: op });
    [[-170, 0], [-10, 1], [150, 2]].forEach(([y]) => bar(y, 230, 24, 1));
    [-120, -88, -56, 40, 72, 104, 200].forEach((y, i) => bar(y, [280, 250, 270, 260, 280, 230, 250][i], 14, 0.55));
  });

  // the commit message card: three bars, the last one is the assistant's link line
  S.card = shape(W, 220, 150, (g) => {
    S.cardRect = el(g, 'rect', { x: -110, y: -75, width: 220, height: 150, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
    S.keep = [[-40, 160], [0, 130]].map(([y, w]) => el(g, 'rect', { x: -80, y: y - 7, width: w, height: 14, rx: 7, fill: P.ink }));
  });
  S.aiBar = shape(W, 210, 52, (g) => {
    S.aiRect = el(g, 'rect', { x: -75, y: -7, width: 150, height: 14, rx: 7, fill: P.ink });
    S.ring = el(g, 'ellipse', { cx: 0, cy: 0, rx: 90, ry: 16, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });
  });
  S.linkChip = chip(W, 'link back', { color: P.hot }).at(1040, 440);

  // the closing sentence, fixed on screen
  S.readLine = label(stage.hud, 'read the message yourself', { size: 64 }).at(960, 840);
  S.skipLine = label(stage.hud, 'skipping the hooks skips both', { size: 64 }).at(960, 840);
}

export function render(ctx, t) {
  const C = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const skip = ease.inOut(prog(t, C('skip'), 0.6));

  // shield: the check
  S.shield.show(reveal(t, C('check'))).dim(spot(t, 1, [C('notSave'), 0.35], [C('above'), 1], [C('second'), 0.35], [C('skip'), 0.15]));
  S.checkChip.show(fadeBetween(t, C('check') + 0.15, C('above'), 0.5)).dim(spot(t, 1, [C('notSave'), 0.35], [C('above') - 0.6, 1]));
  S.textChip.show(fadeBetween(t, C('text'), C('skip'), 0.5)).dim(spot(t, 1, [C('second'), 0.35]));

  // the path into the commit box (history); the box stays ink: nothing here claims the commit was checked
  set(S.path, { opacity: (0.6 * reveal(t, C('notSave') + 0.3)).toFixed(3) });
  S.box.show(reveal(t, C('save'))).dim(spot(t, 1, [C('hooks'), 0.35], [C('stays') + 0.8, 1]));
  S.history.show(reveal(t, C('history') - 0.2)).dim(spot(t, 1, [C('hooks'), 0.35], [C('stays') + 0.8, 1]));

  // gates; on "skipping the hooks" both turn into dashed dim outlines and a dashed path goes around them
  const g1Bump = bump(t, C('settings') + 0.7) + bump(t, C('names') + 0.3) + bump(t, C('voice') + 0.3) + bump(t, C('av') + 1.25);
  S.g1.show(reveal(t, C('hooks'), 0.4)).dim(spot(t, 1, [C('turnOn'), 0.45], [C('first'), 1], [C('second'), 0.35], [C('read'), 0.6], [C('skip'), 0.8]))
    .at(G1, PATH_Y, 1 + 0.25 * g1Bump);
  const g2Bump = bump(t, C('chat') + 0.25);
  // gate 2 fades while the card crosses it, so the gate's ends do not poke out past the card
  const cross = ease.inOut(prog(t, C('stays') + 0.1, 1.1));
  const cx = lerp(mv(t, C('second') + 0.6, 1.0, 900, CARD_X), HOLD_X, cross);
  const near = clamp((150 - Math.abs(cx - G2)) / 40) * (cross > 0 && cross < 1 ? 1 : 0);
  S.g2.show(reveal(t, C('hooks') + 0.32, 0.4) * (1 - 0.85 * near))
    .dim(spot(t, 1, [C('turnOn'), 0.45], [C('first'), 0.35], [C('second'), 1], [C('read'), 0.6], [C('skip'), 0.8]))
    .at(G2, PATH_Y, 1 + 0.25 * g2Bump);
  S.gateFill.forEach((r) => set(r, { opacity: (1 - skip).toFixed(3) }));
  S.gateOff.forEach((r) => set(r, { opacity: skip.toFixed(3) }));
  S.bypass.draw(prog(t, C('skip') + 0.3, 0.1), reveal(t, C('skip') + 0.3, 0.6));
  S.hooksChip.show(fadeBetween(t, C('gitHooks'), C('first') - 0.2, 0.4));

  // switch: on once, with one command
  const on = ease.inOut(prog(t, C('once') + 0.2, 0.35));
  S.sw.show(reveal(t, C('turnOn') + 0.35)).dim(spot(t, 1, [C('first'), 0.35], [C('skip'), 0.15]));
  set(S.knob, { cx: lerp(-38, 38, on).toFixed(1), fill: on > 0.5 ? P.bg : P.dim });
  set(S.track, { fill: on > 0.5 ? P.accent : P.bg2, stroke: on > 0.5 ? P.accent : P.ink });
  S.swGlow.pulse(t, 0.8 * on * spot(t, 1, [C('first'), 0]));
  S.onceLabel.show(reveal(t, C('once') + 0.2)).dim(spot(t, 1, [C('first'), 0.35], [C('skip'), 0.15]));
  S.cmdLabel.show(fadeBetween(t, C('command') - 0.1, C('first'), 0.4));

  // the short list "by name": a header, then the four named kinds, said one by one; all leave on "It never reads"
  S.byName.show(fadeBetween(t, C('byName') - 0.1, C('never') - 0.4, 0.5)).dim(spot(t, 1, [C('settings'), 0.5]));
  const kindAt = ['settings', 'names', 'voice', 'av'].map((n) => C(n));
  S.kinds.forEach((k, i) => {
    const next = kindAt[i + 1] ?? C('never');
    k.show(fadeBetween(t, kindAt[i] - 0.1, C('never') - 0.4, 0.5)).dim(spot(t, 1, [next, 0.35]));
  });

  // locked folder: arrives at "settings", bumps the gate on each private kind, then steps aside when the film strip comes
  const fT = C('settings') - 0.1;
  const fx = lerp(300, G1 - 140, ease.out(prog(t, fT, 0.7))) - 22 * Math.sin(Math.PI * prog(t, fT + 0.7, 0.4))
    - 14 * Math.sin(Math.PI * prog(t, C('names'), 0.4)) - 14 * Math.sin(Math.PI * prog(t, C('voice'), 0.4));
  const aside = ease.inOut(prog(t, C('av') - 0.1, 0.6));
  S.folder.show(fadeBetween(t, fT, C('read') - 0.3, 0.4)).dim(spot(t, 1, [C('av'), 0.35]))
    .at(lerp(fx, G1 - 140, aside), lerp(PATH_Y, LOW_Y, aside));

  // film strip: "audio or video", stopped too, then steps aside for the page
  const sT = C('av') + 0.45;
  const sx = lerp(300, G1 - 140, ease.out(prog(t, sT, 0.7))) - 22 * Math.sin(Math.PI * prog(t, sT + 0.7, 0.4));
  const aside2 = ease.inOut(prog(t, C('never') - 0.3, 0.6));
  S.film.show(fadeBetween(t, sT, C('read') - 0.3, 0.4)).dim(spot(t, 1, [C('never'), 0.35]))
    .at(lerp(sx, 440, aside2), lerp(PATH_Y, LOW_Y, aside2));

  // script page: never read inside, so it goes through; later on into the commit box
  const pT = C('never') + 0.7;
  const into1 = ease.inOut(prog(t, C('text') + 0.6, 1.2));
  const px = lerp(mv(t, pT, 1.6, 300, (G1 + G2) / 2), BOX_X, into1);
  S.page.show(reveal(t, C('never'), 0.5) * (1 - prog(t, C('text') + 1.4, 0.4)))
    .at(px, PATH_Y, lerp(1, 0.3, ease.in(prog(t, C('text') + 1.1, 0.7))));

  // message card: one line goes, the others stay; the card then waits beside the box to be read
  const cT = C('second') + 0.6;
  S.card.show(fadeBetween(t, cT, C('skip'), 0.5)).dim(spot(t, 1, [C('chat') + 0.6, 0.6], [C('read'), 1])).at(cx, PATH_Y);
  set(S.cardRect, { stroke: t >= C('read') ? P.ink : P.dim });
  // the AI bar: lit on "line", turns hot on "AI", leaves the card at the gate after "chat" and stays below it, dimmed
  const out = ease.inOut(prog(t, C('chat') + 0.25, 0.9));
  const hotOn = reveal(t, C('ai'), 0.4);
  set(S.aiRect, { fill: hotOn > 0.5 ? P.hot : P.ink });
  set(S.ring, { opacity: hotOn.toFixed(3) });
  S.aiBar.show(fadeBetween(t, cT, C('read'), 0.4) * spot(t, 0.6, [C('line') + 0.3, 1]) * lerp(1, 0.35, out))
    .at(lerp(CARD_X - 5, G2, out), PATH_Y + 40 + 120 * out);
  S.linkChip.show(fadeBetween(t, C('link'), C('read'), 0.4)).dim(spot(t, 1, [C('stays'), 0.35]));

  // the closing sentence
  S.readLine.show(fadeBetween(t, C('read'), C('skip') - 0.5, 0.4));
  S.skipLine.show(reveal(t, C('skip'), 0.5));
}
