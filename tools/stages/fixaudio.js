// Retake scenes whose narration has stalls, mumbled or inserted sounds, or words that differ from the script; re-align; repeat.
// Retakes are random, so a retake can be worse than the take it replaces: every take is scored and the cleanest one is kept.
// Finishes with desniff (breaths and sniffs) and align, so the order tts -> fixaudio -> desniff -> align holds without a manual step.
import fs from 'node:fs';
import path from 'node:path';
import { runTts } from './tts.js';
import { findGaps, formatGaps } from '../audio-check.js';
import { asrProblems, formatAsr } from './asr.js';
import { findDefects } from './takedefects.js';
import { loadEnv } from '../env.js';
import { remoteConfig, runRemote } from '../remote.js';

const MAX_ATTEMPTS = 8;
// what a problem costs when comparing takes; a mumbled word or a changed word is worse than a long pause
const COST = { dropout: 5, 'extra-syllable': 3, word: 3, missing: 3, default: 1 };

async function runStage(name, episodeDir, args = []) {
  const remote = remoteConfig({ ...loadEnv(), ...process.env });
  if (remote) { try { await runRemote(name, episodeDir, args, remote); } catch (e) { if (!e.silent) throw e; } return; }
  await (await import(`./${name}.js`)).default(episodeDir, args);
}

/** Every known problem, tagged with the scene to retake and what it costs. */
async function problems(episodeDir) {
  const tl = JSON.parse(fs.readFileSync(path.join(episodeDir, 'timeline.json'), 'utf8'));
  const gaps = findGaps(tl).map((g) => ({ scene: g.scene, text: formatGaps([g]), cost: Math.min(g.gap, 1) + 0.5 }));
  const rf = path.join(episodeDir, 'audio', 'asr-report.json');
  const heard = fs.existsSync(rf) ? asrProblems(JSON.parse(fs.readFileSync(rf, 'utf8'))).map((p) => ({ scene: p.scene, text: formatAsr([p], tl), cost: COST[p.kind] ?? COST.default })) : [];
  const defects = (await findDefects(episodeDir)).map((d) => ({ scene: d.scene, text: d.text, cost: COST[d.kind] ?? COST.default }));
  return [...gaps, ...heard, ...defects];
}

const scoreOf = (list, scene) => list.filter((p) => p.scene === scene).reduce((n, p) => n + p.cost, 0);

export default async function fixaudio(episodeDir, args = []) {
  const only = args.filter((a) => !a.startsWith('--'));
  const pick = (list) => (only.length ? list.filter((p) => only.some((o) => p.scene.startsWith(o.padStart(2, '0')))) : list);
  const audio = path.join(episodeDir, 'audio');
  const keep = fs.mkdtempSync(path.join(audio, 'besttake-'));
  const best = {}; // scene id -> {score, final, raw, rawName}
  const snapshot = (manifest, list, scenes) => {
    for (const m of manifest.filter((x) => scenes.includes(x.scene))) {
      const score = scoreOf(list, m.scene);
      if (best[m.scene] && best[m.scene].score <= score) continue;
      const final = path.join(keep, `${m.scene}.final.wav`), raw = path.join(keep, `${m.scene}.raw.wav`);
      fs.copyFileSync(path.join(episodeDir, m.file), final);
      fs.copyFileSync(path.join(audio, 'raw', `${m.key}.wav`), raw);
      best[m.scene] = { score, final, raw, rawName: `${m.key}.wav`, file: m.file };
    }
  };
  try {
    await runStage('asr', episodeDir);
    let list = pick(await problems(episodeDir));
    const manifest = JSON.parse(fs.readFileSync(path.join(audio, 'manifest.json'), 'utf8'));
    snapshot(manifest, list, manifest.map((m) => m.scene));
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && list.length; attempt++) {
      const scenes = [...new Set(list.map((p) => p.scene.slice(0, 2)))];
      console.log(`round ${attempt}/${MAX_ATTEMPTS}: retaking scene(s) ${scenes.join(', ')} for:\n${list.map((p) => p.text).join('\n')}`);
      const fresh = await runTts(episodeDir, { retake: scenes });
      await runStage('align', episodeDir);
      await runStage('asr', episodeDir);
      list = pick(await problems(episodeDir));
      snapshot(fresh, list, fresh.map((m) => m.scene).filter((id) => scenes.includes(id.slice(0, 2))));
    }
    // put the cleanest take of every scene back (a later take may have been worse than an earlier one)
    for (const [scene, b] of Object.entries(best)) {
      fs.copyFileSync(b.raw, path.join(audio, 'raw', b.rawName));
      fs.copyFileSync(b.final, path.join(episodeDir, b.file));
    }
  } finally { fs.rmSync(keep, { recursive: true, force: true }); }
  fs.rmSync(path.join(audio, 'pre-tighten'), { recursive: true, force: true });
  fs.rmSync(path.join(audio, 'pre-desniff'), { recursive: true, force: true }); // the old backups belong to takes that may be gone
  await runStage('align', episodeDir);
  await runStage('tighten', episodeDir);
  await runStage('align', episodeDir);
  await runStage('desniff', episodeDir);
  await runStage('align', episodeDir);
  await runStage('asr', episodeDir);
  const left = pick(await problems(episodeDir));
  if (left.length) {
    console.log(`still flagged (the cleanest of ${MAX_ATTEMPTS + 1} takes was kept; consider rewording these lines):\n${left.map((p) => p.text).join('\n')}`);
    process.exitCode = 1;
  } else console.log('narration is clean');
}
