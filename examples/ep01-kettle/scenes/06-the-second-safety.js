// Scene 06: the second safety. The shared kettle runs dry (no boil, no steam, the sensor never flips). The camera widens to a
// large close-up of the element beside the kettle: the violet guard disc pressed under it bends as the element overheats, flips in
// one 0.15 s move, its contacts spring open and the power goes OFF (and stays OFF on the kettle). The fainter backup appears to its
// right. On "which acts only if the guard itself fails" the panel replays the run as a what-if (dashed border, its own power circle,
// shown ON from the start of the replay): the guard's contacts weld shut, so its flip opens nothing, power stays ON and the element
// keeps heating, until the backup reaches its higher temperature, flips and cuts the power. Kettle parts come only from ./_kettle.js.
import { palette as P, prog, ease, lerp, clamp, el, set } from 'style';
import { type, label, glow, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween, fitSize } from 'kit';
import { kettle, guardDisc, contacts, powerLight, KETTLE, CURL, FLIP_DUR, bendCurl, flipCurl } from './_kettle.js';

export const meta = {
  cues: [
    { name: 'problem', at: 'a problem' },
    { name: 'noWater', at: 'with no water' },
    { name: 'noBoil', at: 'is no boil' },
    { name: 'noSteam', at: 'no steam' },
    { name: 'disc', at: 'flip the disc' },
    { name: 'separate', at: 'A separate part' },
    { name: 'guard', at: 'second small disc' },
    { name: 'pressed', at: 'pressed against' },
    { name: 'element', at: 'heating element' },
    { name: 'hot', at: 'too hot' },
    { name: 'trips', at: 'disc trips' },
    { name: 'power', at: 'cuts the power' },
    { name: 'backup', at: 'further backup' },
    { name: 'higher', at: 'higher temperature' },
    { name: 'which', at: 'which acts' },
    { name: 'fails', at: 'if the guard itself fails' },
    { name: 'contacts', at: 'its contacts' },
    { name: 'weld', at: 'contacts weld' },
    { name: 'shut', at: 'shut' },
  ],
};

// world layout (after the glide, world = screen)
const KX = 420, KY = 560, KS = 0.9;                     // the kettle, left
const PX0 = 760, PX1 = 1790, PY0 = 200, PY1 = 830;      // the close-up panel, right
const PCX = (PX0 + PX1) / 2;
const COIL_Y = 360, PLATE = [800, 392, 950, 34];        // big coil and the element plate under it (x, y, w, h)
const GX = 1060, BX = 1490, DW = 340, DD = 37;          // guard and backup centres, disc width (>= 300 px) and depth
const DY = PLATE[1] + PLATE[3] + DW * 0.045;            // rims of the cold dish touch the plate's underside
const CY = 610, CW = 220, TAG_Y = 724, SLOT = [PCX, 262]; // contacts row and width, disc tags, the caption slot above the coil
const PWR = [1706, 610];                                 // the what-if power circle, right of the backup's contacts

