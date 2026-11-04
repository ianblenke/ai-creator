# Scene brief: 07-the-flow-review

Write `scenes/07-the-flow-review.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 58.79 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

But the critic reads the script as a page, and a page is exactly where my jumps hid, the ones that viewer heard. That comment is why the second reviewer exists. The critic does check how each scene opens, but you will probably miss jumps too, because you already know why one topic follows the other. So the second reviewer is the flow review: an AI model that may only read your script, told to act as a listener who hears it once, from start to finish. It cannot see your headings, or the notes in the script that tell the animator what to draw. For every abrupt change it quotes the last sentence before and the first after, gives a severity of high, medium or low, and suggests a bridge of its own. It also lists terms used before they are explained, and references back to something you never said.

## Visual intent

- A script page with its heading bars crossed out, passing under a listener figure with a magnifier. At each gap a small card pops out: two quoted bars, a severity chip (high, medium, low) and a short bridge bar in green. A second list of two items: a term and a back-reference.

## Word times (scene-local seconds, word)

```
0.20 But
0.34 the
0.46 critic
0.78 reads
1.06 the
1.20 script
1.58 as
1.74 a
1.82 page,
2.82 and
2.96 a
3.04 page
3.50 is
3.66 exactly
4.18 where
4.36 my
4.58 jumps
4.94 hid,
5.82 the
6.06 ones
6.30 that
6.52 viewer
6.94 heard.
8.90 That
9.14 comment
9.62 is
9.74 why
9.94 the
10.12 second
10.48 reviewer
10.92 exists.
12.30 The
12.50 critic
12.94 does
13.34 check
13.64 how
13.92 each
14.16 scene
14.52 opens,
15.46 but
15.60 you
15.72 will
15.92 probably
16.48 miss
16.76 jumps
17.12 too,
17.94 because
18.20 you
18.36 already
18.64 know
18.88 why
19.26 one
19.48 topic
19.96 follows
20.40 the
20.60 other.
22.40 So
22.54 the
22.68 second
22.98 reviewer
23.34 is
23.44 the
23.56 flow
23.84 review:
24.74 an
24.92 AI
25.34 model
26.08 that
26.26 may
26.56 only
26.88 read
27.13 your
27.32 script,
28.26 told
28.56 to
28.82 act
29.05 as
29.17 a
29.26 listener
29.91 who
30.11 hears
30.38 it
30.63 once,
31.32 from
31.55 start
31.82 to
31.94 finish.
33.65 It
33.77 cannot
34.25 see
34.49 your
34.73 headings,
35.75 or
35.91 the
36.13 notes
36.45 in
36.55 the
36.67 script
37.23 that
37.49 tell
37.81 the
38.01 animator
38.53 what
38.71 to
38.85 draw.
40.69 For
40.97 every
41.25 abrupt
41.67 change
42.09 it
42.39 quotes
42.73 the
42.87 last
43.43 sentence
44.01 before
44.57 and
44.67 the
44.79 first
45.25 after,
46.15 gives
46.43 a
46.57 severity
47.21 of
47.39 high,
47.83 medium
48.23 or
48.39 low,
49.27 and
49.41 suggests
49.97 a
50.11 bridge
50.43 of
50.55 its
50.83 own.
52.31 It
52.43 also
52.79 lists
53.25 terms
53.93 used
54.15 before
54.53 they
54.67 are
54.81 explained,
55.95 and
56.13 references
56.83 back
57.19 to
57.35 something
57.75 you
57.93 never
58.29 said.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
