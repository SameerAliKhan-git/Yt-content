// Minimal static server so the renderer can fetch fonts + data over http.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.woff2': 'font/woff2', '.css': 'text/css', '.wav': 'audio/wav',
};

export function serve(port = 0) {
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const fp = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404); return res.end('not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  serve(Number(process.argv[2]) || 8099).then(({ port }) =>
    console.log(`serving ${ROOT} on http://127.0.0.1:${port}`));
}
