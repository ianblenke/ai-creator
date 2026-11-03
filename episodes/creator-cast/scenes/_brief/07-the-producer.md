# Scene brief: 07-the-producer

Write `scenes/07-the-producer.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 37.36 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Those models do not coordinate themselves, so one more program sits above them: Claude Code, which runs on my machine and calls Claude models in the cloud. It runs the stages in order and starts the picture authors and the reviewers. Then it runs every layout check itself again, to confirm each result, instead of trusting an author who reports that its own work is clean. Each author sees only its own brief and a few reference files, and each reviewer can only read, so an author does not review its own scenes.

## Visual intent

- A producer figure on a desk (a local program) with lines up to cloud shapes; it hands four small files to an author figure and a read-only eye to a reviewer figure, then re-runs a check mark itself on each result.

## Word times (scene-local seconds, word)

```
0.66 Those
0.96 models
1.30 do
1.46 not
1.66 coordinate
2.14 themselves,
3.30 so
3.58 one
3.72 more
3.96 program
4.68 sits
4.98 above
5.26 them:
6.02 Claude
6.46 Code,
7.44 which
7.66 runs
7.94 on
8.06 my
8.24 machine
8.92 and
9.08 calls
9.54 Claude
9.98 models
10.56 in
10.68 the
10.80 cloud.
11.92 It
12.03 runs
12.28 the
12.41 stages
13.04 in
13.27 order
13.85 and
13.99 starts
14.35 the
14.49 picture
14.87 authors
15.35 and
15.49 the
15.65 reviewers.
17.67 Then
17.89 it
18.01 runs
18.43 every
18.73 layout
19.07 check
19.31 itself
19.69 again,
20.57 to
20.71 confirm
21.45 each
21.89 result,
22.81 instead
23.13 of
23.25 trusting
23.65 an
23.87 author
24.43 who
24.61 reports
25.07 that
25.27 its
25.51 own
25.69 work
25.99 is
26.15 clean.
27.95 Each
28.25 author
28.57 sees
28.99 only
29.25 its
29.53 own
29.75 brief
30.51 and
30.63 a
30.75 few
31.03 reference
31.49 files,
32.47 and
32.65 each
32.87 reviewer
33.29 can
33.47 only
33.75 read,
34.63 so
34.81 an
34.97 author
35.26 does
35.56 not
35.84 review
36.23 its
36.41 own
36.64 scenes.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
