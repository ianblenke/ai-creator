// Scene 08, who it is for: the lone author dot at a desk, a small picture frame in front of it ("something real") and the
// computer (with its card slab under it, drawn as in scene 03) across the desk. The machine pushes back with a magenta speech
// mark, the author answers and nods; "this series is for you" lands. Then the desk clears, the frame fills with problem tiles
// (question marks and the series' own icons), and one tile lights up, turns into a check and slides to the centre while the
// point lands: start with the one you have.
import { palette as P, font, prog, ease, lerp, clamp, el, set } from 'style';
import { type, label, Item, glow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'person', at: 'If you want' },
    { name: 'real', at: 'something real' },
    { name: 'alone', at: 'alone' },
    { name: 'machine', at: 'a machine' },
    { name: 'argues', at: 'argues with you' },
    { name: 'reply', at: 'with you' },
    { name: 'series', at: 'this series is for you' },
    { name: 'parts', at: 'Each part' },
    { name: 'problem', at: 'one problem' },
    { name: 'start', at: 'start with the one you have' },
  ],
};

const DESK_Y = 560, PX = 250, PY = 500, MX = 1180, MY = 340;
const COLS = [360, 600, 840, 1080, 1320, 1560], ROWS = [220, 420, 620], TILE = 140;
const PICK = 9; // row 1, col 3: the tile that lights up
// what each tile shows: q = question mark, page = script page, wave = waveform, frame = picture frame, blip = magenta slip
const KINDS = ['q', 'wave', 'q', 'frame', 'blip', 'q', 'page', 'q', 'blip', 'q', 'wave', 'q', 'q', 'frame', 'q', 'page', 'q', 'wave'];

// blend two #rrggbb colours (for the tile that turns acid green)
const mix = (a, b, k) => '#' + [1, 3, 5].map((i) => Math.round(lerp(parseInt(a.substr(i, 2), 16), parseInt(b.substr(i, 2), 16), clamp(k))).toString(16).padStart(2, '0')).join('');

