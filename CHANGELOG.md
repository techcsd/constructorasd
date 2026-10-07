# Changelog — constructorasd.com

All notable changes to this project. Versioning is simple (CLAUDE.md / WB9): a `CHANGELOG.md` entry plus a
`package.json` bump per release. Not tracked in `sgc.app_versiones`.

## 2.0.3 — miniaturas del admin rápidas (2026-10-07)

Las miniaturas del admin cargaban los **originales de 4 MB (4000×3000)** desde Storage — una por una y lento.
Ahora usan **Supabase image transform** (`/render/image/...`): 160–480 px según el sitio donde se muestran
(~7 KB cada una, ~580× menos) y `loading="lazy"` + `decoding="async"` para no pedir todas a la vez. Nuevo
`CmsService.thumbUrl(path, width)`; los SVG (sin transform) devuelven el original. El sitio público no cambia.

## 2.0.2 — fixes del admin en vivo (2026-10-07)

- **Previsualizaciones de imagen en /admin** (miniaturas de lista, portada, galería, biblioteca) salían en
  blanco: cargan desde URLs públicas de Supabase Storage, pero el CSP era `img-src 'self' data: blob:` (sin
  host de Supabase) → el navegador las bloqueaba. Se añadió `https://*.supabase.co` a `img-src` (ya estaba en
  `connect-src`). El sitio público no cambia (sirve `/img/cms/*` propio). Verificado: cabecera CSP nueva en
  prod + una imagen real de Storage responde 200.
- **"Hay cambios sin publicar" falso** (sin editar nada): `unpublishedChanges()` comparaba contra
  `site_state.last_published_at`, que solo se sella con el botón Publicar — los despliegues por git nunca lo
  limpiaban. Ahora compara contra la hora del build en vivo (`version.json` builtAt, que refresca **cualquier**
  despliegue) o el sello de publicación, el más reciente; con `Date.parse` (Postgres da `+00:00`, JS da `Z`) y
  5 s de gracia por desfase de reloj. Se auto-limpia tras cualquier deploy.

> Nota: tras desplegar, hacer **recarga forzada** del admin (Ctrl+Shift+R) — el navegador cachea la cabecera
> CSP y el JS del panel; el hard refresh toma el deploy nuevo.

## 2.0.1 — cierre de brechas de la ronda (2026-10-07)

Cierre honesto de los sub-ítems que habían quedado fuera de la v2.0.0:

- **Redirecciones 301 al cambiar un slug publicado (A03b).** Al renombrar el slug de un proyecto / noticia /
  vacante **publicado**, el editor registra la URL vieja en `web.slug_redirects` (ambos idiomas, con
  re-encadenado A→B→C y sin sombrear un slug reutilizado). El build genera stubs estáticos de redirección
  (`canonical` → nueva URL, redirección instantánea, `noindex,follow`) en la salida prerenderizada vía el
  nuevo `scripts/gen-redirects.mjs` (postbuild) alimentado por `gen-content` → `_redirects.generated.json`.
  Mecanismo puro-estático: funciona en cada *Publicar* (el rebuild del deploy-hook los regenera desde la DB)
  sin depender de `vercel.json`, que Vercel lee del *source* antes del build. Nunca pisa una página real.
- **Pegar imágenes en el editor markdown** (dev notes): al pegar una imagen se sube a `web-media/notes/` y se
  inserta `![imagen](url)` (marcador "subiendo…" mientras tanto).
- **Guardado al cerrar la pestaña** (dev notes): además del respaldo en localStorage, se envía la última
  edición con `fetch` + `keepalive` (reemplaza con menor superficie a la función beacon planificada; respeta
  RLS con el JWT de admin en caché).
- **Pantalla completa** en el editor de notas (botón + `Esc`).
- **Filtros de la bandeja (leads) en la URL** — vista filtrada compartible/marcable.
- **E2E en segundo motor (WebKit)** para el sitio público, además de Chromium: `PW_WEBKIT=1`. El panel admin
  queda en Chromium (herramienta privada de un solo navegador; mutaría en carrera la DB dev si corriera en
  dos motores). Specs de ruta-no-interactiva migradas de `networkidle` → `load` (networkidle cuelga bajo
  WebKit/Windows); guard de *reveal* ahora sondea hasta opacidad estable (determinista entre motores).
- **Evidencia visual** por workflow en `docs/round-03-qa/` (12 rutas × móvil/escritorio) vía
  `PW_EVIDENCE=1` (`e2e/evidence.spec.ts`).

Verificado: `npm run build` verde (67 rutas, gen-redirects OK, sin-clobber probado), 54 unit + 140 e2e
(Chromium full + WebKit público) en verde. Sigue pendiente de Xaviel: Lighthouse en preview.

