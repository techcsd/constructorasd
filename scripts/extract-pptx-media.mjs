// extract-pptx-media.mjs — unzip ppt/media/* from the 2026 presentation into assets-src/pptx/ and
// write assets-src/pptx/slides-map.json (slide number → media files, from ppt/slides/_rels/*.rels and
// the slide XML text), so images can be mapped to sections/projects by slide (WA16):
//   slides 7–14 = stages · 17–19 = projects · 21–22 = client logos.
//
// If the PPTX is absent, exits 0 with a note (Prompt 2 continues with the Lopesan folder + placeholders).

import AdmZip from 'adm-zip';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PPTX = join(
  ROOT,
  '..',
  '..',
  '..',
  '..',
  'developer',
  'constructorasd improvements',
  'October',
  'csd imp 01102026',
  'assets',
  'Presentacion_Global_CSD_2026_v5.pptx',
);
// Resolve the PPTX: explicit arg, then PPTX_PATH env, then the relative guess (round-docs sibling).
const pptxPath = process.argv[2] || process.env.PPTX_PATH || PPTX;
const OUT = join(ROOT, 'assets-src', 'pptx');

if (!existsSync(pptxPath)) {
  console.log(`[extract-pptx-media] ⏭  PPTX not found at ${pptxPath} — skipped.`);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
const zip = new AdmZip(pptxPath);
const entries = zip.getEntries();

// 1) Extract media files.
const media = [];
for (const e of entries) {
  if (/^ppt\/media\/[^/]+\.(png|jpe?g|gif|emf|wmf|svg|webp)$/i.test(e.entryName)) {
    const name = e.entryName.split('/').pop();
    writeFileSync(join(OUT, name), e.getData());
    media.push(name);
  }
}

// 2) Build slide → { rels: {rId: target}, media: [names], text } map.
const slideMap = {};
const relRe = /Id="([^"]+)"\s+Type="[^"]*"\s+Target="([^"]+)"/g;
for (const e of entries) {
  const m = e.entryName.match(/^ppt\/slides\/_rels\/slide(\d+)\.xml\.rels$/);
  if (!m) continue;
  const slide = Number(m[1]);
  const xml = e.getData().toString('utf8');
  const rels = {};
  const mediaForSlide = [];
  let r;
  relRe.lastIndex = 0;
  while ((r = relRe.exec(xml))) {
    const target = r[2];
    rels[r[1]] = target;
    const mm = target.match(/media\/([^/]+)$/);
    if (mm) mediaForSlide.push(mm[1]);
  }
  slideMap[slide] = { media: mediaForSlide, rels };
}

// 3) Attach a short text snippet per slide (for human mapping).
for (const e of entries) {
  const m = e.entryName.match(/^ppt\/slides\/slide(\d+)\.xml$/);
  if (!m) continue;
  const slide = Number(m[1]);
  const xml = e.getData().toString('utf8');
  const text = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)]
    .map((x) => x[1])
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  if (slideMap[slide]) slideMap[slide].text = text;
}

writeFileSync(join(OUT, 'slides-map.json'), JSON.stringify(slideMap, null, 2) + '\n');
console.log(
  `[extract-pptx-media] ✓ ${media.length} media file(s) → assets-src/pptx/ ; ` +
    `${Object.keys(slideMap).length} slides mapped → slides-map.json`,
);
