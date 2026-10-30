// Fails if local-only files (config, denylist, reference voice audio, any audio or video) are tracked or staged.
// Your episodes live in episodes/<id>/, the shipped example in examples/<id>/: both get the same rules (and the same .gitignore lines).
import { execFileSync } from 'node:child_process';

// Every audio container, plus video containers (they carry the narration track).
export const MEDIA_EXT = /\.(?:wav|mp3|flac|m4a|ogg|oga|opus|aac|wma|aif|aiff|mp4|m4v|mov|mkv|webm)$/i;
// Explicit exceptions to MEDIA_EXT (exact repo paths). Empty on purpose: no voice audio is ever committed.
export const MEDIA_ALLOW = [];

const FORBIDDEN = [/^\.env\.local$/, /^\.env$/, /^safety\/denylist\.txt$/, /^voice\/(?!README\.md$|CONSENT\.example\.md$)/, /^\.secrets\//, /^(?:episodes|examples)\/[^/]+\/(?:audio|frames|out)\//, /^seo-reports\//];

export function forbiddenFiles(files) {
  return files.filter((f) => FORBIDDEN.some((re) => re.test(f)) || (MEDIA_EXT.test(f) && !MEDIA_ALLOW.includes(f)));
}

export function checkRepo({ staged = false, cwd = process.cwd() } = {}) {
  const args = staged ? ['diff', '--cached', '--name-only'] : ['ls-files'];
  const out = execFileSync('git', args, { cwd, encoding: 'utf8' });
  return forbiddenFiles(out.split('\n').filter(Boolean));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bad = checkRepo({ staged: process.argv.includes('--staged') });
  if (bad.length) {
    console.error(`content-safety: local-only files must not be committed:\n${bad.map((b) => '  ' + b).join('\n')}`);
    process.exit(1);
  }
}
