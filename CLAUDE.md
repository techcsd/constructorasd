# constructorasd.com — Corporate website of Constructora Scheker & Domínguez (CSD)

Public marketing site for Constructora SD (construction company, Dominican Republic: earthworks, structures, light systems, finishes, turnkey resorts/hospitals). **UI languages: Spanish (default, `/`) and English (`/en`).** Built and maintained solo by Xaviel (Tecnología) with Claude Code. Separate from the internal ERP (SGC) — different repo, different look, same house conventions.

## Stack
Angular 21 (standalone, signals, `@angular/ssr` with full prerender / static output) · SCSS with semantic tokens (no Tailwind, no UI kit) · Vercel (prod: constructorasd.com ← `main`; preview ← `dev`) · Supabase project **csd-core**, schema **`web`** (leads, job applications; edge functions only) · Resend (email to info@constructorasd.com) · `sharp` image pipeline · vitest + Playwright.

## Commands
- `npm start` dev server · `npm run build` (runs every `verify-*` guard in `prebuild`, then prerenders all routes in both languages) · `npm test` (vitest) · `npm run test:e2e` (Playwright smoke) · `npm run images` (optimize `assets-src/` → `public/img/`) · `npm run lighthouse` (local Lighthouse on Home + one project).
- Supabase CLI is installed; access token in `SUPABASE_ACCESS_TOKEN`. Refs/keys live in `.env.local` (gitignored): `SUPABASE_{PROJECT_REF,URL,ANON_KEY,SERVICE_ROLE_KEY}_{DEV,PROD}`, `RESEND_API_KEY`. Scripts that touch Supabase **require `--env dev|prod`** and refuse to run without it.

## Hard rules (never skip)
1. **Design brief is law.** `docs/DESIGN-BRIEF.md` defines tokens, type, components and the anti-AI rules. Screens use semantic tokens only — never raw hex, never a primitive. `verify-tokens.mjs`, `verify-no-ai-tropes.mjs` and `verify-contrast.mjs` run on every build and fail it.
2. **Nothing invented.** Company facts, project names, clients, figures and quotes come from `content/` (sourced from the 2026 presentation). If content is missing, use a neutral placeholder and add a line to `CONTENIDO-PENDIENTE.md` — never fabricate names, numbers, photos or testimonials.
3. **Both languages always.** Every user-visible string goes through `t()` or a `{ es, en }` content field. `verify-i18n.mjs` fails the build if an `en` key is missing. Routes are prerendered in both languages with `hreflang`.
4. **dev → prod (inherited BU1).** Any `web` schema migration, edge function, secret or storage policy is applied **first to sgc-dev (`fzfrnrvndzrjwyvdpkgg`)** and tested on the preview deployment, then to prod (`jeeqhgccqefbqilntcpu`). SQL lives in `sql/` with a date prefix and is recorded in `web.migrations`. Never hardcode the prod ref.
5. **Service role never reaches the browser.** The site only calls edge functions with the anon key; `web.*` tables have no anon/authenticated policies — only the edge functions (service role) write.
6. **Autonomy (WA14):** commit and push freely; `feature/*` → `dev` (Vercel preview) without asking. **Merging to `main`, adding/changing the production domain, or any destructive DNS/Vercel action requires Xaviel's explicit OK** — stop and report instead.
7. **Verify before reporting done:** `npm run build` green, `npm test` green, Playwright smoke green, Lighthouse budgets met (`docs/DESIGN-BRIEF.md` §9), and the affected page opened in the preview URL. Report the preview URL in the summary.
8. **Performance budgets** are part of correctness: Home initial JS ≤ 120 kB gz, LCP image ≤ 180 kB, every served image ≤ 250 kB, CLS ≤ 0.05. `verify-images.mjs` enforces sizes and alt text.
9. **SVG icons, never emojis.** Single sprite in `public/icons.svg`, `stroke="currentColor"`.
10. **Content model is Supabase-ready.** Interfaces in `src/content/types.ts` mirror the future `web.projects / web.clients / web.posts / web.jobs` tables (same field names in camelCase ↔ snake_case). Don't add fields that couldn't be a column.
11. **No commits of originals.** Source images live in `assets-src/` (gitignored); only optimized output in `public/img/` is committed.
12. **Report, don't wait.** When a decision is needed and Xaviel is not in the loop, apply the documented default, note it in `docs/DESIGN-DECISIONS.md` or `CONTENIDO-PENDIENTE.md`, and continue. The only deliberate pause is the `/styleguide` checkpoint at the end of Prompt 1.

## Repo map
```
src/app/core/        i18n (t(), dictionaries), seo (meta, JSON-LD, sitemap), reveal directive, analytics
src/app/ui/          design-system components (header, footer, button, eyebrow, stats-band, stage-row, project-card, client-wall, quote, image-figure, contact-form, whatsapp-fab, lang-switch)
src/app/pages/       home, empresa, servicios, equipos, proyectos(+detail), clientes, vacantes(+detail), noticias(+detail), contacto, privacidad, aviso-legal, styleguide, not-found
src/content/         types.ts, company.ts, stages.ts, equipment.ts, sectors.ts, projects.ts, clients.ts, jobs.ts, posts/*.md, i18n/{es,en}.json
src/styles/          _tokens.scss, _fonts.scss, _type.scss, _layout.scss, _mixins.scss, styles.scss
public/              fonts/, img/, icons.svg, robots.txt, og/
assets-src/          originals (gitignored)
scripts/             verify-*.mjs, optimize-images.mjs, extract-pptx-media.mjs, gen-sitemap.mjs, lighthouse.mjs, supabase/*.mjs (--env gated)
sql/                 YYYY-MM-DD-*.sql migrations for schema web
supabase/functions/  web-contact, web-apply
docs/                DESIGN-BRIEF.md, DESIGN-DECISIONS.md, DNS-CUTOVER.md, ENTORNOS.md, CONTENT-MODEL.md
```

## Reference material (read-only)
- Round docs: `C:\developer\constructorasd improvements\<Month>\csd imp <DDMMYYYY>\` (CONTEXTO, PLAN, PROMPTs, DESIGN-BRIEF).
- Presentation (content source): `…\csd imp 01102026\assets\Presentacion_Global_CSD_2026_v5.pptx`.
- Photos: `C:\Users\xavie\Desktop\X Dev\Constructora SD\` (Lopesan photos under `CSD alt\01_PROYECTOS\02_PROYECTO ACTUAL\LP; …\5-LP-FOTOS\HOTEL LOPESAN BAVARO`; logos under `\logos`). Ignore vehicles, drivers, scans.
- Conventions to port (not to depend on): SGC repo `C:\Users\xavie\Desktop\X Dev\dev\SGC` — `scripts/verify-no-ai-tropes.mjs`, `verify-tokens.mjs`, `verify-contraste.mjs`, `verify-i18n.mjs`, `scripts/build-env.mjs` (`--env` gating), `src/styles/_fonts.scss` (self-hosted fonts), `docs/ENTORNOS.md`.
