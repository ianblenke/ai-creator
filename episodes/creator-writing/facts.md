# Writing for the Ear: facts (sources are the repo's own docs and prompts, read 2026-11-04)

## The flow review (prompts/flow-review.md)
- It is a read-only standing gate run on the whole script before any synthesis, after the critic's fixes; fix every HIGH and MEDIUM, then run it again.
- The reviewer is told to act as a listener who will hear the script read aloud once, who cannot see the scene headings or the visual lines, and who must not edit any file.
- For every abrupt change of subject, between scenes and inside a scene, it gives: the last sentence before and the first after, quoted; a severity of HIGH, MEDIUM or LOW; and a suggested bridge of one or two sentences that says why the next topic follows.
- It also lists terms used before they are explained, and references back to something never said. It ends with a count of HIGH, MEDIUM and LOW items.
- The prompt names things that are not bridges: a bare question, an announcement such as "Here's the part I want to be straight about", "Now let's talk about", and a scene title read aloud.
- It is given only script.md, no fact sheet, because a listener has no fact sheet (docs/agent-layer.md).
## The critic (prompts/script-critic.md)
- It is adversarial and read-only, must not be the model or session that wrote the script, and gets no write access; it runs before any synthesis.
- Inputs: script.md, facts.md and plan.md if present.
- It checks seven things: claims (every claim and number backed by facts.md, nothing stronger than its source, a measurement with its date and conditions); the thesis; density (one story per scene, two to three numbers at most); bare facts (each fact needs a clause on why the listener should care); bridges; the ear (sentences too long for one breath, ambiguous words, homographs such as "read", terms used before they are explained, references to something never said); and disclosure of any host, address, port, path, user name, device, room, place or person.
- Its output is a numbered list, most severe first, each item with the scene, the severity, the exact sentence, what is wrong and a concrete rewrite; then the thesis in one sentence as it heard it, and a one-line verdict: "ready to record" or "fix first".
## How they are run (docs/agent-layer.md)
- Each runs from a fresh working folder holding only its inputs, with the Claude Code agent in print mode, the Opus model and tools limited to Read.
- The order that worked: critic, fix, flow review, fix, both before any synthesis.
- The doc says its choice of Opus for reviews is one author's judgement from a side-by-side on two scenes of an earlier project.
## The writing guidelines (docs/script-format.md)
- Every scene opens with a connective sentence that ties back to the previous scene or poses the question this scene answers; never open a scene on a bare fact.
- Do not stack fragments to deliver facts; give each fact a clause that says why the listener should care.
- A homograph such as "read" is fixed with {{spoken: reed|read}}; phrases that must be pronounced correctly go in must-hear.txt.
## Where the flow review came from (our own practice, told as process)
- In my earlier series, a viewer commented that one of my videos "just stops talking and changes the subject". The cause was that my rule "every scene opens with a connective lead-in" was being met with a bare question or an announcement, which bridges nothing. I then made the flow review a standing check, run on the whole script before any recording (dated 2026-10-20; paraphrased, no name).
## The kettle sentences
- Made up for this video to show the difference between a list and a reason; they are not facts about any real kettle and are said to be made up.
## NOT claimed
- Any number of problems the reviewers find, or how much time they save. That they catch everything. That Opus is better than other models, beyond the repo doc's own "one author's judgement".
- That the reviewers can hear: they read text, so sound problems are for the voice checks in a later part.
