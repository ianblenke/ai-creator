#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { loadScript, validateScript } from './script.js';
import { gate } from './gate.js';
import { scanEpisode, formatFindings } from './safety/scan.js';
import { checkRepo } from './safety/repo-check.js';
import { loadEnv } from './env.js';
import { findGaps, formatGaps } from './audio-check.js';
import { REMOTE_STAGES, remoteConfig, runRemote } from './remote.js';
import { summarize as endingsSummary } from './lint-endings.js';

const GATED = new Set(['tts', 'fixaudio', 'asr', 'verifyclips', 'scenes', 'keyframes', 'render', 'encode']);
// fixture audio is silence: listening checks and retakes have nothing to work on
const NEEDS_VOICE = new Set(['besttake', 'desniff', 'asr', 'fixaudio', 'takedefects', 'voicereview', 'finalcheck']);
// one voice-stage order everywhere (docs/tutorial/takes.md, tools/pipeline.sh)
const ORDER = 'validate, lint-endings, safety, tts, align, besttake (scenes align flagged), desniff, align, asr, takedefects, fixaudio (only if something is flagged), voicereview, scenes (briefs), keyframes, render --check, render, verifyclips, encode, finalcheck';
const SCRIPTS = 'node tools/check-anchors.js and tools/layout-check.js (after any script or scene edit; run with --entrypoint node), encode --draft for a quick look';

const commands = {
  validate(ep) {
    const script = loadScript(path.join(ep, 'script.md'));
    const { errors, warnings, seconds } = validateScript(script);
    console.log(`${script.scenes.length} scenes, estimated ${(seconds / 60).toFixed(1)} min`);
    warnings.forEach((w) => console.log(`warning: ${w}`));
    const end = endingsSummary(ep);
    if (end.errors) console.log(`warning: ${end.errors} known word-ending slip(s) in the script: run \`node tools/lint-endings.js ${ep}\` and reword them`);
    errors.forEach((e) => console.error(`error: ${e}`));
    if (errors.length) process.exitCode = 1;
  },
  async preview(ep, args = []) {
    const { startServer } = await import('./serve.js');
    const h = args.indexOf('--host'); // --host 0.0.0.0 inside a container only; compose publishes it on the host's 127.0.0.1
    const { port } = await startServer(ep, { port: 8765, host: h >= 0 ? args[h + 1] : '127.0.0.1' });
    console.log(`scrub preview: http://127.0.0.1:${port}/stage/harness.html?ui=1  (Ctrl+C to stop)`);
    await new Promise(() => {});
  },
  subs(ep) {
    return import('./timeline.js').then((m) => {
      const tl = JSON.parse(fs.readFileSync(path.join(ep, 'timeline.json'), 'utf8'));
      fs.mkdirSync(path.join(ep, 'subs'), { recursive: true });
      fs.writeFileSync(path.join(ep, 'subs', 'episode.vtt'), m.toVtt(tl));
      fs.writeFileSync(path.join(ep, 'subs', 'episode.srt'), m.toSrt(tl));
      console.log(`subtitles regenerated: ${m.cues(tl).length} cues`);
    });
  },
  'check-audio'(ep) {
    const gaps = findGaps(JSON.parse(fs.readFileSync(path.join(ep, 'timeline.json'), 'utf8')));
    console.log(gaps.length ? formatGaps(gaps) : 'narration check: no stalls or unnatural pauses');
    if (gaps.length) process.exitCode = 1;
  },
  'lint-endings'(ep) {
    return import('./lint-endings.js').then((m) => {
      const r = m.summarize(ep);
      console.log(`word-ending lint: ${r.errors} known slip(s), ${r.warnings} warning(s): run \`node tools/lint-endings.js ${ep}\` for details`);
      if (r.errors) process.exitCode = 1;
    });
  },
  safety(ep) {
    const findings = scanEpisode(ep, { denylistFile: path.resolve('safety/denylist.txt') });
    const tracked = checkRepo();
    if (findings.length) console.error(formatFindings(findings));
    tracked.forEach((t) => console.error(`tracked local-only file: ${t}`));
    if (findings.length || tracked.length) process.exitCode = 1;
    else console.log('content-safety: clean');
  },
};

async function loadStage(name) {
  const file = new URL(`./stages/${name}.js`, import.meta.url);
  if (!fs.existsSync(file)) throw new Error(`stage "${name}" is not implemented yet`);
  return (await import(file.href)).default;
}

const [cmd, ep, ...rest] = process.argv.slice(2);
if (!cmd || !ep) {
  const names = new Set([...Object.keys(commands), ...GATED, ...NEEDS_VOICE, 'align', 'music', 'new']);
  console.error(`usage: media <${[...names].join('|')}> <episode-dir> [options]\npipeline order: ${ORDER}\nalso: ${SCRIPTS}\noffline (VOICE_TRANSPORT=fixture): tts, align, scenes, keyframes, render, encode`);
  process.exit(2);
}
try {
  if (NEEDS_VOICE.has(cmd) && ({ ...loadEnv(), ...process.env }).VOICE_TRANSPORT === 'fixture') {
    throw new Error(`${cmd} checks real narration; VOICE_TRANSPORT=fixture audio is silence, so there is nothing to check`);
  }
  if (GATED.has(cmd)) gate(ep, cmd);
  if (cmd === 'tts') { // pre-recording check for word-ending slips: report, never block (set MEDIA_STRICT_ENDINGS=1 to block on known slips)
    const end = endingsSummary(ep);
    console.log(`word-ending lint: ${end.errors} known slip(s), ${end.warnings} warning(s)${end.errors || end.warnings ? ` (node tools/lint-endings.js ${ep})` : ''}`);
    if (end.errors && process.env.MEDIA_STRICT_ENDINGS) throw new Error('known word-ending slips in the script: reword them first');
  }
  const remote = REMOTE_STAGES.has(cmd) ? remoteConfig({ ...loadEnv(), ...process.env }) : null;
  if (remote) { await runRemote(cmd, ep, rest, remote); process.exit(0); }
  if (commands[cmd]) await commands[cmd](ep, rest);
  else await (await loadStage(cmd))(ep, rest);
} catch (e) {
  if (!e.silent) console.error(e.message);
  process.exit(1);
}
