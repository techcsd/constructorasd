# QA — matriz de workflows (round 06-oct, WH5/WJ9)

Fuente única. Cada fila: qué se prueba, su prueba automática (spec), y el estado. "aprobado (e2e)" = cubierto
por un test que corre en `npm run test:e2e`; "aprobado (manual)" = verificado con captura/inspección esta
ronda; "pendiente Xaviel" = necesita sus datos, su cuenta o sus ojos (nunca se asume).

**Resumen:** 74 tests e2e (Chromium) + 54 unit (vitest) + guardas de build (`verify-*`) en verde. Build de
prod en verde en cada merge. Sin overflow horizontal, sin restos de reveal, sin 4xx en rutas clave.

## Público

| ID | Workflow | Prueba automática | Estado |
|---|---|---|---|
| P01 | Home: hero, CTAs, stats, etapas, destacados, sectores, cita, clientes, ventajas, CTA, footer | `smoke.spec` (200/h1/sin errores), `layout.spec` (cita ≥50%) | aprobado (e2e) |
| P02 | Header desktop + menú móvil (Escape, foco), cambio de idioma conserva ruta | `smoke.spec` (menú móvil, lang), `projects.spec` (lang round-trip) | aprobado (e2e) |
| P03–P06 | Empresa · Servicios · Equipos · Clientes (200, un h1, sin errores de consola) | `smoke.spec` (todas las rutas ES/EN) | aprobado (e2e) |
| P07 | Proyectos: grid/lista, filtro por sector (URL), orden = `sort_order` del CMS | `projects.spec` (filtro+toggle), `layout.spec` (sin placeholder) | aprobado (e2e) |
| P08 | Detalle: hero, datos, galería + lightbox (teclado), ant/sig, cover nítida | `projects.spec` (cover, lightbox teclado, lang) | aprobado (e2e) |
| P08b | Plaza Roque nítida a 2× (WD5) | — | aprobado (manual, docs/ROUND-02-QA) · foto real pendiente Xaviel |
| P09 | Noticias lista + artículo | `smoke.spec` (/noticias 200) | aprobado (e2e) · sin noticias aún (CMS listo) |
| P10 | Vacantes lista + detalle + postulación con CV (PDF/DOCX, >5MB y mime inválido rechazados) | `smoke.spec` (/vacantes) | parcial · validación CV: aprobado (manual, apply-form) |
| P11 | Contacto: mapa (WD2), máscara tel (WD3), mensaje 10+ se envía (WD4), errores por campo, rate-limit, éxito + reenviar | `contact.spec` (4), `map.spec` (tabs+iframe) | aprobado (e2e) · email a info@: pendiente Xaviel (ver abajo) |
| P12 | WhatsApp FAB (claro/oscuro, oculto en Contacto), enlace por idioma | `layout.spec`/`audit.spec` (FAB verificado en captura) | aprobado (manual) |
| P13 | Legales, 404, sitemap, robots, OG, `version.json` | `smoke.spec` (legales/404), sitemap verificado prod | aprobado (e2e+manual) |
| P14 | Lighthouse móvil 6 rutas ≥90/100/100/100; sin overflow; sin reveal; reduced-motion | `audit.spec`, `layout.spec`, `find-overflow.mjs` (0) | overflow/reveal: aprobado (e2e) · **Lighthouse: pendiente** (Chrome no corre en este entorno) |
| P15 | Regresiones ronda 02 (WD1, WE1, WE2, WE4, WE6, WE3) | `layout.spec`, `audit.spec` | aprobado (e2e) |

## Admin (dev preview, `qa_admin`)

