# Content safety: what the gate catches and what it misses

A video is public forever. The safety tools here stop the common leaks (a hostname in a script, an IP on screen, a reference clip in the
git history), but they are pattern matchers. They cannot tell what is private in YOUR life; you teach them with a denylist, and you still
look at every frame yourself.

## Setup (once per clone)

1. Where episodes live: your own episodes go in `episodes/<id>/` (for example, copy the example: `mkdir -p episodes && cp -r examples/ep01-kettle episodes/ep01-mytopic`).
   The shipped example stays in `examples/ep01-kettle/`. `.gitignore`, `tools/safety/repo-check.js` and the render-machine sync
   (`tools/remote.js`) treat both folders the same way: `audio/`, `frames/` and `out/` are local only.
2. The denylist: `cp safety/denylist.example.txt safety/denylist.txt`, then delete the invented names and add your own (checklist below).
   `safety/denylist.txt` is gitignored and must never be committed. Until it is filled in, every gated command prints a banner of `!`
   characters saying the list is MISSING, EMPTY or still the EXAMPLE. The gate keeps running, but without your names.
3. The git hooks: `sh tools/hooks/install.sh`. That runs `git config core.hooksPath tools/hooks`, so git uses the two hooks in
   `tools/hooks/` for this clone (undo: `git config --unset core.hooksPath`).

## What runs where

| Check | When | What it reads |
|---|---|---|
| `tools/safety/scan.js` (the gate) | before `tts`, `scenes`, `keyframes`, `render`, `encode` and the other gated steps; `node tools/cli.js safety <episode-dir>` on demand; before every upload | the episode's text files: script, facts, timeline, subtitles, scene code, briefs, the upload draft |
| on-screen text scan | during `keyframes` | the text the scenes actually draw, with the same rules |
| `tools/safety/ocr-scan.js` | by hand, on every screen recording, screenshot and thumbnail | OCR text of frames sampled every 0.5 s (needs `tesseract`) |
| `tools/safety/repo-check.js` | the pre-commit hook and `safety` | file NAMES that are tracked or staged |
| `tools/hooks/commit-msg` | every commit | your commit message |

## What the gate catches

Each finding prints `file:line [category/rule] masked-sample` and a `hint:` line. The sample is masked on purpose so the report itself
never repeats the secret.

| Rule | Catches | Common false positive and what to do |
|---|---|---|
| `ipv4-address`, `ipv6-address` | IP addresses | a four-part version number: write `v1.2.3.4` |
| `private-domain` | LAN-style names ending in `.local`, `.lan`, `.internal`, `.home`, `.home.arpa`, `.corp`, `.private` ... | in scene code a property such as `n.home` is skipped, a string is not |
| `localhost` | the word localhost | say "this machine" |
| `host-colon-port` | `name:8080` | an object key with a number (`a:10`) in code: add a space after the colon |
| `port-number` | "port 8081" | leave the number out |
| `unix-path`, `windows-path` | home and system paths (`~/...`, `/home/...`, `C:\...`) | use a repo-relative path |
| `mac-address` | hardware addresses | none known |
| `key-pattern`, `private-key` | API key and token shapes, private key headers | if it is real, revoke it now; deleting the line is not enough |
| `secret-assignment` | `token = ...`, `password: ...` with a value | a code variable named `token`: rename it |
| `denylist` | any line of your `safety/denylist.txt`, whole word, any case | a name you show on purpose: take it off the list |

A false positive is fixed by rewording the content, not by weakening the rule. If a rule is wrong for everyone, change it in
`tools/safety/scan.js` together with a test in `scan.test.js`.

## What it misses

- Anything not on your denylist: your street, your dog, your employer. The generic rules know nothing about your life.
- A place or a person described in words ("the house by the river bridge") or shown in a picture.
- Text inside pictures and video, unless you run `ocr-scan.js`; OCR itself misreads small, blurred or stylised text.
- Faces, reflections, window views, a terminal prompt or a status line in a screen recording.
- Audio: a name you SAY in the narration is only caught if it is in the script text.
- Files outside the episode folder, and the git history of anything you committed before the hooks were on.
- Commit messages: the commit-msg hook removes lines that start with `Claude-Session:` and NOTHING else. Other AI session links,
  attribution lines or pasted logs stay in; read your message before you commit.

