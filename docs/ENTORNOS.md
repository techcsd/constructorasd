# Entornos — constructorasd.com (dev / prod)

Hereda la regla madre de SGC (**BU1 / WA11**): **nada llega a producción sin haber vivido y probado en
dev primero**, y cualquier cambio de schema `web`, edge function, secreto o policy se aplica **primero a
sgc-dev** y luego a prod.

## Los dos entornos

| Capa | **dev** (desarrollo) | **prod** (producción) |
|---|---|---|
| Rama Git | `dev` (y `feature/*`) | `main` |
| Vercel | Preview automático (`*.vercel.app`) | Dominio `constructorasd.com` (tras el cutover, WC3/WC4) |
| Supabase (schema `web`) | **sgc-dev** `fzfrnrvndzrjwyvdpkgg` | **csd-core** `jeeqhgccqefbqilntcpu` |
| `ENV_NAME` | `dev` | `prod` |
| `SITE_URL` | URL de preview de Vercel | `https://constructorasd.com` |
| Indexación | `noindex` (meta robots) + cinta **DEV** + prefijo `[DEV]` en el título | indexable |
| Analítica | Vercel Analytics en modo `development` | `production` |

> El ref de prod `jeeqhgccqefbqilntcpu` **nunca** se escribe en `src/` (lo verifica
> `verify-sin-ref-hardcodeado.mjs`): solo vive en el `environment.ts` generado (gitignored) y en `.env.local`.

## Cómo se decide el entorno al construir

`vercel.json` usa `buildCommand: node scripts/build-env.mjs`. Ese script resuelve el entorno así:

1. `--env dev|prod` explícito (scripts locales `npm run build:dev` / `build:prod`), si no…
2. `VERCEL_GIT_COMMIT_REF`: `main` → **prod**, cualquier otra rama → **dev**.

Luego genera `src/environments/environment.ts` (con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL`,
`ENV_NAME`) y ejecuta `npm run build` (que corre los guards del `prebuild` y el prerender de todas las
rutas en ES y EN).

## Secrets / variables

Los valores **nunca** van al repo. En local viven en `.env.local` (gitignored); en Vercel se configuran
por entorno (Preview = dev, Production = prod). Plantilla: `.env.local.example`.

| Variable | Para qué |
|---|---|
| `SUPABASE_URL_{DEV,PROD}` | URL del proyecto Supabase (el formulario y las edge functions del Prompt 3) |
| `SUPABASE_ANON_KEY_{DEV,PROD}` | anon key (solo lectura/edge, nunca service role en el navegador) |
| `SITE_URL_{DEV,PROD}` | base para canonical/hreflang/sitemap/OG |

El **service role** y la **API key de Resend** no están aquí: viven solo en Supabase/Vercel y los usan las
edge functions (Prompt 3), nunca el navegador (CLAUDE.md regla 5).

## Flujo de trabajo

1. Trabaja en `feature/*` o directamente en `dev`.
2. `push` → Vercel construye el **preview** (dev) automáticamente. La URL de preview se anota abajo.
3. Xaviel revisa en el preview.
4. Con su OK (**WC4**): PR `dev → main` → Vercel construye **prod** → dominio.
   **Merge a `main`, alta del dominio y acciones de DNS requieren OK explícito de Xaviel** (WA14).

## URL de preview (dev)

- **Preview en vivo (Prompt 1): https://constructorasd.vercel.app** (alias estable; también
  `https://constructorasd-git-dev-xaviel-csd.vercel.app`). Proyecto Vercel `constructorasd`
  (`prj_E3QOicacJUsZEZTx77UUJ95cjwSq`) en el equipo **CSD** (`xaviel-csd`), ligado a `techcsd/constructorasd`.
- Es un build **DEV**: `noindex`, prefijo `[DEV]` en el título y cinta DEV en la esquina. El `ENV_NAME`
  lo decide el nombre de la rama (`main` → prod, cualquier otra → dev), así que esto se cumple aunque
  Vercel etiquete el deploy como "production".
- ⚠️ **Acción pendiente de Xaviel en el panel de Vercel** (no bloquea): Vercel puso la *Production Branch*
  en `dev` porque `main` estaba vacío al crear el proyecto. Cuando se haga el gate de prod (WC4), cambiar
  *Settings → Git → Production Branch* a **`main`** para que `dev` quede como preview y `main` como producción.
- El subdominio opcional `dev.constructorasd.com` se añadiría en el cutover de DNS (WB11), no es necesario para trabajar.
