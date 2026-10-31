import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseSuggestions, rankSuggestions, makeClient, quotaGuard, pacificDate, research, buildReport, isoSeconds, analyticsProblem, analyticsUrl, missingScopes, slug, StopError, CACHE_MS, UA } from './seo.js';
import { SCOPES, ANALYTICS_SCOPES, authScopes } from './youtube-lib.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'seo-'));
const reply = (body, status = 200) => ({ status, ok: status < 400, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
// A fake network: answers by URL, records every call; the clock only moves when the client sleeps.
function fakeNet(answer) {
  const calls = [];
  const slept = [];
  let t = Date.parse('2026-10-30T12:00:00Z');
  return {
    calls, slept,
    now: () => t,
    advance: (ms) => { t += ms; },
    sleep: async (ms) => { slept.push(ms); t += ms; },
    fetch: async (url, init) => { calls.push({ url, init }); return answer(url); },
  };
}

test('suggestions parse from the firefox shape and the JSONP youtube shape', () => {
  // client=firefox, observed live 2026-10-30
  assert.deepEqual(parseSuggestions('["kettle",["kettle","kettle descaler"],[],{"google:suggestsubtypes":[[512],[512]]}]'), ['kettle', 'kettle descaler']);
  assert.deepEqual(parseSuggestions('window.google.ac.h(["kettle",[["kettle",0,[512]],["kettle boil",0,[512,433]]],{"k":1}])'), ['kettle', 'kettle boil']);
  assert.deepEqual(parseSuggestions('["x",[]]'), []);
  assert.throws(() => parseSuggestions('<html>unusual traffic</html>'), StopError);
});

test('ranking: a suggestion in both lists first, then by best position; duplicates merge case-insensitively', () => {
  const ranked = rankSuggestions([
    { source: 'youtube', items: ['kettle', 'kettle sound', 'Kettle Descaler'] },
    { source: 'google', items: ['kettle', 'kettle descaler', 'kettle price'] },
    { source: 'youtube', items: ['kettle sound'] }, // an alphabet expansion: best position wins
  ]);
  assert.deepEqual(ranked.map((e) => [e.text, e.youtube, e.google]), [
    ['kettle', 1, 1], ['Kettle Descaler', 3, 2], ['kettle sound', 1, null], ['kettle price', null, 3],
  ]);
});

test('the client caches identical requests on disk for 7 days, then asks again', async () => {
  const dir = tmp();
  const net = fakeNet(() => reply('["a",["a b"]]'));
  const get = makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: dir });
  assert.deepEqual(await get('https://x/?q=a', { parse: parseSuggestions }), ['a b']);
  assert.deepEqual(await get('https://x/?q=a', { parse: parseSuggestions }), ['a b']);
  assert.equal(net.calls.length, 1);
  assert.match(net.calls[0].init.headers['user-agent'], /^ai-creator-seo\//);
  assert.equal(net.calls[0].init.headers['user-agent'], UA);
  net.advance(CACHE_MS - 1000);
  await get('https://x/?q=a');
  assert.equal(net.calls.length, 1, 'still fresh just before 7 days');
  net.advance(2000);
  await get('https://x/?q=a');
  assert.equal(net.calls.length, 2, 'expired after 7 days');
});

test('a body that does not parse is not cached', async () => {
  const dir = tmp();
  let n = 0;
  const net = fakeNet(() => reply(n++ ? '["a",["ok"]]' : '<html>block</html>'));
  const get = makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: dir });
  await assert.rejects(get('https://x/?q=a', { parse: parseSuggestions }), StopError);
  assert.deepEqual(await get('https://x/?q=a', { parse: parseSuggestions }), ['ok']);
});

test('rate limit: at most one network request per second, using the injected sleep; cache hits do not wait', async () => {
  const net = fakeNet(() => reply('["a",[]]'));
  const get = makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: tmp() });
  await get('https://x/1');
  await get('https://x/2');
  net.advance(300);
  await get('https://x/3');
  await get('https://x/1');
  assert.deepEqual(net.slept, [1000, 700]);
  assert.equal(net.calls.length, 3);
});

test('HTTP 429 and 403 stop the run with a clear message and are not cached', async () => {
  for (const status of [429, 403]) {
    const net = fakeNet(() => reply({ error: { message: 'slow down' } }, status));
    const get = makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: tmp() });
    await assert.rejects(get('https://x/?q=a', { label: 'the suggestion service' }), (e) => e instanceof StopError && new RegExp(`the suggestion service answered HTTP ${status} \\(slow down\\): stopping, no retries`).test(e.message));
  }
  const net = fakeNet(() => reply('', 429));
  await assert.rejects(research(['kettle', 'tea'], { get: makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: tmp() }) }), StopError);
  assert.equal(net.calls.length, 1, 'nothing more is sent after a 429');
});

