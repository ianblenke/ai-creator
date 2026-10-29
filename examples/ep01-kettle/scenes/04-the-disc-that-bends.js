// Scene 04: the sensor disc is two metals stuck together; heat makes the amber one stretch more, so the cold dish slowly flattens,
// but only gradually: not much use for pulling a switch apart. Kettle, disc, steam and contacts come from the shared module.
import { palette as P, ease, prog, lerp, el, set } from 'style';
import { type, label, glow, curve, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, Item } from 'kit';
import { kettle, sensorDisc, contacts, KETTLE, CURL, bendCurl } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'sensor', at: 'sensor sitting in that steam' },
    { name: 'zoom', at: 'actually made of' },
    { name: 'dish', at: 'shallow dish' },
    { name: 'layers', at: 'two layers' },
    { name: 'stuck', at: 'stuck together' },
    { name: 'heat', at: 'Heat makes both layers expand' },
    { name: 'faster', at: 'one expands faster' },
    { name: 'bend', at: 'whole disc bend' },
    { name: 'heatIn', at: 'heat into movement' },
    { name: 'movement', at: 'movement' },
    { name: 'gradual', at: 'is gradual' },
    { name: 'switch', at: 'pulling a switch apart' },
  ],
};

const K = { x: 700, y: 500, s: 1.25 };       // the kettle in the opening (world)
const CX = 960, CY = 430;                    // close-up disc centre (world)
const DW = 840, DEPTH = DW * (8 / 60), LAYER = DW * 0.075; // same proportions as the kettle's own sensor disc
const END_CURL = 0.55;                       // how far the slow bend gets in this scene (still a dish; scene 05 continues from here)
const SLOT_Y = 700;                          // one label slot under the disc
const SW = { x: 1610, y: 430 };              // the switch contacts (right of the disc)

let S;

