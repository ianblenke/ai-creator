// Scene 05: the snap. A close-up disc bends slowly, then flips in one move; then one common design (the shared snapSwitch):
// the snap pushes the rod, the seesaw lever tips past the middle, the contacts spring apart and the power circle goes dark.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, label, glow, flow, makeStage, paintBackground, makeParticles, reveal, fadeBetween } from 'kit';
import { sensorDisc, snapSwitch, powerLight, POWER_SPOT, CURL, bendCurl, flipCurl } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'bend', at: 'the bend' },
    { name: 'dish', at: 'shallow-dish shape' },
    { name: 'temp', at: 'switching temperature' },
    { name: 'flip', at: 'flips all at once' },
    { name: 'snap', at: 'with a snap' },
    { name: 'design', at: 'In one common design' },
    { name: 'push', at: 'pushes a rod' },
    { name: 'rod', at: 'a rod' },
    { name: 'lever', at: 'trips a lever' },
    { name: 'seesaw', at: 'like a seesaw' },
    { name: 'tips', at: 'tips over' },
    { name: 'middle', at: 'past the middle' },
    { name: 'pulls', at: 'pulls the electrical contacts' },
    { name: 'contacts', at: 'electrical contacts' },
    { name: 'apart', at: 'apart' },
    { name: 'sharp', at: 'open sharply' },
    { name: 'power', at: 'the power is cut' },
    { name: 'cut', at: 'cut cleanly' },
  ],
};

// close-up disc (part 1) and the mechanism (part 2), world px. Part 2 starts cold (contacts closed, power ON) and runs in sync:
// one flip on "pushes a rod" lifts the lever to just short of level; it tips on "past the middle"; the contacts part on "apart";
// the power circle goes dark on "cut".
const DISC = { x: 900, y: 430, w: 760 };
const START = 0.75;                        // where scene 04's slow bend left the disc (between cold and trip)
const M = { x: 860, y: 440, s: 1.4 };      // snapSwitch pivot
const HOLD = -2, TIP = 4.5, OPEN = 26.7;    // lever degrees: held short of level, tipped (contacts still shut), contacts wide apart
const SLACK = 25;                          // the tipped lever just meets the arm; OPEN gives a ~150 px gap on screen
const wp = (lx, ly) => [M.x + lx * M.s, M.y + ly * M.s];
const ROD = wp(-300, 120), PIVOT = wp(0, 0), CONTACT = wp(420, -13);
const POW_S = 1.6;
const SLOT = 680;                          // part 1 label slot (under the close-up disc)

let S;

