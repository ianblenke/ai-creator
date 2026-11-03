# Scene brief: 08-the-tests

Write `scenes/08-the-tests.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 21.00 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

When the build finishes, run the test suite inside the container before you trust anything else. It takes seconds. Look for zero failures, and then the word OK near the end. If it does not pass, fix that first: nothing after it is worth debugging on a broken base.

## Visual intent

- A row of small test squares turn green one after another, then one large OK. A single square drawn magenta and ringed, held to the side, stands for the case where it does not pass.

## Word times (scene-local seconds, word)

```
0.64 When
0.82 the
0.96 build
1.28 finishes,
2.22 run
2.58 the
2.72 test
3.04 suite
3.50 inside
4.00 the
4.10 container
4.90 before
5.23 you
5.40 trust
5.93 anything
6.37 else.
8.25 It
8.35 takes
8.67 seconds.
10.37 Look
10.57 for
10.71 zero
11.05 failures,
12.07 and
12.17 then
12.33 the
12.43 word
12.77 OK
13.37 near
13.57 the
13.77 end.
15.13 If
15.25 it
15.38 does
15.62 not
15.84 pass,
16.72 fix
17.00 that
17.22 first:
18.12 nothing
18.52 after
18.78 it
18.90 is
19.00 worth
19.24 debugging
19.82 on
19.92 a
20.00 broken
20.34 base.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
