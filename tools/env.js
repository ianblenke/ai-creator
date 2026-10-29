import fs from 'node:fs';

/** Strip an inline ` # comment` from an unquoted value, and the quotes from a quoted one (the rules Compose uses for .env files). */
export function parseValue(raw) {
  const v = raw.trim();
  const q = v.match(/^(["'])(.*?)\1(\s+#.*)?$/);
  return q ? q[2] : v.replace(/(^|\s+)#.*$/, '');
}

/** Minimal .env.local reader (KEY=VALUE lines). Returns {} if the file is missing. */
export function loadEnv(file = '.env.local') {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return {};
  }
  return Object.fromEntries(
    text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), parseValue(l.slice(i + 1))]; }),
  );
}
