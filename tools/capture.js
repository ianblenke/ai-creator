// Playwright session around the harness: load a scene, step time, grab frames/text. One session per worker.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { startServer } from './serve.js';

// software WebGL is slow for everything else, so only enable it when a scene uses Three.js
const usesThree = (dir) => { try { return fs.readdirSync(path.join(dir, 'scenes')).some((f) => f.endsWith('.js') && /\bthree\b/.test(fs.readFileSync(path.join(dir, 'scenes', f), 'utf8'))); } catch { return false; } };

export async function openSession(episodeDir) {
  const srv = await startServer(episodeDir);
  const gl = usesThree(episodeDir) ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [];
  // No special rasterizer flags: --disable-partial-raster was tried and causes ghost copies of moving SVG elements (swept frames no longer match pure frames).
  // The harness forces a repaint after every time step, which is what keeps repeated screenshots stable.
  // GPU compositing leaves stale pixels behind a moving, partly transparent group that contains a blur filter (seen as an extra panel for about 0.2 s).
  // Repaint tricks do not fix it; software compositing does, with identical output from every previous frame and no speed loss.
  const defaults = ['--disable-gpu-compositing'];
  const extra = [...defaults, ...(process.env.MEDIA_CHROME_ARGS || '').split(/\s+/).filter(Boolean)];
  const browser = await chromium.launch({ args: [...gl, ...extra, '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(180000); // heavy machine load must not turn into spurious screenshot timeouts
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${srv.port}/stage/harness.html${process.env.MEDIA_HARNESS_QUERY ? '?' + process.env.MEDIA_HARNESS_QUERY : ''}`);
  const check = () => { if (errors.length) throw new Error(`scene error: ${errors.splice(0).join(' | ')}`); };
  return {
    page,
    /** Fresh page state (new module instances): the reference for "what this frame should look like with no history". */
    async reset() { await page.reload(); await page.waitForFunction(() => typeof window.__load === 'function'); },
    async load(id) { const info = await page.evaluate((s) => window.__load(s), id); check(); return info; },
    async setTime(t) { await page.evaluate((x) => window.__setTime(x), t); check(); },
    async frame(t, { type = 'png' } = {}) { await this.setTime(t); return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 97 } : {}), clip: { x: 0, y: 0, width: 1920, height: 1080 } }); },
    texts: () => page.evaluate(() => window.__texts()),
    async close() { await browser.close(); await srv.close(); },
  };
}
