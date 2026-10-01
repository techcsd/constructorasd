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
- **Año de fundación**: el material dice "desde 2014 / 12 años" — confirmar el año oficial exacto.

## Pendiente por página (se detalla en Prompt 2)

### General / empresa
- Año de fundación exacto (el material dice "desde 2014" / "12 años" — confirmar el año oficial).
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

## Backend / lanzamiento (Prompt 3)

- **RESEND_API_KEY**: hace falta para que el formulario envíe el correo de aviso a `info@`. Ahora mismo los
  leads **se guardan** en `web.leads` (fuente de verdad) pero el correo queda con `email_error`. Opciones:
  ponla en `.env.local` (`RESEND_API_KEY=…`) y la configuro como secreto de las edge functions, o autorízame
  a leerla del Vault de SGC. También hay que **verificar el dominio remitente** en Resend (ver `docs/DNS-CUTOVER.md`).
- **Aplicar a prod (csd-core)**: el schema `web` + funciones están probados en sgc-dev; aplicarlos a prod
  requiere tu OK (es la base de datos de producción compartida con SGC). Runbook exacto en `docs/DNS-CUTOVER.md`.
- **Dominio + DNS**: pasos en `docs/DNS-CUTOVER.md` (cambiar A/CNAME en Wix; MX/SPF se mantienen).
- **Search Console**: alta de la propiedad + TXT de verificación (lo generas tú).

## Para la próxima ronda de SGC (no se toca SGC en este repo)

- **Monitoreo de uptime**: añadir `constructorasd.com` al módulo de infraestructura de SGC (DNS/RDAP/HTTP +
  alertas Telegram). Es un cambio en el repo de SGC, no aquí.
- **Vista "Web → Solicitudes"**: exponer `web.leads` / `web.job_applications` en SGC (con sus propias
  políticas de lectura) para gestionar los leads y las candidaturas desde el ERP.
