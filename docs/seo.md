# SEO research: titles, tags and descriptions

`tools/seo.js` gathers free signals about what people search for on a topic and writes them into a Markdown report you read
before you write a title, tags and the description. Nothing in it is paid: Google's autocomplete, the YouTube Data API with a free
API key, and the YouTube Analytics API with your own sign-in.

    node tools/seo.js research <term> [<term>...] [--seeds file] [--alphabet] [--out dir]
    node tools/seo.js quota
    node tools/seo.js analytics [--days 28] [--video <video id>]

In a Docker-only setup: `docker compose run --rm --entrypoint node media tools/seo.js ...` (`analytics` needs the sign-in from
`docs/upload.md`, which is made on the host).

## What it does, and what it does not
- **Suggestions are relative interest, not search volume.** Autocomplete shows what people start to type, in the order Google ranks
  it. It gives no counts. A suggestion at position 1 is more common than one at position 8 for that prefix; that is all it says. The
  report says this in its header. No tool here tells you how many people search for anything.
- **The suggestion endpoint is unofficial.** `https://suggestqueries.google.com/complete/search` is what browsers call; Google does
  not document it as an API, it may change shape, break or rate-limit without notice, and whether scripted use is allowed by Google's
  terms is a grey area. So the tool stays polite: one request per second at most, every identical request cached on disk for 7 days
  (`.cache/seo/`), a User-Agent that names the tool, and a hard stop (no retries) on HTTP 429 or 403. Keep runs small; `--alphabet`
  turns one seed into 54 requests.
- **Seeds are sent to Google.** Type public topics only, never private names. The tool prints that warning and runs the
  content-safety scanner (`tools/safety/scan.js`, with your `safety/denylist.txt`) over the seeds; on a hit it refuses and sends
  nothing.
- **The top-video lookup needs a free API key** (`YOUTUBE_API_KEY` in `.env.local`). Without one, the report has suggestions only
  and says so.
- **Not tested live:** the YouTube Data API calls and the Analytics call. No API key or Analytics sign-in was available when the tool
  was written (2026-10-30); both are covered only by offline tests against recorded response shapes from Google's reference pages.
  The first real run is the test: read its output critically.

## The suggestion endpoint, observed
Two requests by hand on 2026-10-30 (seed "voice cloning", one with `ds=yt`, one without), each answered HTTP 200,
`content-type: text/javascript; charset=UTF-8`, with this shape (10 suggestions in each list; the fourth element varies):

    ["voice cloning",["voice cloning","voice cloning ai", ...],[],{"google:suggestsubtypes":[[512,433],[512], ...]}]

The parser also accepts the JSONP shape that `client=youtube` returns (`window.google.ac.h([...,[["text",0,[512]], ...]])`);
that shape was not requested live. Any other answer (a block page, HTML) stops the run and is not cached.

## research
For each seed:
1. **Autocomplete**: YouTube suggestions (`client=firefox&ds=yt`) and Google web suggestions (the same without `ds=yt`). With
   `--alphabet`, also the seed followed by a space and each letter a to z.
2. **Top videos** (only with an API key): `search.list` (type video, 10 results) for the seed itself, not for each suggestion, then
   one `videos.list` for those ids (title, channel, publish date, views, tags, length).
3. **The report**, by default `seo-reports/<date>-<seed>.md` (`--out` picks another folder). `seo-reports/` is gitignored and
   blocked by the repo check: it is your research, not part of the project.

The report has: the ranked suggestions (a suggestion in both the YouTube and the Google list ranks first, then by its best
position), the top videos per seed with views per day since publishing, a tag table across those videos (how many use each tag),
title lengths and the words that recur in titles, the length range, and **gaps**: suggestions that no top-video title contains.

`--seeds file` reads one seed per line (lines starting with `#` are skipped), added to any seeds on the command line.

