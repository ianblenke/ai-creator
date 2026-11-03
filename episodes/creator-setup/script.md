# What You Need, and Your First Render
Duration: 5 min
Voice: ian. Sizes and times are dated in facts.md; at most three numbers per scene.

## Cold open
The example in this part renders with no graphics card, no voice server and, once the tools are built, no internet connection. Its narration is silent, on purpose: a placeholder with the right length, so the pictures and the video come out exactly as they will with a real voice. You can see that work before you record or clone your own voice.

> VISUAL: A plain computer with no card beside it. A flat, silent line where a waveform would be, and a video frame builds up on the screen anyway, step by step. Calm, sparse, near-black.

## Intro
This part of the series answers two questions: what do you need, and can you see it work first? I will go through the short list, set up your list of names to block, build the tools, run the tests, and render the example. The voice, the slowest step and the one a graphics card speeds up most, comes later.

> VISUAL: Five stops in a row, lit one after another: a checklist, a shield, a box being built, a check mark, a play button. A sixth stop, a waveform on a card, stays dim at the far right.

## What you need
The short list starts with the machine itself, because everything else runs on top of it. The only system I tested is Linux on an ordinary Intel or AMD processor. Apple machines, Windows machines and machines with other kinds of chip are untested, so I will not promise them. You need Docker with Compose version two point two four or newer, because every pipeline stage runs inside a container, and you do not install Python or the audio tools yourself. A graphics card is optional, and it has to be an NVIDIA one: the voice is faster on it, but every stage also has a processor-only version.

> VISUAL: A short checklist of four chips that tick on as they are spoken: a Linux slab labelled x86_64, a Docker box labelled 'Compose 2.24 or newer', a card slab drawn dashed for optional labelled 'NVIDIA', a processor chip. Untested systems appear dim and crossed out, never ticked.

## The names list
Before you build anything, set up the one thing that protects you. This pipeline reads your scripts and puts words on screen, so it needs to know which names must never appear. Copy the example list of names to block, and put your own in it: machine names, your user name, family names. The safety gate is a check that runs before the main stages and stops them if one of those names shows up in a script, a scene or a subtitle. Until you fill the list in, every step that checks prints a loud warning: the gate still runs, but it does not know your names. Then switch on the git hooks, small checks that git runs before every commit. They refuse a commit that includes your private files or any audio, but they do not read the text of your scripts. The gate does that when you run a stage.

> VISUAL: A page of short bars, the example list, with invented names. Your own private names replace them as magenta-ringed bars, then a gate drawn as a bar across a path stops a leaking line. A small banner of warning marks sits over the page until it is filled in.

## The build
With the names protected, you can build the container that holds every tool. Before the build, write two small files: a settings file for the tools, which you copy from the example and which keeps the voice in its silent test mode, and your user id, so the container runs as you. Then start the build and do something else. From a clean copy it took about three and a half minutes on my connection, and the image is about eight gigabytes.

> VISUAL: Two small file icons feed into a box. The box fills with layers while a slow clock hand turns. A disk slab grows beside it. Nothing else moves.

## The tests
When the build finishes, run the test suite inside the container before you trust anything else. It takes seconds. Look for zero failures, and then the word OK near the end. If it does not pass, fix that first: nothing after it is worth debugging on a broken base.

> VISUAL: A row of small test squares turn green one after another, then one large OK. A single square drawn magenta and ringed, held to the side, stands for the case where it does not pass.

## The first render
Now the offline run, one stage at a time. First the silent narration. Then alignment, which finds when each word is said. Then the scene briefs, a short description of each picture, and keyframes, still frames to check the layout. Last, a draft render of the moving pictures, and a draft video that joins them with the sound. Each stage prints a last line you can compare with the docs. The draft render took about a minute once, on a machine with twenty-four cores and no graphics card, and about two on a copy. This runs on the example where it ships. Your own episodes go in an episodes folder, which a fresh copy does not have yet, and the docs show the one command that makes it.

> VISUAL: The track of six stops fills left to right, each lighting with a green tick as its name is spoken. A flat silent line at the top becomes a rendered frame at the end, then the draft video file appears.

## What comes later
Three things are missing from this render, and each one costs you something the offline run did not: a network, disk space, or money. First, the network: alignment with a real voice, and the checks that listen to it, download their models the first time you use them. Second, disk space: the voice server downloads its own weights on first start, about three gigabytes for one voice option, on top of its own image. Third, money: the scenes, the script critique and the reviews are written by a model in the cloud, through a coding agent, an AI assistant that works inside the project for you, and that means a paid account. I have not worked out the cost of an episode, so I will not guess.

> VISUAL: Three dim chips wait to the right of the finished render: a download arrow into a small model box, a voice server with a weights slab, and a coding-agent cloud with a pencil. A 'not measured' note sits dashed under the cloud.

## Where it runs
If a model in the cloud already writes the scenes, it is fair to ask why the rest does not run in the cloud as well. The voice I use is the reason: it needs a graphics card, and as far as I know a coding session in the cloud has none. Your recording of your own voice, your list of names to block and your sign-in for uploading to YouTube are yours, and I did not want them in more places. That is my judgement, not a test: I have not tried a sandbox in the cloud. I will say when the cloud comes in.

> VISUAL: The computer on the left, a cloud on the right with a dashed line between. Three small keepsakes, a voice clip, a list of names and a key, stay inside the computer. The cloud holds only a pencil and a page. A 'my judgement, not a test' note fades in.

## Close
A silent render proves the pictures and the video. It does not prove the voice, because there is no voice to check, so the checks that listen refuse to run. Next is the plan for an episode, which the project calls the spec: how one problem becomes one episode, and what never goes on screen.

> VISUAL: The silent line, then a small waveform fades in dim beside it. An unlabeled arrow points right toward a blank page.
