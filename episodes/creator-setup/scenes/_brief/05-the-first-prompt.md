# Scene brief: 05-the-first-prompt

Write `scenes/05-the-first-prompt.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 59.66 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Now you can ask the agent to do the setup for you. This is the prompt I would start with: read the readme and the full-run page, check my machine against the requirements, and tell me what is missing. Do not install anything without asking. Then copy the settings files, ask me for the names to block, build the image, run the tests, and render the offline example, and at any failure stop and show me the error. I ran that prompt in a fresh copy, in a read-only mode where the agent may read files but not run commands. It gave the same steps I ran by hand, and it came back with the right questions first: is Docker installed, which names to block, and do I want the draft or the final render. I did not let it run them. The next scenes are what it does, so you can check its work.

## Visual intent

- The terminal again, now a prompt card on a page: five short chips in a column, read, check, settings, build and test, render. A magenta stop sign sits on 'do not install without asking'. Beside it a small lock labelled 'read-only'. Three question bubbles rise from the agent: Docker, names, draft or final.

## Word times (scene-local seconds, word)

```
1.08 Now
1.34 you
1.46 can
1.70 ask
1.90 the
2.12 agent
2.46 to
2.60 do
2.80 the
2.94 setup
3.30 for
3.50 you.
5.40 This
5.62 is
5.76 the
5.90 prompt
6.34 I
6.42 would
6.62 start
6.90 with:
7.68 read
7.94 the
8.10 readme
8.62 and
8.74 the
8.86 full-run
9.34 page,
10.20 check
10.48 my
10.64 machine
11.02 against
11.34 the
11.50 requirements,
12.80 and
13.02 tell
13.26 me
13.38 what
13.56 is
13.72 missing.
15.38 Do
15.54 not
15.75 install
16.38 anything
16.76 without
17.15 asking.
19.29 Then
19.65 copy
20.03 the
20.17 settings
20.59 files,
21.55 ask
21.77 me
21.91 for
22.05 the
22.17 names
22.45 to
22.59 block,
23.53 build
23.79 the
24.01 image,
24.87 run
25.11 the
25.25 tests,
26.17 and
26.35 render
26.65 the
26.89 offline
27.33 example,
28.39 and
28.53 at
28.73 any
28.99 failure
29.41 stop
29.81 and
29.95 show
30.17 me
30.31 the
30.51 error.
32.25 I
32.37 ran
32.61 that
32.85 prompt
33.25 in
33.35 a
33.47 fresh
33.79 copy,
34.75 in
34.85 a
35.01 read-only
35.63 mode
36.13 where
36.31 the
36.55 agent
36.85 may
37.11 read
37.43 files
37.97 but
38.17 not
38.41 run
38.65 commands.
40.59 It
40.71 gave
40.99 the
41.19 same
41.57 steps
41.97 I
42.11 ran
42.39 by
42.63 hand,
43.59 and
43.71 it
43.83 came
44.13 back
44.41 with
44.59 the
44.73 right
44.97 questions
45.51 first:
46.45 is
46.67 Docker
47.19 installed,
48.18 which
48.45 names
48.78 to
48.94 block,
49.91 and
50.04 do
50.20 I
50.30 want
50.52 the
50.66 draft
51.14 or
51.26 the
51.40 final
51.76 render.
53.50 I
53.62 did
53.84 not
54.10 let
54.30 it
54.42 run
54.66 them.
56.18 The
56.32 next
56.70 scenes
57.08 are
57.22 what
57.40 it
57.50 does,
58.40 so
58.58 you
58.70 can
58.88 check
59.14 its
59.30 work.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
