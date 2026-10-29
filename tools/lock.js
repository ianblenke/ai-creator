// Cross-process render lock: scene renders are CPU-heavy, so concurrent runs just time each other out.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOCK = path.join(os.tmpdir(), 'ai-creator-render.lock');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

export async function withRenderLock(fn, { waitMs = 30 * 60 * 1000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    try {
      fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' });
      break;
    } catch {
      let holder = 0;
      try { holder = parseInt(fs.readFileSync(LOCK, 'utf8'), 10); } catch { /* released between checks */ }
      if (holder && !alive(holder)) { fs.rmSync(LOCK, { force: true }); continue; }
      if (Date.now() - t0 > waitMs) throw new Error('timed out waiting for another render to finish');
      await sleep(2000);
    }
  }
  try { return await fn(); } finally { fs.rmSync(LOCK, { force: true }); }
}
