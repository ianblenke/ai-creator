#!/usr/bin/env node
// OCR frame gate for RECORDED pictures (screen captures, console screenshots, thumbnails): the text gate reads files only, so a hostname in a
// terminal recording would pass it. Samples a video every --step seconds (default 0.5), OCRs each frame with tesseract and runs the text
// through the same rules and denylist as scan.js. Exit 0 clean, 1 findings, 2 tesseract or ffmpeg missing.
//   node tools/safety/ocr-scan.js <video.mp4|image.png ...> [--step 0.5]
// OCR misreads small or stylised text, and it cannot see faces or a place described by its look: still review every frame by eye (docs/safety.md).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { scanRenderedText, loadDenylist, formatFindings } from './scan.js';

const IMAGE = /\.(?:png|jpe?g|webp|bmp|tiff?)$/i;

export const hasTool = (cmd) => spawnSync(cmd, [cmd === 'ffmpeg' ? '-version' : '--version'], { stdio: 'ignore' }).status === 0;

export function tesseractOcr(file) {
  const r = spawnSync('tesseract', [file, 'stdout'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`tesseract failed on ${file}: ${(r.stderr || '').slice(-300)}`);
  return r.stdout;
}

/** Frames of a video every `step` seconds as [{file, t}] in a temp dir; an image is its own single frame. */
export function frames(input, step, tmp) {
  if (IMAGE.test(input)) return [{ file: input, t: null }];
  const dir = fs.mkdtempSync(path.join(tmp, 'ocr-'));
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', input, '-vf', `fps=1/${step}`, path.join(dir, '%06d.png')], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg could not read ${input}: ${(r.stderr || '').slice(-300)}`);
  // fps=1/step emits frame n (1-based) at about (n - 1) * step seconds
  return fs.readdirSync(dir).sort().map((f, i) => ({ file: path.join(dir, f), t: +(i * step).toFixed(2) }));
}

/** OCR every frame of every input and scan the text; `ocr` is injectable for tests. */
export function ocrScan(inputs, { step = 0.5, denylist = [], ocr = tesseractOcr, tmp = os.tmpdir() } = {}) {
  const findings = [];
  for (const input of inputs) {
    for (const { file, t } of frames(input, step, tmp)) {
      const label = t === null ? input : `${input}@${t}s`;
      findings.push(...scanRenderedText([ocr(file)], { label, denylist }));
    }
  }
  return findings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--step');
  const step = i >= 0 ? +args[i + 1] : 0.5;
  const inputs = args.filter((a, j) => !a.startsWith('--') && args[j - 1] !== '--step');
  if (!inputs.length || !(step > 0)) { console.error('usage: node tools/safety/ocr-scan.js <video|image ...> [--step 0.5]'); process.exit(2); }
  const notRun = 'NOTHING was checked: exit 2 is not a pass. The tools image has both tools: docker compose run --rm --entrypoint node media tools/safety/ocr-scan.js <file>';
  if (!hasTool('tesseract')) { console.error(`ocr-scan: tesseract is not installed (Debian/Ubuntu package: tesseract-ocr). ${notRun}`); process.exit(2); }
  if (inputs.some((f) => !IMAGE.test(f)) && !hasTool('ffmpeg')) { console.error(`ocr-scan: ffmpeg is needed to sample video frames. ${notRun}`); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-scan-'));
  try {
    const findings = ocrScan(inputs, { step, denylist: loadDenylist(path.resolve('safety/denylist.txt')), tmp });
    if (findings.length) { console.error(formatFindings(findings)); process.exitCode = 1; }
    else console.log(`ocr-scan: clean (${inputs.length} input(s), every ${step} s). Now look at the frames yourself: OCR misses small text.`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
