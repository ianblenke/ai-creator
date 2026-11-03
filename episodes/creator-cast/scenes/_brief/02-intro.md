# Scene brief: 02-intro

Write `scenes/02-intro.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 34.90 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

To see why that matters, here is what this series builds: a video with narration, where every stage hands one job to one model. A few of them run on a graphics card at home, a few on an ordinary processor, and the rest are Claude models in the cloud. I name each one, say what it is good at, and say what it cannot do. For the main ones I also say what the license page said, and when. These are the models in early November of 2026, and they will change.

## Visual intent

- Four colour-coded stage chips in a row, one job each. A graphics-card slab, a processor chip and a cloud sit beneath as three homes; chips drop into their homes as the narration lists them.

## Word times (scene-local seconds, word)

```
0.64 To
0.74 see
0.90 why
1.06 that
1.26 matters,
2.12 here
2.38 is
2.48 what
2.66 this
2.84 series
3.28 builds:
4.22 a
4.32 video
4.72 with
4.92 narration,
6.08 where
6.42 every
6.78 stage
7.20 hands
7.70 one
7.90 job
8.34 to
8.60 one
8.76 model.
10.35 A
10.45 few
10.69 of
10.81 them
11.05 run
11.27 on
11.37 a
11.43 graphics
11.85 card
12.09 at
12.19 home,
13.05 a
13.13 few
13.41 on
13.53 an
13.73 ordinary
14.17 processor,
15.37 and
15.53 the
15.67 rest
16.17 are
16.35 Claude
16.79 models
17.31 in
17.41 the
17.53 cloud.
19.21 I
19.33 name
19.55 each
19.91 one,
20.53 say
20.73 what
20.91 it
21.03 is
21.15 good
21.43 at,
21.95 and
22.13 say
22.39 what
22.55 it
22.65 cannot
23.11 do.
24.59 For
24.73 the
24.88 main
25.20 ones
25.42 I
25.60 also
25.92 say
26.18 what
26.36 the
26.52 license
26.98 page
27.28 said,
28.12 and
28.28 when.
29.90 These
30.34 are
30.48 the
30.60 models
30.98 in
31.14 early
31.46 November
31.94 of
32.20 2026,
33.64 and
33.80 they
33.96 will
34.18 change.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
