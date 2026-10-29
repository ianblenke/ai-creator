// Scene 03: the steam-based design has a bonus: the sensor trips well under a boil, which also helps on a mountain.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, lines, arrow, glow, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';
import { kettle, steam, KETTLE } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'bonus', at: 'a bonus' },                // "a bonus" label above the kettle
    { name: 'steam', at: 'A little steam' },         // a few faint wisps above the water, nothing reaches the sensor
    { name: 'mistaken', at: 'mistaken for a boil' }, // "can't be mistaken" label
    { name: 'boil', at: 'for a boil' },              // a visibly stronger burst: hard boil, steam pours into the channel, sensor lights
    { name: 'sensor', at: 'the sensor can' },        // "the sensor" label, sensor glow brightens
    { name: 'trip', at: 'set to trip' },             // camera settles wide; thermometer with the boil line and the trip mark
    { name: 'under', at: 'well under' },             // gap bracket "well under"
    { name: 'mountain', at: 'on a mountain' },       // mountain silhouette (camera holds still from here on)
    { name: 'cooler', at: 'water boils cooler' },    // boil line moves DOWN with an arrow, stays above the trip mark; sensor lights again
  ],
};

const KX = 620, KY = 520, KS = 1.1;  // the shared kettle, world placement
const TX = 1200;                     // thermometer x (world)
const BOIL0 = 330, BOIL1 = 480;      // boil line: sea level, then on the mountain (still above the trip mark)
const TRIP = 600;                    // trip mark, well under the boil line
const SLOT = [620, 190];             // one label slot above the kettle (labels follow one another, never overlap)
let S;

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: 0, dur: 0.01, x: 800, y: 540, z: 1.05 },
    { cue: 'trip', dur: 0.8, x: 960, y: 540, z: 1 }, // the only move; the camera then holds still to the end
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  S.k = kettle(W).at(KX, KY, KS);
  S.sensorPt = S.k.toWorld(KETTLE.sensor);
  S.glow = glow(W, { r: 80, color: P.warm, strength: 0.6 }).at(...S.sensorPt);
  S.k.g.parentNode.appendChild(S.k.g); // kettle above its glow
  // the stronger burst on "a boil": bigger, faster wisps filling the steam space (the shared steam drawing)
  S.burst = steam(W, { from: S.k.toWorld([-40, 20]), to: S.k.toWorld([50, -140]), n: 7, period: 1.3, sway: 50, size: 1.3 });

  // one slot, plain labels (no pills), one at a time
  S.bonus = label(W, 'a bonus', { color: P.accent }).at(...SLOT);
  S.steamLbl = label(W, 'a little steam').at(...SLOT);
  S.mistaken = label(W, "can't be mistaken").at(...SLOT);
  S.sensorLbl = label(W, 'the sensor', { color: P.warm }).at(...SLOT);

  // thermometer: tube, bulb, boil line (ink, dashed), trip mark (thin warm line), gap bracket, drop arrow
  const line = { fill: 'none', stroke: P.ink, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  const th = S.thermo = new Item(W);
  el(th.g, 'rect', { x: TX - 18, y: 290, width: 36, height: 500, rx: 18, ...line, 'stroke-width': 4 });
  el(th.g, 'circle', { cx: TX, cy: 826, r: 36, ...line, 'stroke-width': 4 });
  S.boilG = new Item(W);
  el(S.boilG.g, 'line', { x1: TX - 50, y1: 0, x2: TX + 50, y2: 0, stroke: P.ink, 'stroke-width': 5, 'stroke-dasharray': '10 8' });
  S.boilLbl = label(W, 'a boil');
  S.tripG = new Item(W);
  el(S.tripG.g, 'line', { x1: TX - 50, y1: TRIP, x2: TX + 50, y2: TRIP, stroke: P.warm, 'stroke-width': 6, 'stroke-linecap': 'round' });
  S.tripLbl = label(W, 'trip', { color: P.warm });
  S.tripLbl.at(TX - 80 - S.tripLbl.w / 2, TRIP);
  S.gap = new Item(W);
  S.gapPath = el(S.gap.g, 'path', { fill: 'none', stroke: P.warm, 'stroke-width': 5, 'stroke-linecap': 'round' });
  S.under = label(W, 'well under', { color: P.warm });
  S.drop = arrow(W, TX, BOIL0 + 16, TX, BOIL1 - 10, { color: P.cool, width: 7, head: 16 }); // inside the tube

  // mountain: ink outline silhouette, and its words above it
  const m = S.mountain = new Item(W);
  el(m.g, 'path', { d: 'M 1420 800 L 1530 640 L 1580 690 L 1660 560 L 1780 800 Z', fill: P.ink, 'fill-opacity': 0.06, ...line, 'stroke-width': 5 });
  S.cooler = label(W, 'boils cooler', { color: P.cool }).at(1610, 480);

  // the point, restated big at the end (verbatim fragments: "set to trip well under", "also helps on a mountain")
  S.point = lines(W, ['set to trip well under', 'also helps on a mountain'], { size: 64, color: P.accent }).at(960, 170);
}

