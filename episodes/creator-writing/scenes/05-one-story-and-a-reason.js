// Scene 05: one story and a reason. A bridge alone still leaves a list (the first kettle); a scene card carries one story arrow and
// two number tokens while the extras fly to a notes pile; then a bare fact tag gains a short green reason bar that starts with "so".
import { palette as P, font, el, set, ease, prog, lerp } from 'style';
import { type, measure, label, chip, curve, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, glow, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'bridges', at: 'Bridges' },
    { name: 'enough', at: 'not enough' },
    { name: 'smooth', at: 'smooth' },
    { name: 'still', at: 'still be a list' },
    { name: 'alist', at: 'list like the first' },
    { name: 'kettle', at: 'kettle A scene' },
    { name: 'scene', at: 'scene turns' },
    { name: 'carries', at: 'carries' },
    { name: 'listener', at: 'listener cannot' },
    { name: 'back', at: 'go back' },
    { name: 'missed', at: 'number they missed' },
    { name: 'sogive', at: 'So give' },
    { name: 'story', at: 'one story' },
    { name: 'two', at: 'two or three' },
    { name: 'rest', at: 'keep the rest' },
    { name: 'notes', at: 'own notes' },
    { name: 'facts', at: 'The facts you keep' },
    { name: 'earn', at: 'earn their place' },
    { name: 'reason', at: 'coming with a reason' },
    { name: 'line', at: 'Take the line' },
    { name: 'steel', at: 'the base is steel' },
    { name: 'bare', at: 'bare fact' },
    { name: 'guess', at: 'guess why' },
    { name: 'add', at: 'add a reason' },
    { name: 'so', at: 'so it will' },
    { name: 'warp', at: 'warp on a' },
    { name: 'stove', at: 'stove The fact' },
    { name: 'become', at: 'has become' },
    { name: 'madeup', at: 'made-up kettle' },
    { name: 'real', at: 'real script' },
    { name: 'good', at: 'only as good' },
    { name: 'under', at: 'fact under it' },
    { name: 'underw', at: 'under it' },
  ],
};

let S;
const ROW_Y = 520; // the fact row in the second half