// a speech mark: a rounded bubble with its tail toward the lower left (dx = -1) or lower right (dx = 1) and three dots
function bubble(parent, color, dx, mark = 'dots') {
  const it = new Item(parent, 84, 76);
  const tail = dx < 0 ? 'L -10 22 L -30 38 L -24 22' : 'L 24 22 L 30 38 L 10 22';
  const d = dx < 0
    ? `M -42 -30 Q -42 -38 -34 -38 L 34 -38 Q 42 -38 42 -30 L 42 14 Q 42 22 34 22 ${tail} L -34 22 Q -42 22 -42 14 Z`
    : `M -42 -30 Q -42 -38 -34 -38 L 34 -38 Q 42 -38 42 -30 L 42 14 Q 42 22 34 22 ${tail} L -34 22 Q -42 22 -42 14 Z`;
  el(it.g, 'path', { d, fill: color, 'fill-opacity': 0.18, stroke: color, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  if (mark === 'dots') [-18, 0, 18].forEach((x) => el(it.g, 'circle', { cx: x, cy: -8, r: 5.5, fill: color }));
  else el(it.g, 'path', { d: 'M -22 -8 L -11 -18 L 0 -2 L 11 -18 L 22 -8', fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); // an objection
  return it;
}

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: -2, dur: 0.01, x: 800, y: 470, z: 1.08 },
    { cue: 'series', delay: 0, dur: 0.6, x: 850, y: 470, z: 1 },   // zoom out without panning
    { cue: 'parts', delay: 0.4, dur: 1.0, x: 960, y: 540, z: 1 },   // pan once the desk is gone; the tiles settle with it
  ], ctx.cue);
  const w = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // the desk: one flat line the author and the machine share
  S.desk = new Item(w, 1300, 10).at(850, DESK_Y);
  el(S.desk.g, 'line', { x1: -650, x2: 650, y1: 0, y2: 0, stroke: P.dim, 'stroke-width': 5, 'stroke-linecap': 'round' });

  // THE PERSON: one ink dot with a ring
  S.glow = glow(w, { r: 110, color: P.ink, strength: 0.22 }).at(PX, PY);
  S.person = new Item(w, 68, 68).at(PX, PY);
  S.personG = el(S.person.g, 'g');
  el(S.personG, 'circle', { r: 30, fill: 'none', stroke: P.ink, 'stroke-width': 4 });
  el(S.personG, 'circle', { r: 14, fill: P.ink });
  S.alone = label(w, 'alone', { size: type.label, color: P.ink }).at(PX, 650);

  // "something real": THE PICTURE, small, standing on the desk in front of the author
  S.frame = new Item(w, 160, 90).at(500, DESK_Y - 52);
  el(S.frame.g, 'rect', { x: -80, y: -45, width: 160, height: 90, rx: 12, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(S.frame.g, 'circle', { cx: -22, cy: 4, r: 18, fill: P.ink, 'fill-opacity': 0.8 });
  el(S.frame.g, 'path', { d: 'M 2 26 L 30 -14 L 56 26 Z', fill: P.dim, 'fill-opacity': 0.8 });

  // THE COMPUTER and THE CARD slab under it: scene 03's drawing at 0.75
  S.machine = new Item(w, 320, 382).at(MX, MY, 0.75);
  const m = S.machine.g;
  el(m, 'rect', { x: -160, y: -100, width: 320, height: 200, rx: 20, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(m, 'rect', { x: -15, y: 100, width: 30, height: 36, fill: P.dim });
  el(m, 'rect', { x: -80, y: 134, width: 160, height: 14, rx: 7, fill: P.dim });
  const card = el(m, 'g', { transform: 'translate(0 240)' });
  el(card, 'rect', { x: -160, y: -42, width: 320, height: 84, rx: 14, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(card, 'circle', { cx: -100, cy: 0, r: 28, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  S.fan = el(card, 'g');
  for (let i = 0; i < 3; i++) el(S.fan, 'line', { x1: 0, y1: 0, x2: 20 * Math.cos((i * 2 * Math.PI) / 3), y2: 20 * Math.sin((i * 2 * Math.PI) / 3), stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round' });
  for (let i = 0; i < 8; i++) el(card, 'line', { x1: -30 + i * 22, y1: -22, x2: -30 + i * 22, y2: 22, stroke: P.cool, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 });
  S.argues = label(w, 'argues', { size: type.label, color: P.ink }).at(MX, 650);

  // the argument: the machine's magenta mark (from its screen, tail toward the author), then the author's ink reply
  S.speech = bubble(w, P.hot, -1, 'zigzag');
  S.reply = bubble(w, P.ink, 1);

  S.forYou = label(w, 'this series is for you', { size: type.title, color: P.ink }).at(850, 170);

  // problem tiles filling the frame
  const r = ctx.rand(3);
  S.tokens = [];
  ROWS.forEach((y, ri) => COLS.forEach((x, ci) => {
    const i = S.tokens.length, kind = KINDS[i];
    const it = new Item(w, TILE, TILE).at(x, y);
    const rect = el(it.g, 'rect', { x: -TILE / 2, y: -TILE / 2, width: TILE, height: TILE, rx: 28, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
    const ic = el(it.g, 'g', { stroke: P.dim, fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    let q = null;
    if (kind === 'q') q = el(it.g, 'text', { x: 0, y: 20, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': 56, 'font-weight': 700, fill: P.dim }, '?');
    if (kind === 'page') { el(ic, 'rect', { x: -20, y: -28, width: 40, height: 56, rx: 6 }); [-14, -2, 10].forEach((yy) => el(ic, 'line', { x1: -10, x2: 10, y1: yy, y2: yy })); }
    if (kind === 'wave') [10, 22, 34, 18, 28, 12].forEach((h, j) => el(ic, 'line', { x1: -30 + j * 12, x2: -30 + j * 12, y1: -h / 2, y2: h / 2 }));
    if (kind === 'frame') { el(ic, 'rect', { x: -44, y: -25, width: 88, height: 50, rx: 8 }); el(ic, 'circle', { cx: -20, cy: -6, r: 7, fill: P.dim, stroke: 'none' }); el(ic, 'path', { d: 'M -8 16 L 12 -6 L 32 16 Z', fill: P.dim, stroke: 'none' }); } // the track's pictures icon (scene 02)
    if (kind === 'blip') { [-24, -12, 12, 24].forEach((xx) => el(ic, 'line', { x1: xx, x2: xx, y1: -8, y2: 8 })); el(ic, 'line', { x1: 0, x2: 0, y1: -24, y2: -4, stroke: P.hot }); }
    S.tokens.push({ it, rect, q, x, y, ri, delay: r() * 1.0 });
  }));
  // the lit tile's question mark becomes an acid-green check
  S.check = el(S.tokens[PICK].it.g, 'path', { d: 'M -28 2 L -8 22 L 30 -22', fill: 'none', stroke: P.accent, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 });
  // a dashed outline keeps the place the lit tile came from, so the gap reads as deliberate
  S.slot = new Item(w, TILE, TILE);
  el(S.slot.g, 'rect', { x: -TILE / 2, y: -TILE / 2, width: TILE, height: TILE, rx: 28, fill: 'none', stroke: P.accent, 'stroke-width': 4, 'stroke-dasharray': '12 10' });
  S.pickGlow = glow(w, { r: 170, color: P.accent, strength: 0.3 });
  S.tokens[PICK].it.raise();

  S.end = label(w, 'start with the one you have', { size: type.title, color: P.ink }).at(960, 790);
}

export function render(ctx, t) {
  const cue = ctx.cue, cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const parts = cue('parts'), start = cue('start');
  const reply = cue('reply') + 0.5; // the author answers just after the machine's line ends
  const clear = 1 - ease.inOut(prog(t, parts, 0.6)); // the desk scene clears before the tiles come

  S.desk.show(reveal(t, cue('person'), 0.8) * clear);
  S.frame.show(reveal(t, cue('real'), 0.5) * clear).dim(dimAfter(t, cue('alone'), 0.45));
  // the author answers, then nods twice: a small squash, no hop
  const nk = prog(t, reply + 0.05, 0.7);
  const sq = 1 - 0.1 * Math.abs(Math.sin(2 * Math.PI * nk));
  set(S.personG, { transform: `translate(0 ${(30 * (1 - sq)).toFixed(2)}) scale(1 ${sq.toFixed(4)})` });
  S.person.show(reveal(t, cue('person')) * clear).dim(lerp(dimAfter(t, cue('machine'), 0.6), 1, ease.inOut(prog(t, reply, 0.4))));
  S.alone.show(reveal(t, cue('alone')) * clear).dim(dimAfter(t, cue('machine'), 0.35));
  S.glow.at(PX, PY).pulse(t, reveal(t, cue('series'), 0.8) * clear);

  S.machine.show(reveal(t, cue('machine')) * clear).dim(dimAfter(t, cue('series'), 0.5));
  set(S.fan, { transform: `translate(-100 0) rotate(${((t * 140) % 360).toFixed(1)})` });
  S.argues.show(reveal(t, cue('argues')) * clear).dim(dimAfter(t, cue('series'), 0.35));
  // the magenta mark pops from the screen's left edge and settles just off it
  const pop = ease.back(prog(t, cue('argues'), 0.45));
  const slide = ease.inOut(prog(t, cue('argues') + 0.1, 0.6));
  S.speech.at(lerp(1030, 990, slide), lerp(300, 280, slide), Math.max(0.01, pop)).show(reveal(t, cue('argues'), 0.25) * clear).dim(dimAfter(t, reply, 0.45));
  const rpop = ease.back(prog(t, reply, 0.45));
  S.reply.at(PX + 80, PY - 95, Math.max(0.01, rpop)).show(reveal(t, reply, 0.25) * clear).dim(dimAfter(t, cue('series'), 0.45));
  S.forYou.show(reveal(t, cue('series')) * (1 - ease.inOut(prog(t, parts, 0.4))));

  // tiles arrive one by one once the desk is gone; one swells on "one problem"; at "start" one lights and turns into a
  // check, the rest fall back and make room
  const lit = ease.inOut(prog(t, start, 0.5));
  const go = ease.inOut(prog(t, start + 0.15, 0.9));
  // "one problem": one tile (the one that will light) swells and the rest step back for a moment
  const one = fadeBetween(t, cue('problem'), cue('problem') + 0.6, 0.25);
  const bump = 1 + 0.12 * one;
  S.tokens.forEach((k, i) => {
    const a = ease.out(prog(t, parts + 0.6 + k.delay * 0.8, 0.45));
    if (i === PICK) {
      k.it.at(lerp(k.x, 960, go), lerp(k.y, 430, go), lerp(bump, 1.6, go)).show(a);
      set(k.rect, { stroke: mix(P.dim, P.accent, lit), fill: mix(P.bg2, '#26331a', lit) });
      set(k.q, { opacity: +(1 - clamp(lit * 1.6)).toFixed(3) });
      set(S.check, { opacity: +lit.toFixed(3) });
      S.pickGlow.at(k.it.x, k.it.y).pulse(t, lit);
      S.slot.at(k.x + 100 * go, k.y).show(0.5 * clamp((go - 0.6) / 0.4));
    } else {
      const dx = Math.sign(k.x - 960) * 100 * go, dy = (k.ri - 1) * 30 * go;
      k.it.at(k.x + dx, k.y + dy).show(a).dim(lerp(1, 0.6, one) * lerp(1, 0.15, lit));
    }
  });

  S.end.show(reveal(t, start + 0.2, 0.6));
}
