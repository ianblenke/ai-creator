#!/usr/bin/env node
// YouTube upload helper. Uploads a finished episode as PRIVATE (or unlisted) with its thumbnail and captions; the author makes it public in YouTube Studio.
//   node tools/youtube.js auth                       one-time sign-in (opens a browser on THIS machine; run it yourself)
//   node tools/youtube.js auth --manual              sign-in from a remote machine, step 1 (prints a link), then:
//   node tools/youtube.js auth --finish '<address>'  step 2 (paste the address the browser ended on)
//   node tools/youtube.js auth --port 8765           local sign-in on a fixed port (for an SSH tunnel: ssh -L 8765:127.0.0.1:8765 ...)
//   node tools/youtube.js check                      which channel am I signed in to?
//   node tools/youtube.js short <clip.mp4> [--yes]  uploads a Short (needs clip.json with title and description), private only
//   node tools/youtube.js upload <episode-dir> [--title N] [--privacy private|unlisted] [--yes] [--force]
//   node tools/youtube.js finish <episode-dir>       retry thumbnail + captions for an already uploaded video
//   node tools/youtube.js status <episode-dir>       read-only: visibility, processing, captions of the uploaded video
// Without --yes, `upload` is a dry run. This tool never deletes anything and never publishes publicly.
// Every upload is marked as synthetic media, and the dry run fails unless the description discloses the cloned voice and credits the model.
// Credentials live in .secrets/ (gitignored): client_secret.json from the Cloud Console, token.json written by `auth`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { SCOPES, openBrowser, parseRedirect, parseDraft, validateUpload, buildDescription, episodeFiles, insertMetadata, MAX_TITLE, MAX_DESCRIPTION_BYTES, findPlaceholders, disclosureProblems } from './youtube-lib.js';

const SECRETS = path.resolve('.secrets');
const CLIENT_FILE = path.join(SECRETS, 'client_secret.json');
const TOKEN_FILE = path.join(SECRETS, 'token.json');
const API = 'https://www.googleapis.com/youtube/v3';
const UPLOAD = 'https://www.googleapis.com/upload/youtube/v3';
const b64url = (buf) => buf.toString('base64url');
const fail = (msg) => { console.error(`youtube: ${msg}`); process.exit(1); };

function loadClient() {
  if (!fs.existsSync(CLIENT_FILE)) fail(`missing ${path.relative('.', CLIENT_FILE)} (download the OAuth "Desktop app" JSON from the Cloud Console and save it there)`);
  const j = JSON.parse(fs.readFileSync(CLIENT_FILE, 'utf8'));
  if (!j.installed) fail('client_secret.json is not a "Desktop app" credential (create the OAuth client with application type Desktop app)');
  return j.installed;
}

const PENDING_FILE = path.join(SECRETS, 'pending-auth.json');

function authUrl(c, { redirect, challenge, state }) {
  return `${c.auth_uri}?${new URLSearchParams({ client_id: c.client_id, redirect_uri: redirect, response_type: 'code', scope: SCOPES.join(' '), code_challenge: challenge, code_challenge_method: 'S256', state, access_type: 'offline', prompt: 'consent' })}`;
}

async function exchangeAndSave(c, { code, verifier, redirect }) {
  const r = await fetch(c.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: c.client_id, client_secret: c.client_secret, code_verifier: verifier, redirect_uri: redirect, grant_type: 'authorization_code' }) });
  const j = await r.json();
  if (!r.ok || !j.refresh_token) fail(`token exchange failed: ${j.error_description || j.error || r.status}`);
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ refresh_token: j.refresh_token, scope: j.scope, obtained: new Date().toISOString() }, null, 2), { mode: 0o600 });
  const granted = (j.scope || '').split(' ');
  console.log('Signed in. Granted:', granted.map((s) => s.replace('https://www.googleapis.com/auth/', '')).join(', '));
  const extra = granted.filter((s) => !SCOPES.includes(s) && !/^(openid|email|profile)$/.test(s));
  if (extra.length) console.log('WARNING: unexpected extra permissions:', extra.join(' '));
  console.log('Next: node tools/youtube.js check');
}

const newPkce = () => {
  const verifier = b64url(crypto.randomBytes(32));
  return { verifier, challenge: b64url(crypto.createHash('sha256').update(verifier).digest()), state: b64url(crypto.randomBytes(16)) };
};

