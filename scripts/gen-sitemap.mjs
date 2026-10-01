// gen-sitemap.mjs — runs in `postbuild`. Enumerates the prerendered routes (both languages) from the
// static output and writes sitemap.xml + ensures robots.txt points at it. SEO (CLAUDE.md §SEO / WB3).

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Resolve siteUrl from the generated environment.ts (falls back to prod domain).
function siteUrl() {
  try {
    const env = readFileSync(join(ROOT, 'src', 'environments', 'environment.ts'), 'utf8');
    const m = env.match(/"siteUrl"\s*:\s*"([^"]+)"/);
    if (m && m[1]) return m[1].replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  return 'https://constructorasd.com';
}

// Find the prerendered browser output dir.
const CANDIDATES = [
  join(ROOT, 'dist', 'constructorasd', 'browser'),
  join(ROOT, 'dist', 'constructorasd'),
];
const browser = CANDIDATES.find((d) => existsSync(d));
if (!browser) {
  console.log('[gen-sitemap] ⏭  no build output found — skipped (run after `npm run build`).');
  process.exit(0);
}

// Every directory containing an index.html is a route.
const routes = new Set();
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (name === 'index.html') {
      let rel = relative(browser, dir).replace(/\\/g, '/');
      rel = rel === '.' ? '' : rel;
      // Skip the noindex styleguide from the sitemap.
      if (rel === 'styleguide') continue;
      routes.add('/' + rel);
    }
  }
}
walk(browser);

const base = siteUrl();
const urls = [...routes]
  .map((r) => (r === '/' ? '' : r))
  .sort()
  .map((r) => `  <url>\n    <loc>${base}${r}/</loc>\n  </url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(join(browser, 'sitemap.xml'), xml, 'utf8');

// Make sure robots.txt (committed in public/, copied to output) references the sitemap.
const robotsPath = join(browser, 'robots.txt');
let robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8') : 'User-agent: *\nAllow: /\n';
if (!/Sitemap:/i.test(robots)) robots += `\nSitemap: ${base}/sitemap.xml\n`;
writeFileSync(robotsPath, robots, 'utf8');

console.log(`[gen-sitemap] ✓ ${routes.size} route(s) → sitemap.xml (base ${base}).`);
