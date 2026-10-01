# Pendiente — Xaviel (acciones manuales)

> Cosas que **solo tú puedes hacer** (requieren tus cuentas o decisiones de negocio). Lo técnico del sitio
> ya está hecho y en producción (v1.0.0, https://constructorasd.com). El detalle de contenido faltante está
> en `CONTENIDO-PENDIENTE.md`; aquí va el resumen accionable.

## 1. Ahora mismo (SEO / post-lanzamiento)

- [ ] **Google Search Console — enviar el sitemap.**
  El TXT `google-site-verification` ya está en el DNS, así que la propiedad debería validarse sola.
  1. Entra a https://search.google.com/search-console y abre la propiedad `constructorasd.com`
     (si pide verificar, usa "Dominio" → ya tienes el TXT puesto en Squarespace).
  2. Menú **Sitemaps** → en "Añadir un sitemap" escribe `sitemap.xml` → Enviar.
  3. (Opcional, para acelerar) **Inspección de URL** sobre `https://constructorasd.com/` → "Solicitar indexación".

- [ ] **(Opcional) Bing Webmaster Tools** — mismo sitemap, si quieres aparecer también en Bing.

## 2. Opcional (branding de correo)

- [ ] **Verificar `constructorasd.com` en Resend** para que los avisos de formularios salgan desde
  `noreply@constructorasd.com` en vez de `noreply@sgcconstructorasd.com` (que ya funciona).
  En Resend → Domains → Add Domain → te da unos registros (SPF/DKIM/CNAME) que van en el DNS de Squarespace.
  Cuando esté verificado, avísame y cambio el remitente (`MAIL_FROM`) en los dos proyectos.

## 3. Contenido que necesito de ti para completar el sitio

No invento datos de la empresa (regla del proyecto). Para cerrar estos huecos necesito que me pases:

### Legal (bloquea /privacidad, /aviso-legal y el footer)
- [ ] **Razón social exacta** (nombre legal registrado).
- [ ] **RNC** (Registro Nacional del Contribuyente).
- [ ] **Domicilio legal/fiscal** completo.

### Empresa
- [ ] **Año de fundación exacto** (el material dice "desde 2014" / "12 años" — confirmar).
- [ ] ¿Incluimos sección **"Equipo"**? El PPTX solo nombra al Ing. Ángel R. Caraballo.
  Si sí, hacen falta nombres, cargos y fotos (no se inventan).

### Proyectos
- [ ] **Sector y ciudad** de 9 de los proyectos (solo están confirmados Lopesan, Hospital Barahona,
  Brisas City Center y Plaza Roque).
- [ ] **Verificar que cada foto corresponde al proyecto** (las portadas no-Lopesan se mapearon del PPTX por orden).
- [ ] **Plaza Roque**: ¿quién es el cliente? (no figura en el PPTX).
- [ ] Fotos propias por proyecto si quieres **galería** en más proyectos (hoy solo Lopesan tiene galería).

### Clientes
- [ ] Revisar la **agrupación** de clientes (se hizo "a ojo": promotores / hotelería / industria / instituciones).
- [ ] **Logos SVG** de los ~42 clientes (donde no haya, se muestra el nombre en texto).

### Vacantes / Noticias / Contacto
- [ ] ¿Hay **vacantes abiertas**? Si no, se queda "No hay vacantes abiertas — envíanos tu CV".
- [ ] ¿Hay **noticias/posts** para publicar en v1? Si no, la sección queda con placeholder.
- [ ] **Horario de atención** y enlace/imagen del **mapa** ("Cómo llegar").
- [ ] ¿Quieres un correo **`rrhh@`** para las copias de CVs? (hoy todo va a `info@`).

---
*Cuando me pases cualquiera de estos datos, yo lo integro al sitio y redeployeo. Lo técnico (DNS, hosting,
backend, correos, SEO) ya quedó funcionando.*
