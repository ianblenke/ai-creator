// Browser-side anchor resolution (mirrors tools/timeline.js resolveAnchor, scene-local seconds).
const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
export function resolveAnchorLocal(scene, anchor) {
  if (typeof anchor === 'number') {
    if (!scene.words[anchor]) throw new Error(`word index ${anchor} out of range in ${scene.id}`);
    return scene.words[anchor].start - scene.start;
  }
  if (typeof anchor === 'string' && /^t=/.test(anchor)) return parseFloat(anchor.slice(2));
  const want = anchor.split(/\s+/).map(clean).filter(Boolean);
  const have = scene.words.map((w) => clean(w.text));
  for (let i = 0; i + want.length <= have.length; i++) {
    if (want.every((w, k) => have[i + k] === w)) return scene.words[i].start - scene.start;
  }
  throw new Error(`anchor "${anchor}" not found in ${scene.id}`);
}
