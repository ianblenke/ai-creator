# Scene brief: 06-the-picture-writer

Write `scenes/06-the-picture-writer.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 42.28 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

With the sound covered, the other half of the video is what you see, and that is the one job where I pay for the strongest model I can get. Claude Opus, one of Anthropic's models, writes each animation as a small piece of code, and a second Opus session reviews the frames and looks for faults. I compared it with the smaller Sonnet model on two scenes with the same brief. On the denser scene Opus took about ten times longer, but I judged its animations much better, so the shorter time was not worth it. Two scenes is a small sample, so that is my judgement, not a benchmark.

## Visual intent

- A scene card with a code bracket is written by a large Opus figure and a smaller Sonnet figure side by side; two bars grow, Opus's about ten times longer, then Opus's frame glows the brighter. A reviewer magnifier looks for faults.

## Word times (scene-local seconds, word)

```
0.54 With
0.72 the
0.86 sound
1.22 covered,
2.18 the
2.40 other
2.70 half
2.98 of
3.08 the
3.20 video
3.78 is
3.92 what
4.10 you
4.30 see,
5.16 and
5.34 that
5.76 is
5.94 the
6.26 one
6.50 job
7.12 where
7.34 I
7.46 pay
7.84 for
8.00 the
8.16 strongest
8.74 model
9.14 I
9.22 can
9.40 get.
11.31 Claude
11.71 Opus,
12.63 one
12.75 of
12.91 Anthropic's
13.55 models,
14.53 writes
14.97 each
15.29 animation
16.01 as
16.17 a
16.25 small
16.57 piece
16.79 of
16.91 code,
17.79 and
17.93 a
18.07 second
18.57 Opus
18.87 session
19.37 reviews
19.87 the
19.99 frames
20.57 and
20.69 looks
20.95 for
21.15 faults.
22.95 I
23.07 compared
23.45 it
23.55 with
23.71 the
23.87 smaller
24.49 Sonnet
24.93 model
25.51 on
25.69 two
26.01 scenes
26.69 with
26.87 the
27.01 same
27.33 brief.
28.59 On
28.69 the
28.79 denser
29.23 scene
29.61 Opus
29.89 took
30.09 about
30.37 ten
30.61 times
30.95 longer,
31.89 but
32.06 I
32.16 judged
32.50 its
32.75 animations
33.41 much
33.66 better,
34.50 so
34.64 the
34.78 shorter
35.12 time
35.36 was
35.56 not
35.78 worth
36.10 it.
37.30 Two
37.54 scenes
37.94 is
38.08 a
38.18 small
38.54 sample,
39.46 so
39.66 that
39.88 is
40.04 my
40.24 judgement,
41.22 not
41.42 a
41.50 benchmark.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
