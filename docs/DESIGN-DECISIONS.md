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

## Round 06-oct-2026 (v1.6.0)

### AI upscaling via the pipeline (WD5 / WF2 — brief §8 updated)
Xaviel authorized AI upscaling (previously "no AI upscaling") to lift low-res covers to the ≥1600 w
target. `scripts/upscale-images.mjs` uses **Real-ESRGAN** when the portable binary is present, else a
**sharp lanczos3 + mild sharpen** fallback (no GPU/binary on this machine → fallback was used this
round, logged at runtime). Upscaled copies live in `assets-src/upscaled/`; `optimize-images.mjs` prefers
them. Never beyond ×4. `verify-images.mjs` now fails the build if any project cover lacks a ≥1600 w
variant. **2400 w was intentionally not added**: at q42 a 2400 AVIF of these dense aerial photos exceeds
the 250 kB budget (rule 8); the 1600 tier uses AVIF q36 to stay under budget.

**Files upscaled this round** (source → factor → one-line verdict):
- `projects/city-place` 1280 → ×2 — OK (mild 1.25× to the 1600 variant, clean).
- `projects/elements-volare` 1280 → ×2 — OK.
- `projects/monterezzo` 1280 → ×2 — OK.
- `projects/olea` 1280 → ×2 — OK.
- `projects/poseidonia` 1280 → ×2 — OK.
- `projects/riviera-bay` 1280 → ×2 — OK.
- `projects/plaza-roque` 768 → ×4 — acceptable (sharp, soft but natural, sharper than the 768 original);
  **real hi-res photo still wanted** — logged in CONTENIDO-PENDIENTE.
- `stages/etapa-01` 1169 → ×2 — OK.
- `stages/etapa-04` 1217 → ×2 — OK.
- `stages/etapa-05` 768 → ×4 — acceptable but low source; real photo wanted (logged).
- `stages/etapa-07` 1280 → ×2 — OK.

### Lopesan gallery curation (WE7)
From the 9 available Lopesan photos the gallery was cut to the structural / façade shots
(`estructura`, `apuntalamiento`, `fachada`; cover `hero`). Dropped the material-stack and mis-oriented
photos (`componentes`, `encofrado-vertical`, `puntales`, `losas`, `obra`). A richer 8–10 photo set can
be pulled from the 116-photo Lopesan archive later (logged in CONTENIDO-PENDIENTE).

## Admin "Dark studio console" (PROMPT-11 / WN4) — 2026-10-08

**WO1 self-approved.** Xaviel delegated the Part-A approval gate ("yes do all u want, do everything,
do all the stuff"), so the mock was not paused for the 3 questions — the documented defaults were applied
and the work continued straight through Part B.

**Re-skin by token remap, not a ground-up rebuild.** The admin already consumed the semantic tokens
(`--bg`, `--text`, `--accent`, …). Rather than rewrite every screen onto a new component kit, the dark
palette is a token remap scoped to `.adm, .adm-auth` (in `admin.scss`); custom-property inheritance
re-skins every descendant at once, keeping all existing behaviour and the full admin e2e suite green.
Consequence: `admin-cms.scss` redefines the `.adm-btn` family locally, because Angular scopes component
styles and the shell's button rules don't reach the lazy CMS-editor child components.

**Signature layer added on top** (what makes it "studio console", all admin-only / lazy chunk, all
collapsing under `prefers-reduced-motion`): a single fixed ambient oxide glow + faint self-contained SVG
grain; a glass sticky top bar (`backdrop-filter`); an oxide sidebar active-indicator that springs in;
per-screen route entrance motion; and a **Ctrl+K command palette** (fuzzy jump across every section +
"Ver el sitio"/"Cerrar sesión"). The `tropes-allow` markers on the glow/glass are deliberate per the
brief (WN4) and admin-only; the public anti-AI-trope rules are unchanged.

**JetBrains Mono deferred → system mono stack.** The brief asks to self-host JetBrains Mono for console
numerals. No licensed woff2 was available locally and a webfont can't be fetched safely, so `--font-mono`
uses the system stack (`"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`) with `tabular-nums`
via the `.adm-num` utility. This ships zero extra bytes and no CSP/network dependency; if the real font
is wanted later, drop the woff2 in `public/fonts/` and it takes over (first in the stack).

**Not done this round (deferred, logged):** the full bespoke component kit (sparkline stat tiles, tabs
with sliding indicator, 3-pane Leads inbox, masonry Biblioteca), the collapsible 240/64 icon rail (needs
a per-section icon set the public sprite doesn't yet have), and the rebuilt dashboard/editor from brief
§6. The current re-skin delivers the approved visual direction + motion with no regression; these are
polish on top and can be a follow-up round.