export function setup(ctx) {
  S = {
    parts: makeParticles(ctx.rand(7)),
    stage: makeStage(ctx.svg, [
      { t: 0.3, dur: 4, x: 920, y: 480, z: 1.06 },
      { cue: 'design', delay: 0.1, dur: 1.6, x: 960, y: 560, z: 1 },
      { cue: 'pulls', delay: 0, dur: 1.6, x: 1000, y: 540, z: 1.06 },
      { cue: 'power', delay: 0, dur: 1.2, x: 960, y: 540, z: 1 },
    ], ctx.cue),
  };
  const W = S.stage.world;

  // part 1: the close-up disc with the heat under it and the switching point marked as a warm glow
  S.heat = glow(W, { rx: 380, ry: 110, color: P.hot, strength: 0.45 }).at(DISC.x, DISC.y + 130);
  S.tempGlow = glow(W, { rx: 440, ry: 160, color: P.warm, strength: 0.4 }).at(DISC.x, DISC.y);
  S.disc = sensorDisc(W, { w: DISC.w }).at(DISC.x, DISC.y);

  // part 2: spotlight glows behind the part being spoken, then the shared mechanism
  S.rodGlow = glow(W, { rx: 70, ry: 170, color: P.warm, strength: 0.4 }).at(...ROD);
  S.leverGlow = glow(W, { rx: 400, ry: 90, color: P.ink, strength: 0.25 }).at(...PIVOT);
  S.contactGlow = glow(W, { rx: 160, ry: 110, color: P.ink, strength: 0.25 }).at(...CONTACT);
  S.gapGlow = glow(W, { rx: 120, ry: 90, color: P.hot, strength: 0.55 }).at(...CONTACT);
  S.sw = snapSwitch(W, { flipTilt: HOLD, slack: SLACK }).at(M.x, M.y, M.s);

  // wire from the fixed contact to the power circle, with current flowing while the contacts touch
  const top = POWER_SPOT.y - 22 * POW_S;
  const wire = [wp(550, -50), [POWER_SPOT.x, wp(550, -50)[1]], [POWER_SPOT.x, top]];
  S.wire = el(W, 'polyline', { points: wire.map((p) => p.join(',')).join(' '), fill: 'none', stroke: P.dim, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0 });
  S.current = flow(W, wire, { n: 4, r: 8, color: P.accent, period: 1.6 });
  S.powGlow = glow(W, { r: 110, color: P.ink, strength: 0.2 }).at(POWER_SPOT.x, POWER_SPOT.y);
  S.pow = powerLight(W).at(POWER_SPOT.x, POWER_SPOT.y, POW_S);

  // labels: narration words only; one label per slot at a time
  const L = (text, x, y, opts = {}) => label(W, text, { size: type.label, ...opts }).at(x, y);
  S.lb = {
    bend: L('the bend', DISC.x, SLOT),
    dish: L('shallow-dish shape', DISC.x, SLOT),
    temp: L('switching temperature', DISC.x, SLOT, { color: P.warm }),
    snap: L('snap', DISC.x, SLOT, { size: type.hero, color: P.warm }),
    design: L('one common design', M.x, 230),
    rod: L('rod', 330, 600),
    lever: L('lever', M.x, 290),
    seesaw: L('like a seesaw', M.x, 290),
    middle: L('past the middle', M.x, 290, { color: P.warm }),
    contacts: L('contacts', CONTACT[0], 710),
    sharp: L('open sharply', CONTACT[0], 710, { color: P.hot }),
    power: L('power', POWER_SPOT.x - 170, POWER_SPOT.y),
  };
  S.final = label(S.stage.hud, 'the power is cut cleanly', { size: type.hero }).at(960, 150);
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // part 1: slow bend toward the switching point, then one 0.15 s flip; fully gone before the mechanism fades in (one disc on screen)
  const flipAt = c('flip'), out1 = 1 - ease.inOut(prog(t, c('design'), 0.4));
  S.disc.curl(t < flipAt ? bendCurl(t, 0, flipAt - 0.3, START, CURL.trip) : flipCurl(t, flipAt)).show(out1);
  S.heat.pulse(t, lerp(0.35, 1, ease.inOut(prog(t, 0, flipAt))) * out1);
  S.tempGlow.pulse(t, (fadeBetween(t, c('temp'), flipAt, 0.4) + 0.8 * fadeBetween(t, flipAt, flipAt + 0.3, 0.12)) * out1);

  // part 2: starts cold; one flip on "pushes" lifts the lever to just short of level, it tips on "past the middle", parts the contacts on "apart"
  const pushAt = c('push'), midAt = c('middle'), apartAt = c('apart');
  const tilt = t < midAt ? undefined : lerp(HOLD, TIP, ease.in(prog(t, midAt, 0.25))) + (OPEN - TIP) * ease.out(prog(t, apartAt, 0.2));
  S.sw.set({ curl: t < pushAt ? CURL.cold : flipCurl(t, pushAt, CURL.cold, CURL.flipped), middle: fadeBetween(t, c('tips'), c('contacts'), 0.4), tilt });
  const mech = reveal(t, c('design') + 0.45, 0.5);
  S.sw.show(mech);
  set(S.wire, { opacity: +mech.toFixed(3) });
  S.current.update(t, (1 - S.sw.open) * mech);   // current stops the moment the contacts part
  S.pow.set(1 - prog(t, c('cut'), 0.15));        // the circle goes dark on "cut"

  S.rodGlow.at(...ROD).pulse(t, fadeBetween(t, pushAt, c('lever'), 0.4));
  S.leverGlow.at(...PIVOT).pulse(t, fadeBetween(t, c('lever'), c('pulls'), 0.4));
  S.contactGlow.at(...CONTACT).pulse(t, fadeBetween(t, c('pulls'), c('power'), 0.4));
  S.gapGlow.at(CONTACT[0], CONTACT[1] + (S.sw.gap * M.s) / 2).pulse(t, fadeBetween(t, apartAt, c('power'), 0.3));
  S.powGlow.at(POWER_SPOT.x, POWER_SPOT.y).pulse(t, reveal(t, c('power'), 0.5));

  // labels: each fades fully out before the next one in the same slot fades in
  const lb = S.lb;
  lb.bend.show(fadeBetween(t, c('bend'), c('dish') - 0.6, 0.4));
  lb.dish.show(fadeBetween(t, c('dish'), c('temp') - 0.6, 0.4));
  lb.temp.show(fadeBetween(t, c('temp'), flipAt - 0.4, 0.4));
  lb.snap.show(fadeBetween(t, c('snap') - 0.3, c('design') - 0.4, 0.3));
  lb.design.show(fadeBetween(t, c('design'), c('lever') - 0.5, 0.4));
  lb.rod.show(fadeBetween(t, c('rod'), c('pulls'), 0.4));
  lb.lever.show(fadeBetween(t, c('lever') + 0.4, c('seesaw') - 0.5, 0.4));
  lb.seesaw.show(fadeBetween(t, c('seesaw'), c('middle') - 0.5, 0.4));
  lb.middle.show(fadeBetween(t, c('middle'), c('pulls'), 0.4));
  lb.contacts.show(fadeBetween(t, c('contacts'), c('sharp') - 0.5, 0.4));
  lb.sharp.show(fadeBetween(t, c('sharp'), c('cut'), 0.4));
  lb.power.show(reveal(t, c('power'), 0.4));
  S.final.show(reveal(t, c('cut'), 0.5));
}
