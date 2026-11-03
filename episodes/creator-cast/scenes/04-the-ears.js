// 04 - the ears: one persistent diagram. The voice waveform (five words) slips twice (a dropped word, an added sound) and a scan
// rings both. Under it the ALIGNER: a ruler with word blocks snapped to it, start/end marks, and pictures lined up on the words.
// Below that the RECOGNIZER: a heard-text strip, a compare mark and the script page. Both sit on a regular processor, with
// license tags (BSD, MIT) and the date stamp. Then the blind spot: an extra magenta sound slips into a word and the strip still
// writes the right word; a sniff in a gap is never written down. Ends wide on "it never hears a sniff".
import { palette as P, font, prog, ease, lerp, el, set } from 'style';
import { type, Item, label, chip, measure, makeStage, paintBackground, makeParticles, reveal, dimAfter, fadeBetween } from 'kit';

export const meta = {
  cues: [
    { name: 'voice', at: 'synthetic voice' },
    { name: 'drop', at: 'dropping a word' },
    { name: 'add', at: 'adding a sound' },
    { name: 'two', at: 'two more models' },
    { name: 'check', at: 'check every recording' },
    { name: 'aligner', at: 'An aligner' },
    { name: 'finds', at: 'finds exactly' },
    { name: 'starts', at: 'starts' },
    { name: 'ends', at: 'ends' },
    { name: 'picture', at: 'every picture' },
    { name: 'recog', at: 'A speech recognizer' },
    { name: 'writes', at: 'writes down' },
    { name: 'compare', at: 'compare that' },
    { name: 'script', at: 'the script' },
    { name: 'proc', at: 'regular processor' },
    { name: 'license', at: 'license pages' },
    { name: 'date', at: 'October twenty-eighth' },
    { name: 'bsd', at: 'BSD' },
    { name: 'mit', at: 'MIT' },
    { name: 'blind', at: 'one blind spot' },
    { name: 'extra', at: 'adds an extra sound' },
    { name: 'right', at: 'the right word' },
    { name: 'sniff', at: 'never hears a sniff' },
  ],
};

// THE VOICE: five words of bars (12 px on a 24 px pitch), a 36 px pause between words
const GROUPS = [6, 9, 5, 8, 7], PITCH = 24, BW = 12, GAP = 36, WY = 290, HMAX = 110;
const BLOCK_Y = 395, RULER_Y = 425, CARD_Y = 150;
const ROW_Y = 620, STRIP_X = 760, STRIP_W = 580, CMP_X = 1110, PAGE_X = 1240;
const CHIP = [1560, 450];
const DROP_G = 1, OPEN_G = 3, BLIND_G = 2, SNIFF_GAP = 3;   // which word drops, which gains a sound, the gap the sniff sits in
const stroke = (color, w = 5) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// bar centres and word spans (world x)
const BARS = [];
GROUPS.forEach((n, g) => { for (let k = 0; k < n; k++) BARS.push({ g, k, n, x: 480 + BARS.length * PITCH + g * GAP }); });
const SPAN = GROUPS.map((_, g) => { const b = BARS.filter((q) => q.g === g); return { l: b[0].x - 10, r: b[b.length - 1].x + 10 }; });
const gapX = (g) => (SPAN[g].r + SPAN[g + 1].l) / 2;

