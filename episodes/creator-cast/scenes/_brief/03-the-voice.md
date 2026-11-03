# Scene brief: 03-the-voice

Write `scenes/03-the-voice.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 45.31 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Start with the voice, because everything else follows its timing. Audio8, a small open model, runs on my own graphics card and clones my voice from one recording of me. Because it handles one request at a time, one card is enough. Its model card says Apache 2.0 for the code and weights, as an AI agent read it on the first of November, so check the page yourself. The card does not describe the training data, and the license does not say whose voice you may clone, so clone only your own. The model adds no watermark, so I put a line in each description saying the voice is synthetic.

## Visual intent

- A graphics card slab on the left with one waveform coming out of it, one request at a time, a single lane. A small license tag and a date stamp attach to it, then a magenta 'no watermark' note and a 'synthetic' label.

## Word times (scene-local seconds, word)

```
0.62 Start
0.92 with
1.08 the
1.20 voice,
2.16 because
2.62 everything
3.12 else
3.42 follows
3.84 its
4.02 timing.
5.72 Audio8,
6.96 a
7.06 small
7.50 open
7.78 model,
8.72 runs
9.04 on
9.16 my
9.36 own
9.54 graphics
10.02 card
10.72 and
10.86 clones
11.28 my
11.48 voice
11.84 from
12.16 one
12.32 recording
12.84 of
12.98 me.
13.88 Because
14.18 it
14.28 handles
14.86 one
15.02 request
15.44 at
15.56 a
15.64 time,
16.62 one
16.82 card
17.14 is
17.30 enough.
19.14 Its
19.34 model
19.67 card
20.00 says
20.36 Apache
20.89 2.0
21.61 for
21.75 the
21.86 code
22.58 and
22.77 weights,
23.71 as
23.87 an
24.07 AI
24.45 agent
24.87 read
25.05 it
25.21 on
25.29 the
25.43 first
25.75 of
25.91 November,
26.99 so
27.17 check
27.41 the
27.53 page
27.79 yourself.
29.29 The
29.47 card
30.07 does
30.27 not
30.49 describe
31.21 the
31.33 training
31.71 data,
32.61 and
32.73 the
32.87 license
33.35 does
33.55 not
33.87 say
34.21 whose
34.51 voice
34.81 you
34.97 may
35.15 clone,
36.07 so
36.29 clone
36.79 only
37.03 your
37.31 own.
38.99 The
39.13 model
39.57 adds
39.93 no
40.15 watermark,
41.29 so
41.43 I
41.55 put
41.75 a
41.87 line
42.25 in
42.49 each
42.73 description
43.49 saying
43.81 the
43.99 voice
44.39 is
44.57 synthetic.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
