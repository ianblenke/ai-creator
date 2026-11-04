// Scene 10: the close. The route of the part as four small stones in spoken order (ear, bridge, critic, flow review),
// lit as named, then dimmed together and kept at 0.35 as the wide recap; a cloned-voice waveform and an open question
// that clear for the next part's title with an arrow.
import { palette as P, prog, ease, lerp, el, set } from 'style';
import { type, label, chip, arrow, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, Item } from 'kit';

export const meta = {
  cues: [
    { name: 'whole', at: 'the whole routine' },
    { name: 'ear', at: 'write for the ear' },
    { name: 'earw', at: 'the ear' },
    { name: 'bridge', at: 'bridge every change' },
    { name: 'two', at: 'two reviewers' },
    { name: 'attacks', at: 'one that attacks' },
    { name: 'listens', at: 'one that listens' },
    { name: 'end', at: 'the end of this part' },
    { name: 'voice', at: 'cloned voice' },
    { name: 'know', at: 'need to know' },
    { name: 'allowed', at: 'allowed to' },
    { name: 'next', at: 'That is the next part' },
    { name: 'law', at: 'the law and the licence' },
  ],
};

const KEYS = ['mine', 'bridge', 'critic', 'flow'];
const XS = { mine: 480, bridge: 800, critic: 1120, flow: 1440 };
const WORDS = { mine: 'ear', bridge: 'bridge', critic: 'attacks', flow: 'listens' };
const LCUE = { mine: 'earw', bridge: 'bridge', critic: 'attacks', flow: 'listens' }; // each label appears on its word
const ROW_Y = 470, SIDE = 220;
const T1 = 'the next part:', T2 = 'the law and the licence';
const FLOOR = 0.35;

