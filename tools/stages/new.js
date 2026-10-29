// Scaffold a new episode from templates/: the plan, facts, script, must-hear list, upload draft, a generic bible and a thumbnail page.
// Nothing kettle-specific is copied (no scenes, shared cast module, kettle art, timeline or keyframes).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
// episode file -> template, relative to the repo root
export const FILES = {
  'plan.md': 'docs/episode-plan-template.md',
  'facts.md': 'templates/facts.md',
  'script.md': 'templates/script.md',
  'must-hear.txt': 'templates/must-hear.txt',
  'youtube-description.md': 'templates/youtube-description.md',
  'scenes/_brief/_bible.md': 'templates/bible.md',
  'thumbnail/thumb.html': 'templates/thumb.html',
};

/** Create `<root>/episodes/<id>/` from the templates; refuses a bad id or an existing folder. Returns the episode dir. */
export function scaffold(arg, { root = '.' } = {}) {
  const id = String(arg).replace(/\/+$/, '').replace(/^episodes\//, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`episode id "${arg}": use lower-case letters, digits and dashes, for example ep01-topic`);
  const dir = path.join(root, 'episodes', id);
  if (fs.existsSync(dir)) throw new Error(`${dir} already exists; pick another id`);
  for (const [to, from] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(dir, to)), { recursive: true });
    fs.copyFileSync(path.join(REPO, from), path.join(dir, to));
  }
  return dir;
}

export default async function newEpisode(arg) {
  const dir = scaffold(arg);
  console.log(`created ${dir}: ${Object.keys(FILES).join(', ')}\nnext: fill in plan.md, then facts.md (docs/fact-sheets.md), then script.md; run validate and safety`);
}
