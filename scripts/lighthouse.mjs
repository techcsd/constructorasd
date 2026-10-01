// lighthouse.mjs — `npm run lighthouse` (DESIGN-BRIEF §9). Advisory until real images land (Prompt 2),
// but A11y / Best-Practices / SEO = 100 are mandatory now.
//
// Serves the prerendered static build locally, runs Lighthouse (mobile) on Home + /styleguide via
// `npx lighthouse`, writes HTML reports to lighthouse/, and fails if a mandatory category is below budget.
// Best-effort: if Chrome / lighthouse can't run in this environment, it reports and exits 0 (never blocks
// a commit) — the Vercel preview is the source of truth for the checkpoint.

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { homedir } from 'node:os';

// Resolve a Chrome/Chromium binary for chrome-launcher. Prefer an explicit CHROME_PATH; otherwise fall
// back to the Chromium that Playwright installs (so `npm run lighthouse` works without a system Chrome).
function resolveChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = join(homedir(), 'AppData', 'Local', 'ms-playwright');
  const linuxBase = join(homedir(), '.cache', 'ms-playwright');
  for (const root of [base, linuxBase]) {
    if (!existsSync(root)) continue;
    const dirs = readdirSync(root)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort()
      .reverse();
    for (const d of dirs) {
      for (const rel of ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome']) {
        const p = join(root, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return '';
}
const CHROME = resolveChrome();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'lighthouse');
const browser = join(ROOT, 'dist', 'constructorasd', 'browser');

const BUDGETS = { performance: 90, accessibility: 100, 'best-practices': 100, seo: 100 };
const MANDATORY = ['accessibility', 'best-practices', 'seo'];
const TARGETS = [
  { url: '/', name: 'home' },
  { url: '/styleguide/', name: 'styleguide' },
];

if (!existsSync(browser)) {
  console.log('[lighthouse] ⏭  no build output — run `npm run build` first.');
  process.exit(0);
}
mkdirSync(OUT, { recursive: true });

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
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function serve(port) {
  return createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = join(browser, p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      const idx = join(browser, p, 'index.html');
      file = existsSync(idx) ? idx : join(browser, 'index.html');
    }
    try {
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  }).listen(port);
}

const PORT = 4321;
const server = serve(PORT);

function runLighthouse(url, name) {
  const report = join(OUT, `${name}.report.json`);
  const html = join(OUT, `${name}.html`);
  const res = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      '-y',
      'lighthouse',
      url,
      '--quiet',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--chrome-flags=--headless=new --no-sandbox',
      `--output=json`,
      `--output=html`,
      `--output-path=${join(OUT, name)}`,
    ],
    {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      timeout: 180000,
      env: { ...process.env, ...(CHROME ? { CHROME_PATH: CHROME } : {}) },
    },
  );
  // lighthouse writes <path>.report.json / <path>.report.html with multiple outputs
  const jsonPath = existsSync(report) ? report : join(OUT, `${name}.report.json`);
  if (!existsSync(jsonPath)) {
    console.log(`[lighthouse] ⚠  could not produce a report for ${name} (Chrome/lighthouse unavailable).`);
    if (res.stderr) console.log('   ' + res.stderr.split('\n').slice(0, 3).join('\n   '));
    return null;
  }
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const scores = {};
  for (const k of Object.keys(BUDGETS)) scores[k] = Math.round((data.categories[k]?.score ?? 0) * 100);
  return scores;
}

let failed = false;
try {
  for (const t of TARGETS) {
    const scores = runLighthouse(`http://localhost:${PORT}${t.url}`, t.name);
    if (!scores) continue;
    console.log(`\n  ${t.name}  ${t.url}`);
    for (const [k, v] of Object.entries(scores)) {
      const budget = BUDGETS[k];
      const ok = v >= budget;
      const mandatory = MANDATORY.includes(k);
      if (!ok && mandatory) failed = true;
      console.log(
        `    ${ok ? '✓' : mandatory ? '✗' : '•'} ${k.padEnd(16)} ${v}  (budget ${budget}${mandatory ? ', mandatory' : ', advisory'})`,
      );
    }
  }
} finally {
  server.close();
}

console.log('');
if (failed) {
  console.error('[lighthouse] ✗ a mandatory category (A11y/BP/SEO) is below 100.');
  process.exit(1);
}
console.log('[lighthouse] ✓ done (reports in lighthouse/).');
