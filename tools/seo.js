#!/usr/bin/env node
// Free SEO research for titles, tags and descriptions; no paid service anywhere (docs/seo.md).
//   node tools/seo.js research <term> [<term>...] [--seeds file] [--alphabet] [--out dir]
//   node tools/seo.js quota                                 YouTube Data API use today (Pacific date) against the budgets
//   node tools/seo.js analytics [--days 28] [--video id]    search terms that brought viewers to your videos (your own sign-in)
// Suggestions come from Google's unofficial autocomplete endpoint (YouTube and web); they show relative interest, not search volume.
//
// Google pages read on 2026-10-30 (each "Last updated 2026-10-15 UTC"):
// - https://developers.google.com/youtube/v3/determine_quota_cost : "a default quota allocation of 100 search.list calls, 100
//   videos.insert calls, and 10,000 units per day combined for all other endpoints"; the table row for search.list reads "100 quota
//   per day. Each call costs 1 quota."; videos.list costs 1; "Daily quotas reset at midnight Pacific Time (PT)".
// - https://developers.google.com/youtube/analytics/reference/reports/query : GET https://youtubeanalytics.googleapis.com/v2/reports,
//   required ids, startDate, endDate, metrics; optional dimensions, filters, sort, maxResults; scope yt-analytics.readonly, and an
//   "Important" note: requests "now require access to the https://www.googleapis.com/auth/youtube.readonly scope".
// - https://developers.google.com/youtube/analytics/channel_reports : the traffic-source-detail report needs dimension
//   insightTrafficSourceDetail, filter insightTrafficSourceType, maxResults of 25 or less and a sort (-views or -estimatedMinutesWatched);
//   optional filter video. https://developers.google.com/youtube/analytics/dimensions : with YT_SEARCH, the detail "specifies the search term".
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from './env.js';
import { scanText, loadDenylist, formatFindings } from './safety/scan.js';
import { ANALYTICS_SCOPES } from './youtube-lib.js';

export const UA = 'ai-creator-seo/0.1 (open-source YouTube research script; about 1 request per second, cached for 7 days)';
const SUGGEST = 'https://suggestqueries.google.com/complete/search';
const DATA_API = 'https://www.googleapis.com/youtube/v3';
const ANALYTICS = 'https://youtubeanalytics.googleapis.com/v2/reports';
const DAY = 864e5;
export const CACHE_MS = 7 * DAY;
// From the quota page above. An older version of it charged search.list 100 units from the shared pool: if Google changes it back, change this.
export const COSTS = { 'search.list': { bucket: 'search', units: 1 }, 'videos.list': { bucket: 'units', units: 1 } };
const BUDGET_VAR = { search: 'SEO_SEARCH_BUDGET', units: 'SEO_QUOTA_BUDGET' };

export class StopError extends Error {}

/** Both shapes: client=firefox gives ["q",["s1","s2"],...]; client=youtube gives JSONP window.google.ac.h(["q",[["s1",0,[512]],...],...]). */
export function parseSuggestions(text) {
  const body = String(text).trim().replace(/^[^([]*\(/, '').replace(/\)\s*;?$/, '');
  let j;
  try { j = JSON.parse(body); } catch { j = null; }
  if (!Array.isArray(j) || !Array.isArray(j[1])) throw new StopError('the suggestion service sent something that is not a suggestion list (a block page?): stopping');
  return j[1].map((s) => (Array.isArray(s) ? s[0] : s)).filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean);
}

/** YYYY-MM-DD in Pacific time: the YouTube quota day. */
export const pacificDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(ms);

/** Units per Pacific date in a JSON file; charge() refuses (throws, records nothing) when a call would go over its budget. */
export function quotaGuard({ file, budgets, now = Date.now }) {
  const read = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; } };
  const today = () => { const date = pacificDate(now()); return { date, search: 0, units: 0, ...read()[date] }; };
  return {
    budgets,
    today,
    charge(method) {
      const { bucket, units } = COSTS[method];
      const { date, ...day } = today();
      if (day[bucket] + units > budgets[bucket]) {
        throw new StopError(`quota guard: ${method} would bring today's ${bucket} use (Pacific date ${date}) to ${day[bucket] + units}, over the budget of ${budgets[bucket]}; nothing was sent. Wait for midnight Pacific time or raise ${BUDGET_VAR[bucket]} in .env.local.`);
      }
      day[bucket] += units;
      const all = read();
      all[date] = day;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(all, null, 2));
    },
  };
}