### Example (fixture output)
From the offline test fixture in `tools/seo.test.js` (invented videos), shortened:

    # SEO research: kettle

    > Suggestions show RELATIVE interest: what people start to type, in the order Google ranks it. They are NOT search volume, ...

    | rank | suggestion | YouTube position | Google position |
    |---|---|---|---|
    | 1 | kettle | 1 | 1 |
    | 2 | kettle descaler | 3 | 2 |
    | 3 | kettle sound | 2 |  |
    | 4 | kettle price |  | 3 |

    | # | title | channel | published | views | views per day | length |
    |---|---|---|---|---|---|---|
    | 1 | [How a kettle knows when to stop \| explained](https://example.com/watch) | Physics Desk | 2026-09-30 | 3000 | 100 | 4:00 |
    | 2 | [Kettle descaler test: vinegar or citric acid?](https://example.com/watch) | Home Lab | 2026-10-20 | 500 | 50 | 12:05 |

    | tag | videos |
    |---|---|
    | kettle | 2 |
    | descaling | 1 |
    | thermostat | 1 |

    Length in characters: shortest 43, median 43, longest 45 (YouTube allows 100).
    Words in two or more titles: kettle (2).

    ## Gaps
    - kettle sound
    - kettle price

### Using the report
- **Title**: start from a high-ranked suggestion that matches what the episode really answers; prefer one in both lists. Use the
  wording people type ("kettle descaler") rather than your own jargon, keep it near the median length of the top titles, and keep it
  true to the episode: the honest title beats the popular one that the video does not deliver.
- **Gaps** are angles the current top videos do not name in their titles. They are candidates, not proof that anyone wants them.
- **Tags**: tags that several top videos share say how the topic is labelled. Add the ones that describe your video; do not copy
  tags that do not. (How much YouTube weighs tags was not checked for this page.)
- **Description**: put the suggestion wording in the first two sentences, in plain speech, and keep the whole description under the
  5000-byte limit the upload dry run checks (`docs/upload.md`).
- **Views per day** compares videos of different ages; it is not a forecast for yours.

## quota
`node tools/seo.js quota` prints what this tool used today. The YouTube day is a **Pacific-time** date ("Daily quotas reset at
midnight Pacific Time"), so the counts in `.cache/seo/quota.json` are kept per Pacific date.

From https://developers.google.com/youtube/v3/determine_quota_cost (read 2026-10-30, page last updated 2026-10-15 UTC), table rows:
`search.list` "100 quota per day. Each call costs 1 quota." and `videos.list` 1; the page says a project gets "a default quota
allocation of 100 search.list calls, 100 videos.insert calls, and 10,000 units per day combined for all other endpoints".

**This differs from older guides (and from earlier versions of that page) that charge `search.list` 100 units from the shared
10,000.** The tool follows the page as read: `search.list` counts against its own bucket, `videos.list` against the shared pool.
If Google changes the page back, change `COSTS` in `tools/seo.js`. Not verified: how the Cloud Console's Quotas page shows the
separate `search.list` bucket.

So one seed with a key costs 1 `search.list` call and 1 unit of the shared pool. Budgets the tool refuses to exceed (it checks before
each call and sends nothing over budget):

| setting | default | counts | Google's limit |
|---|---|---|---|
| `SEO_SEARCH_BUDGET` | 50 | `search.list` calls a day | 100 a day |
| `SEO_QUOTA_BUDGET` | 800 | units of the shared pool a day (`videos.list`) | 10,000 a day, shared with uploads (`docs/upload.md`, section 7: an upload uses about 450) |

The tool counts only its own calls; the Console shows the whole project. Cached answers cost nothing.

## A free API key
In the same Google Cloud project as the upload setup (`docs/upload.md`, section 1, where the YouTube Data API v3 is already enabled):
**APIs & Services > Credentials > Create credentials > API key**. Then restrict it (the key's page: **API restrictions > Restrict key
> YouTube Data API v3**), and put it in `.env.local`:

    YOUTUBE_API_KEY=<your key>

An API key reads public data only and is not a sign-in. Never commit it (`.env.local` is gitignored and blocked by the repo check).
These Console steps were not checked against Google's current pages on 2026-10-30: if a menu differs, follow the Console.

## analytics
`node tools/seo.js analytics --days 28` lists the YouTube search terms that brought viewers to your channel (or one video with
`--video <id>`): YouTube Analytics API v2 `reports.query` with `dimensions=insightTrafficSourceDetail`,
`filters=insightTrafficSourceType==YT_SEARCH`, `metrics=views,estimatedMinutesWatched`, `sort=-views`, `maxResults=25`. These are the
real terms viewers typed, so they are the best check of a title after an episode is out.

Pages read on 2026-10-30 (all last updated 2026-10-15 UTC): https://developers.google.com/youtube/analytics/reference/reports/query
(endpoint, parameters, scopes), https://developers.google.com/youtube/analytics/channel_reports (this report needs maxResults of 25 or
less and a sort) and https://developers.google.com/youtube/analytics/dimensions (with YT_SEARCH, the detail "specifies the search term").

**It needs two more permissions than uploading**, both read-only: `yt-analytics.readonly`, and `youtube.readonly`, because the
reports.query page says requests "now require access to the https://www.googleapis.com/auth/youtube.readonly scope". **NOT
CONFIRMED**: whether the upload sign-in's `youtube.force-ssl` would already satisfy that; the tool asks for `youtube.readonly`
explicitly rather than guess. Sign in again with them (the upload permissions are requested too, so uploads keep working):

    node tools/youtube.js auth --manual --analytics
    # open the link, approve the four permissions, copy the "can't connect" page's address, then within 10 minutes:
    node tools/youtube.js auth --finish '<the address you copied>'
    node tools/seo.js analytics

(`node tools/youtube.js auth --analytics` on a machine with a browser.) A later sign-in without `--analytics` drops these permissions
again, and the 7-day Testing-mode lapse applies as for uploads. Also enable the API: **APIs & Services > Library > "YouTube Analytics
API" > Enable**. The tool checks the saved sign-in's permissions before calling and, on a 403 for missing permissions or a disabled
API, prints these steps.

## Search Console (not built)
For the project's own docs site or repository pages (not YouTube), Google Search Console shows the real queries that found the site,
with clicks and impressions. It needs you to verify that you own the site (a DNS record or a file on it); it cannot be used for a site
you do not control, and nothing here calls it.

## Free alternatives, not built
- **Google Trends** shows relative interest over time and by region. It has no official public API; unofficial libraries scrape it
  and break often. Use the website by hand.
