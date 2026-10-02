# Changelog — constructorasd.com

All notable changes to this project. Versioning is simple (CLAUDE.md / WB9): a `CHANGELOG.md` entry plus a
`package.json` bump per release. Not tracked in `sgc.app_versiones`.

## 1.2.3 — polished client wall (2026-10-02)

- Redesigned the clients wall (staying text-based — no logos available): larger confident names, clean
  hairline cells with a subtle hover, and no grey placeholder blocks on partial rows. Reads as an
  intentional "trusted by" grid rather than a table. (Logo support stays wired for when official logos arrive.)

## 1.2.2 — founding year confirmed (2026-10-02)

- `COMPANY.founded = 2014` (confirmed). "Volares" photo confirmed as the Elements Volare project cover.

## 1.2.1 — styled file-upload button (2026-10-02)

- Styled the CV upload button (`::file-selector-button`) to match the control aesthetic (bordered chip)
  instead of the browser's default OS button. Found during a full desktop + mobile UI audit of every page.

## 1.2.0 — real brand lockup logo + UI polish (2026-10-02)

- **Logo:** now renders the **full real brand lockup** (monogram + two-line "Scheker & / Domínguez" +
  CONSTRUCTORA) via a `currentColor` CSS mask — matches the brand exactly, stays crisp, and adapts to
  light/dark. Asset `public/img/logo-full.png`. (Replaces the generic one-line Hanken wordmark.)
- **Project detail:** removed the doubled section padding between the intro/facts and the gallery
  (~256px of empty space on desktop → one clean section gap).

## 1.1.1 — internal dedup (2026-10-02)

- Extracted the duplicated detail-page "not found" fallback and the legal prose styles into shared global
  classes (`.detail-missing`, `.legal*` in `_layout.scss`); removed 3 copied SCSS blocks and the 2
  byte-identical legal stylesheets. No visual change.

## 1.1.0 — real obra photos + brand logo fix (2026-10-02)

- **Logo:** replaced the rough traced `.SD` monogram (it rendered blobby) with the **real brand mark**,
  painted via a CSS mask in `currentColor` — pixel-accurate to the logo and still adapts to light/dark
  (header ink, footer bone). Asset: `public/img/logo-mono.png`.
- **Real project photos:** swapped the deck-auto-mapped covers for the client's actual site photos on
  6 projects — City Place, Monterezzo, Olea, Poseidonia, Riviera Bay, Elements Volare. (Romo & Solhe
  pending project details; Solhe's photo has editing markup and needs a clean version.)

## 1.0.3 — image blur-up + small dedup (2026-10-01)

- **Blur-up images:** every `app-image-figure` now paints the manifest's `lqip` (a tiny webp data-URI) as
  the `<picture>` background, so a blurred preview shows while the real image loads — the `lqip` was already
  shipped in the bundle but never rendered. No extra request, no JS.
- **Dedup:** extracted the shared H1 emphasis-split into `core/split-emphasis.ts` (was copied in
  `page-header` and the home hero).

## 1.0.2 — accessibility + structured-data polish (2026-10-01)

- **Accessibility:** gallery lightbox now traps Tab, focuses the close button on open and restores focus to
  the triggering thumbnail on close, with an accessible name; every form field (contact + apply) wires a
  conditional `aria-describedby` + `role="alert"` on its error message; the mobile menu restores focus to its
  toggle on close; sector-filter chips use a new `--line-control` border token that clears 3:1 non-text contrast.
- **Structured data:** detail pages emit entity JSON-LD — `CreativeWork` (projects, live), `NewsArticle`
  (posts) and `JobPosting` (vacancies) — plus breadcrumbs on the news/vacancy pages.
- **Share images:** `og:image` now resolves to the largest variant that actually exists (fixes Plaza Roque's
  broken `-1280` reference → it 404'd), and `og:image:alt` / `twitter:image:alt` are emitted.
- **Sitemap:** every URL now carries `<lastmod>`.

## 1.0.1 — logo refinement + polish (2026-10-01)

- **Logo:** resized the `.SD` monogram so it balances the wordmark instead of towering over it
  (`src/app/ui/logo/logo.scss`) — cleaner header lockup. Also redirects `www/` root to apex (was 200).
- **SEO fix (important):** project / news / job **detail** pages now emit their own canonical, `og:url`
  and hreflang. Previously all 12 project pages pointed their canonical at `/proyectos/`, declaring
  themselves duplicates of the listing (risked de-indexing). `SeoInput` gained optional `path` + `altPaths`.
- **Accessibility:** valid `h1 → h2 → h3` order on `/proyectos` (visually-hidden section heading),
  `aria-pressed` on the sector filter chips, and `tabindex="-1"` on `<main>` so the skip link moves focus.
- **`--header-h` token:** the sticky-header height and the service-anchor `scroll-margin-top` now derive
  from one value (service anchors were landing ~18px off).

## 1.0.0 — production launch (2026-10-01)

- **Live on constructorasd.com.** DNS moved to Squarespace nameservers (`nsa1–4.squarespacedns.com`);
  apex A → Vercel, `www` → 308 → apex; Google MX/SPF/DKIM preserved (email intact). HTTPS issued,
  prod build serving (indexable), sitemap + robots at the apex. Production branch = `main`.
- **Backend applied to prod (csd-core).** Schema `web` + grants + `web-cv` bucket + edge functions
  (`web-contact`, `web-apply`, `web-client-error`) deployed; `RESEND_API_KEY` set (read from SGC Vault),
  sender `noreply@sgcconstructorasd.com` (verified). End-to-end verified in prod: a real contact
  submission persisted to `web.leads` and the notification email delivered (`emailed_at` set); test row removed.
- Fix: Resend setup scripts now resolve Supabase refs by project name (were hardcoding the prod ref,
  which failed the `verify-sin-ref-hardcodeado` guard and the first `main` production build).

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