// A LICENSE TAG: the same drawing as scene 03 (rounded rectangle, 4 px ink outline, punched hole)
function tag(parent, text, size = 42) {
  const tw = measure(text, size), w = Math.ceil(tw + 96), h = Math.ceil(size + 30);
  const it = new Item(parent, w, h);
  el(it.g, 'rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: P.bg2, stroke: P.ink, 'stroke-width': 4 });
  el(it.g, 'circle', { cx: -w / 2 + 24, cy: 0, r: 8, fill: 'none', stroke: P.ink, 'stroke-width': 3 });
  el(it.g, 'text', { x: 18, y: size * 0.35, 'text-anchor': 'middle', 'font-family': font.sans, 'font-size': size, 'font-weight': 700, fill: P.ink }, text);
  return it;
}
// THE PROCESSOR: the same drawing as scene 08 (120 px square, inner square, four pins a side)
function cpu(parent) {
  const it = new Item(parent, 156, 156);
  el(it.g, 'rect', { x: -60, y: -60, width: 120, height: 120, rx: 12, fill: P.cool, 'fill-opacity': 0.15, stroke: P.cool, 'stroke-width': 4 });
  el(it.g, 'rect', { x: -26, y: -26, width: 52, height: 52, rx: 6, fill: 'none', stroke: P.cool, 'stroke-width': 4 });
  for (let k = 0; k < 4; k++) {
    const o = -36 + k * 24;
    [[o, -62, o, -76], [o, 62, o, 76], [-62, o, -76, o], [62, o, 76, o]].forEach(([x1, y1, x2, y2]) => el(it.g, 'line', { x1, y1, x2, y2, ...stroke(P.cool, 4) }));
  }
  return it;
}

let S;
export function setup(ctx) {
  S = { parts: makeParticles(ctx.rand(7)) };
  S.stage = makeStage(ctx.svg, [
    { t: -1, dur: 0.01, x: 960, y: 300, z: 1.15 },                 // the voice alone, its baseline near screen y 540
    { cue: 'aligner', dur: 1.4, x: 960, y: 340, z: 1.1 },          // down to the ruler
    { cue: 'recog', dur: 1.4, x: 960, y: 470, z: 1 },              // down to the recognizer row
    { cue: 'proc', dur: 1.4, x: 1000, y: 450, z: 1 },              // over to the processor
    { cue: 'blind', dur: 1.4, x: 960, y: 470, z: 1.04 },           // in on the voice and the heard text
    { cue: 'sniff', delay: 0.3, dur: 1.2, x: 960, y: 450, z: 1 },  // wide for the close
  ], ctx.cue);
  const W = S.stage.world;

  // the waveform
  S.wave = new Item(W);
  S.bars = BARS.map((b, i) => {
    const h = HMAX * (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
    const r = el(S.wave.g, 'rect', { x: b.x - BW / 2, y: WY - h / 2, width: BW, height: h, rx: BW / 2, fill: P.accent });
    return { ...b, h, r };
  });
  // the slips: an added sound (one magenta bar) in a word, and later the extra sound and the sniff
  const hotBar = () => el(S.wave.g, 'rect', { x: -BW / 2, y: WY, width: BW, height: 0, rx: BW / 2, fill: P.hot, opacity: 0 });
  S.openHot = hotBar();
  S.blindHot = hotBar();
  S.sniff = el(S.wave.g, 'rect', { x: gapX(SNIFF_GAP) - BW / 2, y: WY - 16, width: BW, height: 32, rx: BW / 2, fill: P.hot, opacity: 0 });
  // THE CATCH: a scan line, then rings around the dropped word and the added sound
  S.scan = el(W, 'line', { x1: 0, y1: WY - 80, x2: 0, y2: WY + 80, ...stroke(P.accent, 4), opacity: 0 });
  const dc = (SPAN[DROP_G].l + SPAN[DROP_G].r) / 2;
  S.ringDrop = el(W, 'circle', { cx: dc, cy: WY, r: (SPAN[DROP_G].r - SPAN[DROP_G].l) / 2 + 14, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });
  S.ringAdd = el(W, 'circle', { cx: 0, cy: WY, r: 44, fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: 0 });
  S.two = label(W, 'two more models', { size: type.label }).at(960, CARD_Y);
  // THE EARS icon: two single arcs facing out, accent (aligner) and ink (recognizer)
  S.ears = new Item(W);
  const ex = S.two.w / 2 + 40;
  el(S.ears.g, 'path', { d: `M ${960 - ex} ${CARD_Y - 30} Q ${960 - ex - 30} ${CARD_Y} ${960 - ex} ${CARD_Y + 30}`, ...stroke(P.accent, 5) });
  el(S.ears.g, 'path', { d: `M ${960 + ex} ${CARD_Y - 30} Q ${960 + ex + 30} ${CARD_Y} ${960 + ex} ${CARD_Y + 30}`, ...stroke(P.ink, 5) });

  // THE ALIGNER: ruler with ticks, word blocks snapped to it, start/end marks, pictures lined up
  S.alg = new Item(W);
  el(S.alg.g, 'line', { x1: 450, x2: 1470, y1: RULER_Y, y2: RULER_Y, ...stroke(P.accent, 4) });
  for (let x = 450; x <= 1470; x += 30) el(S.alg.g, 'line', { x1: x, x2: x, y1: RULER_Y, y2: RULER_Y + ((x - 450) % 150 ? 10 : 18), ...stroke(P.accent, 3) });
  S.blocks = SPAN.map((s) => el(S.alg.g, 'rect', { x: s.l, y: -17, width: s.r - s.l, height: 34, rx: 12, fill: P.accent, 'fill-opacity': 0.18, stroke: P.accent, 'stroke-width': 3, opacity: 0 }));
  S.mStart = el(S.alg.g, 'line', { x1: SPAN[BLIND_G].l, x2: SPAN[BLIND_G].l, y1: WY - 70, y2: RULER_Y + 18, ...stroke(P.ink, 4), opacity: 0 });
  S.mEnd = el(S.alg.g, 'line', { x1: SPAN[BLIND_G].r, x2: SPAN[BLIND_G].r, y1: WY - 70, y2: RULER_Y + 18, ...stroke(P.ink, 4), opacity: 0 });
  S.cards = SPAN.map((s) => {
    const g = el(S.alg.g, 'g', { opacity: 0 });
    el(g, 'line', { x1: s.l, x2: s.l, y1: CARD_Y + 30, y2: BLOCK_Y - 17, stroke: P.dim, 'stroke-width': 2, 'stroke-dasharray': '6 8' });
    el(g, 'rect', { x: s.l, y: CARD_Y - 27, width: 96, height: 54, rx: 8, fill: P.bg2, stroke: P.ink, 'stroke-width': 3 });
    el(g, 'path', { d: `M ${s.l + 12} ${CARD_Y + 18} L ${s.l + 38} ${CARD_Y - 8} L ${s.l + 56} ${CARD_Y + 10} L ${s.l + 66} ${CARD_Y + 2} L ${s.l + 84} ${CARD_Y + 18} Z`, fill: P.dim });
    return g;
  });
  S.algLab = label(S.alg.g, 'aligner', { size: type.label, color: P.accent }).at(310, 400);


  // THE RECOGNIZER: heard-text strip, compare mark, script page
  S.rec = new Item(W);
  el(S.rec.g, 'rect', { x: STRIP_X - STRIP_W / 2, y: ROW_Y - 36, width: STRIP_W, height: 72, rx: 18, fill: P.bg2, stroke: P.dim, 'stroke-width': 3 });
  // the heard words: one ink bar per spoken word, at half the waveform's scale
  // half the waveform's scale; the words either side of the sniff's gap move apart so an empty marker fits in it
  const sx = (x, g) => STRIP_X + (x - 960) * 0.5 + (g <= SNIFF_GAP ? -20 : 20);
  S.heard = SPAN.map((s, g) => ({ x: sx(s.l, g), w: (s.r - s.l) * 0.5, r: el(S.rec.g, 'rect', { x: sx(s.l, g), y: ROW_Y - 7, width: 0, height: 14, rx: 7, fill: P.ink }) }));
  // nothing is written for the sniff: an empty dim ring in its gap
  S.sniffGap = el(S.rec.g, 'circle', { cx: STRIP_X + (gapX(SNIFF_GAP) - 960) * 0.5, cy: ROW_Y, r: 14, fill: 'none', stroke: P.dim, 'stroke-width': 3, opacity: 0 });
  // the extra sound is not caught (no ring): a thin dim connector shows its word still lands on the strip as a normal word
  const hb = S.heard[BLIND_G];
  S.link = el(W, 'line', { x1: 0, y1: WY + 42, x2: hb.x + hb.w / 2, y2: ROW_Y - 42, stroke: P.dim, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 });
  S.cmp = new Item(S.rec.g, 56, 30);
  S.cmpBars = [-9, 9].map((y) => el(S.cmp.g, 'line', { x1: -24, x2: 24, y1: y, y2: y, ...stroke(P.accent, 6) }));
  S.cmp.at(CMP_X, ROW_Y);
  S.page = new Item(S.rec.g, 100, 130);
  el(S.page.g, 'rect', { x: -50, y: -65, width: 100, height: 130, rx: 12, fill: P.bg2, stroke: P.dim, 'stroke-width': 4 });
  [60, 70, 50, 64].forEach((w, k) => el(S.page.g, 'rect', { x: -34, y: -40 + k * 24, width: w, height: 8, rx: 4, fill: P.ink }));
  S.recLab = label(S.rec.g, 'recognizer', { size: type.label }).at(310, 600);
  // the license tags live outside the groups so the one being named is never dimmed with its group
  S.bsd = tag(W, 'BSD').at(310, 470);
  S.mit = tag(W, 'MIT').at(310, 670);

  // THE PROCESSOR (both checkers run on it), its words, and the date stamp
  S.proc = new Item(W);
  cpu(S.proc.g).at(...CHIP).show(1);
  S.procLab = label(S.proc.g, 'regular processor', { size: type.note, color: P.cool }).at(CHIP[0], 560);
  S.date = chip(W, 'October twenty-eighth', { color: P.accent }).at(CHIP[0], 680);

  S.blindLab = label(W, 'one blind spot', { size: type.note }).at(STRIP_X, ROW_Y + 80);   // under the recognizer's strip
  S.final = label(S.stage.hud, 'it never hears a sniff', { size: type.title }).at(960, 850);
}

export function render(ctx, t) {
  const c = (n) => ctx.cue(n);
  const cam = S.stage.camera(t);
  paintBackground(ctx, t, S.parts, cam);

  // the voice: appears, drops a word, gains a sound; the slips heal when the aligner arrives
  S.wave.show(reveal(t, c('voice'), 0.6));
  const heal = reveal(t, c('check') + 1.9, 0.5);   // the slips fade after the scan, before the aligner (it checks, it does not repair)
  const drop = ease.inOut(prog(t, c('drop'), 0.5)) * (1 - heal);
  const openK = ease.out(prog(t, c('add'), 0.5)) * (1 - heal);
  const blindK = ease.out(prog(t, c('extra'), 0.5));
  S.bars.forEach((b) => {
    let x = b.x, h = b.h;
    if (b.g === DROP_G) h = lerp(b.h, 10, drop);
    const split = (g, k) => { if (b.g === g) x += (b.k < Math.floor(b.n / 2) ? -12 : 12) * k; };
    split(OPEN_G, openK);
    split(BLIND_G, blindK);
    set(b.r, { x: (x - BW / 2).toFixed(2), y: (WY - h / 2).toFixed(2), height: h.toFixed(2) });
  });
  const midX = (g) => { const b = S.bars.filter((q) => q.g === g); const m = Math.floor(b.length / 2); return (b[m - 1].x + b[m].x) / 2; };
  const hot = (r, g, k, h) => set(r, { x: (midX(g) - BW / 2).toFixed(2), y: (WY - (h * k) / 2).toFixed(2), height: (h * k).toFixed(2), opacity: +Math.min(1, k * 3).toFixed(3) });
  hot(S.openHot, OPEN_G, openK, 64);
  hot(S.blindHot, BLIND_G, blindK, 64);
  set(S.sniff, { opacity: +reveal(t, c('sniff') + 0.45, 0.3).toFixed(3) });   // on 'sniff', not 'never'
  const mx = midX(BLIND_G).toFixed(1);
  set(S.link, { x1: mx, opacity: +(reveal(t, c('right'), 0.4) * 0.8).toFixed(3) });

  // two more models check every recording: label, then one scan that rings each slip as it passes
  S.two.show(fadeBetween(t, c('two'), c('aligner')));
  S.ears.show(fadeBetween(t, c('two'), c('aligner')));
  const sc = prog(t, c('check'), 1.6);
  const scx = lerp(450, 1470, sc);   // constant speed, so each ring closes as the line crosses it
  set(S.scan, { x1: scx.toFixed(1), x2: scx.toFixed(1), opacity: +(sc > 0 && sc < 1 ? Math.min(1, sc * 8, (1 - sc) * 8) : 0).toFixed(3) });
  const ringAt = (x) => c('check') + 1.6 * ((x - 450) / 1020);   // roughly when the scan reaches x
  const dc = (SPAN[DROP_G].l + SPAN[DROP_G].r) / 2;
  set(S.ringDrop, { opacity: +(reveal(t, ringAt(dc), 0.3) * (1 - heal)).toFixed(3) });
  set(S.ringAdd, { cx: midX(OPEN_G).toFixed(1), opacity: +(reveal(t, ringAt(midX(OPEN_G)), 0.3) * (1 - heal)).toFixed(3) });

  // the aligner: ruler, blocks drop and snap, start and end marks, pictures line up on the words
  S.alg.show(reveal(t, c('aligner'), 0.6));
  S.algLab.show(1);
  S.blocks.forEach((b, i) => {
    const k = ease.out(prog(t, c('finds') + i * 0.2, 0.5));
    set(b, { y: (lerp(WY, BLOCK_Y, k) - 17).toFixed(2), opacity: +Math.min(1, k * 2).toFixed(3), 'fill-opacity': i === BLIND_G ? +lerp(0.18, 0.45, fadeBetween(t, c('starts'), c('picture'))).toFixed(3) : 0.18 });
  });
  set(S.mStart, { opacity: +fadeBetween(t, c('starts'), c('picture')).toFixed(3) });
  set(S.mEnd, { opacity: +fadeBetween(t, c('ends'), c('picture')).toFixed(3) });
  S.cards.forEach((g, i) => set(g, { opacity: +reveal(t, c('picture') + i * 0.15, 0.5).toFixed(3) }));

  // the recognizer: writes down what it hears (bars type in), compares, against the script
  S.rec.show(reveal(t, c('recog'), 0.6));
  S.recLab.show(1);
  S.heard.forEach((h, i) => {
    const k = ease.out(prog(t, c('writes') + i * 0.3, 0.4));
    // 'still writes the right word': the third heard word lifts briefly, still ink
    const lift = i === BLIND_G ? 1 + 0.25 * fadeBetween(t, c('right'), c('right') + 0.8, 0.3) : 1;
    const w = h.w * k * lift, hh = 14 * lift;
    set(h.r, { x: (h.x + (h.w - h.w * lift) / 2).toFixed(2), width: w.toFixed(2), y: (ROW_Y - hh / 2).toFixed(2), height: hh.toFixed(2) });
  });
  const cmpK = reveal(t, c('compare'), 0.5);
  S.cmp.show(cmpK).at(CMP_X, ROW_Y);
  const pk = reveal(t, c('script'), 0.5);
  S.page.show(pk).at(lerp(PAGE_X + 30, PAGE_X, pk), ROW_Y);
  set(S.sniffGap, { opacity: +reveal(t, c('sniff') + 0.6, 0.4).toFixed(3) });

  // both run on a regular processor; license tags fill in; the date stamp
  S.proc.show(reveal(t, c('proc'), 0.6));
  S.procLab.show(1);
  // the date stamp fades out on the blind spot (it has had its beat), which also keeps the zoom clear of the right edge
  S.date.show(fadeBetween(t, c('date'), c('blind') - 0.8, 0.6));
  S.bsd.show(reveal(t, c('bsd'), 0.4)).dim(Math.min(dimAfter(t, c('mit'), 0.6), dimAfter(t, c('blind'), 0.35)));
  S.mit.show(reveal(t, c('mit'), 0.4)).dim(dimAfter(t, c('blind'), 0.35));

  // spotlight: what is being spoken is bright, earlier parts drop back to about 0.35
  const fin = reveal(t, c('sniff') + 0.3, 0.6);
  const blind = reveal(t, c('blind'), 0.6);
  const algD = lerp(1, 0.35, reveal(t, c('recog'), 0.6)) + 0.4 * fadeBetween(t, c('bsd'), c('mit'));
  S.alg.dim(Math.min(1, algD) * lerp(1, 0.6, fin));
  const recD = 1 - 0.4 * fadeBetween(t, c('proc'), c('mit'));
  S.rec.dim(recD * lerp(1, 0.6, fin));
  S.proc.dim(dimAfter(t, c('blind'), 0.35));
  S.wave.dim(lerp(1, 0.6, fadeBetween(t, c('recog') + 1.5, c('blind'))) * lerp(1, 0.7, fin));
  S.blindLab.show(fadeBetween(t, c('blind'), c('sniff') - 0.3) * blind);   // fully gone before the closing phrase fades in
  S.final.show(fin);
}
