# Start Here: facts and gates (creator series, [start])

No figures are spoken in this video. Everything below is a gate or an open item, not narration.

## Claims in the script and where they come from
- "A model read my script in a copy of my voice": the author's own voice only, cloned from the author's own reference clip (consent file in the repo; no voice audio is committed).
- "It said one word wrong; a check caught it": needs a REAL slip from the example's recorded takes (`reports/`), or the fallback in arc.md [start] (a sniff, then the same second cleaned). NOT yet chosen. Until then the cold open is a draft.
- "That is how I caught a ghost" (was "shipped"; critic: unsupported): a render ghost caught by rendering a frame twice and comparing; shown with the example's reverted-fix frame, labelled as a reconstruction. Do not claim it reached viewers.
- Cast as ROLES only: voice model on my own card, a recognizer, a hosted model that writes pictures, a producer agent. No names or versions.

## Gates before synthesis (from arc.md)
1. Look: B "Signal" (decided 2026-10-26).
2. Monetization off (decided 2026-10-26), so no YPP hold. Re-check if that changes.
3. Voice engine: Chatterbox original, settings F. Description carries the synthetic-voice line and "Voice model:" credit; upload sets containsSyntheticMedia.
4. Example episode finished with the author's clone and the author's approval of delivery (not done: kettle was only re-narrated once; `reports/` folder with frozen analyses does not exist yet).
5. Tag `part-00` cut only after M6 (clean-machine run) and the arc freeze.

## Pipeline gates still to run on this script
validate, flow review (read-only reviewer), adversarial critique, lint-endings, must-hear list, safety, then tts, besttake, desniff, align, asr, voicereview.

## Review log (2026-10-31)
Flow review (2 HIGH, 4 MEDIUM) and adversarial critique (3 HIGH, 3 MEDIUM) both folded into script.md: real bridges, ghost and producer agent defined, producer and picture model stated as CLOUD-based ("cloud", not "hosted", to dodge the -ed slip), end-card lines (links, 'posted as made', 'stands on its own') removed from narration, 'on your own' softened with the smallest-card line in the description, 'stronger' removed.
OPEN: the cold open says 'one word in it is wrong'; it is true only if a real slip is chosen. If the sniff fallback is used, change to 'one sound in it is wrong'. The clip itself is stage material, not narration.

## Narrator engine (2026-11-01)
- Narration engine: Audio8-TTS-Realistic 0.6B (Edge0), license Apache-2.0 as stated by its model card (read 2026-11-01); training-data provenance is not stated; the model adds NO watermark, so the description carries the "synthetic version of my own voice" disclosure.
- Cloned only from the author's own reference clip (kept outside the repo).
- Narration length 189 s; checks: stall check clean, transcript matches all 9 scenes, the author listened and approved (2026-11-01).
