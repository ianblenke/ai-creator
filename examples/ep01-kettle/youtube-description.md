# Upload draft: How a Kettle Knows When to Switch Off

`node tools/youtube.js upload <episode-dir>` reads the sections below: a numbered title list (`--title N` picks one), the description, and the
chapter lines (appended to the description). The dry run fails unless the description keeps BOTH voice lines in "How this was made": the
synthetic-voice line and the "Voice model:" credit with its licence and link. Which engine narrated this example is not recorded (it ships
no audio), so the credit is left for you to fill in with the lane you render it with.

## Title options
1. How a Kettle Knows When to Switch Off

## Description

A kettle has no clock and no screen, yet it stops by itself the moment the water boils. In many kettles the trick is steam: a small pipe carries it to a disc made of two metals, the disc bends as it warms, then snaps, and the snap pulls the power contacts apart. A separate part guards the kettle when someone switches it on empty.

Sources
Every claim in this video comes from the episode's fact sheet (facts.md, next to the script), with a public source for each fact and a list of what is deliberately NOT claimed. Mechanisms vary between kettles, so the video says "many kettles" or "one design" where that matters. Main sources:
- Electric kettle (Wikipedia): https://en.wikipedia.org/wiki/Electric_kettle
- Steam-sensing switch patent US6914514: https://patents.google.com/patent/US6914514
- Dry-boil protection patent US4539468: https://patents.google.com/patent/US4539468

How this was made
This is the worked example of an open, spec-first pipeline for narrated 2D explainers: a written script, a sourced fact sheet, scenes drawn as code and timed to the narration.
The narration is a synthetic voice, generated with the text-to-speech model credited on the next line; it is not a recording of anyone reading.
Voice model: [fill in: the voice model you used, its maker, licence, the date you read the licence and a link, as in templates/youtube-description.md]

#kettle #howthingswork #engineering #explainer

## Chapters

0:00 The hook
0:20 The steam
0:39 The steam and the mountain
0:50 The disc that bends
1:18 The snap
1:46 The second safety
2:20 The reset
2:35 The close
2:52 The outro
