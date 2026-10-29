// Scene 02: the steam. The shared kettle cutaway: a cloud from the spout; before the boil only a little steam, then a burst;
// the steam channel carries it to the sensor on top of the handle, well above the water surface.
import { palette as P, prog, ease, lerp, clamp } from 'style';
import { type, label, glow, arrow, fitSize, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';
import { kettle, steam, KETTLE } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'spout', at: 'cloud from the spout' }, // spout steam swells
    { name: 'clue', at: 'the clue' },               // "the clue"
    { name: 'before', at: 'Before the boil' },      // boil calms: few bubbles, coil cooler, faint steam
    { name: 'little', at: 'only a little steam' },  // "a little steam"
    { name: 'burst', at: 'a burst of it' },         // full boil, thick steam billows
    { name: 'begun', at: 'the boil has begun' },    // "the boil has begun"
    { name: 'pipe', at: 'pipe carries' },           // the (dimmed) channel and housing brighten, "a small pipe"
    { name: 'carries', at: 'carries that steam' },  // camera zooms on the channel; wisps travel through it into the housing
    { name: 'sensor', at: 'a sensor' },             // the (dimmed) sensor disc brightens with a glow
    { name: 'steam', at: 'sits in the steam' },     // more steam reaches the sensor, "in the steam"
    { name: 'water', at: 'not in the water' },      // the real water surface lights up; a gap marker spans water to channel
    { name: 'itself', at: 'reacts to the boil itself' }, // sensor glows bright, camera ends wide, the point restated
  ],
};

const KX = 760, KY = 580, KS = 1.2;     // kettle placement (world)
const WATER_Y = 196 - 256 * KETTLE.waterDefault; // kettle-local water surface at the default level (lerp(WATER_MIN, WATER_MAX, level))
const CH_Y = KETTLE.channel[0][1];       // channel centre line (kettle-local)
let S;

