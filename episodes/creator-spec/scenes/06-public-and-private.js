// Scene 06: sort the facts into two piles (generic words stay, private names go to a locked folder), then the denylist.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, chip, label, arrow, glow, makeStage, paintBackground, makeParticles, reveal, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'facts', at: 'Some facts' },
    { name: 'true', at: 'are true' },
    { name: 'notsaid', at: 'must not be said' },
    { name: 'sort', at: 'sort the facts' },
    { name: 'piles', at: 'two piles' },
    { name: 'mayuse', at: 'video may use' },
    { name: 'generic', at: 'generic words' },
    { name: 'machine', at: 'every machine name' },
    { name: 'address', at: 'address' },
    { name: 'port', at: 'port' },
    { name: 'person', at: 'and person' },
    { name: 'becomes', at: 'becomes what it does' },
    { name: 'graphics', at: 'the graphics card' },
    { name: 'never', at: 'never publish' },
    { name: 'separate', at: 'separate file' },
    { name: 'outside', at: 'outside the episode folder' },
    { name: 'add', at: 'add its name' },
    { name: 'gitignore', at: 'git ignore' },
    { name: 'yourself', at: 'yourself' },
    { name: 'nothing', at: 'nothing here does that' },
    { name: 'then', at: 'Then every private name' },
    { name: 'list', at: 'list of names' },
    { name: 'block', at: 'to block' },
    { name: 'denylist', at: 'the denylist' },
    { name: 'safety', at: 'safety check' },
    { name: 'trap', at: 'One trap' },
    { name: 'purpose', at: 'show on purpose' },
    { name: 'channel', at: 'channel name' },
    { name: 'final', at: 'or every episode' },
    { name: 'fails', at: 'fails its own' },
  ],
};

// piecewise spotlight level: start value, then glide to each new value at its time
const track = (t, pts, dur = 0.6) => {
  let v = pts[0][1];
  for (let i = 1; i < pts.length; i++) { if (t < pts[i][0]) break; v = lerp(v, pts[i][1], ease.inOut(prog(t, pts[i][0], dur))); }
  return v;
};
const fade = (t, a, b, d = 0.4) => ease.out(prog(t, a, d)) * (1 - ease.in(prog(t, b, d)));

const PAGE = { x0: 960, x1: 480, y: 470 };
const ROW_Y = [-130, -30, 70]; // page-local: exactly three tagged rows
const PUB_Y = 104; // second line of row 3 (not a fourth row): the name shown on purpose
const SEG_X = 107; // page-local centre of each row's name segment
const FOLDER = { x: 1440, y: 430 };
const SHIELD = { x: 1050, y: 450 };
const HOLD_X = 920; // clear of the episode folder: rewritten names wait here
const SLOT_W = [120, 96, 120, 80], SLOT_Y = [-62, -22, 18, 58]; // the canonical four-slot denylist
const SHIELD_D = 'M 0 -130 L 110 -98 L 110 -10 C 110 60 60 108 0 130 C -60 108 -110 60 -110 -10 L -110 -98 Z';
// scene 03's notched-tab folder (300 x 258, centred), scaled uniformly; the stroke stays 5 px
const folderD = (k) => {
  const p = [[-150, 129], [-150, -117], [-150, -129, -138, -129], [-52, -129], [-32, -105], [138, -105], [150, -105, 150, -93], [150, 117], [150, 129, 138, 129]];
  const f = (v) => (v * k).toFixed(1);
  return p.map((q, i) => (i === 0 ? 'M ' : q.length === 4 ? 'Q ' : 'L ') + q.map(f).join(' ')).join(' ') + ' Z';
};
const EPK = 2.2; // episode folder scale: its body holds the full-size page
const EPF = { x: PAGE.x1, y: PAGE.y - 12 * EPK }; // body centre on the page centre

