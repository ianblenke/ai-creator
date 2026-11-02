# Scene brief: 05-the-voice-goes-first

Write `scenes/05-the-voice-goes-first.js` following docs/scene-contract.md, the series bible (scenes/_brief/_bible.md) and tools/stage/style.js.

Duration: 19.90 s (scene-local time 0..duration; hold the final state for ~0.6 s after).

## Narration (what is spoken)

Once the script is solid, the voice comes next, because the narration sets the timing for everything else. Every picture is built to fit the audio, never the other way around. And because a voice model can slip in ways your ears miss, the pipeline checks the audio instead of trusting it.

## Visual intent

- A long waveform sits as a ruler across the middle. Picture blocks below it snap to the waveform's timing, never the other way around; a small arrow shows the direction from audio to picture. Then a magnifier slides along the waveform and a magenta mark appears where a slip hides.

## Word times (scene-local seconds, word)

```
0.12 Once
0.34 the
0.48 script
0.84 is
0.98 solid,
2.00 the
2.14 voice
2.48 comes
2.82 next,
3.76 because
4.08 the
4.22 narration
4.86 sets
5.20 the
5.32 timing
5.83 for
6.10 everything
6.63 else.
7.67 Every
7.95 picture
8.39 is
8.57 built
9.09 to
9.27 fit
9.53 the
9.81 audio,
10.79 never
11.09 the
11.27 other
11.49 way
11.69 around.
12.75 And
12.87 because
13.17 a
13.25 voice
13.61 model
14.15 can
14.41 slip
14.73 in
14.87 ways
15.35 your
15.63 ears
15.93 miss,
16.79 the
16.93 pipeline
17.45 checks
17.79 the
18.05 audio
18.67 instead
19.03 of
19.16 trusting
19.68 it.
```

Attention rule: a new visual change at least every 4 s; key terms appear when spoken. Declare each change as a cue in `meta.cues` with an anchor phrase.
