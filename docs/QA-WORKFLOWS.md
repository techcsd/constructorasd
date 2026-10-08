# QA — matriz de workflows (round `csd imp 06102026`, WH5/WJ9/WK3)

Fuente única de verdad. Una fila por workflow: qué se prueba, su prueba automática (spec), evidencia manual,
entorno y estado. Convenciones de **Estado**:

- **aprobado (e2e)** — cubierto por un test en `npm run test:e2e` (verde).
- **aprobado (manual)** — verificado por inspección/captura esta ronda (evidencia en `docs/round-03-qa/`).
- **corregido → aprobado** — falló, se arregló en la ronda y se re-verificó (con hash).
- **pendiente Xaviel** — necesita sus datos, su cuenta o sus ojos; **nunca se asume**.

**Resumen (v2.0.6, rev prod `efc2e0d`):** **143 e2e** (Chromium full + WebKit público, `PW_WEBKIT=1`) + **54
unit** (vitest) + guardas de build (`verify-*`) en verde. Build de prod verde en cada merge. Sin overflow
horizontal, sin restos de reveal, sin 4xx en rutas clave. Evidencia visual por workflow en
`docs/round-03-qa/` (generar con `PW_EVIDENCE=1 npx playwright test evidence`).

> **Nota sobre WebKit:** la pasada cruzada (`PW_WEBKIT=1`) corre con **1 reintento** porque WebKit-en-Windows
> agota de forma intermitente su espera de carga bajo carga de la máquina (los mismos specs pasan al reintento
> y en aislamiento — no es un defecto del sitio). El gate de Chromium es estricto (0 reintentos).

---

## Público (ES y EN · 390 / 768 / 1440)

| ID | Workflow (pasos → esperado) | Prueba automática | Evidencia | Entorno | Estado |
|---|---|---|---|---|---|
| P01 | Home: hero, CTAs, stats, etapas, destacados, sectores, cita, clientes, ventajas, CTA, footer | `smoke.spec` (200/h1/sin errores), `layout.spec` (cita ≥50%) | `P01-home-{es,en}-*` | dev+prod | aprobado (e2e) |
| P02 | Header desktop + menú móvil (Escape, foco); cambio de idioma conserva ruta | `smoke.spec` (menú, lang), `projects.spec` (lang round-trip) | — | dev+prod | aprobado (e2e) |
| P03 | Empresa — 200, un h1, sin errores de consola | `smoke.spec` | `P03-empresa-*` | dev+prod | aprobado (e2e) |
| P04 | Servicios — anclas de etapas | `smoke.spec` | `P04-servicios-*` | dev+prod | aprobado (e2e) |
| P05 | Equipos | `smoke.spec` | `P05-equipos-*` | dev+prod | aprobado (e2e) |
| P06 | Clientes (muro) | `smoke.spec` | `P06-clientes-*` | dev+prod | aprobado (e2e) |
| P07 | Proyectos: grid/lista, filtro por sector (URL), orden = `sort_order` del CMS | `projects.spec` (filtro+toggle), `layout.spec` (sin placeholder) | `P07-proyectos-*` | dev+prod | aprobado (e2e) |
| P08 | Detalle: hero, datos, galería + lightbox (teclado), ant/sig, cover nítida, JSON-LD, hreflang | `projects.spec` (cover, lightbox teclado, lang) | — | dev+prod | aprobado (e2e) |
| P08b | Plaza Roque nítida a 2× (WD5) | — | — | prod | aprobado (manual) · **foto real: pendiente Xaviel** |
| P09 | Noticias lista + artículo | `smoke.spec` (/noticias 200) | `P09-noticias-*` | dev+prod | aprobado (e2e) · sin noticias aún (CMS listo) |
| P10 | Vacantes lista + detalle + postulación con CV (PDF/DOCX; >5 MB y mime inválido rechazados) | `smoke.spec` (/vacantes), `cv-validation.spec` (DOCX ok, tipo inválido y >5 MB rechazados) | `P10-vacantes-*` | dev | aprobado (e2e lista + unit CV) · prueba en el formulario real: pendiente Xaviel |
| P11 | Contacto: mapa (WD2), máscara tel (WD3), mensaje 10+ se envía (WD4), errores por campo, rate-limit, éxito + reenviar | `contact.spec` (4), `map.spec` (tabs+iframe) | `P11-contacto-*` | dev+prod | aprobado (e2e) · **email real a `info@`: pendiente Xaviel** |
| P12 | WhatsApp FAB (claro/oscuro, oculto en Contacto), enlace por idioma | `audit.spec`/`layout.spec` | — | dev+prod | aprobado (e2e+manual) |
| P13 | Legales, 404, sitemap, robots, OG, `version.json` | `smoke.spec`, sitemap verificado en prod | `P13-404-*` | dev+prod | aprobado (e2e+manual) |
| P14 | Lighthouse móvil 6 rutas ≥90/100/100/100; sin overflow; sin reveal; reduced-motion | `audit.spec`, `layout.spec`, `find-overflow.mjs` (0) | — | — | overflow/reveal: aprobado (e2e) · **Lighthouse: pendiente Xaviel** (Chrome no corre en este entorno) |
| P15 | Regresiones ronda 02 (WD1, WE1, WE2, WE3, WE4, WE6) | `layout.spec`, `audit.spec` | — | dev+prod | aprobado (e2e) |

## Admin (dev preview, `qa_admin`; prod solo lectura)

