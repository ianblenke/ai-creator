# Scene brief: 03-what-you-need

Write `scenes/03-what-you-need.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 45.36 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

The short list starts with the machine itself, because everything else runs on top of it. The only system I tested is Linux on an ordinary Intel or AMD processor. Apple machines, Windows machines and machines with other kinds of chip are untested, so I will not promise them. You need Docker with Compose version two point two four or newer, because every pipeline stage runs inside a container, and you do not install Python or the audio tools yourself. A graphics card is optional, and it has to be an NVIDIA one: the voice is faster on it, but every stage also has a processor-only version.

## Visual intent

- A short checklist of four chips that tick on as they are spoken: a Linux slab labelled x86_64, a Docker box labelled 'Compose 2.24 or newer', a card slab drawn dashed for optional labelled 'NVIDIA', a processor chip. Untested systems appear dim and crossed out, never ticked.

## Word times (scene-local seconds, word)

```
0.80 The
1.00 short
1.32 list
1.88 starts
2.32 with
2.50 the
2.62 machine
3.06 itself,
4.14 because
4.66 everything
5.14 else
5.44 runs
5.80 on
5.94 top
6.24 of
6.38 it.
7.64 The
7.76 only
7.98 system
8.34 I
8.48 tested
9.16 is
9.38 Linux
9.86 on
9.98 an
10.18 ordinary
10.68 Intel
11.32 or
11.52 AMD
11.95 processor.
13.89 Apple
14.13 machines,
15.05 Windows
15.45 machines
16.09 and
16.25 machines
16.99 with
17.27 other
17.53 kinds
17.85 of
17.99 chip
18.49 are
18.69 untested,
19.87 so
20.03 I
20.11 will
20.31 not
20.51 promise
20.93 them.
22.61 You
22.73 need
22.95 Docker
23.43 with
23.65 Compose
24.17 version
24.57 two
24.79 point
25.05 two
25.29 four
25.87 or
26.05 newer,
26.95 because
27.47 every
27.73 pipeline
28.25 stage
28.65 runs
29.03 inside
29.49 a
29.57 container,
30.71 and
30.85 you
31.11 do
31.37 not
31.61 install
32.21 Python
33.09 or
33.23 the
33.47 audio
33.85 tools
34.15 yourself.
36.13 A
36.21 graphics
36.67 card
36.93 is
37.19 optional,
38.01 and
38.15 it
38.30 has
38.59 to
38.72 be
38.86 an
39.00 NVIDIA
39.53 one:
40.27 the
40.41 voice
40.72 is
40.88 faster
41.40 on
41.52 it,
42.20 but
42.46 every
42.76 stage
43.24 also
43.56 has
43.78 a
43.88 processor-only
44.82 version.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