export function render(ctx, t) {
  const cue = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  const tBonus = cue('bonus'), tSteam = cue('steam'), tMis = cue('mistaken'), tBoil = cue('boil'), tSensor = cue('sensor');
  const tTrip = cue('trip'), tUnder = cue('under'), tMount = cue('mountain'), tCool = cue('cooler');
  const tPoint = tCool + 0.75;

  // the kettle heats; a little steam first (nothing in the channel), then a real boil: hard bubbling, a big burst, steam to the sensor
  const k = S.k;
  const boilA = reveal(t, tBoil, 0.4);
  k.show(reveal(t, 0, 0.3)).water(KETTLE.waterDefault).boil(t, lerp(0.2, 1, boilA)).heat(1).click(1).power(1);
  const kDim = lerp(1, 0.35, ease.inOut(prog(t, tTrip, 0.6)));
  k.dim(kDim);
  k.steamIn.update(t, lerp(0.35 * reveal(t, tSteam, 0.5), 1, boilA));
  S.burst.show(1).dim(kDim);
  S.burst.update(t, boilA);
  k.steamToSensor.update(t, boilA);
  // the sensor answers only the boil: lights on the burst, brightest on "the sensor", and again when the mountain boil arrives
  S.glow.pulse(t, Math.max(0.6 * fadeBetween(t, tBoil + 0.3, tUnder + 0.6, 0.4), 0.4 * fadeBetween(t, tSensor, tUnder + 0.6, 0.4), 0.8 * reveal(t, tCool + 0.5, 0.4)));

  // one slot: each label is fully gone before the next arrives
  const D = 0.3;
  S.bonus.show(fadeBetween(t, tBonus, tSteam - D, D));
  S.steamLbl.show(fadeBetween(t, tSteam, tMis - D, D));
  S.mistaken.show(fadeBetween(t, tMis, tSensor - D, D));
  S.sensorLbl.show(fadeBetween(t, tSensor, tTrip + 0.3, D));

  // thermometer: boil line and trip mark on "set to trip"; the bracket says "well under"
  const thA = reveal(t, tTrip, 0.5);
  const endDim = lerp(1, 0.6, prog(t, tPoint, 0.6));
  const dropP = ease.inOut(prog(t, tCool, 0.9));
  const boilY = lerp(BOIL0, BOIL1, dropP);
  S.thermo.show(thA).dim(endDim);
  S.boilG.show(thA).at(0, boilY).dim(endDim);
  S.boilLbl.show(thA).at(TX - 80 - S.boilLbl.w / 2, boilY).dim(endDim);
  S.tripG.show(reveal(t, tTrip + 0.2, 0.4)).dim(endDim);
  S.tripLbl.show(reveal(t, tTrip + 0.2, 0.4)).dim(endDim);
  set(S.gapPath, { d: `M ${TX + 62} ${boilY + 6} L ${TX + 80} ${boilY + 6} L ${TX + 80} ${TRIP - 6} L ${TX + 62} ${TRIP - 6}` });
  S.gap.show(reveal(t, tUnder, 0.5)).dim(endDim); // the bracket stays: the boil is still above the trip mark
  // "well under" was true at sea level; it steps aside once the boil line starts down (the gap shrinks)
  S.under.show(fadeBetween(t, tUnder, tCool - 0.3, 0.4)).at(TX + 110 + S.under.w / 2, (BOIL0 + TRIP) / 2);
  S.drop.draw(prog(t, tCool, 0.9), reveal(t, tCool, 0.2) * endDim);

  // the mountain, where water boils cooler
  S.mountain.show(reveal(t, tMount, 0.5));
  S.cooler.show(reveal(t, tCool + 0.3, 0.4)).dim(endDim);

  S.point.reveal(2, reveal(t, tPoint, 0.5));
}
