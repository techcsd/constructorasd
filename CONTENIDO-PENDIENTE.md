# Contenido pendiente — constructorasd.com

> Para Xaviel. Lista de todo lo que falta para completar el sitio sin inventar nada (CLAUDE.md regla 2 / WB2).
> Se agrupa por página. Claude Code va añadiendo aquí cualquier dato, foto o texto que no exista en las fuentes
> (`content/`, PPTX, carpeta de fotos). Nada de esto bloquea el avance: mientras tanto se usan placeholders
> neutros y se deja la nota aquí.

## Estado de las fuentes (Prompt 1)

- **PPTX**: ✅ presente en `assets/Presentacion_Global_CSD_2026_v5.pptx`. Ya se **extrajo el texto** para
  adelantar contenido real al repo (sin inventar nada): stats (45+/12/8), las 7 etapas con sus
  capacidades, los 11 proyectos con su cliente, los ~42 clientes, la cita de filosofía, sectores y ventajas.
  Viven en `src/content/{company,stages,projects,clients,page-meta}.ts`. En el Prompt 2 se extraen las
  **imágenes** de `ppt/media` y se redactan las narrativas por proyecto.
- **Fotos de obra**: ✅ 116 fotos de Lopesan Costa Bávaro Bloque F; 5 curadas y optimizadas (`public/img/lopesan/`).
  Solo este proyecto tiene fotos propias de obra; los demás dependen de las imágenes del PPTX (ver riesgo en PLAN §7).
- **Logos**: ✅ en `logos/`. El monograma `.SD` se trazó a SVG; el wordmark se rehízo en Hanken Grotesk 700.

## Por confirmar con Xaviel (de lo ya cargado)

- **Sector y ciudad por proyecto**: solo están confirmados Lopesan (Hotelero / Punta Cana) y Hospital
  Barahona (Hospitalario / Barahona). Falta el sector/ciudad de los otros 9 proyectos (`src/content/projects.ts`).
- **Agrupación de clientes**: se agrupó a ojo (promotores / hotelería / industria / instituciones); revisar.
- ~~**Año de fundación**~~: ✅ confirmado **2014** (Xaviel). `COMPANY.founded = 2014`.

## Pendiente por página (se detalla en Prompt 2)

### General / empresa
- ~~Año de fundación~~: ✅ **2014** (confirmado). · Foto "Volares" = proyecto **Elements Volare** (confirmado).
- RNC y dirección legal completa (para Aviso legal / Ley 172-13 y el footer).
- Equipo directivo: el PPTX solo nombra al Ing. Ángel R. Caraballo. **No se inventan nombres ni fotos** →
  la sección "Equipo" queda fuera de v1 (WB8). Si Xaviel quiere incluirla, hacen falta nombres, cargos y fotos.

### Proyectos
- **Fotos auto-mapeadas**: las portadas de los 11 proyectos no-Lopesan y Plaza Roque se sacaron del PPTX
  mapeando por orden de diapositiva (image38→Poseidonia … image48→Villa Cacique, image22→Plaza Roque).
  Son fotos reales de CSD, pero **conviene que Xaviel verifique que cada foto corresponde al proyecto**.
- **Galerías**: solo Lopesan tiene galería (8 fotos). Los demás proyectos muestran solo la portada —
  hacen falta más fotos propias por proyecto para una galería.
- **Sector / ubicación / alcance por proyecto**: confirmados solo para Lopesan, Hospital Barahona,
  Brisas City Center y Plaza Roque. El resto usa "República Dominicana" como ubicación neutral y un
  alcance indicativo (`scope` en `src/content/projects.ts`) — confirmar ciudad y etapas reales.
- **Plaza Roque**: no figura el cliente en el PPTX (queda vacío) — confirmar.
- Nota técnica menor: el WebP de respaldo de `hospital-barahona` pesa 349 kB (>250 kB); el AVIF servido a
  navegadores modernos sí cumple. Solo afecta a navegadores muy antiguos.

### Clientes
- Logos vectoriales (SVG) de los ~42 clientes; donde no haya logo se muestra el nombre en texto (nunca placeholder de imagen).

### Vacantes
- ¿Hay vacantes abiertas actualmente? Si no, se muestra "No hay vacantes abiertas — envíanos tu CV".

### Noticias
- ¿Hay notas/posts para publicar en v1? Si no, la sección queda con un placeholder.

### Contacto
- Horario de atención, imagen estática del mapa / enlace "Cómo llegar".
- ¿Correo `rrhh@` para copias de CVs? (por ahora todo va a `info@`).

