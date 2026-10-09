# HANDOFF — constructorasd.com

_Last updated: 2026-10-08 (end of round 04 `csd imp 08102026`)._

## Current state
- **v3.0.0 shipped to production.** `dev → main` merged (no-ff, commit `edb136d`), tagged `v3.0.0`,
  live on constructorasd.com (version.json rev `edb136d9`). Prod smoke green (`/`, `/en`, `/proyectos`,
  project detail, `/contacto`, `/admin/login` all 200).
- Branches aligned: `main` == `dev` == this release. Working tree clean.

## What round 04 delivered (PROMPT-09 + 10 + 11)
- **P09** todo editable desde `/admin` (Inicio CMS, etapas, Ajustes, Textos del sitio / `ui_strings`,
  guard `verify-editable-coverage`).
- **P10** motion público sin librerías (hero/Ken Burns, count-up, hover, View Transitions, stagger,
  micro-motion, acordeón) — CLS/reduced-motion safe.
- **P11** admin **"Dark studio console"**: tema oscuro (remapeo de tokens `.adm`), atmósfera + barra glass +
  motion, **paleta `Ctrl+K`**, **Panel** dashboard + skeletons, **rail de iconos colapsable**, ayuda `?`,
  **editor de proyecto con vista previa en vivo + punto focal** (focal → render público), numerales mono.

## Verification baseline (keep green)
`npm run build` (todas las guardas) · **62 unit** · **86 e2e** · **14 admin-cms**. Home initial JS ~41 kB gz
(budget 120). Admin 100% lazy (aislamiento verificado). Screenshots: `docs/round-04-qa/admin-01…08`.

## Pending (manual — need Xaviel on prod admin)
Post-merge checklist items that require an interactive team login (shared prod has the Tecnología auth hook):
- [ ] Publicar una vez desde `/admin` en prod (dispara rebuild).
- [ ] Round-trip de edición de Inicio en prod.
- [ ] Confirmar botón hero "Hablemos" en bone y edición de punto focal en un proyecto real.

## Deferred — all done (2026-10-09, on `dev`, pending next merge)
Sparklines (Panel, datos reales 14d), masonry Biblioteca, control segmentado con indicador deslizante,
y Leads a 3 paneles. **Nada de PROMPT-11 queda pendiente.** Único ítem abierto: `VERCEL_DEPLOY_HOOK`
del botón Publicar (necesita un token de Vercel que no existe en ningún secreto accesible — publicar
se cubre vía la API de Vercel mientras tanto).

`dev` está por delante de `main` (v3.0.0) con el pulido del admin + docs; listo para el próximo merge
cuando Xaviel dé el OK (o para seguir acumulando).

## Gotchas to remember
- `src/content/_overrides.json` must be committed as `{}` — always `git checkout HEAD -- src/content/_overrides.json`
  after a build before committing.
- Admin shared styles are duplicated across `admin.scss` (shell/pages) and `admin-cms.scss` (CMS editors)
  because Angular scopes component styles — add new `.adm-*` utilities to **both**.
- Prod Supabase is **shared with SGC** (ref `jeeqhgccqefbqilntcpu`); never rotate shared secrets.
- `gh` CLI is not installed on this machine — merges done via local `git merge --no-ff` + push.