## 2.0.0 — round 06-oct: admin CMS + dev notes v2 + leads v2 + QA total (WH5/WJ9) (2026-10-07)

Culminación de la ronda. Matriz de workflows en docs/QA-WORKFLOWS.md: 74 e2e + 54 unit + guardas de build
en verde; sin overflow; seguridad verificada (anon bloqueado de las tablas privadas; borradores no
expuestos). Incluye el CMS real (1.8.0), dev notes v2 con autosave y leads v2 (1.9.0), y el barrido UI/UX
(1.7.0) — todo re-verificado. Pendiente de Xaviel: Lighthouse, email real a info@, publicar desde prod,
foto de Plaza Roque (ver QA-WORKFLOWS §Pendiente).

## 1.9.0 — round 06-oct: Dev notes v2 (autosave) + Leads v2 (WH2/WH3/WH4/WJ6/WJ8) (2026-10-07)

- **Dev notes v2:** split markdown editor (marked GFM + DOMPurify + highlight.js subset, Tab, copy-code),
  **real-time autosave** (debounce + blur/switch/hide/unload, state indicator, localStorage backup,
  conflict guard on `updated_at`), version history (max 50, restore), templates (HANDOFF/Decisión/Bug),
  pin/archive/tags/search, `Ctrl+S`/`Ctrl+N`, export `.md`. Schema `sql/2026-10-06-dev-notes-v2.sql`.
- **Leads v2:** unread badge (menu + tab title), inbox list + detail, internal notes, status history
  (trigger), filters + search + CSV export, `tel:`/WhatsApp/Reply actions, **Realtime** new-lead toast,
  CV preview for applications. Schema `sql/2026-10-06-leads-v2.sql` (both dev+prod).
- `docs/DEV-NOTES-REFERENCE.md`; `ADMIN-GUIDE.md` chapters 8–9.

## 1.8.0 — round 06-oct: real content management from /admin (WH1/WJ1–WJ7) (2026-10-06)

Replaces the raw-JSON content editor with a real CMS. **Not yet merged to main** — lives on `dev`/preview.

- **Data model** (`sql/2026-10-06-cms-schema.sql`, dev+prod): `web.admins` + `is_admin()` (every policy
  uses it); normalized tables `media, clients, projects, project_images, posts, jobs` + `slug_redirects,
  publish_log, site_state`; RLS (admin-all / anon-published); `v_public_*` views; `web-media` storage
  bucket. `site_content` kept for the singletons.
- **Migration** (`scripts/cms/migrate-site-content.mjs`, dev+prod): your content + 20 images → Storage
  (42 clients, 12 projects, 8 gallery).
- **Build pipeline** (`gen-content` v2): the static site builds from the CMS tables (DB → `v_public_*` →
  downloaded/optimized images under `public/img/cms`), prod-strict fallback; committed CMS images so
  rebuilds skip re-encoding (publish ~2 min, not ~20).
- **Admin UI** (`/admin`, lazy, brand design system): CRUD editors for **Proyectos** (cover+gallery
  upload, focal-ready, drag-reorder, etapas, SEO, trash), **Clientes, Noticias, Vacantes**, a structured
  **Empresa** form (incl. map offices), a **Biblioteca** (media library, usage counts), and a
  **Publish bar** (deploy state via `/version.json`). Human validation in Spanish.
- **Tests/docs:** `e2e/admin-cms.spec.ts` (login, create+trash project, empresa, biblioteca, publish);
  `docs/CMS-ARCHITECTURE.md`, `docs/ADMIN-GUIDE.md` (Spanish).
- Pending within this round: dedicated forms for Etapas/Sectores/Equipos/Páginas (editable meanwhile via
  “Otros (JSON)”), and the client-side draft preview.

## 1.7.0 — round 06-oct: full UI/UX sweep (WD6/WE11) (2026-10-06)

Systematic audit across both languages × 390/768/1440 × Chromium + WebKit (`scripts/audit-shots.mjs`
→ `lighthouse/audit/REPORT.md`), then fixes with permanent guards.

- **Site-wide 404 fixed (regression from v1.6.0):** the v1.6.0 image rebuild (`rm -rf public/img`) had
  deleted committed brand assets (`logo-full.png` + 6 logo/icon files), 404-ing the logo mask on every
  page. Restored all 7; `verify-images` now fails if any required static asset is missing, and an e2e
  test asserts no route requests a 4xx/5xx asset.
- **Tap targets (mobile, WCAG 2.5.5):** `ES/EN` language switch, footer nav links, ghost-button CTAs,
  the logo link and the contact-detail links are now ≥ 44 px; e2e guards the primary ones.
- **Map on /contacto** now points at the exact Santo Domingo office (from SGC) and is admin-editable
  (shipped in v1.6.x).