/** GET with a 7-day disk cache, at most one network request per gapMs, and a hard stop on 429/403. Returns parse(body). */
export function makeClient({ fetch = globalThis.fetch, now = Date.now, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), cacheDir = '.cache/seo', gapMs = 1000 } = {}) {
  let last = -Infinity;
  return async function get(url, { cacheKey = url, label = 'request', parse = (b) => b, before } = {}) {
    const file = path.join(cacheDir, `${crypto.createHash('sha256').update(cacheKey).digest('hex')}.json`);
    try {
      const c = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (now() - c.at < CACHE_MS) return parse(c.body);
    } catch { /* not cached */ }
    if (before) before();
    const wait = last + gapMs - now();
    if (wait > 0) await sleep(wait);
    last = now();
    const r = await fetch(url, { headers: { 'user-agent': UA } });
    const body = await r.text();
    let detail = '';
    try { detail = JSON.parse(body).error?.message || ''; } catch { /* not json */ }
    if (r.status === 429 || r.status === 403) {
      throw new StopError(`${label} answered HTTP ${r.status}${detail ? ` (${detail})` : ''}: stopping, no retries. Answers so far are cached; wait (an hour or more for suggestions, Pacific midnight for quota) before running again.`);
    }
    if (!r.ok) throw new StopError(`${label} answered HTTP ${r.status}${detail ? ` (${detail})` : ''}: stopping`);
    const out = parse(body); // a body that does not parse is never cached
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ at: now(), body }));
    return out;
  };
}

/** ISO 8601 duration (PT1H2M3S, P1DT2H) to seconds; null when absent or unparsable. */
export function isoSeconds(d) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(d || '');
  return m ? ((+m[1] || 0) * 24 + (+m[2] || 0)) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) : null;
}

/** Top 10 videos for one seed: search.list (its own bucket) then one videos.list for the ids (1 unit). */
export async function topVideos(seed, { get, apiKey, quota }) {
  const key = `&key=${encodeURIComponent(apiKey)}`; // never in the cache key or an error message
  const s = new URLSearchParams({ part: 'snippet', type: 'video', maxResults: '10', q: seed });
  const found = await get(`${DATA_API}/search?${s}${key}`, { cacheKey: `search?${s}`, label: 'YouTube Data API search.list', parse: JSON.parse, before: () => quota.charge('search.list') });
  const ids = (found.items || []).map((i) => i.id?.videoId).filter(Boolean);
  if (!ids.length) return [];
  const v = new URLSearchParams({ part: 'snippet,statistics,contentDetails', id: ids.join(',') });
  const list = await get(`${DATA_API}/videos?${v}${key}`, { cacheKey: `videos?${v}`, label: 'YouTube Data API videos.list', parse: JSON.parse, before: () => quota.charge('videos.list') });
  const byId = new Map((list.items || []).map((x) => [x.id, x]));
  return ids.filter((id) => byId.has(id)).map((id) => {
    const x = byId.get(id);
    return { id, title: x.snippet?.title || '', channel: x.snippet?.channelTitle || '', publishedAt: x.snippet?.publishedAt, views: x.statistics?.viewCount == null ? null : +x.statistics.viewCount, tags: x.snippet?.tags || [], seconds: isoSeconds(x.contentDetails?.duration) };
  });
}

/** Suggestion lists for every seed (and seed + a..z), then top videos per seed when there is an API key. */
export async function research(seeds, { get, alphabet = false, apiKey = '', quota, log = () => {} }) {
  const lists = [];
  for (const seed of seeds) {
    const queries = [seed, ...(alphabet ? [...'abcdefghijklmnopqrstuvwxyz'].map((c) => `${seed} ${c}`) : [])];
    for (const q of queries) {
      for (const source of ['youtube', 'google']) {
        const url = `${SUGGEST}?${new URLSearchParams({ client: 'firefox', ...(source === 'youtube' ? { ds: 'yt' } : {}), q })}`;
        lists.push({ seed, query: q, source, items: await get(url, { label: 'the suggestion service', parse: parseSuggestions }) });
      }
    }
    log(`suggestions: ${seed} (${queries.length * 2} lists)`);
  }
  if (!apiKey) return { lists, videos: null };
  const videos = {};
  for (const seed of seeds) { videos[seed] = await topVideos(seed, { get, apiKey, quota }); log(`top videos: ${seed}`); }
  return { lists, videos };
}