/** Local browser: listen on 127.0.0.1 (optionally a fixed port, for an SSH tunnel) and catch the redirect. */
async function auth(port = 0) {
  const c = loadClient();
  const { verifier, challenge, state } = newPkce();
  const server = http.createServer();
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const redirect = `http://127.0.0.1:${server.address().port}`;
  const url = authUrl(c, { redirect, challenge, state });
  console.log(`Open this page, sign in with the account that owns the channel, and approve the two permissions (listening on ${redirect}):\n\n${url}\n`);
  openBrowser(url, spawn);
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out waiting for the browser (5 minutes)')), 300000);
    server.on('request', (req, res) => {
      const q = new URL(req.url, redirect).searchParams;
      if (!q.has('code') && !q.has('error')) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'content-type': 'text/plain' }).end(q.get('error') ? `Sign-in failed: ${q.get('error')}. You can close this tab.` : 'Signed in. You can close this tab and go back to the terminal.');
      clearTimeout(timer);
      try { resolve(parseRedirect(`${redirect}${req.url}`, state)); } catch (e) { reject(e); }
    });
  }).finally(() => server.close());
  await exchangeAndSave(c, { code, verifier, redirect });
}

/** Remote machine, step 1: print the link and remember the sign-in attempt. The browser's redirect will not load; the author pastes its address in step 2. */
function authManual(port = 8765) {
  const c = loadClient();
  const { verifier, challenge, state } = newPkce();
  const redirect = `http://127.0.0.1:${port}`;
  fs.writeFileSync(PENDING_FILE, JSON.stringify({ verifier, state, redirect, created: new Date().toISOString() }), { mode: 0o600 });
  console.log(`1. Open this link in a browser on ANY computer, sign in with the account that owns the channel, and approve the two permissions:\n\n${authUrl(c, { redirect, challenge, state })}\n`);
  console.log(`2. The browser will then show an error page ("can't connect" / "refused") for an address starting with ${redirect}. That is expected.\n   Copy the FULL address from the browser's address bar and run:\n\n   node tools/youtube.js auth --finish '<paste the address here>'\n`);
}

/** Remote machine, step 2. */
async function authFinish(pasted) {
  const c = loadClient();
  if (!fs.existsSync(PENDING_FILE)) fail('no sign-in in progress: run `node tools/youtube.js auth --manual` first');
  const { verifier, state, redirect, created } = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
  if (Date.now() - Date.parse(created) > 600000) { fs.rmSync(PENDING_FILE); fail('that sign-in attempt is more than 10 minutes old: run `auth --manual` again'); }
  let code;
  try { code = parseRedirect(pasted, state); } catch (e) { fail(e.message); }
  await exchangeAndSave(c, { code, verifier, redirect });
  fs.rmSync(PENDING_FILE, { force: true });
}

async function accessToken() {
  const c = loadClient();
  if (!fs.existsSync(TOKEN_FILE)) fail('not signed in: run `node tools/youtube.js auth` first (setup: docs/upload.md)');
  const { refresh_token } = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  const r = await fetch(c.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: c.client_id, client_secret: c.client_secret, refresh_token, grant_type: 'refresh_token' }) });
  const j = await r.json();
  if (!r.ok) fail(j.error === 'invalid_grant' ? 'the sign-in has expired (apps in Testing mode lapse after 7 days): run `node tools/youtube.js auth` again (setup and the sign-in steps: docs/upload.md)' : `could not refresh the sign-in: ${j.error_description || j.error}`);
  return j.access_token;
}

async function call(token, url, init = {}) {
  const r = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  const text = await r.text();
  let j = {};
  try { j = text ? JSON.parse(text) : {}; } catch { /* not json */ }
  if (!r.ok) throw new Error(`${r.status} ${j.error?.message || text.slice(0, 200)}`);
  return j;
}

async function check() {
  const token = await accessToken();
  const j = await call(token, `${API}/channels?part=snippet&mine=true`);
  if (!j.items?.length) fail('signed in, but this Google account has no YouTube channel');
  for (const ch of j.items) console.log(`Signed in to channel: "${ch.snippet.title}" (${ch.id})`);
  console.log('If that is the right channel, you are ready: node tools/youtube.js upload <episode-dir>');
}