| ID | Workflow | Prueba automática | Estado |
|---|---|---|---|
| A01 | Login / ruta protegida redirige | `admin-cms.spec` (login) | aprobado (e2e) |
| A03 | Proyectos: crear, aparece en lista; editar; portada+galería; reordenar; publicar/destacar; borrar→papelera→restaurar | `admin-cms.spec` (crear→lista→trash) | aprobado (e2e) · reorder/restore: aprobado (manual) |
| A03b | Cambiar slug publicado → redirección 301 | — | pendiente (slug_redirects generado en build; verificar tras publicar) |
| A04–A09 | Clientes/Noticias/Vacantes CRUD · Empresa (oficinas→mapa) · Etapas/Sectores/Equipos/Páginas · Biblioteca | `admin-cms.spec` (empresa, biblioteca) | aprobado (e2e empresa/biblioteca; resto manual: 42 clientes, 7 etapas, 6 sectores, 11 páginas) |
| A10 | Publicar: contador, estado del deploy, "Ver sitio"; `version.json` cambia | `admin-cms.spec` (publish bar) | aprobado (e2e estado) · publicación real: pendiente Xaviel |
| A11 | Vista previa de borrador | `admin-cms.spec` (draft preview muestra no publicado) | aprobado (e2e) |
| A13 | Mensajes de validación humanos (sin PostgREST crudo) | `admin-cms.spec` (crear valida) | aprobado (manual) |
| A14 | Dev notes: autosave (escribir→recargar→persiste), highlight+copiar, versiones, plantillas, pin/archivar | `admin-cms.spec` (autosave+highlight) | aprobado (e2e) · offline/conflicto: aprobado (manual) |
| A15 | Leads: badge no leídos, abrir marca leído, notas internas, historial, filtros+CSV, responder/WhatsApp, CV preview | `admin-cms.spec` (inbox+nota) | aprobado (e2e) · realtime/CSV/CV: aprobado (manual) |
| A16 | Seguridad: anon no lee tablas privadas; no-admin tampoco; Storage sin admin; /admin noindex | verificación directa PostgREST (abajo) | aprobado (manual, ver §Seguridad) |

## Infraestructura

| ID | Workflow | Estado |
|---|---|---|
| I01 | Migraciones y funciones iguales en dev y prod | aprobado — toda migración aplicada dev→prod y registrada en `web.migrations` |
| I02 | Secrets en ambos (RESEND, GOOGLE/MAPS_EMBED, SUPABASE) | aprobado (dev+prod); `VERCEL_TOKEN` opcional pendiente (WK2) |
| I03 | Build prod estricto falla si Supabase no responde | aprobado (gen-content v2 `ENV_NAME=prod` → exit 1) |
| I04 | Caché de media en Vercel evita re-encode | aprobado — imágenes CMS commiteadas, build pasa de ~20 min a ~40 s |

## Seguridad (A16) — verificado con la anon key directa (PostgREST, dev)
- `web.leads`, `web.dev_notes`, `web.inbox_notes` → **42501 (permiso denegado)** para anon. ✓
- `web.projects` con `published=false` → **`[]`** (los borradores no se exponen). ✓
- `INSERT web.media` como anon → **42501**. ✓
- `web.v_public_*` (solo publicados) → responde. ✓
- Usuario autenticado **no admin**: la misma política `web.is_admin()` lo rechaza por diseño (no está en
  `web.admins`). Storage `web-media` escribe solo con `is_admin()`. `/admin` `noindex` + fuera del sitemap.

## Pendiente Xaviel (necesita sus datos/ojos — nunca asumido)
1. **P11 email real a `info@`** — enviar "Garage de autos." en prod y confirmar que llega (el 200 + fila en
   Leads está verificado; la entrega de correo la confirma él).
2. **P14 Lighthouse** — correrlo en el preview (Chrome no arranca en este entorno).
3. **P08b** — foto real de mayor resolución de Plaza Roque (CONTENIDO-PENDIENTE).
4. **A10** — publicar una vez desde el admin de prod y ver el cambio en vivo.
5. **WG1/WG2** — dirección exacta de Punta Cana; token de Vercel si quiere el estado real del deploy.
