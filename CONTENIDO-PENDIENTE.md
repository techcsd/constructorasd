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
- Fotos propias (no-PPTX) de los 10 proyectos distintos a Lopesan, si existen.
- Confirmar nombre de cliente, sector, ubicación y alcance de cada uno de los 11 proyectos.

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
