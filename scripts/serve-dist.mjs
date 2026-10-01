// serve-dist.mjs — minimal static server for the prerendered build (used by Playwright + Lighthouse).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

// gzip text assets so local Lighthouse approximates Vercel's compression.
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.xml', '.txt']);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'dist', 'constructorasd', 'browser');
const PORT = process.env.PORT || 4466;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let file = join(ROOT, p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    const idx = join(ROOT, p, 'index.html');
    file = existsSync(idx) ? idx : null;
  }
  if (!file) {
    // SPA-style fallback to the prerendered 404 shell.
    file = join(ROOT, 'index.html');
    res.statusCode = 404;
  }
  try {
    const ext = extname(file);
    res.setHeader('content-type', MIME[ext] || 'application/octet-stream');
    if (/\.(css|js|mjs|woff2|avif|webp|png|svg|ico)$/.test(file)) {
      res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    }
    const body = readFileSync(file);
    const accepts = (req.headers['accept-encoding'] || '').includes('gzip');
    if (accepts && COMPRESSIBLE.has(ext)) {
      res.setHeader('content-encoding', 'gzip');
      res.end(gzipSync(body));
    } else {
      res.end(body);
    }
  } catch {
    res.statusCode = 500;
    res.end('error');
  }
}).listen(PORT, () => console.log(`serve-dist on http://localhost:${PORT}`));
