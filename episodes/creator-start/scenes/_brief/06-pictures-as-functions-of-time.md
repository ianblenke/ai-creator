# Scene brief: 06-pictures-as-functions-of-time

Write `scenes/06-pictures-as-functions-of-time.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 27.33 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

With the narration fixed, the pictures can be built to fit it. A cloud model writes each animation as a small piece of code, and each frame is drawn from the time alone. So the same moment always draws the same frame, and you can render a frame twice and compare. That is how I caught a ghost: a leftover copy of a moving shape, one frame wide, that I never would have seen by eye.

## Visual intent

- A clock reading 't' feeds a box that draws a frame. The same moment is fed in twice and two identical frames appear side by side. Then one frame shows a faint magenta leftover copy of a moving shape, one frame wide, found by laying the two frames over each other; the difference lights up magenta.

## Word times (scene-local seconds, word)

```
0.00 With
0.18 the
0.30 narration
0.90 fixed,
1.84 the
1.98 pictures
2.40 can
2.56 be
2.72 built
3.22 to
3.38 fit
3.66 it.
4.46 A
4.56 cloud
4.96 model
5.54 writes
5.98 each
6.36 animation
7.08 as
7.24 a
7.38 small
7.78 piece
8.06 of
8.22 code,
9.17 and
9.28 each
9.55 frame
9.98 is
10.14 drawn
10.61 from
10.81 the
10.97 time
11.37 alone.
12.43 So
12.59 the
12.75 same
13.07 moment
13.65 always
14.03 draws
14.41 the
14.57 same
14.91 frame,
15.87 and
15.97 you
16.11 can
16.33 render
16.67 a
16.77 frame
17.17 twice
18.05 and
18.17 compare.
19.39 That
19.59 is
19.71 how
19.91 I
20.03 caught
20.27 a
20.35 ghost:
21.33 a
21.43 leftover
21.97 copy
22.43 of
22.57 a
22.67 moving
23.05 shape,
23.95 one
24.17 frame
24.53 wide,
25.49 that
25.67 I
25.79 never
26.03 would
26.19 have
26.33 seen
26.61 by
26.99 eye.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