const mb = (f) => `${(fs.statSync(f).size / 1048576).toFixed(1)} MiB`;
const markerFile = (dir) => path.join(dir, 'out', 'youtube-upload.json');

function plan(dir, opts) {
  const files = episodeFiles(dir);
  if (!fs.existsSync(files.draft)) fail(`no ${path.relative('.', files.draft)}`);
  const d = parseDraft(fs.readFileSync(files.draft, 'utf8'));
  const title = d.titles[opts.title - 1];
  const description = buildDescription(d);
  const problems = validateUpload({ title, description, chapters: d.chapters }, { video: files.video, thumbnail: files.thumbnail, captions: files.captions });
  return { files, title, description, problems };
}

async function setThumbnailAndCaptions(token, videoId, files) {
  await call(token, `${UPLOAD}/thumbnails/set?videoId=${videoId}&uploadType=media`, { method: 'POST', headers: { 'content-type': 'image/png' }, body: fs.readFileSync(files.thumbnail) });
  console.log('  thumbnail set');
  const boundary = `b${crypto.randomBytes(8).toString('hex')}`;
  const meta = JSON.stringify({ snippet: { videoId, language: 'en', name: 'English', isDraft: false } });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\ncontent-type: application/octet-stream\r\n\r\n`),
    fs.readFileSync(files.captions),
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  await call(token, `${UPLOAD}/captions?uploadType=multipart&part=snippet`, { method: 'POST', headers: { 'content-type': `multipart/related; boundary=${boundary}` }, body });
  console.log('  captions added');
}

async function upload(dir, opts) {
  const { files, title, description, problems } = plan(dir, opts);
  console.log(`Episode:   ${dir}\nTitle:     ${title || '(none)'}\nPrivacy:   ${opts.privacy}  (you switch it to Public in YouTube Studio)\nVideo:     ${fs.existsSync(files.video) ? `${path.basename(files.video)} (${mb(files.video)})` : 'MISSING'}\nThumbnail: ${path.basename(files.thumbnail)}\nCaptions:  ${path.basename(files.captions)}\nDescription: ${Buffer.byteLength(description)} bytes, first line: ${description.split('\n')[0].slice(0, 90)}…`);
  if (problems.length) { console.error('\nNot ready to upload:\n' + problems.map((p) => `  - ${p}`).join('\n')); process.exit(1); }
  const safety = spawnSync(process.execPath, ['tools/cli.js', 'safety', dir], { encoding: 'utf8' });
  if (safety.status !== 0) { console.error('\ncontent-safety scan failed; nothing uploaded:\n' + (safety.stdout + safety.stderr).trim()); process.exit(1); }
  if (fs.existsSync(markerFile(dir)) && !opts.force) fail(`already uploaded (${path.relative('.', markerFile(dir))}); use --force to upload again, or \`finish\` to retry the thumbnail and captions`);
  if (!opts.yes) { console.log('\nDry run only. Everything above is valid; re-run with --yes to upload.'); return; }

  const token = await accessToken();
  console.log('\nStarting upload…');
  const size = fs.statSync(files.video).size;
  const init = await fetch(`${UPLOAD}/videos?uploadType=resumable&part=snippet,status`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-length': String(size), 'x-upload-content-type': 'video/mp4' }, body: JSON.stringify(insertMetadata({ title, description, privacy: opts.privacy })) });
  if (!init.ok) fail(`could not start the upload: ${init.status} ${(await init.text()).slice(0, 300)}`);
  const location = init.headers.get('location');
  const put = await fetch(location, { method: 'PUT', headers: { 'content-length': String(size), 'content-type': 'video/mp4' }, body: Readable.toWeb(fs.createReadStream(files.video)), duplex: 'half' });
  const out = await put.json().catch(() => ({}));
  if (!put.ok || !out.id) fail(`upload failed: ${put.status} ${JSON.stringify(out).slice(0, 300)} (nothing was published; you can run it again)`);
  fs.mkdirSync(path.dirname(markerFile(dir)), { recursive: true });
  fs.writeFileSync(markerFile(dir), JSON.stringify({ videoId: out.id, privacy: opts.privacy, title, uploaded: new Date().toISOString() }, null, 2));
  console.log(`  video uploaded (id ${out.id}), privacy: ${out.status?.privacyStatus || opts.privacy}`);
  try { await setThumbnailAndCaptions(token, out.id, files); } catch (e) { console.error(`  thumbnail/captions step failed: ${e.message}\n  The video is up; retry with: node tools/youtube.js finish ${dir}`); process.exitCode = 1; }
  console.log(`\nReview it in YouTube Studio: https://studio.youtube.com/video/${out.id}/edit\nIt is ${out.status?.privacyStatus || opts.privacy}. When it looks right, set the visibility to Public there.`);
}

