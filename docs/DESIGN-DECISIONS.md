# Design decisions — constructorasd.com

Running log of every default or judgement call applied while implementing `docs/DESIGN-BRIEF.md`.
The brief is law; anything here is either a detail the brief left open or a deliberate deviation (deviations
are also reflected back into the brief/code so they never diverge — CLAUDE.md rule 1 / WA3).

## Prompt 1 — Foundation

### Tokens
- Added one primitive, **`--concrete-500: #6E695F`**, and mapped light `--text-3` to it (instead of
  `--concrete-400`). Reason: eyebrow/meta text is small, so it must clear WCAG AA 4.5:1; `--concrete-400`
  on `--bg` is only ~3.3:1. The new value is ~4.8:1. Dark `--text-3` stays `--concrete-400` (passes on ink).
  `scripts/verify-contrast.mjs` checks every pair in both tones and is green.

### Logo
- **Monogram `.SD`**: traced from `logos/sd-no-bg-logo.png` (potrace) to a single clean path; used inline
  with `fill="currentColor"` in the `Logo` component, and as static files `public/img/logo-{dark,light}.svg`
  (full lockup traced from `csd-no-bg-logo.png`) for JSON-LD/OG. Also `public/favicon.svg` + PNG favicons
  (32/180/192/512) + `site.webmanifest`, all generated from the monogram.
- **Wordmark "Scheker & Domínguez / CONSTRUCTORA"**: **rebuilt as live text in Hanken Grotesk 700** in the
  `Logo` component (brief §6 explicitly allows this). Lighter DOM than inlining the 13k-char traced wordmark,
  and crisp. The traced full-lockup is still available as the static SVG files.

### Fonts
- Hanken Grotesk (variable 100–900) + Instrument Serif (italic 400), self-hosted from Fontsource
  (`@fontsource-variable/hanken-grotesk`, `@fontsource/instrument-serif`), latin + latin-ext woff2 in
  `public/fonts/`, `font-display: swap`, a metric-adjusted `Hanken Fallback` to cut CLS. The two primary
  faces are `<link rel=preload>`-ed in `index.html`. No Google Fonts at runtime (verified by the Playwright smoke).

### Images / ImageFigure
- `ImageFigure` is a hand-rolled `<picture>` with AVIF + WebP `srcset` and a reserved `aspect-ratio`,
  **instead of `NgOptimizedImage`**. Same AVIF/WebP + no-CLS result without needing a custom image loader for
  our static output. Missing image key → neutral concrete placeholder with a thin label (never a stock image).
- Pipeline caps at **1600w** (480/960/1600) at AVIF q44 / WebP q52. Reason: the container is 1320px and these
  detailed site photos compress poorly past 1600w (2400w blew the 250 kB budget). Hero (LCP) target is defined
  at 1600w AVIF; `verify-images.mjs` enforces 180 kB for hero AVIF and 250 kB for everything else.

### Photos picked for the styleguide (from the 116 Lopesan Costa Bávaro Bloque F shots)
Chosen for composition (wide formwork/structure, no close-up faces), keys under `lopesan/`:
- `hero` (20240822_112357) — green shoring beams + rebar + sky, used as the Home-hero mock + featured card.
- `estructura` (20240822_113233) — overhead formwork beams, used in the StageRow (etapa 04).
- `obra` (20240710_173600), `puntales` (20240710_171108), `componentes` (20240822_121906) — gallery spares.
- Dropped `encofrado` (20240822_122555): a timber-stack shot whose WebP wouldn't fit the 250 kB budget and
  which was the least compelling composition.

### Motion / behavior
- `appReveal` uses `IntersectionObserver` via `afterNextRender` (SSR-safe; content is fully visible without JS)
  and a global `prefers-reduced-motion` kill switch in `styles.scss`.
- StageRow uses native `<details>/<summary>` so it expands with no JS.
- StatsBand numerals are **static** (no count-up in Prompt 1): the values ("45+", "12") are non-numeric strings,
  so a count-up would be awkward; deferred as a possible enhancement.

### Content shown on `/styleguide`
All real, sourced from the 2026 presentation (nothing invented — rule 2): the four stats, the full stage 04
(Estructura) with its heights table, the philosophy quote, three project cards (Lopesan featured with photo;
Poseidonia and Hospital Barahona as neutral placeholders), and 12 real client names.

### Deviations to carry into later prompts
- Per-project `sector`/`city` are only set where confirmed (Lopesan, Hospital Barahona). The rest await
  Prompt 2 — see `CONTENIDO-PENDIENTE.md`.
