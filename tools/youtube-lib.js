// Pure helpers for the YouTube upload tool: read an episode's upload draft, validate it, build API payloads. No network, no secrets.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const MAX_TITLE = 100;
export const MAX_DESCRIPTION_BYTES = 5000;
export const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;

/** Split the draft into title options, description body and chapter lines. */
export function parseDraft(md) {
  const section = (name) => {
    const m = md.match(new RegExp(`^## ${name}[^\\n]*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm'));
    return m ? m[1].trim() : '';
  };
  const titles = section('Title options').split('\n').map((l) => l.match(/^\d+\.\s+(.*)$/)).filter(Boolean).map((m) => m[1].trim());
  const description = section('Description');
  const chapters = section('Chapters').split('\n').map((l) => l.trim()).filter((l) => /^\d+:\d{2}(:\d{2})?\s/.test(l));
  return { titles, description, chapters };
}

/** Anything still in [square brackets] that looks like a to-do the author must fill in. */
export function findPlaceholders(text) {
  return [...text.matchAll(/\[[^\]\n]*\b(add|your|todo|fill|insert)\b[^\]\n]*\]/gi)].map((m) => m[0]);
}

export const toSeconds = (ts) => ts.split(':').reduce((a, v) => a * 60 + +v, 0);

/** YouTube chapters: first at 0:00, at least three, ascending, each at least 10 s long. */
export function validateChapters(lines) {
  const errors = [];
  const secs = lines.map((l) => toSeconds(l.split(/\s/)[0]));
  if (lines.length < 3) errors.push('need at least 3 chapters');
  if (secs[0] !== 0) errors.push('first chapter must be 0:00');
  for (let i = 1; i < secs.length; i++) {
    if (secs[i] <= secs[i - 1]) errors.push(`chapter ${i + 1} is not after chapter ${i}`);
    else if (secs[i] - secs[i - 1] < 10) errors.push(`chapter ${i} is shorter than 10 s`);
  }
  return errors;
}

// Required in every description (docs/upload.md): say the voice is synthetic, and credit the voice model with its licence and a link.
// Any honest wording passes: one line naming the narration (or voice) as cloned or synthetic, then what made it ("generated with X").
export const DISCLOSURE = /\b(?:narration|narrator|voice)\b[^\n]*\b(?:cloned|clone|synthetic|AI[- ]generated)\b[^\n]*\b(?:generated|made|synthesi[sz]ed) (?:with|by) \S/i;
export const DISCLOSURE_EXAMPLES = [
  'The narration is a cloned copy of my own voice, generated with <model>.',
  "The narration is a cloned copy of <name>'s voice, used with their written permission, generated with <model>.",
  'The narration is a synthetic preset voice (<voice id>), generated with <model>.',
];
export const ATTRIBUTION = /^Voice model: .*\blicen[cs]e\b.*https?:\/\/\S+/im;

export function disclosureProblems(text) {
  const problems = [];
  if (!DISCLOSURE.test(text || '')) problems.push(`missing the synthetic-voice line, one of:\n${DISCLOSURE_EXAMPLES.map((e) => `    ${e}`).join('\n')}`);
  if (!ATTRIBUTION.test(text || '')) problems.push('missing the model credit line: "Voice model: <model> by <maker>, <licence> licence (read <date>): <link>"');
  return problems;
}

export const MIN_VIDEO_BYTES = 100 * 1024;

/** {video, duration} from ffprobe, or null when ffprobe is not installed. */
function ffprobeSync(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', file], { encoding: 'utf8' });
  if (r.error) return null;
  if (r.status !== 0) return { video: false, duration: 0 };
  const j = JSON.parse(r.stdout);
  return { video: (j.streams || []).some((s) => s.codec_type === 'video'), duration: parseFloat(j.format?.duration) || 0 };
}

/** A plausible rendered MP4: above a size floor, an ftyp box at the start and, when ffprobe is installed, a video stream of 1 s or more. */
export function videoProblems(file, { probe = ffprobeSync, minBytes = MIN_VIDEO_BYTES } = {}) {
  const size = fs.statSync(file).size;
  if (size < minBytes) return [`video ${path.basename(file)} is only ${size} bytes: not a rendered episode`];
  const head = Buffer.alloc(8);
  const fd = fs.openSync(file, 'r');
  try { fs.readSync(fd, head, 0, 8, 0); } finally { fs.closeSync(fd); }
  if (head.toString('latin1', 4, 8) !== 'ftyp') return [`video ${path.basename(file)} is not an MP4 (no ftyp box at the start)`];
  const p = probe(file);
  if (p && !(p.video && p.duration >= 1)) return [`video ${path.basename(file)}: ffprobe finds ${p.video ? `only ${p.duration} s` : 'no video stream'}`];
  return [];
}

/** Everything that must be true before anything is sent; returns a list of problems (empty = ok). */
export function validateUpload({ title, description, chapters }, files) {
  const problems = [];
  if (!title) problems.push('no title');
  if (title && title.length > MAX_TITLE) problems.push(`title is ${title.length} characters (max ${MAX_TITLE})`);
  if (/[<>]/.test(title || '')) problems.push('title must not contain < or >');
  if (Buffer.byteLength(description || '') > MAX_DESCRIPTION_BYTES) problems.push(`description is over ${MAX_DESCRIPTION_BYTES} bytes`);
  for (const p of findPlaceholders(`${title}\n${description}`)) problems.push(`placeholder still present: ${p}`);
  problems.push(...disclosureProblems(description));
  problems.push(...validateChapters(chapters).map((e) => `chapters: ${e}`));
  for (const [label, f] of Object.entries(files)) if (!fs.existsSync(f)) problems.push(`missing ${label}: ${f}`);
  if (files.video && fs.existsSync(files.video)) problems.push(...videoProblems(files.video));
  if (files.thumbnail && fs.existsSync(files.thumbnail) && fs.statSync(files.thumbnail).size > MAX_THUMBNAIL_BYTES) problems.push('thumbnail is over 2 MB');
  return problems;
}

/** The text YouTube gets: description paragraphs plus the chapter list at the end. */
export function buildDescription({ description, chapters }) {
  return `${description.trim()}\n\n${chapters.join('\n')}\n`;
}

export const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl'];
// Read-only, opt-in with `auth --analytics`, for tools/seo.js analytics. reports.query lists yt-analytics.readonly and (read 2026-10-30,
// https://developers.google.com/youtube/analytics/reference/reports/query) "now require[s] access to the .../auth/youtube.readonly scope".
export const ANALYTICS_SCOPES = ['https://www.googleapis.com/auth/yt-analytics.readonly', 'https://www.googleapis.com/auth/youtube.readonly'];
export const authScopes = (analytics = false) => (analytics ? [...SCOPES, ...ANALYTICS_SCOPES] : SCOPES);

/** Files an episode's final folder is expected to hold. */
export function episodeFiles(episodeDir) {
  const id = path.basename(episodeDir);
  const prefix = id.replace(/^ep\d+-/, (m) => m) ;
  const fin = path.join(episodeDir, 'out', 'final');
  const base = fs.existsSync(fin) ? (fs.readdirSync(fin).find((f) => /-final\.mp4$/.test(f)) || `${prefix}-final.mp4`).replace(/-final\.mp4$/, '') : prefix;
  return {
    video: path.join(fin, `${base}-final.mp4`),
    thumbnail: path.join(fin, `${base}-thumbnail.png`),
    captions: path.join(fin, `${base}-final.srt`),
    draft: path.join(episodeDir, 'youtube-description.md'),
  };
}

/** Metadata for videos.insert. Visibility is never public from this tool: the author flips it in YouTube Studio. */
// containsSyntheticMedia: the channel owner's disclosure of realistic altered or synthetic content, settable on videos.insert and
// videos.update. Read 2026-10-29 at https://developers.google.com/youtube/v3/docs/videos (page last updated 2026-10-15). A cloned
// voice is synthetic, so every upload from this tool declares it.
export function insertMetadata({ title, description, privacy }) {
  if (!['private', 'unlisted'].includes(privacy)) throw new Error('privacy must be private or unlisted (publish from YouTube Studio)');
  return {
    snippet: { title, description, categoryId: '28', defaultLanguage: 'en', defaultAudioLanguage: 'en' },
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false, embeddable: true, containsSyntheticMedia: true },
  };
}

/** Try to open the sign-in page in a browser. A missing opener (no xdg-open in a container) arrives as an async 'error' event, not a throw. */
export function openBrowser(url, spawnFn, platform = process.platform, log = console.log) {
  const fallback = () => log(`Could not open a browser here: open this link yourself:\n${url}\n`);
  try {
    const p = spawnFn(platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' });
    p.on('error', fallback);
    p.unref();
  } catch { fallback(); }
}

/** Read the authorization code from the URL the browser was redirected to (pasted by the author); the state must match. */
export function parseRedirect(redirectUrl, expectedState) {
  let q;
  try { q = new URL(redirectUrl.trim()).searchParams; } catch { throw new Error('that is not a URL: paste the full address from the browser bar (it starts with http://127.0.0.1)'); }
  if (q.get('error')) throw new Error(`Google returned: ${q.get('error')}`);
  if (!q.get('code')) throw new Error('no code in that URL: paste the address shown after you approved the sign-in');
  if (q.get('state') !== expectedState) throw new Error('state mismatch: this URL is not from the sign-in you just started (run `auth --manual` again)');
  return q.get('code');
}