`repo-check.js` blocks by name: `.env`, `.env.local`, `safety/denylist.txt`, everything in `voice/` except its README and consent example,
`.secrets/`, the generated folders above, and every audio or video file (`.wav .mp3 .flac .m4a .ogg .oga .opus .aac .wma .aif .aiff .mp4
.m4v .mov .mkv .webm`) anywhere in the repo. The exception list `MEDIA_ALLOW` in that file is empty on purpose: no voice audio, reference
clip or transcript of one is ever committed. It cannot see audio renamed to another extension.

## The denylist interview

Sit down once, go through these categories, and write every real answer into `safety/denylist.txt`, one per line. Add a name the moment
it comes up later, too.

- Machines: hostnames, container and VM names, NAS and router names, Wi-Fi network names, Bluetooth device names.
- Accounts: your login name, email addresses, cloud project IDs, OAuth client IDs, YouTube channel ID, API key names.
- People: family, housemates, pets, colleagues, anyone who appears in your logs or screenshots.
- Places: street, town, building, school, workplace, nearby landmarks, room names your smart home uses.
- Projects: private project and code names, internal repo names, product names that are not public yet.
- Voice: the name of your saved voice on the voice server, your reference clip's file name.
- Anything you would not print on a postcard.

Do NOT list a name you show on purpose, such as your channel or series name in an outro: every episode would then fail its own gate.

## The OCR frame gate

The text gate reads files, not pixels. For every recorded picture (screen capture, console screenshot, thumbnail):

    node tools/safety/ocr-scan.js recording.mp4 thumbnail.png --step 0.5

It samples a video every 0.5 s with ffmpeg, reads each frame with tesseract and runs the text through the same rules and your denylist.
Exit 0 is clean, 1 means findings (a video frame is labelled `file@<seconds>s`), 2 means tesseract or ffmpeg is missing and NOTHING was checked.
The tools image has no tesseract, so in the container the scan exits 2. Run it on the host instead, with Node 22.23.4 or newer,
ffmpeg and tesseract (Debian/Ubuntu package `tesseract-ocr`), from the repository root after `npm ci`. A clean OCR run is not a review: look at the frames yourself and note
that you did in the episode's `facts.md`. Record demos in a throwaway user or container with a neutral prompt and hostname, a demo git
identity and a demo account, so there is less to catch.

## Cloning through a server voice

`tts` refuses to clone until `voice/CONSENT.md` is filled in, but it can only check what it sends: a reference clip named by
`VOICE_REF`. A server can also clone from a reference of its own, which `tts` never sees: Chatterbox's `CHATTERBOX_DEFAULT_REF`
(a mounted clip used by the voice-name route), or a saved voice on an OmniVoice server. With `VOICE_NAME` set and no `VOICE_REF`,
the consent check does NOT run; instead every such `tts` run prints a banner saying so. That gap is not closed: if the server voice
was made from a recording, it is a clone, and the same rule applies (your own voice, or written permission, with `voice/CONSENT.md`
filled in). Kokoro presets and the stub tone are not clones.

## In CI

CI runs `npm test`, which includes these checks: the example denylist names never appear in `examples/ep01-kettle`, the denylist banner
fires on a missing list, the hooks block audio, and the OCR scan labels frame times. CI has no `safety/denylist.txt` (it is private), so
the test that your local list is filled in runs only on your machine and is skipped in CI. For the repository-wide name check, CI runs
`node tools/safety/scan.js --names <list>` over every tracked text file, with your names from a `DENYLIST` repository secret (one per
line; without the secret it checks only the example list). Never write the names themselves into the workflow file: it is public.

The workflow is written but has not run yet: the repository has no remote.
