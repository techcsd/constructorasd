// verify-no-ai-tropes.mjs — DESIGN GUARD (DESIGN-BRIEF §1 / WA3). Runs in prebuild.
//
// Statically-checkable half of the anti-"AI look" rules. Fails the build on:
//   1) background gradients (allowed only via the scrim mixin / lines marked `scrim`);
//   2) backdrop-filter (glassmorphism);
//   3) forbidden hues anywhere — purple / violet / indigo / teal / "AI blue";
//   4) emoji in templates (icons must be SVG from the sprite);
//   5) border-left ≥ 3px with a color (the "card with a colored left stripe");
//   6) border-radius ≥ 12px except the WhatsApp .fab (brief caps radii at 6px);
//   7) banned copy clichés (ES + EN) and lorem ipsum, in templates/content.
//
// Scope: src/**. Per-line escape hatch: `tropes-allow` in a comment.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

const ALLOW = /tropes-allow/;

const GRADIENT = /\b(linear|radial|conic)-gradient\s*\(/i;
const BACKDROP = /backdrop-filter\s*:/i;
const EMOJI = /\p{Extended_Pictographic}/u;
// © ® ™ are Extended_Pictographic but are legitimate text symbols, not emoji icons.
const EMOJI_ALLOW = '©®™';
const BORDER_LEFT = /border-left\s*:\s*([^;{}]+)/i;
const BORDER_RADIUS = /border-radius\s*:\s*([^;{}]+)/i;

// Forbidden hues: color keywords + a few infamous "AI" hexes. The palette is closed (ink/bone/oxide).
const FORBIDDEN_COLOR =
  /\b(purple|violet|indigo|teal|fuchsia|magenta|rebeccapurple|turquoise|aquamarine)\b/i;
const FORBIDDEN_HEX = /#(6[0-9a-f]7|7c3aed|8b5cf6|6366f1|4f46e5|14b8a6|0d9488|2dd4bf|a855f7)\b/i;

// Banned copy clichés (DESIGN-BRIEF §1.8). Checked in visible text (html/ts/json/md).
const BANNED_COPY = [
  /\belevate\b/i,
  /\bunlock\b/i,
  /\bseamless\b/i,
  /\bcutting[-\s]edge\b/i,
  /soluciones integrales a su medida/i,
  /¡?bienvenid[oa]!?/i,
  /\blorem ipsum\b/i,
];

function walk(dir, exts) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

function enclosingSelector(lines, idx) {
  for (let i = idx; i >= 0 && i > idx - 40; i--) {
    const brace = lines[i].indexOf('{');
    if (brace >= 0) return lines[i].slice(0, brace);
  }
  return '';
}

const violations = [];

// ── SCSS: gradients, backdrop-filter, border-left, border-radius, hues ──
for (const file of walk(SRC, ['.scss'])) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const isMixins = /_mixins\.scss$/.test(rel);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (ALLOW.test(line)) return;
    if (GRADIENT.test(line) && !isMixins && !/scrim/i.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'gradient', text: line.trim().slice(0, 90) });
    }
    if (BACKDROP.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'backdrop-filter', text: line.trim().slice(0, 90) });
    }
    // Motion anti-AI (WN3) — public styles only (the private admin has its own system). No animated hue,
    // no animated gradient background-position, no blur animation outside the image LQIP, no transition/
    // animation longer than 1200 ms (Ken Burns uses var(--m-kenburns), so no literal to catch).
    if (!/[\\/]admin[\\/]/.test(rel)) {
      if (/hue-rotate/i.test(line)) violations.push({ rel, line: i + 1, kind: 'animated-hue', text: line.trim().slice(0, 90) });
      if (/background-position/i.test(line) && /@keyframes/i.test(enclosingSelector(lines, i))) {
        violations.push({ rel, line: i + 1, kind: 'animated-bg-position', text: line.trim().slice(0, 90) });
      }
      if (/\bblur\s*\(/i.test(line) && /(transition|animation)\s*:/i.test(line) && !/image-figure\.scss$/.test(rel)) {
        violations.push({ rel, line: i + 1, kind: 'blur-animation', text: line.trim().slice(0, 90) });
      }
      if (/(transition|animation)\s*:/i.test(line)) {
        const over = [...line.matchAll(/(\d+(?:\.\d+)?)s\b/g)].some((m) => parseFloat(m[1]) > 1.2) ||
          [...line.matchAll(/(\d{4,})ms\b/g)].some((m) => parseInt(m[1], 10) > 1200);
        if (over) violations.push({ rel, line: i + 1, kind: 'too-slow', text: line.trim().slice(0, 90) });
      }
    }
    if (FORBIDDEN_COLOR.test(line) || FORBIDDEN_HEX.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'forbidden-hue', text: line.trim().slice(0, 90) });
    }
    const bl = line.match(BORDER_LEFT);
    if (bl && !/border-left-(width|style|color)/.test(line)) {
      const px = bl[1].match(/(\d+(?:\.\d+)?)px/);
      const hasColor = /#|rgb|hsl|var\(--/.test(bl[1]) && !/transparent|none/.test(bl[1]);
      if (px && parseFloat(px[1]) >= 3 && hasColor) {
        violations.push({ rel, line: i + 1, kind: 'card-left-stripe', text: line.trim().slice(0, 90) });
      }
    }
    const br = line.match(BORDER_RADIUS);
    if (br) {
      const sel = enclosingSelector(lines, i);
      const isFab = /fab/i.test(sel) || /fab/i.test(line);
      const px = br[1].match(/(\d+(?:\.\d+)?)px/);
      const round = /\b(50%|999+px|9999px)\b/.test(br[1]) || /\b\d{3,}px\b/.test(br[1]);
      if (!isFab && ((px && parseFloat(px[1]) >= 12) || round)) {
        violations.push({ rel, line: i + 1, kind: 'radius-too-big', text: line.trim().slice(0, 90) });
      }
    }
  });
}

