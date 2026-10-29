# Scene brief: 06-the-second-safety

Write `scenes/06-the-second-safety.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 33.04 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Everything so far assumes there is water, and that is a problem, because with no water there is no boil, and with no boil there is no steam to flip the disc. A separate part guards against that. In one design, it is a second small disc that snaps, pressed against the heating element. When the element gets too hot, since no water is carrying the heat away, that disc trips and cuts the power. That design also adds a further backup, set to trip at a higher temperature, which acts only if the guard itself fails, for example if its contacts weld shut.

## Visual intent

- The same kettle, empty. The heating element glows red, a second small disc against it flips, power goes dark. Then a faint second disc appears behind the first, labeled "backup".

## Word times (scene-local seconds, word)

```
0.64 Everything
1.04 so
1.26 far
1.52 assumes
1.92 there
2.10 is
2.22 water,
2.90 and
3.02 that
3.16 is
3.28 a
3.36 problem,
4.02 because
4.28 with
4.44 no
4.60 water
4.90 there
5.08 is
5.18 no
5.34 boil,
6.00 and
6.12 with
6.28 no
6.44 boil
6.70 there
6.86 is
6.98 no
7.16 steam
7.47 to
7.59 flip
7.84 the
7.95 disc.
8.84 A
8.97 separate
9.41 part
9.67 guards
9.95 against
10.23 that.
11.17 In
11.33 one
11.47 design,
12.35 it
12.45 is
12.57 a
12.67 second
13.03 small
13.35 disc
13.63 that
13.85 snaps,
14.83 pressed
15.17 against
15.45 the
15.55 heating
15.85 element.
17.07 When
17.21 the
17.31 element
17.61 gets
17.81 too
18.01 hot,
18.55 since
18.79 no
18.95 water
19.23 is
19.35 carrying
19.73 the
19.85 heat
20.11 away,
20.97 that
21.17 disc
21.47 trips
21.77 and
21.91 cuts
22.17 the
22.27 power.
23.61 That
23.79 design
24.20 also
24.48 adds
24.66 a
24.73 further
25.04 backup,
26.12 set
26.32 to
26.46 trip
26.72 at
26.82 a
26.88 higher
27.18 temperature,
28.18 which
28.44 acts
28.70 only
28.90 if
29.00 the
29.10 guard
29.34 itself
29.70 fails,
30.60 for
30.78 example
31.20 if
31.32 its
31.46 contacts
32.00 weld
32.34 shut.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
