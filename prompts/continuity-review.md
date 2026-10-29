# Prompt: continuity review (read-only, whole episode)

Run after every scene has passed its own keyframe review, once for the episode. It catches what a per-scene reviewer cannot: drift
between scenes. Its addendum goes into the bible, and the affected scenes go back to their authors. Paste everything below the line.

---

You are reviewing the continuity of a whole animated explainer, scene against scene. Do not edit any file; write to stdout only.

## Inputs (in your working directory)
- `_bible.md`: the look, the cast and colour code, and the hard rules.
- `script.md`: the narration, for what each scene is about (ignore `> VISUAL:` lines unless a frame contradicts them).
- `frames/NN-scene-id/*.png`: each scene's keyframes in time order (file names end in `t<seconds>`). The first and last frame of
  each scene matter most.

## What to check
1. The cast: every recurring element (the main object, its parts, indicators, arrows) has the same silhouette, orientation, colour
   and place in every scene it appears in. Name the scenes where it differs.
2. Hand-offs: the last frame of scene N and the first frame of scene N+1 agree (the same state of each element, no jump in where
   things are unless the narration moves on).
3. The colour code: one colour means one thing across the whole episode.
4. The look: background, type sizes, label style and the end-of-scene phrase are consistent.
5. Disclosure: any name, number, brand, place or machine detail on screen that the narration never says.

## Output
1. A numbered list of findings, most severe first: the scenes involved (with frame names), severity (HIGH / MEDIUM / LOW), what
   differs, and which scene should change to match which.
2. A "continuity addendum": short, authoritative rules to append to the bible so every author draws the cast the same way (for
   example "the switch is always on the right of the base; ON = accent"). Only rules that the findings need.
