# Baseline vs. after — Lighthouse mobile (local, prerendered `dist`, `scripts/serve-dist.mjs`)

Baseline = commit `1fa4326` (3.1.0, `dev`) built with `ng build` only (committed images/content, no CMS fetch).
After = this branch after the photo work (6 enhanced covers swapped on dev, `large` variants, per-role budgets).
Run: `npm run lighthouse` (fixed this round: static server now runs in a child process; paths with spaces quoted).

| Page | Perf (base → after) | LCP ms (base → after) | CLS | Transfer kB (base → after) | A11y | BP |
|---|---|---|---|---|---|---|
| `/` | 86 → 86 | 4091 → 4101 | 0 → 0 | 402 → 402 | 100 | 100 |
| `/proyectos/` | 83 → 83 | 4738 → 4737 | 0 → 0 | 594 → 594 | 100 | 100 |
| `/proyectos/lopesan-costa-bavaro-bloque-f/` | 85 → 85 | 4426 → 4441 | 0 → 0 | 676 → 676 | 100 | 100 |
| `/servicios/` | 89 → 89 | 3810 → 3826 | 0 → 0 | 403 → 403 | 100 | 100 |
| `/en/` | 85 → 86 | 4129 → 4096 | 0 → 0 | 402 → 402 | 100 | 100 |

Notes
- No regression: card/gallery images are still served at ≤ 250 kB AVIF; `large` (≤ 600 kB) is only in the lightbox srcset.
- Performance < 90 and SEO 69 are **pre-existing and local-only**: Lighthouse throttles mobile on localhost, and SEO fails on the
  non-indexed `http://localhost` dev build (noindex + no canonical host). Same numbers in the baseline.
- Raw reports: `lighthouse/*.report.json` (gitignored).

## After PROMPT-14 (gallery layout, 2026-11-24)

| Page | Perf (3.2.0 → 3.3.0) | LCP ms | CLS | Transfer kB |
|---|---|---|---|---|
| `/` | 86 → 86 | 4094 | 0 | 402 |
| `/proyectos/` | 83 → 83 | 4728 | 0 | 594 |
| `/proyectos/lopesan-costa-bavaro-bloque-f/` | 85 → 88 | 3979 | 0 | 676 → 439 (gallery shows ≤ a full-row subset, "Ver todas" for the rest) |
| `/servicios/` | 89 → 89 | 3826 | 0 | 404 |
| `/en/` | 86 → 86 | 4095 | 0 | 402 |

CLS 0 everywhere. Perf < 90 and SEO 69 remain the local-throttling/`noindex`-on-dev artefacts noted above (not regressions). Villa Cacique 38 has no gallery (cover only), so only Lopesan has a detail gallery to measure.
