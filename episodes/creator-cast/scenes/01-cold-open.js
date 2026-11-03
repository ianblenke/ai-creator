// 01 - cold open: two flat judges on the left (two AI models), a row of small clips (THE VOICE waveforms), two with a magenta sniff.
// The judges say "yes" over clip after clip, clean or not, every single time; then the judges dim out and the idea holds:
// a listener that always says yes tells you nothing.
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'judge', at: 'I ran two' },
    { name: 'listeners', at: 'as listeners' },
    { name: 'clean', at: 'clean clips' },
    { name: 'sniff', at: 'a sniff added' },
    { name: 'yes', at: 'said yes' },
    { name: 'every', at: 'every single time' },
    { name: 'listener', at: 'A listener that' },
    { name: 'nothing', at: 'tells you nothing' },
    { name: 'video', at: 'This video' },
  ],
};

const JX = 330, JY = 470;                                   // the judge (220 px tall)
const CX = [700, 930, 1160, 1390, 1620], CY = 540;          // five clips in a row
const SNIFF = [1, 3];                                       // clips with a sniff added
const BY = 385;                                             // yes bubbles above the clips
const FINAL_Y = 820;

// THE VOICE: rounded accent bars (12 px on a 24 px pitch) centred on a baseline; returns the bar boxes
function wave(parent, n, hmax, seed, gap = 24, bw = 12) {
  return Array.from({ length: n }, (_, i) => {
    const h = hmax * (0.25 + 0.75 * Math.abs(Math.sin((i + seed) * 1.7) * Math.cos((i + seed) * 0.6)));
    const x = (i - (n - 1) / 2) * gap - bw / 2;
    const r = el(parent, 'rect', { x, y: -h / 2, width: bw, height: h, rx: bw / 2, fill: P.accent });
    return { x, h, r };
  });
}

// A LISTENER / JUDGE (series drawing): dim head r36 over a rounded body 120x146 rx30, 220 px tall
function judge(parent) {
  const it = new Item(parent, 120, 220);
  el(it.g, 'circle', { cx: 0, cy: -74, r: 36, fill: P.dim, 'fill-opacity': 0.25, stroke: P.dim, 'stroke-width': 4 });
  el(it.g, 'rect', { x: -60, y: -36, width: 120, height: 146, rx: 30, fill: P.dim, 'fill-opacity': 0.25, stroke: P.dim, 'stroke-width': 4 });
  return it;
}

// the verdict (series drawing): a bg2 bubble with a dim outline, tail offset left (toward the judges), "yes" in hot
function bubble(parent) {
  const size = 44, w = Math.ceil(measure('yes', size) + 48), h = 72;
  const it = new Item(parent, w, h + 18);
  const tl = -w / 2 + 22;   // tail base starts near the left corner and points down-left
  el(it.g, 'path', { d: `M ${-w / 2 + 18} ${-h / 2} H ${w / 2 - 18} Q ${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 18} V ${h / 2 - 18} Q ${w / 2} ${h / 2} ${w / 2 - 18} ${h / 2} H ${tl + 24} L ${tl - 8} ${h / 2 + 18} L ${tl} ${h / 2} H ${-w / 2 + 18} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 18} V ${-h / 2 + 18} Q ${-w / 2} ${-h / 2} ${-w / 2 + 18} ${-h / 2} Z`, fill: P.bg2, stroke: P.dim, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  el(it.g, 'text', { x: 0, y: size * 0.35, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: P.hot }, 'yes');
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  // one gentle move: a little close at the start, out to wide as the video turns to what comes instead
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 520, z: 1.06 },
    // starts after the judges have faded (they would cross the left edge), and re-centres the clip row under the sentence
    { cue: 'video', delay: 0.7, dur: 1.6, x: 1160, y: 540, z: 1 },
  ], ctx.cue);
  const W = S.stage.world;

  S.judges = [judge(W).at(JX - 80, JY), judge(W).at(JX + 80, JY)];   // two AI models
  S.jLab = label(W, 'listeners', { size: type.label, color: P.dim }).at(JX, 655);

  S.clips = CX.map((x, i) => {
    const it = new Item(W, 200, 130);
    el(it.g, 'rect', { x: -100, y: -65, width: 200, height: 130, rx: 20, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
    const bars = wave(it.g, 7, 86, i * 3);
    if (SNIFF.includes(i)) {
      // THE SNIFF: one small magenta bar out of place, drawn over the waveform's fifth bar
      const b = bars[4];
      it.under = b.r;
      it.sniff = el(it.g, 'rect', { x: b.x - 1, y: -15, width: 14, height: 30, rx: 7, fill: P.hot, stroke: P.bg2, 'stroke-width': 3, opacity: 0 });
    }
    return it.at(x, CY);
  });

  S.bubbles = CX.map((x) => bubble(W).at(x, BY));
  // a thin dim tie from between the judges' heads to each bubble's top, arched above the row so it never crosses another bubble
  S.ties = CX.map((x) => el(W, 'path', { d: `M ${JX} 372 Q ${(JX + x) / 2} 200 ${x} ${BY - 38}`, fill: 'none', stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }));
  S.final = label(S.stage.hud, 'A listener that always says yes tells you nothing', { size: 56, color: P.ink }).at(960, FINAL_Y);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // the judges: in on "I ran two", pushed back while the clips are spoken, back up while they say yes, then dim out
  const jd = lerp(dimAfter(t, c('clean'), 0.55), 1, reveal(t, c('yes'), 0.4));
  const out = 1 - ease.inOut(prog(t, c('video'), 0.6));
  S.judges.forEach((j, i) => j.show(reveal(t, c('judge') + i * 0.25, 0.6) * out).dim(lerp(jd, 0.35, reveal(t, c('nothing'), 0.8))));
  S.jLab.show(reveal(t, c('listeners'), 0.5) * out).dim(dimAfter(t, c('clean'), 0.35));

  // the clips: clean ones on "clean clips", then the sniffs land; pushed back when the listener is the subject
  S.clips.forEach((k, i) => {
    k.show(reveal(t, c('clean') + i * 0.12, 0.5)).dim(dimAfter(t, c('listener'), 0.35));
    if (k.sniff) {
      // the magenta bar replaces the green one instead of covering it
      const s = reveal(t, c('sniff') + (i === 3 ? 0.2 : 0), 0.4);
      set(k.sniff, { opacity: +s.toFixed(3) });
      set(k.under, { opacity: +(1 - s).toFixed(3) });
    }
  });

  // yes, over clip after clip, clean or not; a pulse on "every single time"; out with the judge
  S.bubbles.forEach((b, i) => {
    const at = c('yes') + i * 0.55;
    const pulse = fadeBetween(t, c('every') + i * 0.1, c('every') + i * 0.1 + 0.35, 0.2);
    const pop = ease.back(prog(t, at, 0.35));
    set(S.ties[i], { opacity: +(reveal(t, at, 0.1) * (1 - prog(t, at + 0.1, 0.4))).toFixed(3) });   // the verdict comes from the judges
    b.show(reveal(t, at, 0.25) * out).dim(lerp(1, 0.35, reveal(t, c('nothing'), 0.8))).at(CX[i], BY, lerp(0.85, 1, pop) * (1 + 0.12 * pulse));
  });

  S.final.show(reveal(t, c('nothing'), 0.6));
}
