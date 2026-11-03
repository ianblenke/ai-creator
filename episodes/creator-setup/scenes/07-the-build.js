// 07 - the build: the container box appears; two small files (the settings file, copied from the dashed example, with the
// silent voice line, and your user id) are written; on "start the build" they feed into the box, which fills with cool
// layers while a slow dim clock hand turns and the disk slab grows beside it. Ends wide on "start the build and do something else".
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, arrow, flow, toolIcon, makeStage, paintBackground, makeParticles, reveal, fadeBetween, fitSize } from 'kit';

export const meta = {
  cues: [
    { name: 'names', at: 'the names protected' },
    { name: 'build', at: 'build the container' },
    { name: 'container', at: 'container that holds' },
    { name: 'tools', at: 'every tool' },
    { name: 'before', at: 'Before the build' },
    { name: 'two', at: 'two small files' },
    { name: 'settings', at: 'a settings file' },
    { name: 'copy', at: 'copy from the example' },
    { name: 'silent', at: 'silent test mode' },
    { name: 'user', at: 'your user id' },
    { name: 'runs', at: 'runs as you' },
    { name: 'start', at: 'Then start the build' },
    { name: 'else', at: 'something else' },
    { name: 'clean', at: 'From a clean copy' },
    { name: 'minutes', at: 'three and a half' },
    { name: 'connection', at: 'on my connection' },
    { name: 'image', at: 'the image' },
    { name: 'gb', at: 'eight gigabytes' },
  ],
};

const FX = 520, SY = 300, UY = 680, EX = 200;              // files: settings (top), user id (bottom), the example (left)
const BX = 1100, BY = 480, BW = 360, BH = 420;             // the container box
const CLX = 1560, CLY = 330, CR = 90;                       // the clock
const DX = 1560, DB = 720, DW = 280, DH = 140;              // the disk slab: centre x, bottom, width, full height
const NL = 8;                                               // layers in the box
const stroke = (color, w = 5) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const spot = (t, a, b, floor = 0.35) => lerp(floor, 1, fadeBetween(t, a, b));