/** One row per distinct suggestion: in both YouTube and Google lists first, then by best position (1 = first in its list). */
export function rankSuggestions(lists) {
  const m = new Map();
  for (const { source, items } of lists) {
    items.forEach((text, i) => {
      const k = text.toLowerCase();
      const e = m.get(k) || { text, youtube: null, google: null };
      e[source] = e[source] == null ? i + 1 : Math.min(e[source], i + 1);
      m.set(k, e);
    });
  }
  const both = (e) => (e.youtube != null && e.google != null ? 1 : 0);
  const best = (e) => Math.min(e.youtube ?? Infinity, e.google ?? Infinity);
  return [...m.values()].sort((a, b) => both(b) - both(a) || best(a) - best(b) || a.text.localeCompare(b.text));
}

const STOP = new Set('a an and are as at be by for from how i in is it my of on or the this to vs what why with you your'.split(' '));
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const clock = (sec) => (sec == null ? '?' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`);
const count = (words) => [...words.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/** The Markdown report (pure: everything comes in as arguments). */
export function buildReport({ seeds, date, lists, videos, nowMs, maxSuggestions = 100 }) {
  const ranked = rankSuggestions(lists);
  const all = videos ? Object.values(videos).flat() : [];
  const out = [
    `# SEO research: ${seeds.join(', ')}`,
    '',
    `Date ${date} (Pacific). Made by \`node tools/seo.js research\`; how to read it: docs/seo.md.`,
    '',
    '> Suggestions show RELATIVE interest: what people start to type, in the order Google ranks it. They are NOT search volume, and no',
    '> number in this report is a count of searches. Positions are 1 = first in a list.',
    '',
    `## Suggestions (${ranked.length} distinct, from ${lists.length} lists)`,
    '',
    'Ranked: in both the YouTube and the Google list first, then by best position.',
    '',
    '| rank | suggestion | YouTube position | Google position |',
    '|---|---|---|---|',
    ...ranked.slice(0, maxSuggestions).map((e, i) => `| ${i + 1} | ${cell(e.text)} | ${e.youtube ?? ''} | ${e.google ?? ''} |`),
  ];
  if (ranked.length > maxSuggestions) out.push('', `(${ranked.length - maxSuggestions} more not shown)`);
  out.push('', '## Top videos', '');
  if (!videos) {
    out.push('Skipped: no YOUTUBE_API_KEY in .env.local, so no videos were looked up (docs/seo.md says how to make a free key).');
  } else {
    for (const seed of seeds) {
      const vs = videos[seed] || [];
      out.push(`### ${seed}`, '');
      if (!vs.length) { out.push('No videos returned.', ''); continue; }
      out.push('| # | title | channel | published | views | views per day | length |', '|---|---|---|---|---|---|---|');
      vs.forEach((v, i) => {
        const days = Math.max(1, (nowMs - Date.parse(v.publishedAt)) / DAY);
        out.push(`| ${i + 1} | [${cell(v.title)}](https://www.youtube.com/watch?v=${v.id}) | ${cell(v.channel)} | ${(v.publishedAt || '').slice(0, 10)} | ${v.views ?? '?'} | ${v.views == null ? '?' : Math.round(v.views / days)} | ${clock(v.seconds)} |`);
      });
      out.push('');
    }
    const tags = count(all.flatMap((v) => [...new Set(v.tags.map((t) => t.toLowerCase().trim()))]));
    out.push(`## Tags across the top videos (${all.filter((v) => v.tags.length).length} of ${all.length} videos have tags)`, '');
    out.push(...(tags.length ? ['| tag | videos |', '|---|---|', ...tags.slice(0, 30).map(([t, n]) => `| ${cell(t)} | ${n} |`)] : ['No tags.']));
    const lens = all.map((v) => v.title.length);
    const words = count(all.flatMap((v) => [...new Set(v.title.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [])].filter((w) => !STOP.has(w) && w.length > 1))).filter(([, n]) => n > 1);
    out.push('', '## Title patterns', '');
    out.push(lens.length ? `Length in characters: shortest ${Math.min(...lens)}, median ${median(lens)}, longest ${Math.max(...lens)} (YouTube allows 100).` : 'No titles.');
    out.push('', `Words in two or more titles: ${words.length ? words.slice(0, 15).map(([w, n]) => `${w} (${n})`).join(', ') : 'none'}.`);
    const secs = all.map((v) => v.seconds).filter((s) => s != null);
    out.push('', '## Length', '', secs.length ? `Shortest ${clock(Math.min(...secs))}, median ${clock(median(secs))}, longest ${clock(Math.max(...secs))}.` : 'No lengths.');
  }
  out.push('', '## Gaps', '');
  if (!videos) out.push('Needs the top videos (an API key).');
  else {
    const titles = all.map((v) => v.title.toLowerCase());
    const gaps = ranked.filter((e) => !titles.some((t) => t.includes(e.text.toLowerCase())));
    out.push('Suggestions that no top-video title contains (in rank order): candidate angles, not proof of demand.', '');
    out.push(...(gaps.length ? gaps.slice(0, 25).map((e) => `- ${e.text}`) : ['None: every suggestion appears in a title.']));
  }
  return `${out.join('\n')}\n`;
}