// THE KETTLE (bible canon, same drawing as scene 04): trapezoid body, flat lid knob, handle arc left, straight spout right,
// switch dot just under the handle's lower end.
function kettle(parent) {
  const it = new Item(parent, 240, 190);
  const g = it.g, st = { stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' };
  el(g, 'path', { d: 'M 68 -4 L 118 -48 L 108 -58 L 60 -32', fill: P.bg2, ...st });
  el(g, 'path', { d: 'M -84 90 L 74 90 Q 86 90 83 78 L 60 -50 Q 56 -70 36 -70 L -46 -70 Q -66 -70 -69 -50 L -88 78 Q -90 90 -84 90 Z', fill: P.bg2, ...st });
  el(g, 'rect', { x: -16, y: -86, width: 32, height: 16, rx: 8, fill: P.bg2, ...st });
  el(g, 'path', { d: 'M -66 -44 Q -124 -40 -114 22 Q -108 54 -84 58', fill: 'none', ...st, 'stroke-linecap': 'round' });
  el(g, 'circle', { cx: -104, cy: 74, r: 11, fill: P.dim });
  return it;
}
function tagShape(parent, kind) {
  const it = new Item(parent, 110, 80);
  const g = it.g, st = { fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  el(g, 'rect', { x: -55, y: -40, width: 110, height: 80, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  if (kind === 'thermo') { el(g, 'line', { x1: 0, y1: -24, x2: 0, y2: 8, ...st }); el(g, 'circle', { cx: 0, cy: 16, r: 9, ...st }); }
  if (kind === 'steel') steelIcon(g, 0, 0, P.dim);
  if (kind === 'lid') { el(g, 'path', { d: 'M -12 -4 V -14 A 12 12 0 0 1 12 -14 V -4', ...st }); el(g, 'rect', { x: -20, y: -4, width: 40, height: 28, rx: 6, ...st }); }
  return it;
}
function steelIcon(g, x, y, color) {
  const st = { stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round' };
  el(g, 'line', { x1: x, y1: y - 28, x2: x, y2: y + 8, ...st });
  el(g, 'ellipse', { cx: x, cy: y + 16, rx: 34, ry: 10, fill: 'none', ...st });
}
// a number token: a drawn hash mark (42 px tall, so it reads like 38 px+ text), never real digits
function token(parent) {
  const it = new Item(parent, 88, 88);
  el(it.g, 'circle', { cx: 0, cy: 0, r: 42, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  it.ring = el(it.g, 'circle', { cx: 0, cy: 0, r: 42, fill: P.accent, 'fill-opacity': 0.15, stroke: P.accent, 'stroke-width': 5, opacity: 0 });
  el(it.g, 'path', { d: 'M -7 -21 L -13 21 M 12 -21 L 6 21 M -21 -7 L 21 -7 M -22 9 L 19 9', fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });
  return it;
}
// THE LISTENER (canon): outlined head over a rounded-square body, two ear loops; ears dim until it listens
function listener(parent) {
  const it = new Item(parent, 160, 220);
  el(it.g, 'rect', { x: -70, y: -24, width: 140, height: 134, rx: 50, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  el(it.g, 'circle', { cx: 0, cy: -72, r: 38, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  const ear = 'M -40 -88 A 12 16 0 0 0 -40 -56 M 40 -88 A 12 16 0 0 1 40 -56';
  el(it.g, 'path', { d: ear, fill: 'none', stroke: P.dim, 'stroke-width': 6, 'stroke-linecap': 'round' });
  it.ears = el(it.g, 'path', { d: ear, fill: 'none', stroke: P.accent, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 });
  return it;
}

export function setup(ctx) {
  const c = ctx.cue;
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { t: -1, dur: 0.01, x: 960, y: 380, z: 1 },          // open with the bridge row centred
      { cue: 'still', dur: 1.6, x: 960, y: 480, z: 1.03 },  // glide down as the list row arrives
      { cue: 'scene', delay: -0.2, dur: 1.6, x: 960, y: 500, z: 1 },
      { cue: 'story', delay: -0.2, dur: 1.4, x: 760, y: 500, z: 1.15 },
      { cue: 'two', delay: 1.0, dur: 1.4, x: 960, y: 500, z: 1 },
      { cue: 'line', dur: 1.6, x: 1000, y: 540, z: 1.04 },
      { cue: 'good', dur: 1.2, x: 960, y: 540, z: 1 },
      { cue: 'under', dur: 0.7, x: 620, y: 500, z: 0.92 }, // pull out: both halves, centred on the content; done before the tail
    ], c),
  };
  const w = S.stage.world;

  // ---- part 1: a bridge alone, then the list kettle ----
  S.blocks = new Item(w, 1080, 130);
  for (const bx of [560, 1360]) {
    el(S.blocks.g, 'rect', { x: bx - 140, y: 235, width: 280, height: 130, rx: 22, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
    for (let i = 0; i < 3; i++) el(S.blocks.g, 'rect', { x: bx - 100, y: 268 + i * 26, width: i === 2 ? 120 : 200, height: 12, rx: 6, fill: P.ink });
  }
  S.plankGlow = glow(w, { rx: 320, ry: 70, color: P.accent, strength: 0.35 }).at(960, 300);
  S.plank = new Item(w, 560, 56);
  el(S.plank.g, 'rect', { x: 680, y: 272, width: 560, height: 56, rx: 16, fill: P.accent, 'fill-opacity': 0.9, stroke: P.accent, 'stroke-width': 3 });
  el(S.plank.g, 'text', { x: 960, y: 314, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 40, 'font-weight': 700, fill: P.bg }, 'because');
  S.enough = chip(w, 'not enough', { color: P.ink, size: type.label }).at(960, 425);
  S.kettle = kettle(w);
  S.tags = ['thermo', 'steel', 'lid'].map((k) => tagShape(w, k));
  S.listLabel = label(w, 'still a list', { size: type.label, color: P.ink }).at(1440, 640);

  // ---- part 2: one scene, one story, two numbers ----
  S.card = new Item(w, 760, 440);
  el(S.card.g, 'rect', { x: -380, y: -220, width: 760, height: 440, rx: 28, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.card.at(700, 480);
  S.sceneLabel = label(w, 'a scene', { size: type.label, color: P.dim }).at(700, 310);
  S.storyArrow = curve(w, 360, 490, 1050, 490, { bend: 0.01, color: P.accent, width: 8, head: 28 });
  S.storyLabel = label(w, 'one story', { size: type.label, color: P.accent }).at(700, 215);
  S.twoLabel = label(w, 'two or three numbers', { size: type.label, color: P.ink }).at(700, 760);
  S.notes = new Item(w, 332, 252);
  for (const o of [-16, 0, 16]) el(S.notes.g, 'rect', { x: o - 150, y: o - 110, width: 300, height: 220, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
  S.notes.at(1450, 500);
  S.notesLabel = label(w, 'your own notes', { size: type.label, color: P.ink }).at(1450, 690);
  S.listener = listener(w).at(1460, 470);
  S.backArrow = curve(w, 1360, 400, 1195, 400, { bend: 50, color: P.dim, dashed: true, width: 5 });
  S.block = new Item(w, 48, 48); // "cannot go back": the way back is crossed out before it reaches the card
  el(S.block.g, 'path', { d: 'M -22 -22 L 22 22 M 22 -22 L -22 22', stroke: P.hot, 'stroke-width': 8, 'stroke-linecap': 'round' });
  S.block.at(1150, 400);
  S.missQ = label(w, '?', { size: type.label, color: P.hot }).at(900, 520);
  // token homes in the card; kept ones move onto the story arrow; extras fly one at a time to separate spots on the notes,
  // right-hand spots first so no flight crosses a landed token (lift = arc height, negative = up)
  const homes = [[430, 400], [590, 390], [760, 410], [930, 395], [470, 585], [700, 595], [960, 580]];
  const KEEP = { 1: [560, 490], 5: [840, 490] };
  const PILE = { 3: [1510, 455, 0, -60], 0: [1510, 550, 1, -100], 2: [1390, 455, 2, -60], 4: [1390, 550, 3, 60] };
  S.tokens = homes.map((h, i) => ({ it: token(w), h, keep: KEEP[i], pile: PILE[i] }));
  S.keptAt = [[890, 330], [1030, 330]]; // the kept pair, centred on x 960 once the card is gone
  S.earn = label(w, 'earn their place', { size: type.title, color: P.ink });
  S.withReason = chip(w, 'with a reason', { color: P.accent, size: type.label }).at(960, 600);

  // ---- part 3: a bare fact gains a reason ----
  const fx = 600, ftw = measure('the base is steel', type.label), fw = Math.ceil(110 + ftw + 34);
  S.fact = new Item(w, fw, 120);
  el(S.fact.g, 'rect', { x: -fw / 2, y: -60, width: fw, height: 120, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  S.factBoxLit = el(S.fact.g, 'rect', { x: -fw / 2, y: -60, width: fw, height: 120, rx: 24, fill: 'none', stroke: P.accent, 'stroke-width': 5, opacity: 0 });
  steelIcon(S.fact.g, -fw / 2 + 56, 0, P.dim);
  el(S.fact.g, 'text', { x: -fw / 2 + 110, y: type.label * 0.35, 'font-family': font.sans, 'font-size': type.label, 'font-weight': 700, fill: P.ink }, 'the base is steel');
  S.fact.at(fx + fw / 2, ROW_Y);
  S.factCx = fx + fw / 2;
  // the reason bar: "so" + "will not warp" + a stove; kept shorter than the fact tag (the brief's "short second bar")
  const PAD = 26, GAP = 14, STOVE = 60, END = 22;
  let rs = type.label;
  const barW = (s) => PAD + measure('so', s) + GAP + measure('will not warp', s) + GAP + STOVE + END;
  while (rs > type.note && barW(rs) > fw - 50) rs -= 2;
  const rx0 = fx + fw + 24, rw = Math.ceil(barW(rs));
  S.rw = rw; S.rwSo = Math.ceil(PAD + measure('so', rs) + END);
  S.reasonG = el(w, 'g', { opacity: 0 });
  S.reasonRect = el(S.reasonG, 'rect', { x: rx0, y: ROW_Y - 60, width: 0, height: 120, rx: 24, fill: P.accent, 'fill-opacity': 0.16, stroke: P.accent, 'stroke-width': 5 });
  const tStyle = { y: ROW_Y + rs * 0.35, 'font-family': font.sans, 'font-size': rs, 'font-weight': 700, opacity: 0 };
  S.soText = el(S.reasonG, 'text', { x: rx0 + PAD, ...tStyle, fill: P.accent }, 'so');
  const wx = rx0 + PAD + measure('so', rs) + GAP;
  S.reasonText = el(S.reasonG, 'text', { x: wx, ...tStyle, fill: P.ink }, 'will not warp');
  // a hot stove: a burner with two heat waves
  S.stove = el(S.reasonG, 'g', { opacity: 0 });
  const sx = wx + measure('will not warp', rs) + GAP + STOVE / 2;
  el(S.stove, 'rect', { x: sx - 28, y: ROW_Y + 18, width: 56, height: 12, rx: 6, fill: P.accent });
  for (const o of [-11, 11]) el(S.stove, 'path', { d: `M ${sx + o} ${ROW_Y + 8} q -8 -10 0 -20 q 8 -10 0 -20`, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-linecap': 'round' });
  S.rowCx = (fx + rx0 + rw) / 2;
  S.rowGlow = glow(w, { rx: (rx0 + rw - fx) / 2 + 60, ry: 110, color: P.accent, strength: 0.25 }).at(S.rowCx, ROW_Y);
  S.bare = chip(w, 'bare fact', { color: P.dim, size: type.label }).at(S.factCx, 690);
  S.guessQ = label(w, '?', { size: type.title, color: P.hot }).at(S.factCx, 385);
  S.aReason = chip(w, 'a reason', { color: P.accent, size: type.label }).at(S.rowCx, 690);
  S.madeup = chip(w, 'made-up', { color: P.dim, size: type.label, dashed: true }).at(400, 360);
  S.real = chip(w, 'real', { color: P.ink, size: type.label });
  S.real.at(400 + S.madeup.w / 2 + 40 + S.real.w / 2, 360);
  S.slide = [S.factCx - (rx0 + rw / 2), -128]; // on "under": the reason bar sits on top of the fact tag
  S.under = el(w, 'rect', { x: fx + 20, y: ROW_Y + 74, width: fw - 40, height: 10, rx: 5, fill: P.accent, opacity: 0 });

  // the closing wide view restates the first half too: a small dim "one story" card with its two tokens
  S.mini = new Item(w, 440, 210);
  el(S.mini.g, 'rect', { x: -220, y: -105, width: 440, height: 210, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  label(S.mini.g, 'one story', { size: type.label, color: P.accent }).at(0, -58).show(1);
  el(S.mini.g, 'line', { x1: -180, y1: 42, x2: 170, y2: 42, stroke: P.accent, 'stroke-width': 7, 'stroke-linecap': 'round' });
  el(S.mini.g, 'path', { d: 'M 150 28 L 176 42 L 150 56', fill: 'none', stroke: P.accent, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  for (const x of [-90, 70]) { const k = token(S.mini.g).at(x, 42).show(1); set(k.ring, { opacity: 1 }); }
  S.mini.at(360, 210);

  S.fin = label(S.stage.hud, 'only as good as the fact under it', { size: 64, color: P.ink }).at(960, 840);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // ---- part 1 ----
  const out1 = 1 - ease.in(prog(t, c('scene') - 0.2, 0.4)); // gone before the card starts
  const bridgeDim = dimAfter(t, c('still'), 0.35);
  S.blocks.show(reveal(t, c('bridges') - 0.2) * out1).dim(bridgeDim);
  S.plank.show(reveal(t, c('bridges') + 0.2) * out1).dim(bridgeDim);
  S.plankGlow.pulse(t, fadeBetween(t, c('smooth'), c('still')) * out1);
  S.enough.show(reveal(t, c('enough')) * out1).dim(bridgeDim);
  S.listLabel.show(reveal(t, c('still'), 0.4) * out1);
  S.tags.forEach((g, i) => {
    const a = reveal(t, c('alist') + i * 0.18, 0.4) * out1;
    const wob = t >= c('kettle') && t < c('kettle') + 1.2 ? Math.sin((t - c('kettle')) * 12 + i) * 4 * (1 - prog(t, c('kettle'), 1.2)) : 0;
    g.at(720 + i * 200, 640 + wob).show(a);
  });

  // kettle: part 1 (the list), then part 3 (the example)
  if (t < c('line')) S.kettle.at(380, 640).show(reveal(t, c('kettle'), 0.5) * out1).dim(1);
  else S.kettle.at(400, ROW_Y).show(reveal(t, c('line') + 0.3)).dim(Math.max(dimAfter(t, c('steel') + 0.6, 0.45), reveal(t, c('madeup'))) * dimAfter(t, c('real'), 0.4));

  // ---- part 2 ----
  const notesOut = 1 - ease.inOut(prog(t, c('facts'), 0.6)); // the notes side leaves at "The facts you keep"
  const out2 = 1 - ease.inOut(prog(t, c('earn') + 1.0, 0.6)); // card and story leave after "earn their place"
  const back2 = dimAfter(t, c('facts'), 0.5);
  const glide = ease.inOut(prog(t, c('earn') + 1.6, 0.9));   // then the kept pair and the phrase move to the centre
  const cardA = reveal(t, c('scene') + 0.25) * out2;
  S.card.show(cardA).dim(Math.min(dimAfter(t, c('rest') + 0.3, 0.6), back2));
  S.sceneLabel.show(cardA * (1 - ease.in(prog(t, c('story'), 0.4))));
  S.listener.show(fadeBetween(t, c('listener') - 0.2, c('sogive'), 0.4));
  set(S.listener.ears, { opacity: reveal(t, c('listener'), 0.3).toFixed(3) });
  S.backArrow.draw(ease.out(prog(t, c('back'), 0.5)), fadeBetween(t, c('back'), c('sogive'), 0.4));
  S.block.show(fadeBetween(t, c('back') + 0.4, c('sogive'), 0.3));
  S.missQ.show(fadeBetween(t, c('missed') + 0.3, c('sogive'), 0.4));
  S.storyArrow.draw(ease.inOut(prog(t, c('story'), 1.0)), out2);
  S.storyLabel.show(reveal(t, c('story')) * out2);
  S.twoLabel.show(reveal(t, c('two')) * notesOut).dim(dimAfter(t, c('rest'), 0.4));
  S.notes.show(reveal(t, c('rest')) * notesOut);
  S.notesLabel.show(reveal(t, c('notes')) * notesOut);

  S.tokens.forEach((o, i) => {
    // pop in one by one from "carries" to "numbers"
    let [x, y] = o.h, a = reveal(t, c('carries') + i * 0.13, 0.3), d = 1, sc = 1;
    if (i === 6) { // the number the listener missed drifts away
      const m = ease.inOut(prog(t, c('missed'), 0.8));
      x += 60 * m; y += 40 * m; a *= 1 - m;
    }
    if (o.keep) {
      const m = ease.inOut(prog(t, c('two'), 0.9));
      x = lerp(x, o.keep[0], m); y = lerp(y, o.keep[1], m);
      set(o.it.ring, { opacity: m.toFixed(3) });
      sc = 1 + 0.15 * Math.sin(Math.PI * prog(t, c('earn') + (i === 1 ? 0 : 0.2), 0.7)); // pulse on the arrow at "earn"
      const dest = S.keptAt[i === 1 ? 0 : 1];
      x = lerp(x, dest[0], glide); y = lerp(y, dest[1], glide);
      a *= 1 - ease.in(prog(t, c('line'), 0.5));
      d = dimAfter(t, c('reason'), 0.5);
    } else if (o.pile) {
      const [px, py, k, lift] = o.pile;
      d = dimAfter(t, c('two'), 0.6);
      const m = ease.inOut(prog(t, c('rest') + 0.2 + k * 0.4, 0.9));
      x = lerp(x, px, m); y = lerp(y, py, m) + lift * Math.sin(Math.PI * m);
      a *= notesOut;
    }
    o.it.at(x, y, sc).show(a).dim(d);
  });
  S.earn.at(lerp(700, 960, glide), lerp(800, 470, glide)).show(fadeBetween(t, c('earn'), c('line'), 0.5)).dim(dimAfter(t, c('reason'), 0.35, 0.5));
  S.withReason.show(fadeBetween(t, c('reason'), c('line'), 0.5));

  // ---- part 3 ----
  const factA = reveal(t, c('steel'));
  const factFocus = Math.min(1, dimAfter(t, c('so') + 0.4, 0.6) + reveal(t, c('become')));
  const factDim = t < c('madeup') ? factFocus : dimAfter(t, c('madeup'), 0.4) + 0.6 * reveal(t, c('under'));
  S.fact.show(factA).dim(Math.min(1, factDim));
  set(S.factBoxLit, { opacity: (reveal(t, c('become')) * (1 - reveal(t, c('madeup')) * 0.6) + 0.6 * reveal(t, c('under'))).toFixed(3) });
  S.bare.show(fadeBetween(t, c('bare'), c('add'), 0.4));
  S.guessQ.show(fadeBetween(t, c('guess'), c('add'), 0.4));
  // the bar grows from zero at "so" just wide enough for "so", then out to full width as "warp" is spoken
  const g1 = ease.out(prog(t, c('so'), 0.35)), g2 = ease.inOut(prog(t, c('warp') - 0.15, 0.5));
  const reasonDim = t < c('madeup') ? 1 : dimAfter(t, c('madeup'), 0.4) + 0.3 * reveal(t, c('real'));
  const sl = ease.inOut(prog(t, c('underw') - 0.1, 0.4));
  set(S.reasonG, { opacity: (reveal(t, c('so'), 0.15) * reasonDim).toFixed(3), transform: `translate(${(S.slide[0] * sl).toFixed(1)} ${(S.slide[1] * sl).toFixed(1)})` });
  set(S.reasonRect, { width: (S.rwSo * g1 + (S.rw - S.rwSo) * g2).toFixed(1) });
  set(S.soText, { opacity: reveal(t, c('so') + 0.1, 0.3).toFixed(3) });
  set(S.reasonText, { opacity: reveal(t, c('warp'), 0.4).toFixed(3) });
  set(S.stove, { opacity: reveal(t, c('stove'), 0.4).toFixed(3) });
  S.rowGlow.pulse(t, fadeBetween(t, c('become'), c('madeup'), 0.6));
  S.aReason.show(fadeBetween(t, c('become'), c('real'), 0.5)).dim(dimAfter(t, c('madeup'), 0.35, 0.4));
  S.madeup.show(fadeBetween(t, c('madeup'), c('good') - 0.5, 0.5)).dim(dimAfter(t, c('real'), 0.35, 0.4));
  S.real.show(fadeBetween(t, c('real'), c('good') - 0.5, 0.4));
  set(S.under, { opacity: reveal(t, c('underw') - 0.1, 0.4).toFixed(3) });

  S.mini.show(reveal(t, c('under'), 0.6)).dim(0.45);
  S.fin.show(reveal(t, c('good')));
}
