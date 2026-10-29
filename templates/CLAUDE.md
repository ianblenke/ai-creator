# [Your series name]

<!-- Copy this file to the root of your own project as CLAUDE.md. Claude Code reads it at the start of every session, so it is where
     the agent's rules and your hard-won lessons live. Keep it short and specific; add a dated line whenever something goes wrong. -->

Narrated 2D explainer videos made with the ai-creator pipeline. Read `README.md`, `docs/script-format.md`, `docs/scene-contract.md`,
`docs/visual-kit.md`, `docs/fact-sheets.md` and `docs/agent-layer.md` before working on an episode.

Pipeline: `plan.md -> facts.md -> script.md -> critic + flow review -> tts -> align -> besttake (flagged scenes) -> desniff -> align -> asr -> takedefects ->
fixaudio (only if flagged) -> voicereview -> scenes (briefs) ->
scene authors -> keyframes + reviews -> render --check -> render -> verifyclips -> encode -> finalcheck`.
Everything runs in the tools container: `docker compose run --rm media <cmd> episodes/<id>` (scripts: `docker compose run --rm
--entrypoint node media tools/<script>.js ...`). Start an episode with `docker compose run --rm media new <id>`.

## Hard rules
- Never write a hostname, IP address, port, file path, user name, device, room, place or person's name into a script, scene, subtitle,
  description, thumbnail or commit message. Write generically ("the GPU box"). Add every private name to `safety/denylist.txt`.
- Facts come only from `episodes/<id>/facts.md` plus the public sources it cites. Never invent a number for a script or a visual.
- The voice is my own cloned voice only, with my consent note in `voice/`. Never clone anyone else's voice.
- Every video description says the narration is a synthetic (cloned) copy of my voice and names the voice model with its licence and link.
- Never commit audio of any voice, reference clips or their transcripts.

## How the agent works here
- Scene authors are sub-agents that see ONLY their brief, `scenes/_brief/_bible.md`, `docs/scene-contract.md`, `tools/stage/style.js`
  and the kit, each in its own clean directory (recipe in `docs/agent-layer.md`). Use the prompts in `prompts/`.
- Reviewers (critic, flow review, keyframe review, continuity review) are read-only and are never the session that wrote the work.
- Never trust a sub-agent's own "clean" report. After every author round, re-run yourself:
  `node tools/check-anchors.js episodes/<id>`, `node tools/lint-scene.js <scene file>`,
  `node tools/layout-check.js episodes/<id> <NN> --step 0.1` (a 0.5 s step has let real overlaps through).
- After any scripted edit, read the text back: an edit that fails before writing leaves the old text, and the voice then records it.
- After any script edit, run `check-anchors`: a reworded line breaks cues anchored on the old words.

## Writing
- Every scene opens with a bridge that connects to the previous idea and says why this one follows. A question or an announcement is
  not a bridge. Run `prompts/flow-review.md` on the whole script and fix every HIGH and MEDIUM before recording.
- One story per scene and 2 to 3 numbers at most. Explain each fact; don't fire facts.
- Run `prompts/script-critic.md` (read-only, a different session) before spending on synthesis.

## Lessons (dated, newest last)
- [date]: [what went wrong, and the rule that prevents it]