export const slug = (seeds) => `${seeds[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'seeds'}${seeds.length > 1 ? `-and-${seeds.length - 1}-more` : ''}`;

// ---- analytics ----
export const REAUTH = [
  'The YouTube sign-in does not include the read-only Analytics permissions. Sign in again with them (this replaces .secrets/token.json;',
  'upload keeps working because the new sign-in asks for the upload permissions too):',
  '  node tools/youtube.js auth --manual --analytics',
  '  # open the link, approve all four permissions, copy the address of the "can\'t connect" page, then within 10 minutes:',
  "  node tools/youtube.js auth --finish '<the address you copied>'",
  '  node tools/seo.js analytics',
  '(On a machine with a browser: node tools/youtube.js auth --analytics. A later sign-in WITHOUT --analytics drops these permissions again.)',
].join('\n');
const ENABLE = 'The YouTube Analytics API is not enabled in your Google Cloud project: Console > APIs & Services > Library, search "YouTube Analytics API", Enable, then run this again.';

/** Scopes from the analytics set that a saved sign-in lacks (the token file records what Google granted). */
export const missingScopes = (granted) => ANALYTICS_SCOPES.filter((s) => !String(granted || '').split(' ').includes(s));

/** A readable message for a failed reports.query, with re-auth steps for a missing scope. */
export function analyticsProblem(status, body) {
  let e = {};
  try { e = JSON.parse(body).error || {}; } catch { /* not json */ }
  const said = [e.message, e.status, ...(e.errors || []).map((x) => x.reason), ...(e.details || []).map((d) => d.reason)].join(' ');
  if (/SERVICE_DISABLED|accessNotConfigured|has not been used in project|is disabled/i.test(said)) return ENABLE;
  if (status === 403 && /insufficient|SCOPE/i.test(said)) return `YouTube Analytics answered 403 (insufficient permissions).\n${REAUTH}`;
  return `YouTube Analytics answered HTTP ${status}: ${e.message || String(body).slice(0, 200)}`;
}

export function analyticsUrl({ days = 28, video, today }) {
  const start = new Date(Date.parse(`${today}T00:00:00Z`) - days * DAY).toISOString().slice(0, 10);
  const q = new URLSearchParams({ ids: 'channel==MINE', startDate: start, endDate: today, metrics: 'views,estimatedMinutesWatched', dimensions: 'insightTrafficSourceDetail', filters: `insightTrafficSourceType==YT_SEARCH${video ? `;video==${video}` : ''}`, sort: '-views', maxResults: '25' });
  return `${ANALYTICS}?${q}`;
}

/** Same files and refresh as tools/youtube.js (docs/upload.md); checks the saved scopes before any request. */
async function accessToken(fetchFn) {
  const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join('.secrets', f), 'utf8')); } catch { return null; } };
  const c = read('client_secret.json')?.installed;
  const t = read('token.json');
  if (!c || !t?.refresh_token) throw new StopError(`not signed in (no .secrets/client_secret.json or token.json; setup: docs/upload.md).\n${REAUTH}`);
  if (t.scope && missingScopes(t.scope).length) throw new StopError(`the saved sign-in lacks ${missingScopes(t.scope).join(' ')}.\n${REAUTH}`);
  const r = await fetchFn(c.token_uri, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: t.refresh_token, grant_type: 'refresh_token' }) });
  const j = await r.json();
  if (!r.ok) throw new StopError(j.error === 'invalid_grant' ? `the sign-in has expired (Testing-mode sign-ins lapse after 7 days).\n${REAUTH}` : `could not refresh the sign-in: ${j.error_description || j.error}`);
  return j.access_token;
}

