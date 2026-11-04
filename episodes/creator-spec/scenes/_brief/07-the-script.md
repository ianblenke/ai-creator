# Scene brief: 07-the-script

Write `scenes/07-the-script.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 54.58 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

With the facts sorted, the script can use only the public pile, and its format is a few rules. Each heading with two hash marks starts a scene. The paragraphs under it are exactly what the voice will say. A line that starts with the visual marker is a note for whoever draws that scene; it is never spoken and never becomes a subtitle. A spoken-form tag fixes a misread word, and a pause marker gives exact silence. The validate command only checks that every scene has narration and a title of its own, and warns when the length is off your target. It cannot tell whether a scene connects to the one before. That is a reviewer's job, and it is the rule that matters most: every scene starts by tying itself to the previous one.

## Visual intent

- A script page with headings and paragraphs. A heading lights, then its paragraph, then a small note bar marked 'visual' that is crossed off the voice line. A spoken-form tag and a short silence bar appear next, then a green tick on a validate line, with a small question mark beside the joins between scenes.

## Word times (scene-local seconds, word)

```
0.72 With
0.90 the
1.06 facts
1.46 sorted,
2.16 the
2.30 script
2.62 can
2.84 use
3.16 only
3.44 the
3.58 public
3.94 pile,
4.88 and
5.02 its
5.24 format
5.78 is
5.92 a
6.02 few
6.28 rules.
8.08 Each
8.32 heading
8.68 with
8.92 two
9.18 hash
9.54 marks
10.04 starts
10.40 a
10.52 scene.
12.17 The
12.32 paragraphs
13.09 under
13.37 it
13.59 are
13.76 exactly
14.39 what
14.55 the
14.69 voice
14.99 will
15.23 say.
16.49 A
16.59 line
16.85 that
17.03 starts
17.35 with
17.51 the
17.71 visual
18.19 marker
18.83 is
18.95 a
19.03 note
19.25 for
19.43 whoever
19.85 draws
20.23 that
20.51 scene;
21.43 it
21.55 is
21.65 never
21.91 spoken
22.71 and
22.87 never
23.13 becomes
23.53 a
23.63 subtitle.
25.29 A
25.37 spoken-form
26.13 tag
26.51 fixes
26.99 a
27.07 misread
27.57 word,
28.37 and
28.51 a
28.61 pause
29.03 marker
29.41 gives
29.69 exact
30.27 silence.
32.35 The
32.53 validate
33.15 command
33.79 only
34.31 checks
34.69 that
34.97 every
35.29 scene
35.57 has
35.83 narration
36.59 and
36.73 a
36.93 title
37.31 of
37.44 its
37.68 own,
38.42 and
38.60 warns
39.04 when
39.22 the
39.36 length
39.82 is
40.00 off
40.16 your
40.34 target.
42.44 It
42.54 cannot
42.94 tell
43.48 whether
43.84 a
43.92 scene
44.24 connects
44.64 to
44.74 the
44.90 one
45.06 before.
46.80 That
47.10 is
47.24 a
47.32 reviewer's
47.80 job,
48.68 and
48.82 it
48.94 is
49.06 the
49.26 rule
49.58 that
49.74 matters
50.16 most:
51.04 every
51.46 scene
51.94 starts
52.36 by
52.58 tying
53.02 itself
53.46 to
53.58 the
53.70 previous
54.26 one.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
