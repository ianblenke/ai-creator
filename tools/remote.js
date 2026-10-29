// Run heavy stages (keyframes/render/encode) on a separate render machine: push the project, run there, pull results back.
import { spawn } from 'node:child_process';

export const REMOTE_STAGES = new Set(['keyframes', 'render', 'encode', 'align', 'asr', 'verifyclips', 'voicereview', 'takedefects', 'desniff', 'finalcheck']);

/** Single-quote a string for a POSIX shell. */
export const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

export function remoteConfig(env) {
  if (!env.RENDER_HOST || env.MEDIA_REMOTE_CHILD || env.MEDIA_LOCAL) return null;
  return { host: env.RENDER_HOST, dir: env.RENDER_DIR || 'ai-creator', pathPrefix: env.RENDER_PATH || '$HOME/.local/node/bin' };
}

export function buildRemoteCommand(cmd, episode, args, cfg) {
  const call = ['node', 'tools/cli.js', cmd, episode, ...args].map(shq).join(' ');
  const fwd = /^\d+(\.\d+)?$/.test(process.env.MEDIA_DETERMINISM_DB || '') ? `MEDIA_DETERMINISM_DB=${process.env.MEDIA_DETERMINISM_DB} ` : ''; // the optional determinism tolerance must reach the render host
  return `export PATH=${cfg.pathPrefix}:$PATH; cd ${cfg.dir} && ${fwd}MEDIA_REMOTE_CHILD=1 ${call}`;
}

/** What to pull back after a stage, relative to the episode directory. */
// Pulls never delete local files, except keyframes (a pure mirror of regenerated PNGs). Deleting out/ once removed hand-made files.
export const pullPaths = (cmd) => (cmd === 'keyframes' ? ['keyframes/'] : cmd === 'align' ? ['timeline.json', 'subs/', 'audio/narration.wav'] : cmd === 'asr' ? ['audio/asr-report.json'] : cmd === 'voicereview' ? ['audio/voice-review.json', 'audio/review/'] : cmd === 'desniff' ? ['audio/'] : cmd === 'verifyclips' || cmd === 'finalcheck' || cmd === 'takedefects' ? [] : ['out/']);

const run = (cmd, args, opts = {}) => new Promise((resolve) => {
  const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
  p.on('close', (code) => resolve(code ?? 1));
  p.on('error', () => resolve(1));
});

// Same layout rule as .gitignore and repo-check: episodes/<id> (yours) and examples/<id> (shipped) are treated alike.
export const EXCLUDES = ['--exclude=node_modules', '--exclude=.venv-align', ...['episodes', 'examples'].flatMap((d) => [`--exclude=${d}/*/keyframes`, `--exclude=${d}/*/out`]), '--exclude=.git'];

export async function runRemote(cmd, episode, args, cfg) {
  const ssh = ['-o', 'BatchMode=yes', cfg.host];
  console.log(`[remote] syncing project to the render machine`);
  if (await run('rsync', ['-a', '--delete', ...EXCLUDES, './', `${cfg.host}:${cfg.dir}/`])) throw new Error('could not sync the project to the render machine');
  const code = await run('ssh', [...ssh, buildRemoteCommand(cmd, episode, args, cfg)]);
  for (const sub of pullPaths(cmd)) {
    const rel = `${episode.replace(/\/+$/, '')}/${sub}`;
    const isDir = sub.endsWith('/');
    if (isDir) await run('mkdir', ['-p', rel]);
    if (await run('rsync', isDir ? ['-a', ...(cmd === 'keyframes' ? ['--delete'] : []), `${cfg.host}:${cfg.dir}/${rel}`, rel] : ['-a', `${cfg.host}:${cfg.dir}/${rel}`, rel])) console.error(`[remote] warning: could not pull ${rel}`);
  }
  if (code) throw Object.assign(new Error(`remote ${cmd} failed (exit ${code})`), { silent: true });
}
