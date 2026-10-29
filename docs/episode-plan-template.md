# Episode plan: [working title]

(`node tools/...` is the host form; in a Docker-only setup see the README, "Host commands and container commands".)

One page, written before the script. `node tools/cli.js new <id>` copies this file to `episodes/<id>/plan.md`. The script critic reads
it to check the script against the thesis. (The example series used a heavier spec tool; for one episode this page is enough.)

## Thesis
[One sentence the viewer should be able to repeat afterwards. Example: "A kettle switches off because steam bends a two-metal disc
until it snaps."]

## Audience
[Who is watching, what they already know, and the question they arrive with.]

## Not covered
[What this episode deliberately leaves out, so it stays one story. Each item can be a later episode.]

## Facts needed
[The claims the thesis depends on. Each becomes an item in `facts.md` with a source and a marker (measured / estimated / cited);
see `docs/fact-sheets.md`. A claim you cannot source does not go in the script.]
- [claim] (source to find: [where you expect to find it])

## Scene sketch
[5 to 10 lines, one per scene: the one point of that scene and the bridge from the previous one. One story and 2 to 3 numbers per scene.]
1. Hook: [the question or surprise]
2. [point], because [why it follows]

## Risks
- Accuracy: [claims that vary between cases ("many", "one design"), numbers that may change; how the video stays true, for example a
  spoken and on-screen "measured on <date>"].
- Disclosure: [anything private near this topic: machines, places, people. Add each name to `safety/denylist.txt`.]
- Rights: [images, music, logos or trademarks you plan to show, and their licences].

## Done when
- `validate`, `safety`, the critic and the flow review pass (no open HIGH or MEDIUM).
- Every scene passes `check-anchors`, `lint-scene` and `layout-check --step 0.1`, run by you.
- The final video's own audio track matches the script, and the description discloses the cloned voice and names the voice model.
