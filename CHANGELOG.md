# Changelog — constructorasd.com

All notable changes to this project. Versioning is simple (CLAUDE.md / WB9): a `CHANGELOG.md` entry plus a
`package.json` bump per release. Not tracked in `sgc.app_versiones`.

## 0.1.0 — foundation (Prompt 1)

Foundation, design system and `/styleguide` checkpoint.

- Scaffolded Angular 21 (standalone, signals, `@angular/ssr` with full static prerender).
- Environment wiring: generated-and-gitignored `environment.ts` from `.env.local`, `--env dev|prod` gating,
  prod-ref guard, `vercel.json` (security headers, redirects), DEV ribbon + `noindex` on non-prod.
- Design system from `docs/DESIGN-BRIEF.md`: semantic SCSS tokens (light/dark), self-hosted fonts
  (Hanken Grotesk + Instrument Serif), type/layout scales, and the full `src/app/ui/` component library.
- i18n: runtime `t()` + route-prefix locale (`/` ES, `/en`), localized routes with translated slugs, `hreflang`.
- SEO: `SeoService` (title template, canonical, OG/Twitter, JSON-LD Organization), sitemap generator, robots.txt.
- Quality guards in `prebuild`: `verify-tokens`, `verify-no-ai-tropes`, `verify-contrast`, `verify-i18n`,
  `verify-images`, `verify-sin-ref-hardcodeado`. Image pipeline (`sharp`), vitest units, Playwright smoke, Lighthouse.
- `/styleguide` checkpoint page (WA15) with every component, real content and a Home hero mock.
