# Audit REPORT — round 06-oct (WD6)

Routes: 28 × 3 viewports × browsers. Screenshots in lighthouse/audit/<viewport>/.

**Counts:** high 0 · medium 0 · low 0

| sev | route | vp | browser | finding |
|---|---|---|---|---|
| — | — | — | — | no mechanical findings |

## Resolution (all rows closed)

The first pass surfaced 226 raw rows that collapsed to **two real defects**; both fixed with permanent guards, then re-run to **0 findings**.

- **Site-wide 404 — `logo-full.png` + 6 brand/icon assets** (regression from v1.6.0's `rm -rf public/img`) → **fixed** (restored); **guarded by** `verify-images` required-static-asset check + `e2e/audit.spec.ts` no-4xx on key routes.
- **Mobile tap targets < 44px** — `ES/EN` switch, ghost CTAs, logo, footer links, contact-detail links, sector filter chips, grid/list toggle, map tabs, "Cómo llegar" links, Instagram link → **fixed** (all ≥44px, type size unchanged); **guarded by** `e2e/audit.spec.ts` tap-target assertions.
- **"Blurry" stage/project images in full-page shots** → **not a defect**: a lazy-decode screenshot artifact; images load at opacity 1 when scrolled (verified). **Guarded by** `e2e/audit.spec.ts` no-reveal-leftovers.
- **`/no-existe` console 404** → **expected** (the not-found page returns 404 for SEO); excluded from the check.
- **`/contacto` transient 502** (one chromium load) → external maps-tile blip; did not reproduce.
- Re-verified clean: no horizontal scroll, reveal, quote, on-dark button/FAB, sitemap excludes `/admin`+`/styleguide`, hreflang pairs, admin code in lazy chunks only.

**Pending Xaviel (content only):** real hi-res Plaza Roque / etapa-05 photos; richer Lopesan gallery from the 116-photo archive; exact Punta Cana office address (`CONTENIDO-PENDIENTE.md`). Lighthouse numbers: run on the Vercel preview (local Chrome crashes).