export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { cue: 'sensor', delay: 0.1, dur: 1.8, x: 900, y: 500, z: 1.15 },  // lean in on the sensor housing
    { cue: 'zoom', delay: 0.2, dur: 1.8, x: 960, y: 480, z: 1 },       // the disc grows out of it
    { cue: 'bend', delay: 0.2, dur: 1.8, x: 960, y: 450, z: 1.1 },
    { cue: 'heatIn', delay: -0.3, dur: 1.6, x: 960, y: 540, z: 1 },    // end wide: disc, heat -> movement, switch
  ], ctx.cue);
  const w = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage };

  // --- opening: the shared kettle, boiling, steam reaching the sensor on top of the handle ---
  S.kettle = kettle(w).at(K.x, K.y, K.s);
  S.sensorAt = S.kettle.toWorld(KETTLE.sensor);
  S.sensorTag = label(w, 'the sensor', { size: type.label, color: P.warm }).at(S.sensorAt[0] + 210, S.sensorAt[1] - 80);

  // --- close-up disc (the same two-layer disc, scaled up from the kettle's sensor) ---
  S.heatGlow = glow(w, { rx: 520, ry: 120, color: P.hot, strength: 0.45 }).at(CX, CY + 190);
  S.warmGlow = glow(w, { rx: 560, ry: 200, color: P.warm, strength: 0.3 }).at(CX, CY + 40);
  S.disc = sensorDisc(w, { w: DW, depth: DEPTH, layer: LAYER });
  // the joint between the layers ("stuck together"): a thin ink line along the shared centre line
  S.seam = new Item(w, DW, 2 * DEPTH);
  S.seamLine = el(S.seam.g, 'path', { fill: 'none', stroke: P.ink, 'stroke-width': 5, 'stroke-linecap': 'round' });

  // stretch arrows at the ends of each layer (ends stay at local y = 0, so the arrows keep their height)
  S.arrows = ['ampL', 'ampR', 'coolL', 'coolR'].map((k) => {
    const color = k.startsWith('amp') ? P.warm : P.cool;
    const g = el(w, 'g', { opacity: 0 });
    const line = el(g, 'line', { stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round' });
    const tip = el(g, 'path', { fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    return { k, g, line, tip };
  });

  // labels in one slot under the disc (one at a time); narration words only, no pills
  const L = (text, color) => label(w, text, { size: type.label, color }).at(CX, SLOT_Y);
  S.slot = [
    { it: L('shallow dish', P.ink), from: 'dish', to: 'layers' },
    { it: L('two layers', P.ink), from: 'layers', to: 'stuck' },
    { it: L('stuck together', P.ink), from: 'stuck', to: 'heat' },
    { it: L('both layers expand', P.hot), from: 'heat', to: 'faster' },
    { it: L('one expands faster', P.warm), from: 'faster', to: 'bend' },
    { it: L('the whole disc bend', P.ink), from: 'bend', to: 'heatIn' },
  ];

  // heat -> movement
  S.heatLbl = label(w, 'heat', { size: type.label, color: P.hot }).at(760, SLOT_Y);
  S.moveLbl = label(w, 'movement', { size: type.label, color: P.ink }).at(1210, SLOT_Y);
  S.hmArrow = curve(w, 760 + S.heatLbl.w / 2 + 30, SLOT_Y, 1210 - S.moveLbl.w / 2 - 30, SLOT_Y, { bend: 0, color: P.dim });

  // the switch: a contact pair the slow bend barely moves
  S.contacts = contacts(w, { w: 140 }).at(SW.x, SW.y);
  S.switchTag = label(w, 'switch', { size: type.note, color: P.ink }).at(SW.x, SW.y + 90);
  S.reach = curve(w, CX + DW / 2 + 30, CY, SW.x - 90, SW.y, { bend: -30, color: P.warm, dashed: true });

  // the point, big (verbatim narration)
  S.point = label(w, 'a gradual bend', { size: type.title, color: P.warm }).at(CX, 830);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // opening kettle: boiling, power on; steam runs through the channel to the sensor; gone as the disc grows out of the sensor
  const kA = reveal(t, 0, 0.4) * (1 - ease.inOut(prog(t, c('zoom') + 0.6, 0.9)));
  S.kettle.show(kA).water(KETTLE.waterDefault).boil(t, 1).heat(1).click(1).power(1);
  S.kettle.steamIn.update(t, 0.8);
  S.kettle.steamToSensor.update(t, reveal(t, c('sensor') - 0.2, 0.6));
  S.kettle.sensor.curl(CURL.cold);
  S.sensorTag.show(fadeBetween(t, c('sensor') + 0.2, c('zoom') - 0.4, 0.4));

  // the curl: cold dish (centre lowest), then the slow flattening as the amber layer outgrows the blue one
  const curl = bendCurl(t, c('bend') - 1.2, 10.5, CURL.cold, END_CURL);

  // disc: starts exactly on the kettle's sensor (same size), then grows into the close-up
  const g = ease.inOut(prog(t, c('zoom') + 0.2, 1.8));
  const s0 = (60 * K.s) / DW;
  const dx = lerp(S.sensorAt[0], CX, g), dy = lerp(S.sensorAt[1], CY, g), ds = lerp(s0, 1, g);
  S.disc.curl(curl).show(prog(t, c('zoom'), 0.2)).at(dx, dy, ds);

  // the joint, highlighted on "stuck together"
  const pts = [];
  for (let i = 0; i <= 24; i++) { const x = -DW / 2 + (DW * i) / 24; pts.push(`${x.toFixed(1)} ${(DEPTH * curl * (1 - (2 * x / DW) ** 2)).toFixed(1)}`); }
  set(S.seamLine, { d: `M ${pts.join(' L ')}` });
  S.seam.show(fadeBetween(t, c('stuck'), c('heat'), 0.4)).at(dx, dy, ds);

  // glows: heat from below, warmth spreading over the disc
  const heatA = reveal(t, c('heat'), 0.8) * dimAfter(t, c('gradual'), 0.5);
  S.heatGlow.pulse(t, heatA);
  S.warmGlow.show(0.9 * reveal(t, c('heat') + 0.3, 1.6));

  // stretch arrows: both layers expand, then the amber ones grow longer; they fade as the stretch becomes the bend
  const arrA = reveal(t, c('heat'), 0.5) * (1 - ease.inOut(prog(t, c('heatIn') - 0.6, 0.6)));
  const fast = ease.inOut(prog(t, c('faster') + 0.2, 1.2));
  for (const a of S.arrows) {
    const amber = a.k.startsWith('amp');
    const side = a.k.endsWith('L') ? -1 : 1;
    const x0 = CX + side * (DW / 2 + 26);
    const y0 = CY + (amber ? -LAYER / 2 : LAYER / 2);
    const x1 = x0 + side * (36 + (amber ? 54 * fast : 0));
    set(a.line, { x1: x0.toFixed(1), y1: y0.toFixed(1), x2: x1.toFixed(1), y2: y0.toFixed(1) });
    set(a.tip, { d: `M ${(x1 - side * 18).toFixed(1)} ${(y0 - 14).toFixed(1)} L ${x1.toFixed(1)} ${y0.toFixed(1)} L ${(x1 - side * 18).toFixed(1)} ${(y0 + 14).toFixed(1)}` });
    set(a.g, { opacity: +(arrA * (amber ? 1 : 1 - 0.5 * ease.inOut(prog(t, c('faster'), 0.6)))).toFixed(3) });
  }

  // label slot: one at a time, each fully out before the next is in
  for (const s of S.slot) s.it.show(fadeBetween(t, c(s.from) + 0.1, c(s.to) - 0.45, 0.35));

  // heat -> movement (pushed back once the point arrives)
  const hmDim = dimAfter(t, c('gradual'), 0.35);
  S.heatLbl.show(reveal(t, c('heatIn'), 0.5)).dim(hmDim);
  S.hmArrow.draw(ease.inOut(prog(t, c('heatIn') + 0.3, 0.8)), hmDim);
  S.moveLbl.show(reveal(t, c('movement'), 0.5)).dim(hmDim);

  // the point, then the switch the slow bend can only nudge (the contacts creep open a hair, nowhere near a clean break)
  S.point.show(reveal(t, c('gradual'), 0.7));
  const sw = reveal(t, c('switch') - 0.3, 0.5);
  S.contacts.show(sw).set({ open: 0.12 * ease.inOut(prog(t, c('switch'), 1.4)) });
  S.switchTag.show(sw);
  S.reach.draw(0.7 * ease.inOut(prog(t, c('switch'), 1.2)), 0.7 * sw);
}
