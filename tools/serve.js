// Tiny static server for the harness: /stage (tools/stage), /vendor, /scene/<id>.js, /timeline.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

export function startServer(episodeDir, { port = 0, host = '127.0.0.1' } = {}) {
  const roots = {
    '/stage/': path.resolve('tools/stage'),
    '/vendor/': path.resolve('vendor'),
    '/scene/': path.resolve(episodeDir, 'scenes'),
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = null;
    if (url.pathname === '/timeline.json') file = path.resolve(episodeDir, 'timeline.json');
    for (const [prefix, dir] of Object.entries(roots)) {
      if (url.pathname.startsWith(prefix)) {
        const f = path.resolve(dir, '.' + url.pathname.slice(prefix.length - 1));
        if (f.startsWith(dir + path.sep)) file = f;
      }
    }
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve({ server, port: server.address().port, close: () => new Promise((r) => server.close(r)) }));
  });
}