// ── HTML: emoji, forbidden hues inline, banned copy ──
for (const file of walk(SRC, ['.html'])) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (ALLOW.test(line)) return;
    const chars = [...line].filter((c) => EMOJI.test(c) && !EMOJI_ALLOW.includes(c)).join('');
    if (chars) {
      violations.push({ rel, line: i + 1, kind: 'emoji', text: chars });
    }
    if (FORBIDDEN_COLOR.test(line) || FORBIDDEN_HEX.test(line)) {
      violations.push({ rel, line: i + 1, kind: 'forbidden-hue', text: line.trim().slice(0, 90) });
    }
  });
}

// ── Copy clichés + lorem: html/ts/json/md ──
for (const file of walk(SRC, ['.html', '.ts', '.json', '.md'])) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (/\.spec\.ts$/.test(rel)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (ALLOW.test(line)) return;
    for (const re of BANNED_COPY) {
      if (re.test(line)) {
        violations.push({ rel, line: i + 1, kind: 'banned-copy', text: line.trim().slice(0, 90) });
        break;
      }
    }
  });
}

if (violations.length) {
  console.error(
    `\n[verify-no-ai-tropes] ✗ ${violations.length} "AI-look" violation(s) (DESIGN-BRIEF §1):\n` +
      `  gradient→solid token · backdrop-filter→remove · forbidden-hue→ink/bone/oxide only\n` +
      `  emoji→SVG sprite icon · card-left-stripe→eyebrow/chip · radius-too-big→≤6px (fab excepted)\n` +
      `  banned-copy→statements, not clichés (adapt the 2026 presentation; no lorem)\n` +
      `  (legitimate exception: add "tropes-allow" in a comment on the line)\n`,
  );
  for (const v of violations) console.error(`  [${v.kind}] ${v.rel}:${v.line}  ${v.text}`);
  console.error('');
  process.exit(1);
}
console.log('[verify-no-ai-tropes] ✓ no AI-look tropes detected.');
