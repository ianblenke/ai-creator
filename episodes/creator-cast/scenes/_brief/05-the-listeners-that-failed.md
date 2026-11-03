# Scene brief: 05-the-listeners-that-failed

Write `scenes/05-the-listeners-that-failed.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 55.37 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

That blind spot made me want a third listener, one that can tell how the voice sounds, not only what it says. So I ran two AI models that take audio as input, and a naturalness score, on eighteen short clips, some clean and some with a sniff or a loud word that I added. In my test, with my prompt, both models said yes, unnatural pause, to every clip. The score gave the same number to the clean clips and to every broken one. What is promising is plainer: flag a sound only when it stands out from the rest of the same episode. That method found all four sniffs I had added, with two false alarms on the other clips. That was one test on one voice, and I have not checked it against my ears, so everything it flags is only a candidate that I listen to.

## Visual intent

- Three grey listener figures each stamp 'yes' on all eighteen clips, a tidy grid of squares. A flat meter sits at the same height for every clip. Then a baseline band appears under the waveforms; four magenta sniffs rise above it and get ringed, two stray rings flagged beside them.

## Word times (scene-local seconds, word)

```
0.64 That
0.88 blind
1.24 spot
1.68 made
1.92 me
2.08 want
2.42 a
2.52 third
2.84 listener,
3.78 one
3.92 that
4.04 can
4.22 tell
4.46 how
4.62 the
4.74 voice
5.06 sounds,
5.86 not
6.02 only
6.20 what
6.36 it
6.48 says.
8.32 So
8.50 I
8.62 ran
8.90 two
9.22 AI
9.54 models
9.92 that
10.10 take
10.44 audio
10.86 as
11.08 input,
12.02 and
12.16 a
12.26 naturalness
12.82 score,
13.68 on
13.88 eighteen
14.38 short
14.68 clips,
15.52 some
15.82 clean
16.18 and
16.34 some
16.70 with
16.90 a
17.04 sniff
17.78 or
17.92 a
18.00 loud
18.30 word
18.56 that
18.72 I
18.92 added.
20.76 In
20.88 my
21.08 test,
21.50 with
21.70 my
21.90 prompt,
22.60 both
22.90 models
23.28 said
23.54 yes,
24.13 unnatural
24.65 pause,
25.06 to
25.26 every
25.54 clip.
27.43 The
27.59 score
27.98 gave
28.20 the
28.37 same
28.65 number
29.07 to
29.20 the
29.38 clean
29.75 clips
30.47 and
30.60 to
30.91 every
31.20 broken
31.66 one.
33.09 What
33.26 is
33.43 promising
34.33 is
34.55 plainer:
35.59 flag
36.01 a
36.13 sound
36.79 only
36.99 when
37.15 it
37.27 stands
37.61 out
37.75 from
37.93 the
38.07 rest
38.29 of
38.39 the
38.51 same
38.77 episode.
40.65 That
40.91 method
41.25 found
41.63 all
41.85 four
42.21 sniffs
42.71 I
42.81 had
43.01 added,
43.83 with
44.05 two
44.37 false
44.75 alarms
45.23 on
45.31 the
45.45 other
45.67 clips.
47.03 That
47.23 was
47.49 one
47.69 test
48.09 on
48.29 one
48.49 voice,
49.41 and
49.55 I
49.63 have
49.79 not
50.07 checked
50.45 it
50.67 against
51.05 my
51.31 ears,
52.19 so
52.45 everything
52.87 it
52.99 flags
53.55 is
53.67 only
53.87 a
53.97 candidate
54.45 that
54.61 I
54.71 listen
55.03 to.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
