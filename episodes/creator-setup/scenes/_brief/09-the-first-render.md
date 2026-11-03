# Scene brief: 09-the-first-render

Write `scenes/09-the-first-render.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 52.84 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Now the offline run, one stage at a time. First the silent narration. Then alignment, which finds when each word is said. Then the scene briefs, a short description of each picture, and keyframes, still frames to check the layout. Last, a draft render of the moving pictures, and a draft video that joins them with the sound. Each stage prints a last line you can compare with the docs. The draft render took about a minute once, on a machine with twenty-four cores and no graphics card, and about two on a copy. This runs on the example where it ships. Your own episodes go in an episodes folder, which a fresh copy does not have yet, and the docs show the one command that makes it.

## Visual intent

- The track of six stops fills left to right, each lighting with a green tick as its name is spoken. A flat silent line at the top becomes a rendered frame at the end, then the draft video file appears.

## Word times (scene-local seconds, word)

```
0.54 Now
0.70 the
0.94 offline
1.70 run,
2.04 one
2.20 stage
2.52 at
2.64 a
2.72 time.
4.28 First
4.66 the
4.86 silent
5.26 narration.
6.76 Then
6.98 alignment,
7.80 which
8.04 finds
8.36 when
8.50 each
8.70 word
8.98 is
9.12 said.
10.94 Then
11.46 the
11.64 scene
11.94 briefs,
12.67 a
12.83 short
13.11 description
13.77 of
13.99 each
14.25 picture,
15.13 and
15.27 keyframes,
16.45 still
16.79 frames
17.19 to
17.35 check
17.61 the
17.73 layout.
19.57 Last,
20.61 a
20.69 draft
21.11 render
21.69 of
21.81 the
21.93 moving
22.23 pictures,
23.27 and
23.39 a
23.47 draft
23.85 video
24.23 that
24.39 joins
24.73 them
24.89 with
25.07 the
25.21 sound.
27.31 Each
27.59 stage
28.15 prints
28.45 a
28.57 last
29.03 line
29.35 you
29.49 can
29.65 compare
30.09 with
30.23 the
30.35 docs.
31.83 The
31.97 draft
32.35 render
32.69 took
32.91 about
33.15 a
33.25 minute
33.63 once,
34.42 on
34.51 a
34.60 machine
35.10 with
35.30 twenty-four
35.92 cores
36.70 and
36.86 no
37.04 graphics
37.52 card,
38.42 and
38.54 about
38.88 two
39.34 on
39.44 a
39.52 copy.
41.20 This
41.48 runs
41.80 on
41.90 the
42.06 example
42.52 where
42.74 it
42.86 ships.
44.64 Your
44.92 own
45.18 episodes
45.90 go
46.16 in
46.28 an
46.44 episodes
46.90 folder,
47.72 which
47.94 a
48.12 fresh
48.52 copy
48.96 does
49.20 not
49.42 have
49.70 yet,
50.56 and
50.70 the
50.82 docs
51.20 show
51.46 the
51.62 one
51.80 command
52.14 that
52.32 makes
52.64 it.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
