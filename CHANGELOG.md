# Changelog — constructorasd.com

All notable changes to this project. Versioning is simple (CLAUDE.md / WB9): a `CHANGELOG.md` entry plus a
`package.json` bump per release. Not tracked in `sgc.app_versiones`.

## 1.0.0-rc.1 — backend & launch prep (Prompt 3)

- Supabase schema `web` (leads, job_applications, rate_limits, client_errors) with RLS and no anon
  policies — only the edge functions (service role) write. Private `web-cv` storage bucket. Applied and
  tested on **sgc-dev**; prod runbook in `docs/DNS-CUTOVER.md` (gated on Xaviel's OK).
- Edge functions (Deno): `web-contact`, `web-apply`, `web-client-error` — validation, anti-spam
  (honeypot + min fill time + per-IP rate limit on a salted hash + link-stuffing), persist-then-email via
  Resend (dev redirect to Tecnología, `[DEV]` subject), signed 7-day CV links, CORS. Deployed to sgc-dev.
- Frontend `LeadsService` (anon key only) wires the contact + application forms; optimistic UI, friendly
  bilingual error state, `lead_submitted` / `application_submitted` analytics events. Client error reporter
  → `web-client-error`. Analytics + Speed Insights are prod-only.
- Shared validators (`src/shared/lead-validation.ts`) with vitest. `docs/ANALYTICS.md`, `README.md`,
  `docs/DNS-CUTOVER.md`. Verified end-to-end on sgc-dev: a lead row persists; email records `email_error`
  until `RESEND_API_KEY` is provided.

## 0.2.0 — content & pages (Prompt 2)

- Content model (`src/content/types.ts`) mirroring future `web.*` tables; data filled from the 2026
  presentation (company, 7 stages, 8 equipment lines, 6 sectors, 12 projects, ~42 clients) in ES + EN.
  `content.spec.ts` invariants; `docs/CONTENT-MODEL.md` with the TS↔SQL DDL.
- PPTX media extractor + curated project covers, stage images and a Lopesan gallery (optimized, 1280w cap).
- All pages in both languages: Home (10 sections), Empresa, Servicios (7 stage sections + anchors + heights),
  Equipos, Proyectos (grid/list URL toggle + sector filter), **project detail** (prerendered per slug in
  both languages, facts, gallery + lightbox, prev/next), Clientes, Vacantes + CV application form, Noticias
  (+ markdown article), Contacto (+ SVG map card), Privacidad, Aviso legal, enriched 404. 47 routes prerendered.
- SEO: per-page meta/canonical/hreflang, Organization + BreadcrumbList JSON-LD, OG default image, env-aware
  robots (prod allows / preview disallows), sitemap of all routes. Hero LCP preload. Lighthouse: A11y 100,
  CLS 0; Perf ≥90 on Vercel (brotli/CDN). Extended Playwright (12 details, lang round-trip, filters, lightbox).

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
