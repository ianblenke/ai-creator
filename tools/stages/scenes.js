// scene-generation inputs: writes per-scene briefs and an input manifest. The model authoring scenes sees ONLY these.
import fs from 'node:fs';
import path from 'node:path';
import { loadScript } from '../script.js';

export default async function scenes(episodeDir) {
  const tlFile = path.join(episodeDir, 'timeline.json');
  if (!fs.existsSync(tlFile)) throw new Error('timeline.json missing (run tts and align first)');
  const tl = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
  const script = loadScript(path.join(episodeDir, 'script.md'));
  const dir = path.join(episodeDir, 'scenes');
  const briefDir = path.join(dir, '_brief');
  fs.mkdirSync(briefDir, { recursive: true });
  const provided = ['script.md', 'timeline.json', 'docs/scene-contract.md', 'tools/stage/style.js'];
  if (fs.existsSync(path.join(dir, '_brief', '_bible.md'))) provided.push('scenes/_brief/_bible.md'); // episode-relative like the briefs, so the file is the same from any working directory
  for (const s of script.scenes) {
    const ts = tl.scenes.find((x) => x.id === s.id);
    const words = ts.words.map((w) => `${(w.start - ts.start).toFixed(2)} ${w.text}`).join('\n');
    const md = `# Scene brief: ${s.id}\n\nWrite \`scenes/${s.id}.js\` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.\n\n` +
      `Duration: ${ts.duration.toFixed(2)} s (scene-local time 0..duration; hold the final state for ~0.6 s after).\n\n` +
      `## Narration (what is spoken)\n\n${s.displayText}\n\n## Visual intent\n\n${s.notes.map((n) => `- ${n}`).join('\n') || '- (none given)'}\n\n` +
      `## Word times (scene-local seconds, word)\n\n\`\`\`\n${words}\n\`\`\`\n\nAttention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in \`meta.cues\` with an anchor phrase.\n`;
    fs.writeFileSync(path.join(briefDir, `${s.id}.md`), md);
  }
  fs.writeFileSync(path.join(dir, '_inputs.json'), JSON.stringify({ provided, briefs: script.scenes.map((s) => `scenes/_brief/${s.id}.md`) }, null, 2));
  console.log(`wrote ${script.scenes.length} briefs and scenes/_inputs.json`);
}
