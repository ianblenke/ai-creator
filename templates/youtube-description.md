# Upload draft: [episode title]

`docker compose run --rm --entrypoint node media tools/youtube.js upload <episode-dir>` reads the sections below. Its dry run fails
unless "How this was made" keeps BOTH voice lines: a synthetic-voice line and the "Voice model:" credit with its licence and link, and
while any "[fill in ...]" is left. Change the model name, licence and date to the voice lane you actually used. Honest variants of the
first line also pass: "a cloned copy of <name>'s voice, used with their written permission, generated with <model>" or "a synthetic
preset voice (<voice id>), generated with <model>". The whole description must stay under 5000 bytes.

## Title options
1. [fill in the title]

## Description

[fill in: two or three sentences, the question and the answer]

Sources
[fill in: each main public source from facts.md, one per line, with its link]

How this was made
The narration is a cloned copy of my own voice, generated with Chatterbox. It is not a recording of me reading; the audio carries the model's built-in Perth watermark.
Voice model: Chatterbox by Resemble AI; code MIT licence, weights tagged MIT on the model page (licence read [fill in the date]): https://huggingface.co/ResembleAI/chatterbox

## Chapters

0:00 The hook
