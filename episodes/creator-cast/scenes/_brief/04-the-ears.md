# Scene brief: 04-the-ears

Write `scenes/04-the-ears.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 43.94 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

A synthetic voice can slip, by dropping a word or adding a sound, so two more models check every recording. An aligner finds exactly when each word starts and ends, and that is what lets every picture line up with the audio. A speech recognizer writes down what it hears, and I compare that with the script. Both run on a regular processor, and an AI agent read their license pages on October twenty-eighth: BSD for the aligner, MIT for the recognizer. The recognizer has one blind spot: if the voice adds an extra sound to a word, it still writes the right word, and it never hears a sniff.

## Visual intent

- A waveform ruler with word blocks snapped to it (the aligner), and below it a script page and a heard-text strip compared by a small compare mark (the recognizer). A magenta extra syllable slips in and the strip still shows the right word.

## Word times (scene-local seconds, word)

```
0.80 A
0.88 synthetic
1.44 voice
1.82 can
2.10 slip,
2.82 by
3.00 dropping
3.42 a
3.52 word
4.08 or
4.30 adding
4.60 a
4.70 sound,
5.68 so
5.94 two
6.16 more
6.40 models
6.90 check
7.30 every
7.58 recording.
9.16 An
9.28 aligner
9.92 finds
10.28 exactly
11.14 when
11.47 each
11.70 word
12.06 starts
12.50 and
12.67 ends,
13.47 and
13.65 that
14.01 is
14.11 what
14.29 lets
14.59 every
14.89 picture
15.31 line
15.59 up
15.71 with
15.87 the
16.03 audio.
17.61 A
17.69 speech
18.09 recognizer
19.01 writes
19.37 down
19.65 what
19.83 it
19.95 hears,
20.69 and
20.81 I
20.91 compare
21.41 that
21.69 with
21.89 the
22.01 script.
23.95 Both
24.23 run
24.43 on
24.51 a
24.61 regular
24.99 processor,
26.23 and
26.37 an
26.59 AI
27.13 agent
27.45 read
27.63 their
27.83 license
28.29 pages
28.81 on
28.97 October
29.51 twenty-eighth:
30.65 BSD
31.23 for
31.35 the
31.49 aligner,
32.25 MIT
32.69 for
32.81 the
32.95 recognizer.
34.83 The
34.99 recognizer
35.71 has
36.05 one
36.23 blind
36.58 spot:
37.50 if
37.62 the
37.78 voice
38.24 adds
38.46 an
38.64 extra
38.98 sound
39.28 to
39.46 a
39.56 word,
40.48 it
40.64 still
40.98 writes
41.32 the
41.46 right
41.70 word,
42.50 and
42.62 it
42.78 never
43.04 hears
43.34 a
43.42 sniff.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
