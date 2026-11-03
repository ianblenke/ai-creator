# Scene brief: 06-the-names-list

Write `scenes/06-the-names-list.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 61.60 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

The first thing the agent will ask you for is the one thing that protects you. This pipeline reads your scripts and puts words on screen, so it needs to know which names must never appear. Copy the example list of names to block, and put your own in it: machine names, your user name, family names. The safety gate is a check that runs before the main stages and stops them if one of those names shows up in a script, a scene or a subtitle. Until you fill the list in, every step that checks prints a loud warning: the gate still runs, but it does not know your names. Then switch on the git hooks, small checks that git runs before every commit. They refuse a commit that includes your private files or any audio, but they do not read the text of your scripts. The gate does that when you run a stage.

## Visual intent

- A page of short bars, the example list, with invented names. Your own private names replace them as magenta-ringed bars, then a gate drawn as a bar across a path stops a leaking line. A small banner of warning marks sits over the page until it is filled in.

## Word times (scene-local seconds, word)

```
1.34 The
1.48 first
1.74 thing
1.94 the
2.14 agent
2.40 will
2.68 ask
2.90 you
3.06 for
3.52 is
3.64 the
3.90 one
4.12 thing
4.42 that
4.70 protects
5.26 you.
7.08 This
7.38 pipeline
7.92 reads
8.20 your
8.40 scripts
9.16 and
9.30 puts
9.64 words
10.14 on
10.36 screen,
11.42 so
11.60 it
11.70 needs
11.98 to
12.12 know
12.38 which
12.72 names
13.16 must
13.54 never
13.86 appear.
15.63 Copy
15.96 the
16.10 example
16.58 list
16.84 of
17.02 names
17.38 to
17.52 block,
18.41 and
18.55 put
18.75 your
18.95 own
19.15 in
19.27 it:
19.95 machine
20.33 names,
21.03 your
21.27 user
21.55 name,
22.07 family
22.49 names.
24.47 The
24.63 safety
25.05 gate
25.51 is
25.65 a
25.73 check
25.99 that
26.15 runs
26.45 before
26.83 the
26.93 main
27.17 stages
28.01 and
28.19 stops
28.61 them
28.95 if
29.19 one
29.31 of
29.41 those
29.69 names
30.07 shows
30.51 up
30.83 in
30.95 a
31.05 script,
31.95 a
32.07 scene
32.65 or
32.81 a
32.89 subtitle.
34.55 Until
34.81 you
34.95 fill
35.19 the
35.31 list
35.65 in,
36.21 every
36.55 step
36.97 that
37.25 checks
37.81 prints
38.41 a
38.55 loud
38.89 warning:
39.89 the
40.01 gate
40.35 still
40.69 runs,
41.65 but
41.81 it
41.91 does
42.15 not
42.59 know
42.79 your
42.99 names.
44.71 Then
45.01 switch
45.45 on
45.57 the
45.71 git
45.93 hooks,
46.79 small
47.17 checks
47.53 that
47.75 git
48.01 runs
48.33 before
48.75 every
48.99 commit.
50.94 They
51.12 refuse
51.58 a
51.74 commit
52.28 that
52.48 includes
52.88 your
53.06 private
53.46 files
54.10 or
54.36 any
54.66 audio,
55.68 but
55.86 they
56.10 do
56.32 not
56.64 read
56.88 the
57.02 text
57.40 of
57.50 your
57.70 scripts.
59.40 The
59.54 gate
59.80 does
60.06 that
60.40 when
60.56 you
60.70 run
60.86 a
60.94 stage.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