### Legal (páginas Privacidad / Aviso legal)
Las páginas `/privacidad` y `/aviso-legal` están redactadas (Ley 172-13 RD) pero necesitan los datos
fiscales reales, marcados en el texto como `[Razón social, RNC y domicilio legal — pendiente]`:
- **Razón social exacta** (nombre legal registrado de la empresa).
- **RNC** (Registro Nacional del Contribuyente).
- **Domicilio legal / fiscal** completo.

## Backend / lanzamiento (Prompt 3) — ✅ EN PRODUCCIÓN (2026-10-01)

El sitio está **publicado en https://constructorasd.com** (v1.0.0). Todo lo de abajo ya está hecho:

- **RESEND_API_KEY**: ✅ leída del Vault de SGC (con tu OK) y puesta como secreto en dev + prod. Remitente
  `noreply@sgcconstructorasd.com` (dominio verificado en Resend). Verificado en prod: un lead real se guardó
  en `web.leads` y el correo **se envió** (`emailed_at` con valor, sin `email_error`); la fila de prueba se borró.
- **Prod backend (csd-core)**: ✅ schema `web` + grants + bucket `web-cv` + funciones
  (`web-contact`, `web-apply`, `web-client-error`) desplegadas y verificadas end-to-end.
- **Vercel**: ✅ Production Branch = `main`; dominios `constructorasd.com` + `www.constructorasd.com` añadidos y
  verificados; HTTPS emitido; `www` → 308 → apex; build de prod sirviendo (indexable).
- **DNS**: ✅ el dominio (registrado en Squarespace) movido a **nameservers de Squarespace**
  (`nsa1–4.squarespacedns.com`). A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`.
  MX/SPF/DKIM de Google **intactos** (el correo de la empresa no se tocó). *(Nota: ya no se usa Wix.)*

### Pendiente menor (lo haces tú, requiere tu cuenta Google)
- **Search Console**: la propiedad ya tiene el TXT `google-site-verification` en DNS. Entra a Search Console →
  propiedad `constructorasd.com` → **Sitemaps** → envía `sitemap.xml`. Opcional: "Inspección de URL" sobre la
  home y "Solicitar indexación" para acelerar.
- **Resend (opcional, branding)**: verificar `constructorasd.com` como dominio remitente para que los correos
  salgan desde `noreply@constructorasd.com` en vez de `@sgcconstructorasd.com`.

## Para la próxima ronda de SGC (no se toca SGC en este repo)

- **Monitoreo de uptime**: añadir `constructorasd.com` al módulo de infraestructura de SGC (DNS/RDAP/HTTP +
  alertas Telegram). Es un cambio en el repo de SGC, no aquí.
- **Vista "Web → Solicitudes"**: exponer `web.leads` / `web.job_applications` en SGC (con sus propias
  políticas de lectura) para gestionar los leads y las candidaturas desde el ERP.

## Fotos (ronda 06-oct-2026)

- **Plaza Roque**: la única foto disponible es de **768×487 px**. Se subió con upscaling (×4, sharp) para
  cumplir el mínimo de 1600 w, pero el resultado es **blando**. *Hace falta una foto real de mayor
  resolución de Plaza Roque* (Punta Cana) para la portada y la galería.
- **Etapa 05** (servicios/home): fuente de 768×487 px, mismo caso — foto real de mayor resolución deseable.
- **Lopesan Costa Bávaro — galería**: hay **116 fotos** en el archivo (`Constructora SD\CSD alt\01_PROYECTOS\
  02_PROYECTO ACTUAL\…\HOTEL LOPESAN BAVARO`). Esta ronda se curó a 3 fotos estructurales de las 9 que
  estaban en `assets-src/lopesan/`. Para una galería más rica (8–10), seleccionar más tomas de estructura/
  encofrado/fachada/vistas amplias del archivo y añadirlas a `assets-src/lopesan/`.
- **WG1 — dirección de oficina (resuelto):** Santo Domingo usa la ubicación exacta de la **Oficina
  Central CSD / Bodega Central** (de SGC: `18.4564338, -69.9702340`); Punta Cana apunta al centro de la
  ciudad hasta tener una dirección exacta. Editable desde **/admin › Contenido → Empresa** (campo
  `offices`) o en `src/content/company.ts`.

## CMS (06-oct)
- Formularios dedicados para **Etapas / Sectores / Equipos / Páginas (SEO)** (hoy editables desde /admin › Otros (JSON)).
- **Vista previa de borrador** en cliente (`?preview=1`).
