# DNS cutover — constructorasd.com (para Xaviel)

> Paso a paso en el panel **DNS de Wix** (los nameservers siguen siendo `ns10/ns11.wixdns.net`).
> **Objetivo:** apuntar el sitio a Vercel **sin tocar el correo** (Google Workspace sigue igual).
> Hazlo solo cuando demos el OK de lanzamiento (WC4). Hay una línea de *rollback* al final.

## 0. Estado actual (leído por DNS el 01-oct-2026)

| Registro | Valor actual | Acción |
|---|---|---|
| `NS` | `ns10.wixdns.net`, `ns11.wixdns.net` | **mantener** (DNS en Wix) |
| `A @` | `185.230.63.171/186/107` (Wix) | **cambiar** → `76.76.21.21` (Vercel) |
| `CNAME www` | `cdn3.wixdns.net` (Wix) | **cambiar** → `cname.vercel-dns.com` |
| `MX` | `aspmx.l.google.com` + alt1–4 (Google) | **mantener (no tocar — es el correo)** |
| `TXT (SPF)` | `v=spf1 include:_spf.google.com ~all` | **mantener** |
| `TXT (_dmarc)` | — (no existe) | opcional, ver §4 |

## 1. Añadir el dominio en Vercel (lo hago yo, tras tu OK)

En el proyecto Vercel `constructorasd` → **Settings → Domains** añadir `constructorasd.com` y `www.constructorasd.com`.
Vercel dará un **TXT de verificación** (algo como `_vercel` = `vc-domain-verify=…`). Ese valor lo pongo aquí
cuando lo genere:

- `TXT  _vercel  → <valor que da Vercel>`  **(pendiente — se obtiene al añadir el dominio)**

## 2. En Wix DNS — cambios de apuntado

1. **A `@`**: borra los tres registros `A` de Wix (`185.230.63.*`) y crea **uno**: `A  @  76.76.21.21`.
2. **CNAME `www`**: cambia el valor de `cdn3.wixdns.net` a **`cname.vercel-dns.com`**.
3. **TXT de verificación de Vercel**: añade el TXT del §1 (host `_vercel`).
4. **No toques** ningún registro `MX` ni el `TXT` de SPF de Google.

## 3. Correo transaccional (Resend) — para el formulario de contacto

El formulario guarda el lead en Supabase **siempre** (eso ya funciona); el correo de aviso a `info@` sale por
**Resend** desde `web@constructorasd.com`. Para que Resend pueda enviar con tu dominio hay que **verificarlo
en Resend** (recomendado: un subdominio `send.constructorasd.com` para no tocar el SPF de Google). Resend te
dará 2–3 registros (MX, TXT-SPF y CNAME/TXT-DKIM) que van en Wix. Los pongo aquí cuando configure Resend:

- `MX    send   → feedback-smtp.*.amazonses.com` (o el que indique Resend) **(pendiente)**
- `TXT   send   → v=spf1 include:amazonses.com ~all` **(pendiente)**
- `TXT/CNAME  resend._domainkey … (DKIM)` **(pendiente)**

> Mientras tanto, en **dev** los correos salen con el dominio ya verificado de SGC hacia `Tecnologia@`.

## 4. Verificación de Google Search Console (opcional pero recomendado)

Cuando añadas la propiedad en Search Console te dará un `TXT` de verificación:
- `TXT  @  → google-site-verification=<valor>` **(pendiente — lo generas tú en Search Console)**

## 5. Después del cambio (lo verifico yo)

- Propagación: normalmente **5–60 min** (hasta 24 h en el peor caso).
- `https://constructorasd.com` y `https://www.constructorasd.com` cargan con HTTPS (certificado automático de Vercel).
- `www` redirige a la raíz (configurado en `vercel.json`).
- `https://constructorasd.com/sitemap.xml` responde y lo envío a Search Console.
- Prueba real: enviar el formulario de contacto en producción → llega el correo a `info@` y aparece la fila en `web.leads`.

## 6. Rollback (si algo sale mal)

Vuelve a poner en Wix los `A @` originales (`185.230.63.171`, `.186`, `.107`) y el `CNAME www` a `cdn3.wixdns.net`.
El correo no se ve afectado en ningún momento (nunca se tocan los `MX`).

---

## Runbook de producción (lo ejecuto yo con tu OK — BU1 "dev→prod")

El schema `web`, las edge functions y los secretos ya están probados en **sgc-dev**. Para activar prod
(`csd-core`, aislado en el schema `web`):

```bash
# 1) schema + grants + bucket en prod
node scripts/supabase/apply.mjs --env prod --yes
# 2) exponer el schema web en PostgREST de prod (igual que en dev; aditivo, no toca SGC)
#    (lo hago vía Management API)
# 3) secretos de prod (ENV_NAME=prod, IP_SALT, MAIL_*, RESEND_API_KEY)
node scripts/supabase/set-secrets.mjs --env prod --yes
# 4) desplegar las funciones a prod
npx supabase functions deploy web-contact     --project-ref <csd-core> --no-verify-jwt
npx supabase functions deploy web-apply        --project-ref <csd-core> --no-verify-jwt
npx supabase functions deploy web-client-error --project-ref <csd-core> --no-verify-jwt
```

> **Falta de ti:** la **RESEND_API_KEY** (ponla en `.env.local` o dímelo y la leo del Vault de SGC con tu OK).
> Sin ella, en prod los leads se guardan pero el correo de aviso no sale (queda `email_error`).
