import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ocrScan, hasTool } from './ocr-scan.js';

// The OCR engine is faked: these tests check the sampling and the scan, not tesseract's reading.
const fakeOcr = (texts) => { let i = 0; return () => texts[i++] ?? ''; };

test('an image is one frame; its OCR text goes through the same rules and denylist', () => {
  const f = ocrScan(['shot.png'], { ocr: fakeOcr(['ssh demo@10.0.0.7 on demo-render-box']), denylist: ['demo-render-box'] });
  assert.deepEqual(f.map((x) => x.category).sort(), ['denylist', 'ipv4']);
  assert.equal(f[0].file, 'shot.png');
  assert.deepEqual(ocrScan(['shot.png'], { ocr: fakeOcr(['a clean terminal']) }), []);
});

test('a video is sampled every step seconds and findings carry the frame time', { skip: !hasTool('ffmpeg') && 'ffmpeg not installed' }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-test-'));
  const video = path.join(tmp, 'clip.mp4');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=2:r=10', '-pix_fmt', 'yuv420p', video]);
  assert.equal(r.status, 0);
  const seen = [];
  const f = ocrScan([video], { step: 0.5, tmp, ocr: (file) => (seen.push(file), seen.length === 3 ? 'box.local' : '') });
  assert.equal(seen.length, 4); // 2 s at one frame per 0.5 s
  assert.deepEqual(f.map((x) => [x.file, x.rule]), [[`${video}@1s`, 'private-domain']]);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('without tesseract the scan exits 2 and says nothing was checked', { skip: hasTool('tesseract') && 'tesseract is installed here' }, () => {
  const r = spawnSync(process.execPath, ['tools/safety/ocr-scan.js', 'shot.png'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /NOTHING was checked: exit 2 is not a pass/);
});