- Re-verified across the whole site: no horizontal scroll, no reveal leftovers, quote intact,
  on-dark buttons/FAB visible, sitemap excludes `/admin` + `/styleguide`, hreflang pairs present,
  admin code stays in lazy chunks.

## 1.6.0 — round 06-oct: contact-form fixes, real map, image upscaling, UI bugs (2026-10-06)

Fixes from Xaviel's 06-oct notes (WD) and the live audit (WE); defaults per WF.

- **Contact form (WD4/WD3/WE9/WF3/WF4/WF8)** — the real send bug: `MSG_MIN` lowered 20 → 10 on both the
  client and the edge function, so short messages like "Garage de autos." now send (verified 200 on dev
  and prod). Server `errors[]` map to per-field errors; rate-limit (429) shows specific copy; the generic
  banner never hides a field error. Live phone mask (`809-692-5906`, international grouping) via
  `appPhoneFormat`; `phone_e164` stored (new column, dev + prod). Message min/max validators + counter.
  Success state offers "Enviar otro mensaje" and scrolls/focuses the confirmation.
- **Real map on /contacto (WD2/WF1)** — Google Maps Embed with Santo Domingo / Punta Cana tabs; falls back
  to a static card until the referrer-restricted `MAPS_EMBED_KEY` is created (steps in
  `docs/MAPS-EMBED-KEY.md`). CSP allows `frame-src https://www.google.com`.
- **Images (WD5/WF2/WE5/WE7)** — AI-upscaling pipeline (`upscale-images.mjs`, Real-ESRGAN with sharp
  fallback) lifts low-res covers to a ≥1600 w variant (guarded). LQIP blur resolves on decode. Lopesan
  gallery curated to structural/façade shots.
- **UI bugs** — invisible hero "Hablemos" button → on-dark secondary variant (WD1/WE10); reveal no longer
  leaves the viewport blank on navigation (WE2/WF5); quote measure fixed (WE1); project-detail hero with
  title/client over a scrim (WE3/WF6); horizontal scroll removed (WE4); WhatsApp FAB stays visible over
  dark sections (WE6/WF7); redesigned prev/next row (WE8); placeholder location hidden on cards (WE12).
- **Guards/tests** — new e2e (`layout`, `map`), unit tests (phone formatter, `buildEmbedSrc`, `MSG_MIN`
  parity), `verify-contrast` button pairs, `verify-images` ≥1600 cover rule, `verify-sin-ref-hardcodeado`
  Google-key literal check, `find-overflow.mjs`.

## 1.5.0 — admin: Contenido (full content CMS) (2026-10-02)

- **Contenido module** — edit all site content (company, projects, clients, sectors, stages, equipment,
  jobs, posts, page titles) from `/admin`. Content lives in `web.site_content`; the build (`gen-content`,
  prebuild) reads it and overrides the TS seeds, which remain as a safe fallback — **the build never breaks**
  (on any fetch failure it uses the seeds). Seeded once from the current content.
- **Publicar** — a rebuild trigger (`web-publish` edge function → Vercel deploy hook) so content/appearance
  changes go live (~2 min). Admin-email-gated.
- The admin panel is now **complete**: Dev notes · Leads · Contenido · Apariencia.

## 1.4.0 — admin: Leads + Apariencia modules (2026-10-02)

- **Leads module** — view contact messages + CV applications in `/admin`, update status, download CVs
  (short-lived signed URLs), reply by email. RLS-locked to the admin email.
- **Apariencia module** — change the brand **accent color** live (`web.site_settings`); the public site
  applies it at runtime (a small anon read), no redeploy needed. A deliberately bounded, safe control.
- Bumped the per-component style budget for the (internal, growing) admin stylesheet.
- Next: **Contenido** — full content editing (projects, clients, news, jobs) via a DB-backed CMS + publish.

## 1.3.0 — admin panel (/admin) + Dev notes module (2026-10-02)

- **Private admin panel at `/admin`** — Supabase email+password login; fully hidden (auth-gated, noindex via
  meta + `X-Robots-Tag`, `Disallow` in robots.txt, excluded from the sitemap, unlinked; standalone layout
  with no public header/footer). Lazy-loaded so supabase-js stays out of the public bundle.
- **Dev notes module** — create/edit/delete notes with a markdown body, status (open/done), priority and
  tags; list with status filters + search. Stored in Supabase `web.dev_notes`, **locked to the admin email
  via RLS** (safe on the shared BU1 projects — "any authenticated" is never granted).
- Scaffolded for future modules (Contenido, Apariencia, Leads). Applied + verified end-to-end on sgc-dev.
  Prod rollout (csd-core migration + auth) is gated on Xaviel's OK.

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
