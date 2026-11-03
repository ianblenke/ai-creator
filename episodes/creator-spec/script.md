# One Problem per Episode: Specs, Facts and What Never Goes on Screen
Duration: 5 - 7 min
Voice: ian. Sources and dates are in facts.md; at most three numbers per scene.

## Cold open
I added one line to a script on purpose: a made-up machine name, a made-up address and a made-up port. If that line had reached the voice, my voice clone would have read it out loud. Instead, the safety check caught it before any recording, and it told me which line and what kind of thing it had found. A word you do not notice is the one that ends up public, and that check only knows what it has been taught. So most of this part is about what comes before it: what a video says, where each fact comes from, and what must never appear.

> VISUAL: A script page with one line that has three small marks on it. A scan line sweeps down the page, then three magenta rings close around the marks, each with a short label: an address, a machine name, a port. A voice waveform sits to the side, flat and silent.

## Intro
This part of the series takes those choices in order: the one-page plan, the fact sheet, the script, and then the checks that read all of it. Each one is small, and each gives the next something to rely on. Before any script exists, you decide what one video says, and I will start there.

> VISUAL: Four stops in a row, lit one after another: a one-page plan, a fact sheet with stamps, a script with headings, a shield. A dim waveform and a dim play button wait at the far right.

## One problem per episode
Start with the plan, because a video that tries to answer three questions answers none of them well. The plan is one page, written before the script. It holds a thesis, one sentence a viewer could repeat afterwards; the audience, with the question they come in with; and a short list of the facts the thesis depends on. Then comes the part people skip: what this episode will not cover, so each of those items can become a later episode. Last, it sketches the scenes, each with its one point and a bridge, a sentence that says why it follows the one before. You do not start from a blank page: one command, new, sets up an episode folder with this page and empty versions of the other files.

> VISUAL: A single page builds up with five short bars: a thesis, a viewer, a short list of facts, a crossed-out list, a column of scene dots joined by small arrows. The page stays centred. A new-episode folder icon with the page inside appears beside it.

## The fact sheet
The plan names the facts your thesis depends on, and the fact sheet is where each one earns its place. The rule is simple: the script and the scenes may take a fact only from this one file, and every fact carries a marker. A cited fact has a public source, and you note the link and the day you {{spoken: red|read}} it. A measured fact comes from your own test, so you note how, when, and how many runs. An estimated fact is your own best guess: you note what it rests on, and the script says about. A marker is only as good as the reading behind it, so {{spoken: reed|read}} the source itself, and write the claim no stronger than the source is. A search snippet, a forum post or a model's answer is a lead, not a source.

> VISUAL: A sheet with three rows, each with a small tag: a link tag for cited, a ruler tag for measured, a tilde tag for estimated. A magnifier opens a source page beside the cited row, and a tag that says 'no stronger than the source' slides under it. A snippet, a forum post and a speech bubble fade in dim at the edge, marked 'a lead'.

## Dated stamps
Even a well-sourced fact can go stale, because a video stays up long after a number moves. So for anything you measured, say the date in the video, out loud and on screen: measured on this date. Then a later change does not make the video false; it makes it dated, and you can see which part to redo. In the same spirit, an estimate always says about, and anything you could not verify goes under a heading, not claimed, so nobody adds it back by accident.

> VISUAL: A measured number on screen with a small date stamp that appears when the date is spoken. A calendar page slides away and a second number fades in with a different stamp, and the first is still correct for its own date. A short 'not claimed' list sits off to one side, dimmed.

## Public and private
Some facts are true and still must not be said, which is why the next step is to sort the facts into two piles. Everything the video may use is rewritten in generic words: every machine name, address, port, room, place and person becomes what it does, such as the machine with the graphics card. What you will never publish goes in a separate file outside the episode folder, and you add its name to your git ignore file yourself, because nothing here does that for you. Then every private name goes on your list of names to block, the denylist, which the safety check will use. One trap: do not list a name you show on purpose, such as your channel name, or every episode fails its own check.

> VISUAL: A fact sheet splits into two columns. On the left, plain labels stay lit. On the right, a locked folder, with names fading into it. A shield with a list inside it appears at the centre, and each moved name drops onto the list as a short bar. A name that is shown on purpose stays on the left with a small cross over the shield.

## The script
With the facts sorted, the script can use only the public pile, and its format is a few rules. Each heading with two hash marks starts a scene. The paragraphs under it are exactly what the voice will say. A line that starts with the visual marker is a note for whoever draws that scene; it is never spoken and never becomes a subtitle. A spoken-form tag fixes a misread word, and a pause marker gives exact silence. The validate command only checks that every scene has narration and a title of its own, and warns when the length is off your target. It cannot tell whether a scene connects to the one before. That is a reviewer's job, and it is the rule that matters most: every scene starts by tying itself to the previous one.

> VISUAL: A script page with headings and paragraphs. A heading lights, then its paragraph, then a small note bar marked 'visual' that is crossed off the voice line. A spoken-form tag and a short silence bar appear next, then a green tick on a validate line, with a small question mark beside the joins between scenes.

## The safety check
Everything so far is text, and text is exactly what the safety check reads, so now it can do its work. It runs before the voice, the pictures and the render, and again before every upload. It reads every text file in the episode folder, and when the frames are made, the words the scenes actually draw. When it finds something, it prints the file and line, a hint, and a masked sample, so the report never repeats the whole secret. Until your denylist has your own names in it, every command that runs the check prints a loud banner of exclamation marks. And once the banner is gone, that only means the list exists, not that it is complete.

> VISUAL: A pipeline of five stops with the shield in front of each, then the shield again before an upload. The check prints a finding line with a masked sample as bars. A loud banner of marks rises over it, then fades, leaving a short list that is clearly unfinished.

## The hooks
The check guards what you make, but not what you save into your project's history, so two small git hooks guard that step. You turn them on once, with one command. The first refuses a short list of files by name: your settings, your denylist, your voice files, and anything with an audio or video extension. It never reads what is inside a file, so the check above is still your text check. The second deletes one kind of line from a commit message, the one an AI coding assistant adds to link back to its chat. Every other line stays, so read the message yourself, and know that skipping the hooks skips both.

> VISUAL: A commit box with two small gates in front of it. The first gate stops a folder labelled private and a film strip, and lets a script page through. The second gate removes one bar from a message and leaves the others. A switch marked 'on once' is lit beside them.

## What it cannot catch
None of this is complete, because the check only knows what you have taught it, and it only matches patterns. It does not know your street or your employer unless they are on the list. It cannot catch a place described in words, a face, a reflection in a window, or the terminal line that shows your user and machine name. So you look at every frame yourself, and you run the picture text scan by hand on every recording; it needs an extra tool, and without it, it checks nothing. A plan, a fact sheet and a check protect what the video says. Next is how it sounds: writing for the ear, with a reviewer who reads the script as a listener who cannot see the headings.

> VISUAL: The shield from before with four small gaps in its outline: a place described in words, a face, a window reflection, a terminal line. A pair of eyes moves across a row of frames. The last frame shows a listener figure beside a script with its headings crossed out.