test('quota: persisted per Pacific date, rolls over at Pacific midnight, refuses a call over budget', () => {
  const file = path.join(tmp(), 'quota.json');
  let t = Date.parse('2026-10-31T06:59:00Z'); // 23:59 on Oct 30 in Pacific daylight time (UTC-7)
  const q = quotaGuard({ file, budgets: { search: 2, units: 1 }, now: () => t });
  assert.equal(pacificDate(t), '2026-10-30');
  q.charge('search.list');
  q.charge('videos.list');
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { '2026-10-30': { search: 1, units: 1 } });
  assert.throws(() => q.charge('videos.list'), /over the budget of 1; nothing was sent.*SEO_QUOTA_BUDGET/);
  assert.equal(q.today().units, 1, 'a refused call records nothing');
  t = Date.parse('2026-10-31T07:00:00Z'); // Pacific midnight
  assert.deepEqual(q.today(), { date: '2026-10-31', search: 0, units: 0 });
  q.charge('videos.list');
  const again = quotaGuard({ file, budgets: { search: 2, units: 1 }, now: () => t });
  assert.equal(again.today().units, 1, 'read back from disk');
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8'))['2026-10-30'].search, 1);
  assert.throws(() => quotaGuard({ file: path.join(tmp(), 'q.json'), budgets: { search: 0, units: 9 } }).charge('search.list'), /SEO_SEARCH_BUDGET/);
});

const SEARCH = { items: [{ id: { videoId: 'v1' } }, { id: { videoId: 'v2' } }] };
const VIDEOS = { items: [
  { id: 'v2', snippet: { title: 'Kettle descaler test: vinegar or citric acid?', channelTitle: 'Home Lab', publishedAt: '2026-10-20T00:00:00Z', tags: ['Kettle', 'descaling'] }, statistics: { viewCount: '500' }, contentDetails: { duration: 'PT12M5S' } },
  { id: 'v1', snippet: { title: 'How a kettle knows when to stop | explained', channelTitle: 'Physics Desk', publishedAt: '2026-09-30T00:00:00Z', tags: ['kettle', 'thermostat'] }, statistics: { viewCount: '3000' }, contentDetails: { duration: 'PT4M' } },
] };
const answer = (url) => (url.includes('suggestqueries') ? reply(url.includes('ds=yt') ? '["kettle",["kettle","kettle sound","kettle descaler"]]' : '["kettle",["kettle","kettle descaler","kettle price"]]') : url.includes('/search?') ? reply(SEARCH) : reply(VIDEOS));

test('no API key: suggestions only, no Data API call, the report says it was skipped', async () => {
  const net = fakeNet(answer);
  const res = await research(['kettle'], { get: makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: tmp() }), alphabet: true });
  assert.equal(res.videos, null);
  assert.equal(net.calls.length, 54, '27 queries x 2 sources');
  assert.ok(net.calls.every((c) => c.url.startsWith('https://suggestqueries.google.com/complete/search?client=firefox')));
  assert.ok(net.calls.some((c) => c.url.includes('q=kettle+z')));
  const md = buildReport({ seeds: ['kettle'], date: '2026-10-30', ...res, nowMs: net.now() });
  assert.match(md, /Skipped: no YOUTUBE_API_KEY and no usable saved sign-in/);
  assert.match(md, /Needs the top videos/);
});

test('with a key: one search.list and one videos.list per seed, quota charged on misses only, key kept out of the cache key', async () => {
  const net = fakeNet(answer);
  const dir = tmp();
  const quota = quotaGuard({ file: path.join(dir, 'quota.json'), budgets: { search: 50, units: 800 }, now: net.now });
  const get = makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: dir });
  const res = await research(['kettle'], { get, apiKey: 'SECRETKEY', quota });
  const api = net.calls.filter((c) => c.url.includes('googleapis'));
  assert.equal(api.length, 2);
  assert.match(api[0].url, /\/youtube\/v3\/search\?part=snippet&type=video&maxResults=10&q=kettle&key=SECRETKEY$/);
  assert.match(api[1].url, /\/youtube\/v3\/videos\?part=snippet%2Cstatistics%2CcontentDetails&id=v1%2Cv2&key=/);
  assert.deepEqual(res.videos.kettle.map((v) => v.id), ['v1', 'v2'], 'search order kept');
  assert.deepEqual(quota.today(), { date: '2026-10-30', search: 1, units: 1 });
  await research(['kettle'], { get, apiKey: 'SECRETKEY', quota });
  assert.deepEqual(quota.today(), { date: '2026-10-30', search: 1, units: 1 }, 'cached: not charged again');
  for (const f of fs.readdirSync(dir)) assert.ok(!fs.readFileSync(path.join(dir, f), 'utf8').includes('SECRETKEY'));
});

