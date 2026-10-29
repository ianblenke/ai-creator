# Second-opinion trial 1 (2026-10-26): reviewing keyframes of the kettle example

> **Read before copying any command below.** This is a dated record, not a recipe. The model names and CLI flags are those of
> 2026-10-26 and will go stale. The Gemini command used `--dangerously-skip-permissions`, which lets the agent run any command and
> write any file without asking: never use it (or any "skip all approvals" flag) on a machine or folder you care about. To run a
> reviewer today, use `prompts/keyframe-review.md` with a read-only tool list in a clean directory, as `docs/agent-layer.md` shows.
> Cost was not recorded; times are single runs (n = 1).

Same task, same material (a contact sheet of keyframes per scene, the narration, the bible), three independent reviewers, no one saw the others' notes:
- Claude Opus 5.5 (Agent tool): `opus.txt`, score 3/5, 4 HIGH + 13 other findings. Strong on continuity and the missing payoff of the guard scene.
- GPT-6.1 Terra (`codex exec -m gpt-6.1-terra`, read-only, sheets passed with `-i`): `terra.txt`, score 2/5, 5 HIGH + 11 others. Concise, strong on mechanism (the lever not connected to the contacts, the guard disc drawn away from the element), honest about what contact sheets cannot show.
- Gemini 4 Argon, High (`agy --model gemini-4-argon-high --dangerously-skip-permissions -p`): `argon.txt`, score 2/5, longest and most frame-specific (timing of the rod against the snap, ghost text at low opacity, text not verbatim from the narration, labels colliding, dead stretches).

Agreement (all three): the kettle changes silhouette and orientation; the sensor changes place (and sits in the water in scene 2); the disc curvature flips between scenes 4 and 5; the guard scene never shows the backup tripping; power circle moves.
Only one reviewer: rod appears after the snap and the upper contact "levitates" (Argon); "trip well under a boil" is not narration and misleads (Argon); no hand pressing the reset knob (Terra); the outro keeps the kettle (Terra, Argon).
Not checked: whether single-reviewer findings are all correct; all three work from sampled frames, so timing claims between frames are unverified.

Cost and time: not recorded this time. Next trial should log tokens, wall time and a count of findings that survived a human check.
Reproduce: `docs/trials/` holds the raw outputs; the prompt is in the commit message of this folder (also reproduced in `PROMPT.md` copy below).

## Round 2 (after one revision with a shared kettle module)
Same prompt and reviewers, on the revised frames. Scores: Opus 3 (was 3), Terra 3 (was 2), Argon 2 (was 2). Wall time: Terra 34 s, Argon 340 s, Opus about 250 s (subagent). Outputs: `round2/`.
The continuity faults (kettle, sensor place, disc curvature, steam style, power circle) were fixed and no reviewer repeated them. What remained, in agreement: the snap chain in scene 5 is already finished when it is narrated (all three), the guard/weld/backup order in scene 6, the reset in scene 7 happening too early, and steam not seen travelling the pipe in scene 2.
Lesson for the tutorial: review rounds fix what the sampled frames show; timing faults need frames pulled at the narrated word times, not evenly spaced ones.
