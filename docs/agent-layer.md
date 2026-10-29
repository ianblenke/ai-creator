# The agent layer: hosted models for scenes and reviews

Most of the pipeline runs on your own machine. Five steps do not: they need a strong hosted language model, driven through a coding
agent. This page says what those steps are, what they need, how to run each prompt in `prompts/`, and what is not known yet.

## What needs a hosted model

| step | prompt | what the model does | access |
|---|---|---|---|
| script critique | `prompts/script-critic.md` | attacks claims, density and structure before you record | read-only |
| flow review | `prompts/flow-review.md` | listens to the whole script for abrupt subject changes | read-only |
| scene authoring | `prompts/scene-author.md` | writes one scene module from its brief, once per scene | writes one file |
| keyframe review | `prompts/keyframe-review.md` | finds what is wrong in one scene's keyframes | read-only |
| continuity review | `prompts/continuity-review.md` | compares the scenes against each other and the bible | read-only |

You can also let the agent run the pipeline stages for you; the rules it should follow are in `templates/CLAUDE.md` (copy it to your
own project root as `CLAUDE.md`). Voice, alignment, rendering and every gate run locally and need no hosted model.

## What you need, stated plainly
- **A paid account.** The series runs these steps with Claude Code, which needs a paid Claude plan or an Anthropic API key. Check the
  plans and prices yourself on the day you start; they change.
- **Cost: not measured.** No token count or price per episode has been logged for this repository yet. A scene author makes many
  tool calls on a long scene; expect the scene steps to dominate. Until a measured, dated number is published here, plan for it being
  the largest running cost of an episode.
- **Model names will go stale.** As of 2026-10-29 the series uses Claude Opus 5.5 (`--model opus`, an alias that moves to the newest
  Opus) for scene authoring and every review. That choice is one author's judgement from a side-by-side on two scenes of an earlier
  project, not a measurement in this repository. Re-check which model is strongest when you start, and write down the date.
- **The non-Claude path is untested.** The prompts are plain text, so you can paste them into another chat model or coding agent. Then
  the isolation, the read-only access and the gate re-runs below become your job, by hand. Nobody has run an episode that way yet.
  Two second-opinion reviewers from other vendors were tried on the example's keyframes (`docs/trials/`); that is all.

## The rule that matters most: you re-run the gates
A scene author can say its scene is clean and be wrong: a coarse layout step has let real overlaps through. After every author round,
run these yourself, from the repository root. They are written in the host form, which needs Node 22.23.4 or newer, `npm ci` and
Playwright's Chromium on the host; in a Docker-only setup prefix each `node` line with `docker compose run --rm --entrypoint`
and write `media` before the script path (README, "Host commands and container commands"):

    node tools/check-anchors.js episodes/<id>
    node tools/lint-scene.js episodes/<id>/scenes/<NN-scene-id>.js
    node tools/layout-check.js episodes/<id> <NN> --step 0.1

`layout-check` must report `layout clean`. Then `node tools/cli.js keyframes episodes/<id> <NN>` renders the frames for review. After
three review rounds `keyframes` asks for a human: look at the scene yourself before another round. And after any edit that a script or
an agent made to `script.md`, read the text back before you record it.

## Isolation: one clean directory per call
A scene author sees only its brief, the bible, `docs/scene-contract.md`, `tools/stage/style.js` and the kit. It cannot copy what it
cannot see, and it cannot leak a name from a file it never opened. Reviewers get only what they review, and no write access. The
recipe: copy the inputs into a fresh temporary directory, run the agent there with a restricted tool list, copy the result back.

This is isolation by convenience, not a sandbox: the agent still loads your user-level settings and memory, and it is the tool list
(not the directory) that stops it writing elsewhere. Never add `--dangerously-skip-permissions` (or another tool's "skip all
approvals" flag) to these commands: the tool list is what keeps a reviewer read-only.

The commands below match `claude --help` of Claude Code 2.1 on 2026-10-29. The recipe as a whole has not been run end to end in this
repository's CI (it needs a paid account); flags change, so check `claude --help` first. `sed '1,/^---$/d'` drops each prompt file's
header and keeps the prompt.

Common to every call (from the repository root):

    ep=episodes/ep02-topic
    w=$(mktemp -d)

**Scene author** (one call per scene; `s` is the brief's name):

    s=03-the-first-idea
    cp $ep/scenes/_brief/$s.md $ep/scenes/_brief/_bible.md docs/scene-contract.md docs/visual-kit.md \
       tools/stage/style.js tools/stage/kit.js "$w"/
    # and any shared cast module the bible names, for example: cp $ep/scenes/_cast.js "$w"/
    sed "1,/^---\$/d; s/NN-scene-id/$s/g" prompts/scene-author.md > "$w/PROMPT.md"
    (cd "$w" && claude -p "$(cat PROMPT.md)" --model opus --tools "Read,Write,Edit" --permission-mode acceptEdits)
    cp "$w/$s.js" $ep/scenes/
    # now the three gates above, yourself

For a revision round, append the gate output or the reviewer's findings to `PROMPT.md` in the same directory and run it again.

**Script critic** and **flow review** (read-only):

    cp $ep/script.md $ep/facts.md $ep/plan.md "$w"/
    mkdir -p $ep/reviews
    sed '1,/^---$/d' prompts/script-critic.md > "$w/PROMPT.md"
    (cd "$w" && claude -p "$(cat PROMPT.md)" --model opus --tools "Read") > $ep/reviews/critic-1.txt

The flow review is the same with `prompts/flow-review.md`, a fresh directory and only `script.md` copied in (a listener has no fact
sheet). Fix every HIGH and MEDIUM it lists, then run it again on the new script.

**Keyframe review** (one scene, read-only):

    mkdir "$w/frames"
    cp $ep/scenes/_brief/$s.md "$w/brief.md"; cp $ep/scenes/_brief/_bible.md "$w"/; cp $ep/keyframes/$s/*.png "$w/frames/"
    sed '1,/^---$/d' prompts/keyframe-review.md > "$w/PROMPT.md"
    (cd "$w" && claude -p "$(cat PROMPT.md)" --model opus --tools "Read") > $ep/reviews/$s-keyframes-1.txt

**Continuity review** (whole episode, read-only):

    cp $ep/script.md $ep/scenes/_brief/_bible.md "$w"/; cp -r $ep/keyframes "$w/frames"
    sed '1,/^---$/d' prompts/continuity-review.md > "$w/PROMPT.md"
    (cd "$w" && claude -p "$(cat PROMPT.md)" --model opus --tools "Read") > $ep/reviews/continuity-1.txt

Paste its "continuity addendum" into the bible's last section, send the scenes it names back to their authors, and review again.

## The order that worked
critic, fix, flow review, fix (both before any synthesis); after `align` and `scenes`: one author per scene, your gates, keyframes,
one keyframe review per scene, a revision round, a continuity review with its bible addendum, a second review and revision round,
and your gates again before `render --check`.
