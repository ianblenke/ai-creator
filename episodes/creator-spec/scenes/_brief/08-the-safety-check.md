# Scene brief: 08-the-safety-check

Write `scenes/08-the-safety-check.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 49.47 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Everything so far is text, and text is exactly what the safety check reads, so now it can do its work. It runs before the voice, the pictures and the render, and again before every upload. It reads every text file in the episode folder, and when the frames are made, the words the scenes actually draw. When it finds something, it prints the file and line, a hint, and a sample with most of it hidden, so the report never repeats the whole secret. Until your denylist has your own names in it, every command that runs the check prints a loud banner of exclamation marks. And once the banner is gone, that only means the list exists, not that it is complete.

## Visual intent

- A pipeline of five stops with the shield in front of each, then the shield again before an upload. The check prints a finding line with a masked sample as bars. A loud banner of marks rises over it, then fades, leaving a short list that is clearly unfinished.

## Word times (scene-local seconds, word)

```
0.76 Everything
1.22 so
1.44 far
1.74 is
1.92 text,
2.86 and
3.00 text
3.44 is
3.58 exactly
4.04 what
4.20 the
4.36 safety
4.80 check
5.16 reads,
5.92 so
6.14 now
6.52 it
6.60 can
6.86 do
7.10 its
7.30 work.
8.82 It
8.92 runs
9.20 before
9.58 the
9.70 voice,
10.52 the
10.66 pictures
11.44 and
11.56 the
11.70 render,
12.64 and
12.78 again
13.32 before
13.82 every
14.14 upload.
15.96 It
16.12 reads
16.58 every
16.90 text
17.24 file
17.56 in
17.66 the
17.82 episode
18.32 folder,
19.28 and
19.44 when
19.62 the
19.76 frames
20.16 are
20.30 made,
21.00 the
21.14 words
21.50 the
21.66 scenes
22.20 actually
22.66 draw.
24.58 When
24.74 it
24.86 finds
25.22 something,
25.94 it
26.08 prints
26.42 the
26.60 file
26.98 and
27.10 line,
27.92 a
28.04 hint,
28.78 and
28.92 a
29.04 sample
29.72 with
29.96 most
30.22 of
30.34 it
30.48 hidden,
31.36 so
31.64 the
31.78 report
32.34 never
32.64 repeats
33.08 the
33.20 whole
33.46 secret.
34.75 Until
35.03 your
35.21 denylist
36.06 has
36.27 your
36.49 own
36.69 names
37.03 in
37.17 it,
37.83 every
38.11 command
38.47 that
38.65 runs
38.91 the
39.05 check
39.56 prints
40.11 a
40.27 loud
40.69 banner
41.13 of
41.33 exclamation
41.99 marks.
43.63 And
43.81 once
43.99 the
44.13 banner
44.49 is
44.61 gone,
45.41 that
45.67 only
45.93 means
46.25 the
46.43 list
46.75 exists,
47.83 not
48.37 that
48.57 it
48.71 is
48.85 complete.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