/** A stepping stone: a rounded square with a dim outline and an accent outline that lights while it is the focus. */
function stone(parent) {
  const it = new Item(parent, SIDE, SIDE);
  el(it.g, 'rect', { x: -SIDE / 2, y: -SIDE / 2, width: SIDE, height: SIDE, rx: 36, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  it.lit = el(it.g, 'rect', { x: -SIDE / 2, y: -SIDE / 2, width: SIDE, height: SIDE, rx: 36, fill: 'none', stroke: P.accent, 'stroke-width': 6, opacity: 0 });
  it.icon = el(it.g, 'g');
  return it;
}

/** THE FIGURE (canon, scene 08's proportions): circle head over a flat-topped, square-shouldered body, two ear arcs,
 *  drawn at scale `k` around (x, y). Returns the scaled group and an accent ear overlay (opacity 0) to light. */
function figure(g, x, y, k, color = P.dim) {
  const f = el(g, 'g', { transform: `translate(${x} ${y}) scale(${k})` });
  el(f, 'path', { d: 'M -62 110 L -62 0 Q -62 -34 -28 -34 L 28 -34 Q 62 -34 62 0 L 62 110 Z', fill: P.bg2, stroke: color, 'stroke-width': 7 });
  el(f, 'circle', { cx: 0, cy: -76, r: 34, fill: P.bg2, stroke: color, 'stroke-width': 7 });
  const ear = (c, o) => el(f, 'path', { d: 'M -40 -90 Q -54 -76 -40 -62 M 40 -90 Q 54 -76 40 -62', fill: 'none', stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: o });
  ear(P.dim, 1);
  return { f, ears: ear(P.accent, 0) };
}
/** The reviewer's magnifier (canon, scene 08): held at the front of the body on the figure's right, ring near head height. */
function magnifier(f) {
  el(f, 'line', { x1: 74, y1: 24, x2: 54, y2: 48, stroke: P.ink, 'stroke-width': 9, 'stroke-linecap': 'round' });
  el(f, 'circle', { cx: 90, cy: 6, r: 24, fill: P.bg, 'fill-opacity': 0.5, stroke: P.ink, 'stroke-width': 7 });
}
const K = 0.6; // icon scale: the figure is about 130 px tall inside a 220 px stone

let S;
export function setup(ctx) {
  const stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 500, z: 1.06 }, // start a little close
    { cue: 'end', delay: 0, dur: 3.2, x: 960, y: 540, z: 1 }, // a slow glide out to wide across the pause after "end of this part"
  ], ctx.cue);
  const W = stage.world;
  S = { parts: makeParticles(ctx.rand(7)), stage, st: {}, lbl: {} };

  for (const k of KEYS) {
    S.st[k] = stone(W).at(XS[k], ROW_Y);
    S.lbl[k] = label(W, WORDS[k], { size: type.label }).at(XS[k], 640);
  }

  // ear: a plain listener, no pencil; its ears light while "write for the ear" is the focus
  S.mineEars = figure(S.st.mine.icon, 0, 0, K).ears;

  // bridge: two topic blocks with a flat lit plank across the gap (the scene 04 form)
  const b = S.st.bridge.icon;
  el(b, 'rect', { x: -88, y: -40, width: 64, height: 84, rx: 12, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  el(b, 'rect', { x: 24, y: -40, width: 64, height: 84, rx: 12, fill: 'none', stroke: P.dim, 'stroke-width': 4 });
  el(b, 'rect', { x: -46, y: -6, width: 92, height: 22, rx: 8, fill: P.accent });

  // the critic: figure with a magnifier; ears stay dim (it attacks, it does not listen); at "attacks" the lens rings hot
  const cf = figure(S.st.critic.icon, -16, 0, K).f;
  magnifier(cf);
  S.claim = el(cf, 'rect', { x: 70, y: 0, width: 40, height: 12, rx: 6, fill: P.ink, opacity: 0 });
  S.critRing = el(cf, 'circle', { cx: 90, cy: 6, r: 24, fill: 'none', stroke: P.hot, 'stroke-width': 9, opacity: 0 });

  // the flow review: a listener with a magnifier; its ears glow faintly at "two reviewers" and fully at "listens"
  const ff = figure(S.st.flow.icon, -16, 0, K);
  magnifier(ff.f);
  S.flowEars = ff.ears;

  // the next part's question: a cloned voice, and whether it is allowed
  S.wave = new Item(W, 9 * 34, 70);
  S.bars = [0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75, 0.35, 0.6].map((h, i) => ({ h, r: el(S.wave.g, 'rect', { x: -136 + i * 34 - 6, width: 12, rx: 6, fill: P.ink }) })); // ink, not accent: the question is still open
  S.allowed = chip(W, 'allowed?', { size: type.label, color: P.dim, dashed: true }).at(1160, 750);

  // the title, in two parts that fade in as spoken, and its unlabeled arrow, centred together as one line
  const w1 = measure(T1, 64), sp = measure(' ', 64), w2 = measure(T2, 64), gap = 40, aw = 160;
  const x0 = 960 - (w1 + sp + w2 + gap + aw) / 2;
  S.t1 = label(W, T1, { size: 64 }).at(x0 + w1 / 2, 840);
  S.t2 = label(W, T2, { size: 64 }).at(x0 + w1 + sp + w2 / 2, 840);
  const ax = x0 + w1 + sp + w2 + gap;
  S.arrow = arrow(W, ax, 840, ax + aw, 840, { color: P.accent });
}

export function render(ctx, t) {
  const c = ctx.cue;
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  const up = (a) => ease.inOut(prog(t, a, 0.5));
  const down = (a) => ease.inOut(prog(t, a, 0.6));
  // focus 0..1 per stone: rises when named, falls when the next idea takes over; everything falls at "end"
  const fc = {
    mine: up(c('ear')) * (1 - down(c('bridge'))),
    bridge: up(c('bridge')) * (1 - down(c('two'))),
    critic: up(c('two')) * (1 - down(c('listens'))),
    // the flow stone's "two" highlight is fully gone by "attacks", so nothing unspoken stays marked
    flow: Math.max(up(c('two')) * (1 - ease.inOut(prog(t, c('attacks') - 0.35, 0.35))), up(c('listens'))) * (1 - down(c('end'))),
  };
  for (const k of KEYS) {
    const s = S.st[k];
    s.show(reveal(t, c('whole'))).dim(lerp(FLOOR, 1, fc[k]));
    set(s.lit, { opacity: +fc[k].toFixed(3) });
    S.lbl[k].show(reveal(t, c(LCUE[k]))).dim(lerp(FLOOR, 1, fc[k]));
  }
  const atk = reveal(t, c('attacks'), 0.4) * (1 - ease.in(prog(t, c('listens'), 0.4)));
  set(S.critRing, { opacity: +atk.toFixed(3) });
  set(S.claim, { opacity: +atk.toFixed(3) });
  const earsOn = Math.max(0.45 * fc.flow, reveal(t, c('listens'), 0.4)) * (1 - ease.in(prog(t, c('end'), 0.5)));
  set(S.flowEars, { opacity: +earsOn.toFixed(3) });
  set(S.mineEars, { opacity: +fc.mine.toFixed(3) });

  // the waveform: centred when it appears, settles still and glides left on "need to know" to make room for the question;
  // both clear completely for the title, leaving the dimmed route above the end phrase
  const live = 1 - ease.inOut(prog(t, c('know'), 0.6));
  S.bars.forEach(({ h, r }, i) => {
    const hh = h * (1 + 0.22 * live * Math.sin(t * 5.2 + i * 1.3));
    set(r, { y: (-35 * hh).toFixed(2), height: (70 * hh).toFixed(2) });
  });
  const qOut = 1 - ease.inOut(prog(t, c('next'), 0.35));
  S.wave.at(lerp(960, 780, ease.inOut(prog(t, c('know'), 1.2))), 750).show(reveal(t, c('voice')) * qOut);
  S.allowed.show(reveal(t, c('allowed')) * qOut);

  S.t1.show(reveal(t, c('next') + 0.35));
  S.t2.show(reveal(t, c('law') - 0.1));
  S.arrow.draw(ease.out(prog(t, c('law'), 0.8)), reveal(t, c('law'), 0.3));
}
