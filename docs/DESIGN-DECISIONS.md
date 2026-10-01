# Design decisions — constructorasd.com

Running log of every default or judgement call applied while implementing `docs/DESIGN-BRIEF.md`.
Each entry: what was decided, why, and (if it touches the brief) a note that the brief was kept in sync.

> Convention: the brief is law. Anything here is either (a) a detail the brief left open, or (b) a
> deliberate deviation — deviations must also be reflected back into `DESIGN-BRIEF.md` so code and brief
> never diverge (CLAUDE.md hard rule 1 / WA3).

## Prompt 1 — Foundation

### Logo
- **Monogram `.SD` mark**: traced from `logos/csd-no-bg-logo.png` / `sd-no-bg-logo.png` (clean geometric black
  shape on transparent) into a single-path SVG. Provided as `logo-mark.svg` plus full lockups
  `logo-dark.svg` (ink mark + wordmark, for light backgrounds) and `logo-light.svg` (bone, for dark backgrounds).
- **Wordmark "Scheker & Domínguez / CONSTRUCTORA"**: _[to fill: traced vs rebuilt in Hanken Grotesk 700]_.
  The brief (§6) explicitly allows rebuilding the wordmark in Hanken Grotesk 700 if tracing is poor.
- **Favicon**: generated from the `.SD` monogram only.

### Fonts
- Hanken Grotesk (variable, weights 100–900) and Instrument Serif (italic 400) self-hosted from Fontsource
  woff2, latin + latin-ext subsets, `font-display: swap`, `size-adjust` metric fallbacks. No Google Fonts
  requests at runtime. _[to fill: exact Fontsource version / files committed]_.

### Photos
- Curated subset for the `/styleguide` Home-hero mock: _[to fill: the 6 Lopesan filenames picked and why]_.

### Other
- _[to fill as decisions are made]_