function tagIcon(g, kind, x, y) {
  const col = kind === 'cited' ? P.accent : kind === 'measured' ? P.ink : P.dim;
  const t = el(g, 'g', { transform: `translate(${x} ${y})` });
  el(t, 'rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: col, 'fill-opacity': 0.12, stroke: col, 'stroke-width': 3 });
  if (kind === 'cited') {
    for (const dx of [-7, 7]) el(t, 'ellipse', { cx: dx, cy: 0, rx: 11, ry: 6.5, fill: 'none', stroke: col, 'stroke-width': 3, transform: `rotate(-35 ${dx} 0)` });
  } else if (kind === 'measured') {
    el(t, 'rect', { x: -18, y: -7, width: 36, height: 14, rx: 2, fill: 'none', stroke: col, 'stroke-width': 3 });
    for (let i = 0; i < 4; i++) el(t, 'line', { x1: -11 + i * 7.5, x2: -11 + i * 7.5, y1: -7, y2: i % 2 ? -1 : 2, stroke: col, 'stroke-width': 2 });
  } else {
    el(t, 'path', { d: 'M -16 3 Q -8 -9 0 0 Q 8 9 16 -3', fill: 'none', stroke: col, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
  }
}

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: 0, dur: 0.01, x: 960, y: 480, z: 1.15 },
    { cue: 'sort', delay: 0.1, dur: 1.6, x: 930, y: 480, z: 1 },
    { cue: 'never', delay: 0.1, dur: 1.6, x: 1000, y: 470, z: 1.08 },
    { cue: 'then', delay: 0.1, dur: 1.6, x: 930, y: 480, z: 1 },
    { cue: 'trap', delay: 0.1, dur: 1.4, x: 880, y: 480, z: 1.05 },
    { cue: 'final', delay: 0, dur: 1.4, x: 930, y: 530, z: 1 },
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // episode folder (ink, scene 03's silhouette) around the left pile
  S.epFolder = new Item(W, 300 * EPK, 258 * EPK);
  el(S.epFolder.g, 'path', { d: folderD(EPK), fill: P.bg2, 'fill-opacity': 0.7, stroke: P.ink, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  S.epFolder.at(EPF.x, EPF.y);
  // the boundary between the two piles: the locked folder is outside the episode folder
  S.edge = el(W, 'line', { x1: 1050, y1: 230, x2: 1050, y2: 690, stroke: P.dim, 'stroke-width': 4, 'stroke-dasharray': '14 12', opacity: 0 });

  // the fact sheet page: three tagged rows, the third with a second line
  S.page = new Item(W, 360, 470);
  const pg = S.page.g;
  el(pg, 'rect', { x: -180, y: -235, width: 360, height: 470, rx: 24, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  const kinds = ['measured', 'cited', 'estimated'];
  S.segHot = []; S.segGen = []; S.rings = [];
  ROW_Y.forEach((y, i) => {
    tagIcon(pg, kinds[i], -120, y);
    el(pg, 'rect', { x: -78, y: y - 9, width: 138, height: 18, rx: 9, fill: P.ink, opacity: 0.85 });
    S.segGen.push(el(pg, 'rect', { x: SEG_X - 35, y: y - 11, width: 70, height: 22, rx: 8, fill: P.accent, opacity: 0 }));
    S.segHot.push(el(pg, 'rect', { x: SEG_X - 35, y: y - 11, width: 70, height: 22, rx: 8, fill: P.hot }));
    S.rings.push(el(pg, 'ellipse', { cx: SEG_X, cy: y, rx: 52, ry: 22, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 }));
  });
  S.pubSeg = el(pg, 'rect', { x: SEG_X - 35, y: PUB_Y - 11, width: 70, height: 22, rx: 8, fill: P.ink, opacity: 0.85 });
  S.pubLine = el(pg, 'line', { x1: SEG_X - 35, x2: SEG_X + 35, y1: PUB_Y + 20, y2: PUB_Y + 20, stroke: P.ink, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 });
  S.pubRing = el(pg, 'ellipse', { cx: SEG_X, cy: PUB_Y, rx: 52, ry: 22, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });

  // locked folder: the same silhouette in hot, plus the padlock
  S.lock = new Item(W, 300, 258);
  const lg = S.lock.g;
  el(lg, 'path', { d: folderD(1), fill: P.bg2, stroke: P.hot, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  S.padlock = el(lg, 'g', {});
  el(S.padlock, 'path', { d: 'M -20 -2 L -20 -22 A 20 20 0 0 1 20 -22 L 20 -2', fill: 'none', stroke: P.hot, 'stroke-width': 5, 'stroke-linecap': 'round' });
  el(S.padlock, 'rect', { x: -34, y: -4, width: 68, height: 52, rx: 8, fill: P.bg2, stroke: P.hot, 'stroke-width': 5 });
  el(S.padlock, 'circle', { cx: 0, cy: 20, r: 6, fill: P.hot });
  S.lock.at(FOLDER.x, FOLDER.y);

  // hot copies of the private names: off the page at 'becomes', into the locked folder at 'never'
  S.copies = ROW_Y.map(() => el(W, 'rect', { x: -35, y: -11, width: 70, height: 22, rx: 8, fill: P.hot, opacity: 0 }));

  // the shield (scene 08's) and its four-slot denylist
  S.shGlow = glow(W, { r: 190, color: P.accent, strength: 0.3 }).at(SHIELD.x, SHIELD.y);
  S.shield = new Item(W, 220, 260);
  el(S.shield.g, 'path', { d: SHIELD_D, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.accent, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  S.slots = SLOT_Y.map((y, i) => el(S.shield.g, 'rect', { x: -SLOT_W[i] / 2, y: y - 9, width: SLOT_W[i], height: 18, rx: 9, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-dasharray': '8 7' }));
  S.shield.at(SHIELD.x, SHIELD.y);
  S.denyBars = ROW_Y.map((_, i) => el(W, 'rect', { x: -SLOT_W[i] / 2, y: -9, width: SLOT_W[i], height: 18, rx: 9, fill: P.ink, opacity: 0 }));

  // the trap: a struck-through "do not" arrow toward the empty fourth slot
  const s4 = { x: SHIELD.x, y: SHIELD.y + SLOT_Y[3] };
  S.pubArrow = arrow(W, PAGE.x1 + SEG_X + 50, PAGE.y + PUB_Y, s4.x - 52, s4.y + 4, { color: P.dim, dashed: true, width: 4, head: 16 });
  S.cross = el(W, 'g', { opacity: 0, transform: `translate(${s4.x} ${s4.y})` });
  el(S.cross, 'path', { d: 'M -16 -16 L 16 16 M 16 -16 L -16 16', stroke: P.hot, 'stroke-width': 5, 'stroke-linecap': 'round' });

  // git ignore step, done by hand
  S.git = chip(W, 'git ignore', { color: P.ink }).at(FOLDER.x, 660);
  S.gitArrow = arrow(W, FOLDER.x, 570, FOLDER.x, 618, { color: P.ink, width: 4, head: 14 });
  S.noAuto = arrow(W, 1080, 660, 1290, 660, { color: P.dim, dashed: true, width: 4, head: 16 });
  S.noCross = el(W, 'g', { opacity: 0, transform: 'translate(1175 660)' });
  el(S.noCross, 'path', { d: 'M -18 -18 L 18 18 M 18 -18 L -18 18', stroke: P.hot, 'stroke-width': 5, 'stroke-linecap': 'round' });

  // words the narration says
  S.cTrue = chip(W, 'true', { color: P.accent }).at(820, 170);
  S.cNot = chip(W, 'must not be said', { color: P.hot }).at(1080, 170);
  S.cMay = chip(W, 'may use', { color: P.accent }).at(PAGE.x1 + 120, 128); // right of the folder tab
  S.cEp = chip(W, 'episode folder', { color: P.ink }).at(PAGE.x1 + 120, 128);
  S.cNever = chip(W, 'never publish', { color: P.hot }).at(FOLDER.x, 128);
  S.cGeneric = chip(W, 'generic words', { color: P.accent }).at(PAGE.x1, 785);
  S.cGpu = chip(W, 'with the graphics card', { color: P.accent }).at(PAGE.x1, 785);
  S.cYou = chip(W, 'yourself', { color: P.ink }).at(FOLDER.x, 745);
  S.cDeny = chip(W, 'the denylist', { color: P.accent }).at(SHIELD.x, 250);
  S.cSafety = chip(W, 'safety check', { color: P.accent }).at(SHIELD.x, 650);
  S.cChannel = chip(W, 'your channel name', { color: P.ink }).at(1010, 650); // beside the sheet, under the struck arrow
  S.final = label(W, 'do not list a name you show on purpose', { size: 64, color: P.ink }).at(930, 830);
}

export function render(ctx, t) {
  const C = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // page: appears, slides left into the "may use" pile
  const px = lerp(PAGE.x0, PAGE.x1, ease.inOut(prog(t, C('sort') + 0.1, 1.6)));
  S.page.at(px, PAGE.y);
  S.page.show(reveal(t, C('facts') - 0.1)).dim(track(t, [[0, 1], [C('never'), 0.35], [C('trap'), 1], [C('final'), 0.7]]));

  // private names: ringed one by one (all three pulse again on 'person'), then lifted off and replaced by generic words
  const ringAt = [C('machine') + 0.25, C('address'), C('port')];
  const pulse = Math.sin(Math.PI * prog(t, C('person'), 0.6));
  S.rings.forEach((r, i) => set(r, { opacity: fade(t, ringAt[i], C('becomes'), 0.3).toFixed(3), 'stroke-width': (3 + 2 * pulse).toFixed(2) }));
  const lift = t >= C('becomes') ? 1 : 0; // the page's hot segment is swapped for a world copy at the same spot
  S.segHot.forEach((r) => set(r, { opacity: 1 - lift }));
  const gen = ease.inOut(prog(t, C('becomes') + 0.5, 0.6));
  S.segGen.forEach((r) => set(r, { opacity: gen.toFixed(3) }));

  S.copies.forEach((r, i) => {
    const sx = PAGE.x1 + SEG_X, sy = PAGE.y + ROW_Y[i];
    const kh = ease.inOut(prog(t, C('becomes'), 0.6));
    const t0 = C('never') + 0.3 + i * 0.5;
    const k = ease.inOut(prog(t, t0, 1.2));
    const hx = kh < 0.5 ? sx : HOLD_X - 40 * (1 - ease.out(2 * kh - 1)); // fade out on the page, fade in past the folder edge: never crosses it
    const ex = FOLDER.x - 90, ey = FOLDER.y + 60; // inside the folder body, left of the padlock
    const x = lerp(hx, ex, k), y = lerp(sy, ey, k) - Math.sin(k * Math.PI) * 110;
    const a = lift * (kh < 0.5 ? 1 - 2 * kh : 0.55 * (2 * kh - 1)) * lerp(1, 1 / 0.55, ease.out(prog(t, t0, 0.3))) * (1 - ease.in(prog(t, t0 + 0.8, 0.4)));
    set(r, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, opacity: Math.min(1, a).toFixed(3) });
  });

  // the two piles
  S.epFolder.show(reveal(t, C('piles'))).dim(track(t, [[0, 0.6], [C('mayuse'), 1], [C('never'), 0.35], [C('outside'), 1], [C('add'), 0.35], [C('trap'), 0.8], [C('final'), 0.6]]));
  S.lock.show(reveal(t, C('piles'))).dim(track(t, [[0, 0.35], [C('never'), 1], [C('denylist'), 0.35], [C('final'), 0.6]]));
  const click = Math.sin(Math.PI * prog(t, C('separate'), 0.35)); // the padlock clicks: shut all along
  set(S.padlock, { transform: `translate(0 ${(-6 * click).toFixed(2)})` });
  set(S.edge, { opacity: (0.8 * fade(t, C('outside'), C('add'))).toFixed(3) });

  // git ignore, done by hand; no tool does it for you (arrow and cross arrive together)
  S.git.show(reveal(t, C('gitignore'))).dim(track(t, [[0, 1], [C('then'), 0.35]]));
  S.gitArrow.draw(ease.out(prog(t, C('add'), 0.6)), track(t, [[0, 1], [C('then'), 0.35]]));
  S.cYou.show(fade(t, C('yourself'), C('then')));
  const na = fade(t, C('nothing'), C('then'));
  S.noAuto.draw(ease.out(prog(t, C('nothing'), 0.4)), 0.6 * na);
  set(S.noCross, { opacity: na.toFixed(3) });

  // the shield and the denylist: each private name drops in from the locked folder as a short bar
  S.shield.show(reveal(t, C('list'))).dim(track(t, [[0, 1], [C('trap'), 0.6], [C('purpose'), 1], [C('final'), 0.6]]));
  S.shGlow.pulse(t, reveal(t, C('safety')) * (1 - ease.in(prog(t, C('trap'), 0.5))) * 0.8);
  S.denyBars.forEach((r, i) => {
    const t0 = C('block') + i * 0.5;
    const k = ease.inOut(prog(t, t0, 0.9));
    const x = lerp(FOLDER.x - 90, SHIELD.x, k), y = lerp(FOLDER.y + 60, SHIELD.y + SLOT_Y[i], k) - Math.sin(k * Math.PI) * 90;
    set(S.slots[i], { opacity: (1 - prog(t, t0 + 0.7, 0.2)).toFixed(3) }); // the dashed outline goes as the bar lands
    set(r, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, opacity: (ease.out(prog(t, t0, 0.3)) * track(t, [[0, 1], [C('trap'), 0.6]])).toFixed(3) });
  });

  // the trap: the name shown on purpose is underlined and stays on the page; the arrow to the list is struck through
  set(S.pubLine, { opacity: fade(t, C('trap') + 0.3, C('final'), 0.4).toFixed(3) });
  set(S.pubSeg, { opacity: track(t, [[0, 0.85], [C('trap') + 0.3, 1]]).toFixed(3) });
  S.pubArrow.draw(ease.out(prog(t, C('purpose'), 0.5)), 0.6 * (1 - ease.in(prog(t, C('final'), 0.4)) * 0.5));
  set(S.cross, { opacity: ease.out(prog(t, C('purpose'), 0.3)).toFixed(3) });
  // if it were listed, the check would flag your own name: a hot ring at 'fails', settling to 0.35
  set(S.pubRing, { opacity: (ease.out(prog(t, C('fails'), 0.3)) * track(t, [[0, 1], [C('fails') + 0.5, 0.35]], 0.4)).toFixed(3) });

  // spoken words
  S.cTrue.show(fade(t, C('true') + 0.15, C('sort')));
  S.cNot.show(fade(t, C('notsaid'), C('sort')));
  S.cMay.show(fade(t, C('mayuse'), C('outside'))).dim(track(t, [[0, 1], [C('never'), 0.35]]));
  S.cEp.show(reveal(t, C('outside') + 0.2)).dim(track(t, [[0, 1], [C('add'), 0.35]]));
  S.cNever.show(reveal(t, C('never'))).dim(track(t, [[0, 1], [C('then'), 0.35]]));
  S.cGeneric.show(fade(t, C('generic'), C('graphics') - 0.5));
  S.cGpu.show(fade(t, C('graphics'), C('never') - 0.6));
  S.cDeny.show(reveal(t, C('denylist'))).dim(track(t, [[0, 1], [C('safety'), 0.35]]));
  S.cSafety.show(fade(t, C('safety'), C('channel') - 0.4)) // gives its spot to the channel name.dim(track(t, [[0, 1], [C('trap'), 0.35]]));
  S.cChannel.show(fade(t, C('channel'), C('fails') + 0.5));
  S.final.show(reveal(t, C('final') + 0.45));
}
