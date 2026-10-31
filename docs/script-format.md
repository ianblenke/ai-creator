# Script format

`episodes/<id>/script.md` (the example: `examples/ep01-kettle/script.md`), the file you write by hand.

```
# Episode title

## Scene title            <- each level-2 heading starts a scene (id: NN-scene-title)

Narration paragraphs. Spoken-form override: {{spoken: thirty ninety | 3090}}
(spoken text goes to the voice and alignment, display text goes to subtitles)

> VISUAL: visual-intent notes for the scene author (the hosted model that writes the scene code); never spoken, never subtitled
```

- Text before the first `##` is not narrated (use it for target notes). One line there is read: `Duration: 3 - 4 min` sets the
  length window `validate` checks (default 5 to 8 minutes; the example has no such line, so it warns that 3.8 min is too short).
- `validate` fails on scenes without narration and on duplicate scene titles, and warns when the estimated length is outside the
  window. The estimate is the spoken words at 160 words per minute (the author's cloned voice) plus 0.6 s per scene (`tools/script.js`).
  Set `VOICE_WPM` to your own voice's rate in `.env.local` (the tools container reads it as its environment): count the words of one finished scene and divide by its length in minutes.
- Content-safety: no hostnames, IPs, ports, paths, device/room/person names. See `docs/safety.md`.

(`node tools/...` is the host form; in a Docker-only setup see the README, "Host commands and container commands".)

## Writing guidelines (learned from the first test episodes)
- Every scene opens with a connective sentence that ties back to the previous scene or poses the question this scene answers.
  Never open a scene on a bare fact.
- Don't stack fragments ("X, Y, and Z.") to deliver facts. Give each fact a clause that says why the listener should care.
- A scene whose first visual cue is more than ~3 s in needs something on screen for the lead-in (a question, a title).

## Pauses
`{{pause: 0.9}}` on its own line (between two paragraphs) inserts exactly that many seconds of silence at that point. The text before and after
the marker is synthesized separately and joined, so the pause does not depend on how the voice model treats a paragraph break. The marker is never
narrated, shown, subtitled or aligned. Use it for a beat after a punchline (about 0.8 to 1.2 s); do not use it inside a sentence.

You do not need a marker for ordinary punctuation: the tts stage synthesizes each sentence on its own and puts `VOICE_PAUSE_SENTENCE` (default 0.4 s)
after every `.`, `!` or `?`, and `VOICE_PAUSE_PARAGRAPH` (default 0.8 s) at a blank line. Commas are left to the voice model. A `{{pause}}` marker
replaces the automatic pause after its sentence. Pace is `VOICE_TEMPO` (see `docs/narration-quality.md`).

## Words the voice reads wrongly
The present or infinitive "read" (rhymes with "reed") can come out as "red". Write `{{spoken: reed|read}}` (or `{{spoken: re-reed|re-read}}`). The ASR check
cannot tell the two apart, so a human has to listen to these spots.


## Word-ending slips (pre-recording lint)
The narrator voice drops or doubles a final "-ed" or plural "-s"/"-es" before a consonant-initial word (for example "boiled the" heard as "boil the", or "kettles that" as "kettleses that"; these illustrate the pattern and are not from a recorded take). The transcript check cannot see an added syllable, so run `node tools/lint-endings.js episodes/<id>` BEFORE recording and fix every ERROR (a phrase the voice has garbled before). Fixes that work: a singular noun, a different verb, a word that starts with a vowel after the ending ("boiled over" instead of "boiled the water"), or a comma that makes a real pause. WARNINGS are patterns that tend to slip; read them and keep the risky phrase out of a sentence end. Add any new slip to `project/endings.known.json` (it starts empty).
