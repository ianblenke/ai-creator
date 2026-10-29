# Prompt: scene author

Run this in a clean working directory that holds ONLY the files listed under "Inputs" (see `docs/agent-layer.md` for the recipe).
The author must not see the script, the facts, other scenes or the rest of the repository: what it cannot see, it cannot copy or leak.
Paste everything below the line as the prompt. Replace `NN-scene-id` with the brief's file name.

---

You are writing ONE scene of an animated 2D explainer video as an ES module. The narration is already recorded; your scene is drawn
in step with it.

## Inputs (all in your working directory; read every one before writing)
- `NN-scene-id.md`: the brief. Narration, visual intent, duration and the time of every spoken word (scene-local seconds).
- `_bible.md`: the series look, the cast (what each shape and colour means) and the hard rules. It overrides the brief.
- `scene-contract.md`: the module format (`meta.cues`, `setup`, `render(ctx, t)`), the `ctx` object, what is banned.
- `style.js`, `kit.js`, `visual-kit.md`: the palette, fonts and the kit (stage, camera, spotlight, flow dots, type sizes).
- Any shared cast module the bible names (for example a `_cast.js`): draw the cast only with it.

## Output
- Write exactly one file: `NN-scene-id.js`. Do not create or change any other file.
- Then reply with: the cue list (name, anchor phrase, time from the brief), and every place where you departed from the brief and why.
  Do not say the scene is "clean" or "passes": you cannot run the gates here, and the creator runs them after you.

## Rules
1. A pure function of time. Every attribute and pixel `render` sets depends only on `t`, the timeline and `ctx.rand(seed)`. No `Date`,
   `Math.random`, `fetch`, timers, `requestAnimationFrame`, CSS or SMIL animation. Frames are drawn in any order.
2. Imports: `style`, `kit`, `three` and relative files only. No external URLs or fonts.
3. Show only what the narration and the visual intent say. Nothing drawn that is not said; nothing said that is never drawn.
4. Sync: an element appears when its word is spoken (within 0.5 s). Every visual change is a cue in `meta.cues` whose anchor is a
   phrase copied VERBATIM from the brief's narration (same words, same spelling; punctuation may differ). Check each anchor against
   the word list before you finish.
5. No dead stretch: something visibly changes at least every 4 s. A long stretch of narration with nothing new to show still gets
   motion that carries meaning (a label typed word by word as it is spoken, a camera glide, the spotlight moving), not decoration.
6. One persistent diagram that builds is better than a series of slides. Earlier parts dim (to about 0.35) instead of vanishing.
7. Text: at least 38 px, the narration's own words, at most about 5 words per label. Never text over text: fade one fully out before
   the next comes in. No numbers, names or brands on screen that the narration does not say.
8. The frame: keep text inside the safe margins and above the subtitle strip (the bottom 140 px). NOTHING may be cut by the frame
   edge at any time, even dimmed: fade it out or move the camera.
9. The ending: the last state restates the scene's one point in one big phrase (56 px or more), ends on a wide view, and is held
   through the 0.6 s tail after `ctx.duration`.
10. Never write a hostname, IP address, port, file path, user name, device, room, place or person's name anywhere in the file,
    including comments.

## If you are given gate output
A revision round appends the creator's gate output (`check-anchors`, `lint-scene`, `layout-check --step 0.1`, `pacing`) or a
reviewer's findings. Fix every item, change nothing else, and list each item with what you changed.
