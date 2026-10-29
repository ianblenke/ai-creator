// Offline stand-in for the voice server: same route, returns a quiet sine tone sized to the text. For transport tests only (the GPU-free first run uses VOICE_TRANSPORT=fixture).
import http from 'node:http';

export function wavTone(seconds, rate = 24000) {
  const n = Math.round(seconds * rate);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 220 * i) / rate) * 6000), 44 + i * 2);
  return buf;
}

export function stubServer() {
  return http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/v1/audio/speech') { res.writeHead(404).end(); return; }
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      const words = (JSON.parse(body).input || '').split(/\s+/).filter(Boolean).length;
      res.writeHead(200, { 'Content-Type': 'audio/wav' }).end(wavTone(Math.max(0.5, words / 2.5)));
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) stubServer().listen(Number(process.env.PORT || 8080), '0.0.0.0');