export async function analytics({ days, video, fetch: fetchFn = globalThis.fetch, now = Date.now, log = console.log }) {
  const token = await accessToken(fetchFn);
  const r = await fetchFn(analyticsUrl({ days, video, today: pacificDate(now()) }), { headers: { authorization: `Bearer ${token}` } });
  const body = await r.text();
  if (!r.ok) throw new StopError(analyticsProblem(r.status, body));
  const rows = JSON.parse(body).rows || [];
  log(`YouTube search terms that brought viewers, last ${days} days${video ? ` (video ${video})` : ' (whole channel)'}:`);
  if (!rows.length) log('No rows: YouTube reported no search terms for this period.');
  else log(['   views  minutes  search term', ...rows.map(([term, views, minutes]) => `${String(views).padStart(8)} ${String(Math.round(minutes)).padStart(8)}  ${term}`)].join('\n'));
}

// ---- command line ----
const USAGE = 'usage:\n  node tools/seo.js research <term> [<term>...] [--seeds file] [--alphabet] [--out dir]\n  node tools/seo.js quota\n  node tools/seo.js analytics [--days 28] [--video id]';

export async function main(argv, { env = { ...loadEnv(), ...process.env }, log = console.log } = {}) {
  const [cmd, ...rest] = argv;
  const VALUED = ['--seeds', '--out', '--days', '--video'];
  const flag = (n, d) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : d; };
  const terms = rest.filter((a, i) => !a.startsWith('--') && !VALUED.includes(rest[i - 1]));
  const budgets = { units: Number(env.SEO_QUOTA_BUDGET || 800), search: Number(env.SEO_SEARCH_BUDGET || 50) };
  if (!(budgets.units >= 0 && budgets.search >= 0)) throw new StopError('SEO_QUOTA_BUDGET and SEO_SEARCH_BUDGET must be numbers');
  const quota = quotaGuard({ file: '.cache/seo/quota.json', budgets });
  if (cmd === 'quota') {
    const d = quota.today();
    log(`YouTube Data API use on ${d.date} (Pacific; resets at midnight Pacific time), counted by this tool only:\n  search.list calls: ${d.search} of ${budgets.search} (SEO_SEARCH_BUDGET; Google's own limit is 100 calls a day)\n  other units:       ${d.units} of ${budgets.units} (SEO_QUOTA_BUDGET; Google's 10,000 a day are shared with uploads)\nThe Cloud Console (APIs & Services > YouTube Data API v3 > Quotas) shows the whole project.`);
  } else if (cmd === 'analytics') {
    const days = Number(flag('--days', 28));
    if (!(days >= 1)) throw new StopError('--days must be 1 or more');
    await analytics({ days, video: flag('--video'), log });
  } else if (cmd === 'research') {
    const file = flag('--seeds');
    const seeds = [...terms, ...(file ? fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : [])];
    if (!seeds.length) throw new StopError(USAGE);
    log('Seeds are sent to Google: type public topics only, never private names.');
    const hits = scanText(seeds.join('\n'), { file: 'seeds', denylist: loadDenylist(path.resolve('safety/denylist.txt')) });
    if (hits.length) throw new StopError(`content-safety: the seeds look private; nothing was sent:\n${formatFindings(hits)}`);
    const apiKey = env.YOUTUBE_API_KEY || '';
    if (!apiKey) log('No YOUTUBE_API_KEY in .env.local: suggestions only, no top-video lookup (docs/seo.md says how to make a free key).');
    const res = await research(seeds, { get: makeClient(), alphabet: rest.includes('--alphabet'), apiKey, quota, log });
    const date = pacificDate(Date.now());
    const out = path.join(flag('--out', 'seo-reports'), `${date}-${slug(seeds)}.md`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buildReport({ seeds, date, ...res, nowMs: Date.now() }));
    log(`report: ${out}`);
  } else throw new StopError(USAGE);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((e) => { console.error(`seo: ${e.message}`); process.exit(1); });
}