export function setup(ctx) {
  // zoom: the whole kettle stays inside the frame (nothing cut), the channel large near the top, labels on the right
  const stage = makeStage(ctx.svg, [
    { cue: 'carries', delay: 0, dur: 1.2, x: 900, y: 650, z: 1.65 },
    { cue: 'itself', delay: 0.1, dur: 1.4, x: 960, y: 540, z: 1 },
  ], ctx.cue);
  const W = stage.world, H = stage.hud;
  S = { stage, parts: makeParticles(ctx.rand(7)) };

  const k = S.k = kettle(W).at(KX, KY, KS);
  const tw = (p) => k.toWorld(p);

  // extra wisps in the steam space for the burst (the kettle's own steamIn carries the "little")
  S.burst = [
    steam(W, { from: tw([-75, -50]), to: tw([-50, -140]), n: 4, period: 2.2, sway: 30, size: 1.2 }),
    steam(W, { from: tw([45, -50]), to: tw([70, -140]), n: 4, period: 2.5, sway: 30, size: 1.2 }),
  ];
  // steam that visibly travels: rising to the channel mouth, then along the channel into the housing (adds to k.steamToSensor)
  S.feed = steam(W, { from: tw([40, -60]), to: tw([90, -118]), n: 3, period: 1.5, sway: 6, size: 0.8 });
  S.pipe = [ // two layered streams so the wisps in the narrow channel read clearly (one stream tops out at low opacity)
    steam(W, { from: tw([86, -119]), to: tw([204, -127]), n: 4, period: 1.3, sway: 1.5, size: 0.75 }),
    steam(W, { from: tw([86, -119]), to: tw([204, -127]), n: 3, period: 1.7, sway: 1, size: 0.75 }),
  ];

  // the sensor glow
  const sp = tw(KETTLE.sensor);
  S.glow = glow(W, { r: 60, color: P.warm, strength: 0.55 }).at(sp[0], sp[1]);

  // "not in the water": the real water surface lights up and a two-way gap marker spans water surface -> channel
  const [wx, wy] = tw([0, WATER_Y]);
  S.wglow = glow(W, { rx: 170, ry: 26, color: P.cool, strength: 0.6 }).at(wx, wy);
  const [gx, gTop] = tw([118, CH_Y + 16]);
  const [, gBot] = tw([118, WATER_Y - 6]);
  const gm = (gTop + gBot) / 2;
  S.gap = [arrow(W, gx, gm, gx, gTop, { color: P.ink, head: 16 }), arrow(W, gx, gm, gx, gBot, { color: P.ink, head: 16 })];

  // labels (screen-fixed; narration words only; ink for facts, accent for the restated point; magenta stays for heat)
  S.lClue = label(H, 'the clue', { size: type.label, color: P.ink }).at(1480, 300);
  S.lLittle = label(H, 'a little steam', { size: type.label, color: P.ink }).at(1480, 440);
  S.lBegun = label(H, 'the boil has begun', { size: type.label, color: P.ink }).at(1480, 580);
  const col = (s, y) => label(H, s, { size: fitSize(s, 400), color: P.ink }).at(1585, y);
  S.lPipe = col('a small pipe', 200);
  S.lSensor = col('sensor', 300);
  S.lSteam = col('in the steam', 400);
  S.lWater = col('not in the water', 500);
  S.final = label(H, 'reacts to the boil itself', { size: 64, color: P.accent }).at(960, 150);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const k = S.k;

  // boil strength: switched back on (0.4 s), boiling, back to "before the boil" (a little), then the burst
  const on = reveal(t, 0, 0.4);
  const boil = on * lerp(lerp(1, 0.15, ease.inOut(prog(t, c('before'), 0.7))), 1, ease.out(prog(t, c('burst'), 0.4)));
  k.show(reveal(t, 0, 0.4)).water(KETTLE.waterDefault).boil(t, boil).heat(0.35 + 0.65 * boil).click(on).power(on);

  // steam: inside follows the boil; the burst adds thick billows. The spout cloud swells on its word and stays; during the
  // zoom it thins to faint wisps (its plume would rise past the top of the zoomed frame), back in full when the camera is wide
  const burst = clamp((boil - 0.15) / 0.85) ** 2;
  const inSteam = 0.25 + 0.75 * boil;
  const zoomed = ease.inOut(prog(t, c('carries') - 0.3, 0.5)) * (1 - ease.inOut(prog(t, c('itself') + 0.9, 0.5)));
  const spoutA = lerp(0.6, 1, reveal(t, c('spout'), 0.5)) * lerp(1, 0.35, zoomed);
  k.steamIn.update(t, inSteam);
  k.steamOut.update(t, spoutA * inSteam);
  S.burst.forEach((s) => s.update(t, burst).show(1));

  // channel + housing and the disc: on screen (dimmed) from the first frame, brightened on their words
  k.channel.show(1).dim(lerp(0.35, 1, reveal(t, c('pipe'), 0.4)));
  k.sensor.show(1).dim(lerp(0.35, 1, reveal(t, c('sensor'), 0.4)));

  // the channel carries the steam: wisps rise to its mouth and travel through it into the housing
  const flowA = reveal(t, c('carries'), 0.5) * lerp(0.75, 1, reveal(t, c('steam'), 0.4));
  k.steamToSensor.update(t, flowA);
  S.feed.update(t, flowA);
  S.pipe.forEach((p) => p.update(t, flowA));

  // the sensor glows on its word; it reacts (glows bright) at the end
  const react = reveal(t, c('itself') + 0.4, 0.4);
  S.glow.pulse(t, reveal(t, c('sensor'), 0.4) * lerp(0.6, 1.2, react));

  // the real water surface and the gap up to the channel
  const wa = fadeBetween(t, c('water'), c('itself') + 0.4, 0.4);
  S.wglow.pulse(t, wa);
  const gp = ease.inOut(prog(t, c('water') + 0.1, 0.5));
  S.gap.forEach((a) => a.draw(gp, wa));

  // labels: each on its word; the earlier one dims, the one before that leaves (at most two at once)
  const out1 = 1 - ease.in(prog(t, c('pipe') - 0.5, 0.4));
  S.lClue.show(reveal(t, c('clue')) * out1).dim(dimAfter(t, c('little'), 0.35, 0.4));
  S.lLittle.show(reveal(t, c('little')) * out1).dim(dimAfter(t, c('burst'), 0.35, 0.4));
  S.lBegun.show(reveal(t, c('begun')) * out1);
  S.lPipe.show(fadeBetween(t, c('pipe'), c('steam'), 0.4)).dim(dimAfter(t, c('sensor'), 0.35, 0.4));
  S.lSensor.show(fadeBetween(t, c('sensor'), c('water'), 0.4)).dim(dimAfter(t, c('steam'), 0.35, 0.4));
  S.lSteam.show(fadeBetween(t, c('steam'), c('itself'), 0.4)).dim(dimAfter(t, c('water'), 0.35, 0.4));
  S.lWater.show(fadeBetween(t, c('water'), c('itself'), 0.4));
  S.final.show(reveal(t, c('itself') + 0.6, 0.6));
}