test('with a sign-in token instead of a key: Bearer header, no key in the url, token kept out of the cache', async () => {
  const net = fakeNet(answer);
  const dir = tmp();
  const quota = quotaGuard({ file: path.join(dir, 'quota.json'), budgets: { search: 50, units: 800 }, now: net.now });
  const get = makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: dir });
  const res = await research(['kettle'], { get, token: 'SECRETTOKEN', quota });
  const api = net.calls.filter((c) => c.url.includes('googleapis'));
  assert.equal(api.length, 2);
  for (const c of api) { assert.ok(!c.url.includes('key=')); assert.equal(c.init.headers.authorization, 'Bearer SECRETTOKEN'); }
  assert.deepEqual(res.videos.kettle.map((v) => v.id), ['v1', 'v2']);
  for (const f of fs.readdirSync(dir)) assert.ok(!fs.readFileSync(path.join(dir, f), 'utf8').includes('SECRETTOKEN'));
});

test('report for a fixture: header, ranking, videos with views per day, tags, titles, lengths and gaps', async () => {
  const net = fakeNet(answer);
  const dir = tmp();
  const res = await research(['kettle'], { get: makeClient({ fetch: net.fetch, now: net.now, sleep: net.sleep, cacheDir: dir }), apiKey: 'k', quota: quotaGuard({ file: path.join(dir, 'q.json'), budgets: { search: 9, units: 9 } }) });
  const md = buildReport({ seeds: ['kettle'], date: '2026-10-30', ...res, nowMs: Date.parse('2026-10-30T00:00:00Z') });
  assert.match(md, /^# SEO research: kettle\n/);
  assert.match(md, /RELATIVE interest.*NOT search volume/s);
  assert.match(md, /\| 1 \| kettle \| 1 \| 1 \|\n\| 2 \| kettle descaler \| 3 \| 2 \|\n\| 3 \| kettle sound \| 2 \|  \|\n\| 4 \| kettle price \|  \| 3 \|/);
  assert.match(md, /\| 1 \| \[How a kettle knows when to stop \\\| explained\]\(https:\/\/www\.youtube\.com\/watch\?v=v1\) \| Physics Desk \| 2026-09-30 \| 3000 \| 100 \| 4:00 \|/);
  assert.match(md, /\| 2 \| .* \| 500 \| 50 \| 12:05 \|/);
  assert.match(md, /\| kettle \| 2 \|\n\| descaling \| 1 \|/);
  assert.match(md, /shortest 43, median 43, longest 45/);
  assert.match(md, /Words in two or more titles: kettle \(2\)\./);
  assert.match(md, /Shortest 4:00, median 4:00, longest 12:05\./);
  assert.match(md, /## Gaps\n\n.*\n\n- kettle sound\n- kettle price\n$/);
  assert.ok(!/kettle descaler\n/.test(md.split('## Gaps')[1]), 'a suggestion inside a title is not a gap');
});

test('durations, file names', () => {
  assert.equal(isoSeconds('PT1H2M3S'), 3723);
  assert.equal(isoSeconds('P1DT1S'), 86401);
  assert.equal(isoSeconds('P0D'), 0);
  assert.equal(isoSeconds(undefined), null);
  assert.equal(slug(['How Kettles Work!']), 'how-kettles-work');
  assert.equal(slug(['a', 'b', 'c']), 'a-and-2-more');
});

test('analytics: the documented query, and re-auth steps for a missing scope', () => {
  const u = new URL(analyticsUrl({ days: 28, video: 'abc', today: '2026-10-30' }));
  assert.equal(u.origin + u.pathname, 'https://youtubeanalytics.googleapis.com/v2/reports');
  assert.deepEqual(Object.fromEntries(u.searchParams), { ids: 'channel==MINE', startDate: '2026-10-02', endDate: '2026-10-30', metrics: 'views,estimatedMinutesWatched,averageViewDuration', dimensions: 'insightTrafficSourceDetail', filters: 'insightTrafficSourceType==YT_SEARCH;video==abc', sort: '-views', maxResults: '25' });
  const scopeErr = JSON.stringify({ error: { code: 403, message: 'Request had insufficient authentication scopes.', status: 'PERMISSION_DENIED', details: [{ reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' }] } });
  const m = analyticsProblem(403, scopeErr);
  assert.match(m, /insufficient permissions/);
  assert.match(m, /node tools\/youtube\.js auth --manual --analytics\n.*\n  node tools\/youtube\.js auth --finish/);
  assert.match(analyticsProblem(403, JSON.stringify({ error: { message: 'YouTube Analytics API has not been used in project 1 before or it is disabled.', errors: [{ reason: 'accessNotConfigured' }] } })), /not enabled in your Google Cloud project/);
  assert.match(analyticsProblem(400, '{"error":{"message":"Invalid query"}}'), /HTTP 400: Invalid query/);
  assert.deepEqual(missingScopes(SCOPES.join(' ')), ANALYTICS_SCOPES);
  assert.deepEqual(missingScopes(authScopes(true).join(' ')), []);
});
