// Scene 08, the close: a calm recap. Four icons (steam, bimetal disc, snap, guard) light up in turn as each is named,
// then the row lifts away, the shared kettle sits at rest (power off) and the point lands in one big phrase while the
// disc ("two metals") and the snap icons light up again. Every part comes from the shared _kettle.js.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, label, measure, Item, makeStage, paintBackground, makeParticles, reveal, dimAfter } from 'kit';
import { kettle, sensorDisc, guardDisc, powerLight, steam, CURL, bendCurl, flipCurl } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'title', at: 'All in all' },
    { name: 'steam', at: 'Steam tells the kettle' },
    { name: 'disc', at: 'a bimetal disc' },
    { name: 'bend', at: 'into a bend' },
    { name: 'snap', at: 'A snap makes' },
    { name: 'guard', at: 'a separate guard' },
    { name: 'rest', at: 'Behind a whole morning' },
    { name: 'metals', at: 'two metals growing' },
    { name: 'last', at: 'and a snap' },
  ],
};

const ROW_Y = 380, LABEL_Y = 530, LIFT = 160;
const XS = [450, 790, 1130, 1470];

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: -2, dur: 0.01, x: 960, y: 420, z: 1.06 },
    { cue: 'rest', delay: 0.1, dur: 1.8, x: 960, y: 540, z: 1 },
  ], ctx.cue);
  const w = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  S.title = label(w, 'The story is simple', { size: type.title }).at(960, 150);

  S.row = el(w, 'g');
  const tile = (x) => new Item(S.row, 220, 220).at(x, ROW_Y);

  S.steamT = tile(XS[0]);
  S.wisps = steam(S.steamT.g, { from: [0, 90], to: [0, -90], n: 4, period: 2.4, sway: 24, size: 1.3 });

  S.discT = tile(XS[1]);
  S.disc = sensorDisc(S.discT.g, { w: 190 });

  // the snap icon: the disc flips and the power circle (outside the tile, so it is never dimmed) goes off with it
  S.snapT = tile(XS[2]);
  S.snapDisc = sensorDisc(S.snapT.g, { w: 190 }).at(0, -20);
  S.pow = powerLight(S.row, { r: 24 }).at(XS[2], ROW_Y + 70);

  S.guardT = tile(XS[3]);
  S.guard = guardDisc(S.guardT.g, { w: 190 });

  S.tiles = [S.steamT, S.discT, S.snapT, S.guardT];
  S.labels = ['steam', 'bimetal disc', 'snap', 'guard'].map((s, i) => label(S.row, s, { size: type.label }).at(XS[i], LABEL_Y));

  // the kettle at rest: the shared drawing, usual water, cold coil, power off
  S.kettle = kettle(w).at(960, 600, 0.6);

  // the point, in two halves so "and a snap" lands on its own words
  const a = 'Two metals', b = 'and a snap', gap = 22;
  const wa = measure(a, type.title), wb = measure(b, type.title), x0 = 960 - (wa + gap + wb) / 2;
  S.endA = label(w, a, { size: type.title }).at(x0 + wa / 2, 850);
  S.endB = label(w, b, { size: type.title, color: P.accent }).at(x0 + wa + gap + wb / 2, 850);
}

export function render(ctx, t) {
  const cue = ctx.cue, cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const rest = cue('rest');

  S.title.show(reveal(t, cue('title')) * (1 - ease.inOut(prog(t, rest, 0.5))));

  // the row lifts out of the way once the kettle comes in
  const lift = LIFT * ease.inOut(prog(t, rest + 0.2, 1.2));
  set(S.row, { transform: `translate(0 ${(-lift).toFixed(2)})` });

  // each icon lights when named, dims when the next is named, settles at a calm level for the wrap-up,
  // and the disc ("two metals") and the snap light up again when the closing line names them
  const starts = ['steam', 'disc', 'snap', 'guard'].map(cue);
  const again = [null, cue('metals'), cue('last'), null];
  S.tiles.forEach((it, i) => {
    const next = i < 3 ? starts[i + 1] : rest;
    let d = t >= rest ? lerp(dimAfter(t, next, 0.35), 0.55, ease.inOut(prog(t, rest, 0.8))) : dimAfter(t, next, 0.35);
    if (again[i] !== null) d = lerp(d, 1, ease.inOut(prog(t, again[i], 0.4)));
    it.show(reveal(t, starts[i])).dim(d);
    S.labels[i].show(reveal(t, starts[i])).dim(d);
  });

  S.wisps.update(t, 1);
  S.disc.curl(bendCurl(t, cue('bend'), 0.9));
  // the snap icon: at the trip point until "snap", then one 0.15 s flip; the power goes off on the same frame
  const fAt = cue('snap') + 0.25;
  S.snapDisc.curl(t < fAt ? CURL.trip : flipCurl(t, fAt));
  S.pow.show(reveal(t, starts[2])).set(t < fAt + 0.075 ? 1 : 0);
  S.guard.at(0, 0, 1 + 0.04 * Math.max(0, Math.sin((t - starts[3]) * 3.9)) * (t >= starts[3] && t < rest ? 1 : 0));

  S.kettle.show(reveal(t, rest + 0.4, 0.9));
  S.endA.show(reveal(t, cue('metals'), 0.6));
  S.endB.show(reveal(t, cue('last'), 0.5));
}
