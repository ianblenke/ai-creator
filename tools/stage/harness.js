// Browser-side harness. Scenes are pure functions of time: window.__setTime(t) draws the frame for scene-local t.
import { W, H, palette, rng } from 'style';

const stage = document.getElementById('stage');
const svg = document.getElementById('svg');
const c2dCanvas = document.getElementById('c2d');
const glCanvas = document.getElementById('gl');
// CPU-backed 2D canvas. Chrome's GPU-accelerated canvas can present a stale texture, which shows up as ghost copies of moving
// elements that never appear in a fresh render. willReadFrequently forces the software canvas and makes frames history-free.
const c2d = c2dCanvas.getContext('2d', { willReadFrequently: true });
// An unused (transparent) WebGL canvas under the opaque 2D canvas changes how Chrome composites the layers and leaves stale ghosts of
// moving SVG elements. Keep it out of the page unless a scene actually uses Three.js.
glCanvas.style.display = 'none';

const canvasTexts = new Set();
for (const fn of ['fillText', 'strokeText']) {
  const orig = CanvasRenderingContext2D.prototype[fn];
  CanvasRenderingContext2D.prototype[fn] = function (text, ...rest) { canvasTexts.add(String(text)); return orig.call(this, text, ...rest); };
}

// make sure the vendored fonts are loaded before any frame is drawn
await Promise.all(['400','500','700'].flatMap((w) => ['Media Sans', 'Media Mono'].map((f) => document.fonts.load(`${w} 24px "${f}"`))));

let tl = null;
let mod = null;
let sceneInfo = null;
let ctx = null;
let threeState = null;

async function three() {
  if (threeState) return threeState;
  glCanvas.style.display = '';
  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
  renderer.setSize(W, H, false);
  threeState = { THREE, renderer };
  return threeState;
}

function cueTime(name) {
  const cue = (mod.meta?.cues ?? []).find((c) => c.name === name);
  if (!cue) throw new Error(`unknown cue ${name}`);
  return cue.time;
}

window.__init = async (timeline) => { tl = timeline; };

window.__load = async (sceneId) => {
  if (!tl) tl = await (await fetch('/timeline.json')).json();
  sceneInfo = tl.scenes.find((s) => s.id === sceneId);
  if (!sceneInfo) throw new Error(`scene ${sceneId} not in timeline`);
  svg.replaceChildren();
  // nothing may leak from a previous scene: canvas state (paths, transforms, dash, alpha) and any DOM a scene added
  c2d.reset();
  for (const n of [...stage.children]) if (n !== svg && n !== c2dCanvas && n !== glCanvas) n.remove();
  canvasTexts.clear();
  mod = await import(`/scene/${sceneId}.js`);
  // resolve cue anchors to scene-local seconds
  const { resolveAnchorLocal } = await import('/stage/anchors.js');
  for (const c of mod.meta?.cues ?? []) c.time = resolveAnchorLocal(sceneInfo, c.at);
  ctx = { width: W, height: H, svg, c2d, palette, rand: rng, three, cue: cueTime, duration: sceneInfo.duration, scene: sceneInfo, root: stage };
  if (mod.setup) await mod.setup(ctx, tl);
  return { duration: sceneInfo.duration, cues: (mod.meta?.cues ?? []).map((c) => ({ name: c.name, time: c.time })) };
};

window.__setTime = async (t) => {
  c2d.reset(); // default state every frame: output depends only on t, never on earlier frames
  await mod.render(ctx, t, tl);
  await document.fonts.ready;
  // let two frames commit before the screenshot
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
};

window.__texts = () => {
  const out = new Set(canvasTexts);
  svg.querySelectorAll('text').forEach((n) => n.textContent.trim() && out.add(n.textContent.trim()));
  stage.querySelectorAll('div,span,p,h1,h2,h3').forEach((n) => { if (n.children.length === 0 && n.textContent.trim()) out.add(n.textContent.trim()); });
  return [...out];
};

// optional scrub UI: /stage/harness.html?ui=1&scene=ID
const params = new URLSearchParams(location.search);
if (params.get('ui')) {
  const ui = document.getElementById('ui');
  ui.style.display = 'block';
  tl = await (await fetch('/timeline.json')).json();
  const sel = document.getElementById('scene');
  tl.scenes.forEach((s) => sel.add(new Option(s.id, s.id)));
  sel.value = params.get('scene') || tl.scenes[0].id;
  const slider = document.getElementById('slider');
  const tt = document.getElementById('tt');
  const go = async () => { const info = await window.__load(sel.value); slider.max = info.duration; await window.__setTime(+slider.value); };
  sel.onchange = () => { slider.value = 0; go(); };
  slider.oninput = async () => { tt.textContent = (+slider.value).toFixed(2); await window.__setTime(+slider.value); };
  await go();
  stage.style.transform = `scale(${Math.min(innerWidth / W, (innerHeight - 50) / H)})`;
  stage.style.transformOrigin = '0 0';
}