async function status(dir) {
  if (!fs.existsSync(markerFile(dir))) fail(`no upload recorded for ${dir}`);
  const { videoId } = JSON.parse(fs.readFileSync(markerFile(dir), 'utf8'));
  const token = await accessToken();
  const v = (await call(token, `${API}/videos?part=status,processingDetails,snippet,contentDetails&id=${videoId}`)).items?.[0];
  if (!v) fail(`YouTube does not list video ${videoId}`);
  const caps = (await call(token, `${API}/captions?part=snippet&videoId=${videoId}`)).items || [];
  console.log(`Video ${videoId}: "${v.snippet.title}"\n  visibility:  ${v.status.privacyStatus}${v.status.publishAt ? ` (scheduled ${v.status.publishAt})` : ''}\n  upload:      ${v.status.uploadStatus}${v.status.rejectionReason ? ` (${v.status.rejectionReason})` : ''}\n  processing:  ${v.processingDetails?.processingStatus || 'unknown'}\n  duration:    ${v.contentDetails?.duration}\n  made for kids: ${v.status.madeForKids}\n  thumbnail:   ${v.snippet.thumbnails?.maxres ? 'custom, high resolution' : v.snippet.thumbnails?.high ? 'present' : 'none yet'}\n  captions:    ${caps.length ? caps.map((c) => `${c.snippet.language} (${c.snippet.trackKind}${c.snippet.isDraft ? ', draft' : ''})`).join(', ') : 'none'}\n  description: ${(v.snippet.description || '').length} characters`);
}

async function finish(dir) {
  if (!fs.existsSync(markerFile(dir))) fail(`no upload recorded for ${dir}`);
  const { videoId } = JSON.parse(fs.readFileSync(markerFile(dir), 'utf8'));
  const token = await accessToken();
  console.log(`Finishing video ${videoId}…`);
  await setThumbnailAndCaptions(token, videoId, episodeFiles(dir));
}

