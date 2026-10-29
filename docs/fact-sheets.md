# Building a fact sheet

(`node tools/...` is the host form; in a Docker-only setup see the README, "Host commands and container commands".)

`episodes/<id>/facts.md` is the only place the script and the scenes may take a fact from. Everything on it has a source and a
marker, and anything that is not on it does not go into the video. `node tools/cli.js new <id>` starts one from `templates/facts.md`;
the example episode's `facts.md` is a filled-in one.

## The research loop
Start from the thesis and the "Facts needed" list in `plan.md`, then repeat until every needed claim is either sourced or dropped:

1. Write the claim as you would like to say it, in one sentence.
2. Find a public source that says it. Prefer the primary one: the patent, the standard, the paper, the maker's own documentation, the
   data set. An encyclopedia page is a good map to those. A search snippet, a forum post or a model's answer is a lead, not a source.
3. Open and read the source itself, then rewrite the claim so it is no stronger than the source: "many" if the source says many, "one
   design" if it describes one, the source's own conditions for any number.
4. Write it into `facts.md` with its marker, the link and the date you read it. If you could only see a snippet, say so.
5. If the source contradicts your thesis, change the plan, not the fact.
6. Put what you found but will not say under "Not claimed", with the reason (unverified, varies, only a snippet). It stops you, or a
   reviewer, from adding it later by accident.

## The markers
Every fact carries one:
- **[cited]**: a public source says it. Give the link and the read date.
- **[measured]**: you measured it yourself. Give how, when, on what, and how many runs (n). A single run is n = 1; say so. Say the date
  in the video too ("measured on <date>") so a later change cannot make it false.
- **[estimated]**: your own estimate. Say what it is based on. The script must say "about" or "roughly" and never present it as
  measured.

The script critic (`prompts/script-critic.md`) checks every claim and number in the script against this file.

## The sanitizing step
Before a fact sheet is used (and again whenever you add facts from your own machines or notes):

1. Rewrite every device, room, place, person, host name, address, port, user name and file path in generic words ("the GPU box", "a
   smart light"; "the server in the garage" becomes "the GPU box"). Describe what a thing does, not what it is called or where it is.
2. Keep anything you will never publish out of `facts.md`. If you need private notes beside it, keep them in a file the repository
   ignores, and never quote it in a script, scene or description.
3. Add every private name to `safety/denylist.txt` (one per line; the file is ignored by git): your host names, network names, user
   name, family names, street and town.
4. Run `node tools/cli.js safety episodes/<id>` and fix every finding before writing the script. The scan catches patterns and the
   names you listed; it cannot catch a place described in words, so read the sheet once more as a stranger would.
