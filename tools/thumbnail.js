// Render YouTube thumbnails (1280x720) from <episode>/thumbnail/thumb.html variants. Usage: node tools/thumbnail.js <episode-dir> [a b c]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [episode, ...which] = process.argv.slice(2);
if (!episode) { console.error('usage: node tools/thumbnail.js <episode-dir> [a b c]   (renders <episode-dir>/thumbnail/thumb.html, one PNG per variant)'); process.exit(2); }
const variants = which.length ? which : ['a', 'b', 'c'];
const html = path.resolve(episode, 'thumbnail', 'thumb.html');
if (!fs.existsSync(html)) { console.error(`no ${path.relative('.', html)}: copy templates/thumb.html there and edit it`); process.exit(1); }
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
for (const v of variants) {
  await page.goto(`file://${html}?v=${v}`);
  await page.evaluate(() => document.fonts.ready);
  const out = path.resolve(episode, 'thumbnail', `thumb-${v}.png`);
  await page.screenshot({ path: out, type: 'png' });
  console.log(`${path.relative('.', out)}  ${(fs.statSync(out).size / 1048576).toFixed(2)} MiB`);
}
await browser.close();