/** A Short: one vertical clip plus a small JSON file {title, description}. Private only; the author publishes in Studio. */
async function short(file, opts) {
  const metaFile = file.replace(/\.mp4$/, '.json');
  if (!fs.existsSync(file) || !fs.existsSync(metaFile)) fail(`need ${file} and ${metaFile}`);
  const { title, description } = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const problems = [];
  if (!title || title.length > MAX_TITLE) problems.push('title missing or over 100 characters');
  if (!/#shorts/i.test(`${title} ${description}`)) problems.push('add #Shorts to the title or description');
  if (Buffer.byteLength(description || '') > MAX_DESCRIPTION_BYTES) problems.push('description too long');
  for (const p of findPlaceholders(`${title}\n${description}`)) problems.push(`placeholder still present: ${p}`);
  problems.push(...disclosureProblems(description));
  const tmp = fs.mkdtempSync(path.join(path.dirname(file), 'safety-'));
  fs.writeFileSync(path.join(tmp, 'script.md'), `# ${title}\n\n${description}\n`);
  const safety = spawnSync(process.execPath, ['tools/cli.js', 'safety', tmp], { encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (safety.status !== 0) problems.push('content-safety scan failed: ' + (safety.stdout + safety.stderr).trim().slice(0, 300));
  console.log(`Short:   ${path.basename(file)} (${mb(file)})\nTitle:   ${title}\nPrivacy: ${opts.privacy}\nText:    ${Buffer.byteLength(description)} bytes`);
  if (problems.length) { console.error('\nNot ready to upload:\n' + problems.map((p) => `  - ${p}`).join('\n')); process.exit(1); }
  const marker = file.replace(/\.mp4$/, '.uploaded.json');
  if (fs.existsSync(marker) && !opts.force) fail(`already uploaded (${marker}); use --force to upload again`);
  if (!opts.yes) { console.log('\nDry run only. Everything above is valid; re-run with --yes to upload.'); return; }
  const token = await accessToken();
  const size = fs.statSync(file).size;
  const init = await fetch(`${UPLOAD}/videos?uploadType=resumable&part=snippet,status`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-length': String(size), 'x-upload-content-type': 'video/mp4' }, body: JSON.stringify(insertMetadata({ title, description, privacy: opts.privacy })) });
  if (!init.ok) fail(`could not start the upload: ${init.status} ${(await init.text()).slice(0, 300)}`);
  const put = await fetch(init.headers.get('location'), { method: 'PUT', headers: { 'content-length': String(size), 'content-type': 'video/mp4' }, body: Readable.toWeb(fs.createReadStream(file)), duplex: 'half' });
  const out = await put.json().catch(() => ({}));
  if (!put.ok || !out.id) fail(`upload failed: ${put.status} ${JSON.stringify(out).slice(0, 300)}`);
  fs.writeFileSync(marker, JSON.stringify({ videoId: out.id, privacy: opts.privacy, title, uploaded: new Date().toISOString() }, null, 2));
  console.log(`\nUploaded (id ${out.id}), privacy: ${out.status?.privacyStatus || opts.privacy}\nStudio: https://studio.youtube.com/video/${out.id}/edit  (it is private; set it to Public there)`);
}

/** Append an episode's uploaded video to a playlist (skips it if already there). Usage: playlist-add <episode-dir> <playlist-id> [--position N] (1-based; default end) */
async function playlistAdd(episodeDir, playlistId, at) {
  const marker = path.join(episodeDir, 'out', 'youtube-upload.json');
  if (!fs.existsSync(marker)) fail(`${marker} not found: upload the episode first`);
  const { videoId } = JSON.parse(fs.readFileSync(marker, 'utf8'));
  const token = await accessToken();
  let page = '', n = 0;
  do {
    const j = await call(token, `${API}/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}${page ? `&pageToken=${page}` : ''}`);
    for (const it of j.items || []) { n++; if (it.snippet?.resourceId?.videoId === videoId) { console.log(`already in the playlist (position ${it.snippet.position + 1})`); return; } }
    page = j.nextPageToken || '';
  } while (page);
  await call(token, `${API}/playlistItems?part=snippet`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snippet: { playlistId, position: at ? at - 1 : n, resourceId: { kind: 'youtube#video', videoId } } }) });
  console.log(`added ${videoId} to the playlist at position ${at || n + 1}`);
}

const [cmd, ...rest] = process.argv.slice(2);
const flag = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };
const opts = { title: +flag('--title', 1), privacy: flag('--privacy', 'private'), yes: rest.includes('--yes'), force: rest.includes('--force') };
const dir = rest.find((a, i) => !a.startsWith('--') && !['--title', '--privacy', '--port', '--finish'].includes(rest[i - 1]));
try {
  if (cmd === 'auth' && rest.includes('--manual')) authManual(+flag('--port', 8765));
  else if (cmd === 'auth' && rest.includes('--finish')) await authFinish(flag('--finish', ''));
  else if (cmd === 'auth') await auth(+flag('--port', 0));
  else if (cmd === 'check') await check();
  else if (cmd === 'upload' && dir) await upload(dir, opts);
  else if (cmd === 'short' && dir) await short(dir, opts);
  else if (cmd === 'finish' && dir) await finish(dir);
  else if (cmd === 'playlist-add' && dir && rest.filter((x, i) => !x.startsWith('--') && rest[i - 1] !== '--position').length >= 2) await playlistAdd(dir, rest.filter((x, i) => !x.startsWith('--') && rest[i - 1] !== '--position')[1], +flag('--position', 0));
  else if (cmd === 'status' && dir) await status(dir);
  else console.log('usage:\n  node tools/youtube.js auth [--port N]            (browser on this machine)\n  node tools/youtube.js auth --manual              (remote machine, step 1)\n  node tools/youtube.js auth --finish \'<address>\'  (remote machine, step 2)\n  node tools/youtube.js check\n  node tools/youtube.js upload <episode-dir> [--title N] [--privacy private|unlisted] [--yes] [--force]\n  node tools/youtube.js finish <episode-dir>\n  node tools/youtube.js status <episode-dir>   (read-only: what YouTube shows for the uploaded video)');
} catch (e) { fail(e.message); }
