// gen-og.mjs — `npm run og`. Renders the default 1200×630 Open Graph image from the hero photo + an ink
// scrim + the bone wordmark (traced SVG path, so no font dependency). Output committed to public/og/.
// Run locally (it reads assets-src/, which is gitignored and absent on Vercel). Detail pages use their
// own cover image via SeoService; this is the site-wide/share default.

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HERO = join(ROOT, 'assets-src', 'lopesan', 'hero.jpg');
const WORDMARK = join(ROOT, 'public', 'img', 'logo-light.svg');
const OUT_DIR = join(ROOT, 'public', 'og');
const W = 1200;
const H = 630;

if (!existsSync(HERO)) {
  console.log('[gen-og] ⏭  hero source not found (assets-src absent) — skipped.');
  process.exit(0);
}
mkdirSync(OUT_DIR, { recursive: true });

const base = await sharp(HERO).rotate().resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer();

// Ink scrim: darker on the left/bottom where the wordmark sits.
const scrim = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="1" x2="0.7" y2="0">
        <stop offset="0" stop-color="#141516" stop-opacity="0.9"/>
        <stop offset="0.6" stop-color="#141516" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#141516" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </svg>`,
);

// Wordmark (bone) from the traced lockup, placed bottom-left.
const wmRaw = readFileSync(WORDMARK, 'utf8').replace(
  /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g,
  '&amp;',
);
const vb = wmRaw.match(/viewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number) ?? [0, 0, 440, 108];
const wmWidth = 420;
const wmHeight = Math.round((wmWidth * vb[3]) / vb[2]);
const wordmark = await sharp(Buffer.from(wmRaw)).resize(wmWidth).png().toBuffer();

await sharp(base)
  .composite([
    { input: scrim, left: 0, top: 0 },
    { input: wordmark, left: 72, top: H - wmHeight - 72 },
  ])
  .jpeg({ quality: 82 })
  .toFile(join(OUT_DIR, 'default.jpg'));

console.log('[gen-og] ✓ public/og/default.jpg (1200×630)');
