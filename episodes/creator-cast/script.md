# The Cast: Which AI Model Does Which Job
Duration: 5 min
Voice: ian. Names and licences are dated in facts.md; at most three numbers per scene.

## Cold open
I ran two AI models as listeners. I gave them clean clips and clips with a sniff added, and both said yes, there is an unnatural pause, every single time. A listener that always says yes tells you nothing. This video is about the models I use instead.

> VISUAL: One flat judge figure with a magenta speech mark that says 'yes' appears over clip after clip, a row of small waveforms. The 'yes' repeats on every one, clean or not, then the judge dims out. Black background, calm.

## Intro
To see why that matters, here is what this series builds: a video with narration, where every stage hands one job to one model. Some of them run on a graphics card at home, some on an ordinary processor, and the rest are Claude models in the cloud. I name each one, say what it is good at, and say what it cannot do. For the main ones I also say what the licence page said, and when. These are the models as of early November 2026.

> VISUAL: Four colour-coded stage chips in a row, one job each. A graphics-card slab, a processor chip and a cloud sit beneath as three homes; chips drop into their homes as the narration lists them.

## The voice
Start with the voice, because everything else follows its timing. {{spoken: Audio Eight|Audio8}}, a small open model, runs on my own graphics card and clones my voice from one recording of me. Because it handles one request at a time, one card is enough. Its model card says Apache 2.0 for the code and weights, as an AI agent read it on the first of November, so check the page yourself. The card does not describe the training data, and the licence does not say whose voice you may clone, so clone only your own. The model adds no watermark, so I put a line in each description saying the voice is synthetic.

> VISUAL: A graphics card slab on the left with one waveform coming out of it, one request at a time, a single lane. A small licence tag and a date stamp attach to it, then a magenta 'no watermark' note and a 'synthetic' label.

## The ears
A synthetic voice can slip, by dropping a word or adding a sound, so two more models check every recording. An aligner finds exactly when each word starts and ends, and that is what lets every picture line up with the audio. A speech recognizer writes down what it hears, and I compare that with the script. Both run on an ordinary processor, and an AI agent read their licence pages on the twenty-eighth of October: BSD for the aligner, MIT for the recognizer. The recognizer has one blind spot: if the voice adds an extra sound to a word, it still writes the right word, and it never hears a sniff.

> VISUAL: A waveform ruler with word blocks snapped to it (the aligner), and below it a script page and a heard-text strip compared by a small compare mark (the recognizer). A magenta extra syllable slips in and the strip still shows the right word.

## The listeners that failed
That blind spot made me want a third listener, one that can tell how the voice sounds, not only what it says. So I ran two AI models that take audio as input, and a naturalness score, on eighteen short clips, some clean and some with a sniff or a loud word that I added. In my test, with my prompt, both models said yes, unnatural pause, to every clip. The score gave the same number to the clean clips and to every broken one. What is promising is plainer: flag a sound only when it stands out from the rest of the same episode. That method found all four sniffs I had added, with two false alarms on the other clips. That was one test on one voice, and I have not checked it against my ears, so everything it flags is only a candidate that I listen to.

> VISUAL: Three grey listener figures each stamp 'yes' on all eighteen clips, a tidy grid of squares. A flat meter sits at the same height for every clip. Then a baseline band appears under the waveforms; four magenta sniffs rise above it and get ringed, two stray rings flagged beside them.

## The picture writer
With the sound covered, the other half of the video is what you see, and that is the one job where I pay for the strongest model I can get. Claude Opus, one of Anthropic's models, writes each animation as a small piece of code, and a second Opus session reviews the frames and looks for faults. I compared it with the smaller Sonnet model on two scenes with the same brief. On the denser scene Opus took about ten times longer, but I judged its animations much better, so the shorter time was not worth it. Two scenes is a small sample, so that is my judgement, not a benchmark.

> VISUAL: A scene card with a code bracket is written by a large Opus figure and a smaller Sonnet figure side by side; two bars grow, Opus's about ten times longer, then Opus's frame glows the brighter. A reviewer magnifier looks for faults.

## The producer
Those models do not coordinate themselves, so one more program sits above them: Claude Code, which runs on my machine and calls Claude models in the cloud. It runs the stages in order and starts the picture authors and the reviewers. Then it runs every layout check itself again, to confirm each result, instead of trusting an author who reports that its own work is clean. Each author sees only its own brief and a few reference files, and each reviewer can only read, so an author does not review its own scenes.

> VISUAL: A producer figure on a desk (a local program) with lines up to cloud shapes; it hands four small files to an author figure and a read-only eye to a reviewer figure, then re-runs a check mark itself on each result.

## What you need
That is the whole cast, and the question for you is which parts run on your machine and which you pay for. Three models run on your machine: the voice on a graphics card, and the aligner and the recognizer on a processor. The writing and the pictures need a paid Claude plan. When an AI agent read the pricing page on the second of November, Claude Code and Opus 5.5 were listed as included on the paid plans and not on the free one. I did not check the usage limits, and plans change, so check the page yourself. I did not try other chat models, and I have not yet timed or priced an episode.

> VISUAL: The cast in one table of figures split into two zones: 'on your machine' with the card and the processor holding three chips, and 'a paid plan' with two cloud chips. A small 'check the page yourself' dated note.

## Close
That is the cast: one voice, two ears, a writer and a producer, and a set of listeners that did not make it. Next, I'll set up your machine and make your first render.

> VISUAL: The cast as small icons in a calm row: voice, two ears, writer, producer, with a faded listener icon off to one side. An unlabeled arrow points right.