const zig = (x0, x1, y, amp, n) => {
  let d = `M ${x0} ${y}`;
  for (let i = 1; i <= n; i++) d += ` L ${lerp(x0, x1, i / n).toFixed(1)} ${i === n ? y : y + (i % 2 ? -amp : amp)}`;
  return d;
};
// how far a disc's contacts are open, from its curl: closed until the trip point, fully open once flipped
const openOf = (k) => clamp((CURL.trip - k) / (CURL.trip - CURL.flipped));

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: 0, dur: 0.01, x: KX, y: KY - 20, z: 1.15 },
    { cue: 'separate', delay: 0, dur: 1.0, x: 960, y: 540, z: 1 },
  ], ctx.cue);
  const W = stage.world;
  S = { stage, parts: makeParticles(ctx.rand(7)) };

  // the kettle (shared drawing) with a glow on its coil and a glow that marks the sensor
  S.kGlow = glow(W, { rx: 130, ry: 40, color: P.hot, strength: 0.5 });
  S.k = kettle(W).at(KX, KY, KS).show(1);
  const [ex, ey] = S.k.toWorld(KETTLE.element);
  S.kGlow.at(ex, ey);
  S.sensorGlow = glow(W, { r: 64, color: P.warm, strength: 0.5 }).at(...S.k.toWorld(KETTLE.sensor));
  S.k.click(1);

  // the lens on the kettle's element and the panel it opens into (dashed border = the what-if replay)
  S.lensG = el(W, 'g', { opacity: 0 });
  el(S.lensG, 'circle', { cx: ex, cy: ey + 12, r: 90, fill: 'none', stroke: P.violet, 'stroke-width': 4, 'stroke-dasharray': '12 9' });
  el(S.lensG, 'line', { x1: ex + 90, y1: ey + 12, x2: PX0, y2: ey + 12, stroke: P.violet, 'stroke-width': 3, 'stroke-dasharray': '12 9', opacity: 0.6 });
  S.panelG = el(W, 'g', { opacity: 0 });
  S.panel = el(S.panelG, 'rect', { x: PX0, y: PY0, width: PX1 - PX0, height: PY1 - PY0, rx: 28, fill: P.bg2, 'fill-opacity': 0.7, stroke: P.dim, 'stroke-width': 3 });

  // inside the panel (one group, so the what-if swap can dip it): glows, coil, discs, plate above them, links, contacts, tags
  S.inG = el(W, 'g', { opacity: 0 });
  const I = S.inG;
  S.pGlow = glow(I, { rx: 460, ry: 90, color: P.hot, strength: 0.5 }).at(PCX, COIL_Y + 30);
  S.gGlow = glow(I, { r: 190, color: P.violet, strength: 0.45 }).at(GX, DY + 20);
  S.bGlow = glow(I, { r: 190, color: P.violet, strength: 0.4 }).at(BX, DY + 20);
  S.wGlow = glow(I, { r: 100, color: P.hot, strength: 0.55 }).at(GX, CY);
  S.coil = el(I, 'path', { d: zig(830, 1720, COIL_Y, 24, 18), fill: 'none', stroke: P.dim, 'stroke-width': 10, 'stroke-linejoin': 'round' });
  S.coilHot = el(I, 'path', { d: zig(830, 1720, COIL_Y, 24, 18), fill: 'none', stroke: P.hot, 'stroke-width': 11, 'stroke-linejoin': 'round', opacity: 0 });
  S.guard = guardDisc(I, { w: DW, depth: DD }).at(GX, DY).show(0);
  S.backup = guardDisc(I, { w: DW, depth: DD, faint: true }).at(BX, DY).show(0);
  el(I, 'rect', { x: PLATE[0], y: PLATE[1], width: PLATE[2], height: PLATE[3], rx: 10, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 }); // above the discs: a flipped centre tucks behind it
  S.plateHot = el(I, 'rect', { x: PLATE[0], y: PLATE[1], width: PLATE[2], height: PLATE[3], rx: 10, fill: 'none', stroke: P.hot, 'stroke-width': 6, opacity: 0 });
  const link = (x) => el(I, 'line', { x1: x, y1: DY + DD + 26, x2: x, y2: CY - 50, stroke: P.violet, 'stroke-width': 5, 'stroke-dasharray': '10 8', opacity: 0 });
  S.gLink = link(GX); S.bLink = link(BX);
  S.gC = contacts(I, { w: CW }).at(GX, CY).show(0);
  S.bC = contacts(I, { w: CW }).at(BX, CY).show(0);
  S.pwr = powerLight(I, { r: 30 }).at(...PWR).show(0);
  S.gTag = label(I, 'second small disc', { size: 44, color: P.violet }).at(GX, TAG_Y);
  S.bTag = label(I, 'backup', { size: 44, color: P.violet }).at(BX, TAG_Y);

  // one caption slot above the coil that shows one phrase at a time (outside the dipping group)
  const cap = (text, color) => label(W, text, { size: fitSize(text, PX1 - PX0 - 80, type.label), color }).at(...SLOT);
  S.caps = [
    ['separate', 'element', cap('a separate part', P.violet)],
    ['element', 'hot', cap('heating element', P.hot)],
    ['hot', 'power', cap('too hot', P.hot)],
    ['power', 'backup', cap('cuts the power', P.ink)],
    ['backup', 'higher', cap('a further backup', P.violet)],
    ['higher', 'which', cap('higher temperature', P.hot)],
    ['fails', 'contacts', cap('if the guard itself fails', P.violet)],
    ['contacts', 0.4, cap('contacts weld shut', P.hot)], // a number = seconds after "shut"
  ];

  // the opening words beside the kettle (hud, gone before the panel opens), and the closing phrase across the top
  const H = stage.hud;
  S.dry = [['noWater', 'no water', P.cool, 380], ['noBoil', 'no boil', P.cool, 480], ['noSteam', 'no steam', P.ink, 580]]
    .map(([cue, text, color, y]) => [cue, label(H, text, { size: type.label, color }).at(1600, y)]);
  S.final = label(H, 'a separate part guards against that', { size: 64, color: P.ink }).at(960, 120);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);
  const k = S.k;

  // running dry: the water drains, the boil and the steam stop with it; the sensor never gets steam, so it stays a cold dish
  const drain = ease.inOut(prog(t, c('problem'), 1.3));
  const steamA = 1 - drain;
  k.water(KETTLE.waterDefault * (1 - drain)).boil(t, 1 - drain);
  k.steamOut.update(t, steamA);
  k.steamIn.update(t, 0.6 * steamA);
  k.sensor.curl(CURL.cold);
  S.sensorGlow.pulse(t, fadeBetween(t, c('disc'), c('separate')));

  // REAL run: the guard bends as the dry element overheats, flips on "trips", its contacts open and the power goes OFF for good
  const gReal = t < c('trips') ? bendCurl(t, c('hot'), c('trips') - c('hot')) : flipCurl(t, c('trips'));
  k.power(1 - openOf(gReal));
  const lvl = lerp(0.55, 1, reveal(t, c('hot'), 0.8));
  const heatReal = lvl * (1 - ease.inOut(prog(t, c('trips') + FLIP_DUR, 1.2)));
  k.heat(heatReal);
  S.kGlow.pulse(t, heatReal);

  // WHAT-IF replay, swapped in while the panel content dips (0.3 s out, 0.3 s in) on "which acts"
  const swap = c('which') + 0.3;
  const what = t >= swap;
  const dip = what ? ease.inOut(prog(t, swap, 0.3)) : 1 - ease.inOut(prog(t, c('which'), 0.3));
  const weldT = c('weld'), bAt = c('shut') + 0.25;      // the guard flips on "weld" but its contacts hold; the backup trips after "shut"
  const weld = what ? reveal(t, c('contacts'), 0.3) : 0;
  const g = what ? (t < weldT ? bendCurl(t, swap, weldT - swap) : flipCurl(t, weldT)) : gReal;
  const b = what ? (t < bAt ? bendCurl(t, swap, bAt - swap) : flipCurl(t, bAt)) : CURL.cold;
  const gOpen = openOf(g) * (1 - weld), bOpen = openOf(b);
  const heat = what ? 1 - ease.inOut(prog(t, bAt + FLIP_DUR, 0.5)) : heatReal;

  // the kettle's own guard and backup show the real state; the kettle steps back for the replay and returns for the closing phrase
  const gShow = reveal(t, c('guard'), 0.5), bShow = reveal(t, c('backup'), 0.6);
  k.guard.show(gShow).curl(gReal);
  k.backup.show(bShow).curl(CURL.cold);
  const fin = reveal(t, c('shut') + 0.45, 0.5);
  k.dim(lerp(lerp(lerp(1, 0.55, ease.inOut(prog(t, c('separate'), 1.2))), 0.35, reveal(t, c('which'), 0.5)), 1, fin));

  // the lens and the panel open after the glide, so nothing is cut by the frame edge
  const open = reveal(t, c('separate') + 0.8, 0.6);
  set(S.lensG, { opacity: +open.toFixed(3) });
  set(S.panelG, { opacity: +open.toFixed(3) });
  set(S.panel, { 'stroke-dasharray': what ? '22 14' : 'none', stroke: what ? P.violet : P.dim });
  set(S.inG, { opacity: +(open * dip).toFixed(3) });
  set(S.coilHot, { opacity: +heat.toFixed(3), 'stroke-width': (t > c('element') && t < c('hot') + 0.8) || (what && t > weldT && t < bAt) ? 15 : 11 });
  S.pGlow.pulse(t, heat * (what ? 1 : lerp(0.4, 1, reveal(t, c('hot'), 0.8))));
  // "pressed against": the plate lights violet where the rims touch; otherwise it glows with the heat
  set(S.plateHot, { stroke: t > c('pressed') && t < c('element') ? P.violet : P.hot, opacity: +Math.max(heat * (what ? 1 : lerp(0.4, 1, reveal(t, c('hot'), 0.8))), fadeBetween(t, c('pressed'), c('element') - 0.2, 0.3)).toFixed(3) });

  // discs, contacts and links; spotlight: the guard while introduced and tripping, the backup after "further backup", both in the replay
  const gDim = what ? 1 : dimAfter(t, c('backup'), 0.45);
  const bDim = what ? 1 : lerp(0.6, 1, fadeBetween(t, c('backup'), c('which') - 0.2));
  S.guard.show(gShow).dim(gDim).curl(g);
  S.backup.show(bShow).dim(bDim).curl(b);
  S.gC.show(gShow).dim(gDim).set({ open: openOf(g), weld });
  S.bC.show(bShow).dim(bDim).set({ open: bOpen });
  set(S.gLink, { opacity: +(0.8 * gShow * gDim).toFixed(3) });
  set(S.bLink, { opacity: +(0.8 * bShow * bDim).toFixed(3) });
  S.gGlow.pulse(t, fadeBetween(t, c('guard'), c('element')) + fadeBetween(t, c('trips'), c('power') + 1) + (what ? fadeBetween(t, weldT, bAt) : 0));
  S.bGlow.pulse(t, fadeBetween(t, c('backup'), c('higher') + 1) + (what ? fadeBetween(t, bAt - 0.3, bAt + 2) : 0));
  S.wGlow.pulse(t, what ? weld * (1 - reveal(t, bAt + 0.6, 0.5)) : 0);
  // the replay's own power: shown ON with the replay (the welded guard cannot open it), OFF when the backup's contacts open
  S.pwr.show(what ? 1 : 0).set(1 - Math.max(gOpen, bOpen));
  S.gTag.show(gShow).dim(what ? 1 : dimAfter(t, c('element'), 0.6));
  S.bTag.show(bShow).dim(bDim);

  // the caption slot: each phrase fades fully out before the next fades in
  for (const [a, z, it] of S.caps) it.show(reveal(t, c(a) + (a === 'separate' ? 0.8 : 0), 0.4) * (1 - prog(t, (typeof z === 'number' ? c('shut') + z : c(z)) - 0.35, 0.3)));

  // opening words, gone before the panel opens
  const gone = 1 - prog(t, c('separate'), 0.4);
  S.dry.forEach(([cue, it], i) => it.show(reveal(t, c(cue), 0.4) * gone).dim(i < 2 ? dimAfter(t, c(S.dry[i + 1][0]), 0.4) : 1));

  // closing phrase, held through the tail, with the empty kettle bright again as its referent
  S.final.show(fin);
}