| ID | Workflow | Prueba automática | Entorno | Estado |
|---|---|---|---|---|
| A01 | Login / ruta protegida redirige | `admin-cms.spec` (login) | dev | aprobado (e2e) |
| A02 | Panel con menú y contador de leads no leídos | `admin-cms.spec` (leads unread title) | dev | aprobado (manual) |
| A03 | Proyectos: crear, lista, editar, portada+galería, reordenar, destacar/publicar, borrar→papelera→restaurar | `admin-cms.spec` (crear→lista→trash) | dev | aprobado (e2e) · reorder/restore: manual |
| A03b | Cambiar slug publicado → redirección (ambos idiomas) | `gen-redirects` (stub + no-clobber), fetch anon `slug_redirects` | dev+prod | aprobado — stubs estáticos (canonical→nuevo, noindex). "Suave" por sitio estático auto-publicable (ver §Notas) |
| A03c | Descargar foto **original** (portada, galería, Biblioteca) | `admin-cms.spec` (download: storage + `download=`) | dev+prod | aprobado (e2e) |
| A04–A09 | Clientes/Noticias/Vacantes CRUD · Empresa (oficinas→mapa) · Etapas/Sectores/Equipos/Páginas · Biblioteca | `admin-cms.spec` (empresa, biblioteca) | dev | aprobado (e2e empresa/biblioteca; resto manual) |
| A10 | Publicar: contador, estado del deploy, "Ver sitio"; `version.json` cambia | `admin-cms.spec` (publish bar) | dev | aprobado (e2e estado) · **publicación real desde prod: pendiente Xaviel** |
| A11 | Vista previa de borrador | `admin-cms.spec` (draft preview oculto al público) | dev | aprobado (e2e) |
| A12 | Guardia de cambios sin guardar (editor de proyecto) | — | dev+prod | aprobado (manual) — aviso `beforeunload` si `dirty` |
| A13 | Mensajes de validación humanos (sin PostgREST crudo) | `admin-cms.spec` (crear valida) | dev | aprobado (manual) |
| A14 | Dev notes: autosave, highlight+copiar, versiones, plantillas, pin/archivar, **pegar imagen**, **pantalla completa**, **keepalive**, **Ctrl+K**, **duplicar**, **copiar MD**, **↑/↓** | `admin-cms.spec` (autosave+highlight, **duplicar**) | dev | aprobado (e2e) · offline/conflicto/paste/fullscreen: manual |
| A15 | Leads: badge no leídos, abrir marca leído, notas, historial, **en_seguimiento**, filtros+búsqueda en URL, CSV, responder/WhatsApp, CV preview, **acciones en lote** | `admin-cms.spec` (inbox+nota, **estado+lote**) | dev | aprobado (e2e) · realtime/CSV/CV: manual |
| A16 | Seguridad: anon no lee tablas privadas; no-admin tampoco; Storage sin admin; `/admin` noindex | verificación directa PostgREST (abajo) | dev | aprobado (manual, ver §Seguridad) |

## Infraestructura

| ID | Workflow | Estado |
|---|---|---|
| I01 | Migraciones y funciones iguales en dev y prod | aprobado — toda migración aplicada dev→prod y registrada en `web.migrations` (última: `2026-10-08-leads-en-seguimiento`) |
| I02 | Secrets en ambos (RESEND, GOOGLE/MAPS_EMBED, SUPABASE) | aprobado (dev+prod); `VERCEL_TOKEN` opcional pendiente (WK2) |
| I03 | Build prod estricto falla si Supabase no responde | aprobado (gen-content v2 `ENV_NAME=prod` → exit 1) |
| I04 | Caché de media en Vercel evita re-encode | aprobado — imágenes CMS commiteadas; build ~20 min → ~40 s |

## Seguridad (A16) — verificado con la anon key directa (PostgREST, dev)
- `web.leads`, `web.dev_notes`, `web.inbox_notes` → **42501 (permiso denegado)** para anon. ✓
- `web.projects` con `published=false` → **`[]`** (los borradores no se exponen). ✓
- `INSERT web.media` como anon → **42501**. ✓
- `web.v_public_*` (solo publicados) → responde. ✓
- Usuario autenticado **no admin**: la misma política `web.is_admin()` lo rechaza (no está en `web.admins`).
  Storage `web-media` escribe solo con `is_admin()`. `/admin` `noindex` + fuera del sitemap. CSP sin
  violaciones (incluye `*.supabase.co` en `img-src`/`connect-src` para miniaturas del admin).

## Notas
- **A03b redirecciones de slug** — redirección estática auto-publicable, no header 301. Vercel lee
  `vercel.json` del *source* antes del build, y *Publicar* reconstruye el **mismo commit** con datos frescos
  de la DB; lo único que se activa al publicar es lo que el build emite en la **salida**. El stub fija
  `rel=canonical`→nueva URL, redirige al instante (JS+meta) y es `noindex,follow`. Un 301 por cabecera "en
  vivo al publicar" requeriría Build Output API o middleware (seguimiento futuro).

## Pendiente Xaviel (necesita sus datos/ojos — nunca asumido)
1. **P11** — enviar "Garage de autos." en prod y confirmar que el correo llega a `info@`.
2. **P14** — correr Lighthouse en el preview (Chrome no arranca en este entorno).
3. **P08b** — foto real de mayor resolución de Plaza Roque (CONTENIDO-PENDIENTE).
4. **A10** — publicar una vez desde el admin de prod y ver el cambio en vivo.
5. **P10** — probar rechazo de CV (DOCX, >5 MB, mime inválido) desde el formulario real.
6. **WG1/WK2** — dirección exacta de Punta Cana; token de Vercel (estado real del deploy en la barra).

## Checklist post-merge (prod)
- [ ] A10 — publicar una vez desde el admin de prod; `version.json` cambia.
- [ ] P11 — mensaje real a `info@` y confirmar entrega (Resend id + asunto).
- [ ] P08b — reemplazar la foto de Plaza Roque por una de alta resolución.
- [ ] A15 — confirmar que un lead nuevo aparece en el inbox (tiempo real).
