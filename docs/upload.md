# Uploading to YouTube

`tools/youtube.js` uploads a finished episode as **private** (or unlisted) with its thumbnail and English captions, and marks it as
altered or synthetic content. It never publishes and never deletes: you check the video in YouTube Studio and set it to Public there.

Google pages below were read on 2026-10-29 by a model-assisted research agent, not by a human; their "last updated" date is given.
Google changes these pages and its Console menus: if a step does not match, follow the page.

## 1. One-time setup in the Google Cloud Console
1. Sign in at https://console.cloud.google.com with the Google account that owns (or manages) your channel.
2. Create a project (project picker > **New project**). Any name; it is never shown to viewers.
3. Enable the API: **APIs & Services > Library**, search "YouTube Data API v3", open it, **Enable**.
4. Consent screen: **Menu > Google Auth platform > Branding** (click **Get Started** if it says it is not configured yet). Enter an app
   name and a support email, choose the **External** audience, enter a contact email, accept the user-data policy, **Create**.
   (Steps from https://developers.google.com/workspace/guides/configure-oauth-consent, last updated 2026-09-03.)
5. Leave the app in **Testing** (do not press Publish app). Then **Audience > Test users > Add users**: add your own Google address,
   **Save**. Only test users can sign in while the app is in Testing.
6. Credential: **Google Auth platform > Clients > Create Client**, Application type **Desktop app**, any name, **Create**
   (https://developers.google.com/workspace/guides/create-credentials, last updated 2026-10-12).
7. Download that client's JSON from the Clients list (the download button next to it; Google's guide does not describe this step) and
   save it as `.secrets/client_secret.json` in the repository folder. `.secrets/` is gitignored and blocked by the repo check. The tool
   refuses a file without an `installed` section: that means you made a Web client instead of a Desktop app client.

The tool asks for two permissions only: `youtube.upload` and `youtube.force-ssl` (the second is needed for captions and the playlist).

## 2. Where it runs
- **On the host** (your own machine, from the repository root): `auth` (every form), `check` and the real `upload --yes`, `finish` and
  `playlist-add`. This needs a browser and Node 22.23.4 or newer (`package.json` `engines`; older 22.x releases predate the October
  2026 Node security fixes). It needs no `npm install` beyond what the repo already has, and no Docker.
- **In the container, if you like:** the dry run (`upload` without `--yes`) and `status`, as
  `docker compose run --rm --entrypoint node media tools/youtube.js upload <episode-dir>`. The dry runs were run that way on 2026-10-29.

Why sign in on the host: plain `auth` waits for Google's redirect on a loopback address inside the process, which a browser on the
host cannot reach when the process is in a container, and it tries `xdg-open`, which is not in the image and does not exist on macOS
(where it currently crashes with `spawn xdg-open ENOENT`: use `auth --manual` there). Signing in and uploading from inside the
container are not tested.

## 3. Sign in
On a Linux machine with a browser and `xdg-open`, `node tools/youtube.js auth` opens the page and catches the redirect itself.
Everywhere else (macOS, a server, SSH, or when the automatic way fails), use the two-step form:

    node tools/youtube.js auth --manual
    # open the printed link in any browser, sign in, approve the two permissions;
    # the browser then shows a "can't connect" page: copy its FULL address and, within 10 minutes:
    node tools/youtube.js auth --finish '<the address you copied>'
    node tools/youtube.js check      # prints the channel name: make sure it is the right one

- Run `--manual` **once** per sign-in. A second run starts a new attempt and the link from the first one no longer works.
- `--finish` refuses an attempt more than 10 minutes old: run `--manual` again.
- **The sign-in lapses after 7 days** while the app is in Testing: Google says a project in Testing "is issued a refresh token expiring
  in 7 days" unless it asks only for name, email and profile
  (https://developers.google.com/identity/protocols/oauth2, last updated 2026-10-28). The tool then says the sign-in has expired;
  sign in again as above. Publishing the app to Production would need Google's verification and is not covered here.

## 4. The upload draft: `youtube-description.md`
Each episode folder has one: `new` copies `templates/youtube-description.md`, or copy the kettle's
(`examples/ep01-kettle/youtube-description.md`). The kettle's draft leaves its credit line as a placeholder
(`Voice model: [fill in: the voice model you used, ...]`), because which engine spoke its committed timeline is not recorded: fill it
in with the lane you render it with. The tool reads three sections:

- `## Title options`: a numbered list; `--title N` picks one (default 1). At most 100 characters, no `<` or `>`.
- `## Description`: the text viewers see.
- `## Chapters`: lines like `0:00 The hook`, appended to the description. At least three, the first at `0:00`, each later one after
  the one before and at least 10 s after it.

The dry run refuses to continue when:
- description plus chapters is over **5000 bytes** (bytes, not characters: accented letters and emoji count double or more);
- a placeholder is left in `[square brackets]` with the word add, your, todo, fill or insert in it, e.g. `[add your link]`;
- either of the **two disclosure lines** is missing. Keep them in your own words only where the pattern still matches:

      The narration is a cloned copy of my own voice, generated with Chatterbox.
      Voice model: Chatterbox by Resemble AI; code MIT licence, weights tagged MIT on the model page (licence read 2026-10-29): https://huggingface.co/ResembleAI/chatterbox

  The first line must, on one line, call the narration (or narrator, or voice) cloned, a clone, synthetic or AI-generated, and then say
  what made it: "generated", "made" or "synthesized" followed by "with" or "by" and a name. Write the one that is true:

      The narration is a cloned copy of my own voice, generated with <model>.                       (your own voice)
      The narration is a cloned copy of <name>'s voice, used with their written permission, generated with <model>.   (someone else's, with permission)
      The narration is a synthetic preset voice (<voice id>), generated with <model>.               (a preset such as Kokoro's af_heart: no cloning)

  The check only matches words; it cannot tell whether the line is true. Do not call a preset voice your own clone, or a clone of
  someone else your own voice.

  The second line must start with `Voice model:` and contain the word licence (or license) and a link. Link the page that states the
  licence of what you used: for Chatterbox the weights' licence tag is on the Hugging Face model page (above; the code's MIT LICENSE is
  in https://github.com/resemble-ai/chatterbox), which is why the docs and `templates/youtube-description.md` both link the weights page. Using another voice lane, name
  that model, its licence and the date you read it (for OmniVoice the weights are CC-BY-NC: see `docs/licences.md`). Why the project
  discloses even where YouTube does not require it: `docs/voice-cloning-law.md`;
- the content-safety scan of the episode fails (`docs/safety.md`);
- a file is missing from `out/final/`, or the thumbnail is over 2 MB;
- the video does not look like a rendered episode: under 100 KiB (`video ... is only N bytes: not a rendered episode`), no MP4 `ftyp`
  box at the start (`video ... is not an MP4 (no ftyp box at the start)`), or, when `ffprobe` is installed, no video stream or one
  shorter than 1 s (`video ...: ffprobe finds no video stream` / `only N s`). Without `ffprobe` (a host without ffmpeg) only the first
  two checks run; the tools container has it.

The video check does not compare the file with what `encode` verified, its codec, its full length or its content: copy the file
`encode` verified, and watch it once. (Checked on 2026-10-29 on a copy of the kettle: 1000 random bytes and 200,000 random bytes were
each refused with the message above, and the real encode passed.)

## 5. The files: `out/final/`
The tool looks in `<episode>/out/final/` for `<id>-final.mp4`, `<id>-thumbnail.png` and `<id>-final.srt` (the id is the folder name).
No command writes this folder yet: copy your approved files in by hand. For the kettle:

    E=examples/ep01-kettle
    mkdir -p $E/out/final
    cp $E/out/ep01-kettle.mp4    $E/out/final/ep01-kettle-final.mp4
    cp $E/thumbnail.png          $E/out/final/ep01-kettle-thumbnail.png
    cp $E/subs/episode.srt       $E/out/final/ep01-kettle-final.srt

## 6. Dry run, then upload
Without `--yes`, `upload` checks everything and sends nothing. On a copy of the kettle (run 2026-10-29 with the three files copied as
above and the credit line filled in with the Chatterbox example from section 4):

    $ node tools/youtube.js upload <copy-of-ep01-kettle>
    Episode:   <copy-of-ep01-kettle>
    Title:     How a Kettle Knows When to Switch Off
    Privacy:   private  (you switch it to Public in YouTube Studio)
    Video:     ep01-kettle-final.mp4 (24.2 MiB)
    Thumbnail: ep01-kettle-thumbnail.png
    Captions:  ep01-kettle-final.srt
    Description: 1603 bytes, first line: A kettle has no clock and no screen, yet it stops by itself the moment the water boils. In…

    Dry run only. Everything above is valid; re-run with --yes to upload.

That run had the credit line filled in. On the kettle as shipped (2026-10-29), the dry run ends with "Not ready to upload" and lists
the unfilled credit line twice, then each missing `out/final/` file:

    Not ready to upload:
      - placeholder still present: [fill in: the voice model you used, its maker, licence, the date you read the licence and a link, as in templates/youtube-description.md]
      - missing the model credit line: "Voice model: <model> by <maker>, <licence> licence (read <date>): <link>"
      - missing video: examples/ep01-kettle/out/final/ep01-kettle-final.mp4
      ...

The real upload was not run on the kettle.

    node tools/youtube.js upload <episode-dir> --yes            # private (default) or --privacy unlisted
    node tools/youtube.js status <episode-dir>                  # read-only: visibility, processing, captions
    node tools/youtube.js finish <episode-dir>                  # retry thumbnail and captions if that step failed
    node tools/youtube.js playlist-add <episode-dir> <playlist-id> [--position N]

What every upload sends: privacy `private` or `unlisted` (the tool refuses `public`), category id 28, not made for kids,
English, and `containsSyntheticMedia: true`, the channel's "altered or synthetic content" disclosure, settable on upload per
https://developers.google.com/youtube/v3/docs/videos (read 2026-10-29). After a successful upload the tool writes
`out/youtube-upload.json` and refuses to upload that episode again unless you pass `--force`.

## 7. Quota
From https://developers.google.com/youtube/v3/determine_quota_cost (last updated 2026-10-15, read 2026-10-29): `videos.insert` has its
own bucket, "100 quota per day. Each call costs 1 quota"; every other call shares 10,000 units per day. So one `upload --yes` uses 1
upload plus 450 units (thumbnail 50, captions 400); `check` and `status` cost 1 and 51; `playlist-add` costs 50 plus 1 per 50 videos
in the playlist. Older guides quote about 1,600 units per upload; the page as read no longer says that. Your project's own numbers are
under **APIs & Services > YouTube Data API v3 > Quotas**.

## 8. Unverified projects and private uploads
Some older guides say videos uploaded through unaudited API projects are locked to private. The `videos.insert` page read on 2026-10-29 (last
updated 2026-10-15) says the opposite: "Videos uploaded from unverified API projects are not restricted to private viewing mode."
This tool uploads private anyway, so it was **not tested** whether a video from an unverified project can be switched to Public in
Studio. If it stays locked, Google's "Quota and Compliance Audits" page is the route; that page was not read.
