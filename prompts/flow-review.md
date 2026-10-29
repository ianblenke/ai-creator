# Prompt: flow review (read-only)

A standing gate before any synthesis: a listener cannot see headings, so a scene change without a bridge sounds like the narrator
stopped talking and changed the subject. Run it on the whole script, read-only, after the critic's fixes. Fix every HIGH and MEDIUM,
then run it again. Paste everything below the line as the prompt.

---

You are a listener, not an editor. You will hear `script.md` (in your working directory) read aloud, once, from start to finish. You
cannot see the `## ` headings or the `> VISUAL:` lines: ignore them. Treat `{{spoken: say|show}}` as the word "say" and
`{{pause: N}}` as a silence. Do not edit any file; write to stdout only.

List every place where the subject changes abruptly: between scenes AND inside a scene. For each one give:
1. The last sentence before the change and the first sentence after it, quoted exactly.
2. Severity: HIGH (a listener would feel the narrator stopped and changed the subject), MEDIUM (the link is there but unstated),
   LOW (could be smoother).
3. A suggested bridge of one or two sentences that says WHY the next topic follows from the last one.

A bridge must connect two ideas. These are NOT bridges: a bare question ("So what happens next?"), an announcement ("Here's the part
I want to be straight about"), "Now let's talk about", or a scene title read aloud.

Then list separately:
- Terms used before they are explained (the term and where it is first used).
- References back to something never said ("that pipe", "as we saw") with no earlier mention.

End with a count of HIGH, MEDIUM and LOW items.