// a small file with a folded corner and a few ink bars (or a head-and-shoulders mark for the user id)
function file(parent, color, { dashed = false, person = false } = {}) {
  const it = new Item(parent, 110, 140);
  const d = dashed ? { 'stroke-dasharray': '10 8' } : {};
  el(it.g, 'path', { d: 'M -55 -70 L 25 -70 L 55 -40 L 55 70 L -55 70 Z', ...stroke(color, 4), fill: P.bg2, ...d });
  el(it.g, 'path', { d: 'M 25 -70 L 25 -40 L 55 -40', ...stroke(color, 4), ...d });
  if (person) {
    el(it.g, 'circle', { cx: 0, cy: -8, r: 16, ...stroke(P.ink, 5) });
    el(it.g, 'path', { d: 'M -28 42 Q -28 16 0 16 Q 28 16 28 42', ...stroke(P.ink, 5) });
  } else {
    [0.7, 0.5, 0.62].forEach((k, i) => el(it.g, 'rect', { x: -34, y: -20 + i * 26, width: 68 * k, height: 10, rx: 5, fill: color === P.dim ? P.dim : P.ink }));
  }
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { cue: 'before', dur: 1.4, x: 760, y: 590, z: 1.08 },          // lean in on the two files
    { cue: 'start', delay: -0.3, dur: 1.4, x: 960, y: 540, z: 1 },  // wide for the build
  ], ctx.cue);
  const W = S.stage.world;

  // the names list (from the previous scene), small and dim, with one of your names ringed in hot
  S.names = new Item(W, 200, 260);
  el(S.names.g, 'rect', { x: -100, y: -130, width: 200, height: 260, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [0.8, 0.55, 0.7, 0.6, 0.75].forEach((k, i) => el(S.names.g, 'rect', { x: -70, y: -92 + i * 40, width: 140 * k, height: 12, rx: 6, fill: P.ink }));
  el(S.names.g, 'ellipse', { cx: -70 + 49, cy: -86 + 80, rx: 66, ry: 20, fill: 'none', stroke: P.hot, 'stroke-width': 3 });
  S.names.at(520, 520);

  // the container box, its tools, its layers
  S.box = new Item(W);
  el(S.box.g, 'rect', { x: BX - BW / 2, y: BY - BH / 2, width: BW, height: BH, rx: 28, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  S.boxLab = label(W, 'the container', { size: type.label }).at(BX, BY + BH / 2 + 50);
  S.tools = [-100, 0, 100].map((dx) => toolIcon(W, { color: P.dim, size: 64 }).at(BX + dx, BY));
  S.layers = Array.from({ length: NL }, (_, i) => el(W, 'rect', {
    x: BX - BW / 2 + 22, y: BY + BH / 2 - 20 - (i + 1) * 48 + 6, width: BW - 44, height: 40, rx: 10,
    fill: P.cool, 'fill-opacity': 0.18, stroke: P.cool, 'stroke-width': 2, opacity: 0,
  }));

  // the example (dashed, dim), copied into the settings file
  S.example = file(W, P.dim, { dashed: true }).at(EX, SY);
  S.exLab = label(W, 'example', { size: type.note, color: P.dim }).at(EX, SY + 110);
  S.copy = arrow(W, EX + 70, SY, FX - 75, SY, { color: P.dim, width: 4, head: 16 });
  S.settings = file(W, P.ink).at(FX, SY);
  S.setLab = label(W, 'settings file', { size: type.label }).at(FX, SY + 110);
  // the silent voice (CANON: 9 bar positions, 12 wide, gap 22, flat at 4 px, dim), hung from the settings file by a short connector
  S.silent = el(W, 'g', { opacity: 0 });
  el(S.silent, 'line', { x1: FX, x2: FX, y1: 450, y2: 470, ...stroke(P.dim, 3) });
  for (let i = 0; i < 9; i++) el(S.silent, 'rect', { x: FX - 142 + i * 34, y: 478, width: 12, height: 4, rx: 2, fill: P.dim });
  S.silLab = label(W, 'silent test mode', { size: type.note, color: P.dim }).at(FX, 535);
  // your user id
  S.user = file(W, P.ink, { person: true }).at(FX, UY);
  S.userLab = label(W, 'user id', { size: type.label }).at(FX, UY + 110);
  S.runsLab = label(W, 'runs as you', { size: type.note, color: P.dim }).at(FX, UY + 175);

  // the files feed into the box
  const into = [[[FX + 70, SY + 20], [BX - BW / 2 - 14, BY - 70]], [[FX + 70, UY - 20], [BX - BW / 2 - 14, BY + 70]]];
  S.feeds = into.map(([[x1, y1], [x2, y2]]) => arrow(W, x1, y1, x2, y2, { color: P.dim, width: 4, head: 16 }));
  S.dots = into.map(([a, b]) => flow(W, [a, b], { n: 3, r: 8, color: P.cool, period: 1.4 }));

  // the clock (one slow dim hand) and the disk slab
  S.clock = new Item(W);
  el(S.clock.g, 'circle', { cx: CLX, cy: CLY, r: CR, ...stroke(P.dim, 5) });
  el(S.clock.g, 'circle', { cx: CLX, cy: CLY, r: 7, fill: P.dim });
  S.hand = el(S.clock.g, 'line', { x1: CLX, y1: CLY, x2: CLX, y2: CLY - CR + 18, ...stroke(P.dim, 6) });
  S.minLab = label(W, 'about 3.5 minutes', { size: type.label }).at(CLX, CLY + CR + 50);
  S.minNote = label(W, 'on my connection', { size: type.note, color: P.dim }).at(CLX, CLY + CR + 105);
  S.disk = new Item(W);
  S.slab = el(S.disk.g, 'rect', { x: DX - DW / 2, y: DB - 12, width: DW, height: 12, rx: 10, fill: P.cool, 'fill-opacity': 0.3, stroke: P.cool, 'stroke-width': 4 });
  S.gbLab = label(W, 'about 8 GB', { size: type.label }).at(DX, DB + 70);

  const fin = 'start the build and do something else';
  S.final = label(S.stage.hud, fin, { size: fitSize(fin, 1500, 64, 56) }).at(960, 140);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const END = 99, st = c('start');
  S.names.show(fadeBetween(t, c('names') - 0.2, c('before') - 0.6)).dim(0.6);

  // the box: bright when spoken, pushed back while the files are written, back up for the build
  const boxDim = Math.max(spot(t, -1, c('before')), spot(t, st, END, 0.35)) * lerp(1, 0.8, reveal(t, c('clean'), 0.6));
  S.box.show(reveal(t, c('build') - 0.3, 0.6)).dim(boxDim);
  S.boxLab.show(reveal(t, c('container'), 0.5)).dim(boxDim);
  // the tools sit in the box until the layers start
  S.tools.forEach((it, i) => it.show(fadeBetween(t, c('tools') + i * 0.15, st)).dim(boxDim));

  // the two files, one spoken at a time
  const setDim = spot(t, c('settings'), c('user'));
  const userDim = spot(t, c('user'), st);
  S.settings.show(reveal(t, c('two'), 0.5)).dim(t < c('settings') ? 1 : setDim);
  S.user.show(reveal(t, c('two') + 0.2, 0.5)).dim(t < c('settings') ? 1 : userDim);
  S.setLab.show(reveal(t, c('settings'), 0.5)).dim(setDim);
  S.example.show(reveal(t, c('copy') - 0.3, 0.5)).dim(spot(t, c('copy'), c('silent'), 0.5));
  S.exLab.show(reveal(t, c('copy') - 0.3, 0.5)).dim(spot(t, c('copy'), c('silent'), 0.5));
  S.copy.draw(ease.inOut(prog(t, c('copy'), 0.8)), reveal(t, c('copy'), 0.2) * spot(t, c('copy'), c('silent'), 0.5));
  const silA = reveal(t, c('silent'), 0.5) * spot(t, c('silent'), c('user'));
  set(S.silent, { opacity: +silA.toFixed(3) });
  S.silLab.show(reveal(t, c('silent'), 0.5)).dim(spot(t, c('silent'), c('user')));
  S.userLab.show(reveal(t, c('user'), 0.5)).dim(userDim);
  S.runsLab.show(reveal(t, c('runs'), 0.5)).dim(userDim);

  // start the build: the files feed the box, the layers stack, the clock turns, the disk grows
  S.feeds.forEach((a, i) => a.draw(ease.inOut(prog(t, st + i * 0.2, 0.7)), reveal(t, st, 0.2) * spot(t, st, c('clean'), 0.5)));
  S.dots.forEach((d) => d.update(t, reveal(t, st + 0.7, 0.4) * (1 - reveal(t, c('clean'), 0.6))));
  const fill0 = st + 0.8, fill1 = c('gb') - 0.2;
  S.layers.forEach((r, i) => set(r, { opacity: +reveal(t, lerp(fill0, fill1, i / (NL - 1)), 0.4).toFixed(3) }));

  const clockDim = Math.max(spot(t, st, c('clean'), 0.6), spot(t, c('clean'), c('image')));
  S.clock.show(reveal(t, st + 0.4, 0.6)).dim(clockDim);
  const ang = 15 * Math.max(0, t - (st + 0.4));            // slow: 15 degrees a second
  set(S.hand, { transform: `rotate(${ang.toFixed(2)} ${CLX} ${CLY})` });
  S.minLab.show(reveal(t, c('minutes'), 0.5)).dim(spot(t, c('minutes'), c('image')));
  S.minNote.show(reveal(t, c('connection'), 0.5)).dim(spot(t, c('minutes'), c('image')));

  const g = ease.inOut(prog(t, c('image') - 0.2, c('gb') - c('image') + 0.6));   // grows while 'the image' is spoken
  const h = lerp(12, DH, g);
  set(S.slab, { y: (DB - h).toFixed(2), height: h.toFixed(2) });
  S.disk.show(reveal(t, c('image') - 0.2, 0.4)).dim(Math.max(spot(t, st, c('clean'), 0.6), spot(t, c('image'), END)));
  S.gbLab.show(reveal(t, c('gb'), 0.5));

  // the idea, at the top once the camera is wide; it steps back for the numbers and returns for the close
  S.final.show(reveal(t, c('else') - 0.3, 0.6)).dim(Math.max(spot(t, -1, c('clean'), 0.5), reveal(t, c('gb') + 0.6, 0.5)));
}
