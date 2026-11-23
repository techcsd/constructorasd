// classify.mjs — PROMPT-12 Phase 2. Visual triage decisions (made by looking at every contact sheet)
// merged with the measured inventory → audit.json, PHOTO-AUDIT.md (ES, plain language),
// NEED-NEW-PHOTOS.md, and the region overlay for tier C. Re-run after changing D.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'docs', 'round-05-photos');
const inv = JSON.parse(readFileSync(join(OUT, 'inventory.json'), 'utf8'));

// key = id prefix (cms/<6 hex>) or full id. tier A/B/C/D.
// `native` = the true source file (static fallback) for B photos whose CMS copy is an earlier enlargement.
const D = {
  'cms/7212af': { name: 'Estructura con encofrado y cielo azul (portada / Inicio)', tier: 'A', why: 'Buena luz, nítida y bien encuadrada. Sirve como portada y como foto principal de Inicio.', plan: 'Se deja igual.' },
  'cms/1a9cac': { name: 'Puntales y losa encofrada, vista interior', tier: 'A', why: 'Clara y profesional; el piso está prácticamente limpio.', plan: 'Se deja igual.' },
  'cms/14ce3c': { name: 'Encofrado y andamio con cielo (vertical)', tier: 'A', why: 'Buen encuadre y luz. Hay madera apilada al fondo, pero ordenada y sin protagonismo.', plan: 'Se deja igual.' },
  'cms/929f73': { name: 'Terreno con charco y material al fondo (vertical)', tier: 'D', codes: ['POOR_COMPOSITION'], why: 'El protagonista es un charco con lodo y el sol quema una esquina; el material queda lejos y pequeño.', plan: 'No se publica. Reemplazar (ver NEED-NEW-PHOTOS).' },
  'cms/fdabf2': { name: 'Paneles de encofrado cubiertos con lona naranja', tier: 'D', codes: ['CLUTTER_IS_THE_SUBJECT'], why: 'La foto es un montón de paneles y lona tirados en el suelo; limpiarla la dejaría sin tema.', plan: 'No se publica. Reemplazar.' },
  'cms/8fe6b2': { name: 'Sótano con madera verde apilada en el piso', tier: 'D', codes: ['CLUTTER_IS_THE_SUBJECT'], why: 'El montón de tablas ocupa todo el primer plano.', plan: 'No se publica. Reemplazar.' },
  'cms/f2014c': { name: 'Patio con material apilado y paneles', tier: 'D', codes: ['CLUTTER_IS_THE_SUBJECT'], why: 'Primer plano lleno de material tirado; es contenido de obra real, pero no para una web comercial.', plan: 'No se publica. Reemplazar.' },
  'cms/1d65dc': { name: 'Paneles y puntales amontonados en el piso', tier: 'D', codes: ['CLUTTER_IS_THE_SUBJECT'], why: 'Todo el encuadre es el montón de tubos y paneles.', plan: 'No se publica. Reemplazar.' },
  'cms/5ebba3': { name: 'Andamio y encofrado desde un nivel alto (vertical)', tier: 'A', why: 'Buen cielo y estructura clara; la madera verde apilada a la derecha está ordenada.', plan: 'Se deja igual.' },
  'cms/c0706e': { name: 'Vista aérea de la obra (Poseidonia)', tier: 'B', codes: ['LOW_RES'], why: 'La foto original mide solo 1280 px de ancho; hoy se muestra agrandada sin ganar detalle.', plan: 'Mejora gratuita en la PC (más resolución y nitidez). Se compara con la actual.', native: 'projects/poseidonia' },
  'cms/1a461b': { name: 'Vista aérea de la losa (Hospital Barahona)', tier: 'A', why: 'Nítida, buena luz y encuadre. Tiene textura fina de grano pero no molesta.', plan: 'Se deja igual.' },
  'cms/41a11f': { name: 'Vista aérea del edificio en construcción (Brisas City Center)', tier: 'A', why: 'Buena resolución y composición.', plan: 'Se deja igual.' },
  'cms/f5ff52': { name: 'Excavación y cimentación desde arriba (Torre Alpha)', tier: 'A', why: 'Buena resolución. Hay varillas en el suelo, propias de la obra en ese momento.', plan: 'Se deja igual.' },
  'cms/cd6607': { name: 'Vista aérea de las estructuras (Riviera Bay)', tier: 'B', codes: ['LOW_RES'], why: 'La original mide 1280 px de ancho; hoy está agrandada.', plan: 'Mejora gratuita en la PC.', native: 'projects/riviera-bay' },
  'cms/99bbb8': { name: 'Vista aérea del conjunto (City Place)', tier: 'B', codes: ['LOW_RES'], why: 'La original mide 1280 px de ancho; hoy está agrandada.', plan: 'Mejora gratuita en la PC.', native: 'projects/city-place' },
  'cms/0228f3': { name: 'Estructuras entre vegetación (Monterezzo)', tier: 'B', codes: ['LOW_RES'], why: 'La original mide 1280 px de ancho; hoy está agrandada.', plan: 'Mejora gratuita en la PC.', native: 'projects/monterezzo' },
  'cms/9e708b': { name: 'Vista aérea de la obra (Elements Volare)', tier: 'B', codes: ['LOW_RES'], why: 'La original mide 1280 px de ancho; hoy está agrandada.', plan: 'Mejora gratuita en la PC.', native: 'projects/elements-volare' },
  'cms/b23306': { name: 'Edificio frente a la laguna (Olea)', tier: 'B', codes: ['LOW_RES', 'DARK', 'HAZE'], why: 'La original mide 1280 px, y se ve algo oscura y con velo.', plan: 'Mejora gratuita en la PC (resolución, luz y contraste suave).', native: 'projects/olea' },
  'cms/9f56cd': {
    name: 'Vista aérea de la obra (Villa Cacique 38)', tier: 'C', codes: ['CLUTTER_GROUND'],
    why: 'Buena foto, pero en el suelo frente al edificio hay tablas de madera verde tiradas, que se ven desordenadas.',
    plan: 'Retoque con IA solo en esa zona del suelo; el resto queda con los píxeles originales.',
    regions: [{ label: 'tablas de madera verde sueltas frente a la entrada', polygon: [[0.50, 0.685], [0.585, 0.685], [0.685, 0.70], [0.695, 0.80], [0.665, 0.825], [0.60, 0.80], [0.525, 0.755], [0.495, 0.72]] }],
    brief: 'Remove the loose green wooden planks lying on the bare ground and fill with the surrounding sandy soil and small rubble, matching texture, colour and lighting. Do not change the building, trees, people, vehicles or anything outside the marked area.',
  },
  'cms/6f2f5c': { name: 'Fachada ACM de colores (Plaza Roque)', tier: 'D', codes: ['TOO_SMALL'], why: 'La original mide solo 768 × 487 px y está blanda; al agrandarla la IA inventaría detalle. La misma foto se usa también en Servicios.', plan: 'Se deja como está por ahora; hay que conseguir una foto nueva y más grande.' },
  'stages/etapa-01': { name: 'Losa de gran altura sobre torres de apuntalamiento (Servicios, etapa 1)', tier: 'B', codes: ['LOW_RES'], why: 'Mide 1169 px de ancho.', plan: 'Mejora gratuita en la PC.' },
  'stages/etapa-02': { name: 'Motoniveladora moviendo tierra (Servicios, etapa 2)', tier: 'A', why: 'Foto clara, buen cielo y tema evidente.', plan: 'Se deja igual.' },
  'stages/etapa-03': { name: 'Obra civil industrial con andamios (Servicios, etapa 3)', tier: 'A', why: 'Foto clara y de buen tamaño. Las lonas y materiales son parte de la obra en ejecución.', plan: 'Se deja igual.' },
  'stages/etapa-04': { name: 'Estructura vertical y encofrado, nave interior (Servicios, etapa 4)', tier: 'B', codes: ['LOW_RES', 'DARK'], why: 'Es vertical, mide 1217 px de ancho y queda oscura.', plan: 'Mejora gratuita en la PC (resolución y luz).' },
  'stages/etapa-05': { name: 'Fachada ACM de colores (Servicios, etapa 5)', tier: 'D', codes: ['TOO_SMALL', 'DUPLICATE'], why: 'Es la misma foto de la tarjeta de Plaza Roque (768 px, blanda). Repetirla hace ver el sitio con pocas fotos.', plan: 'Reemplazar con otra foto de fachada o de acabados (ver NEED-NEW-PHOTOS).' },
  'stages/etapa-06': { name: 'Habitación terminada (Servicios, etapa 6)', tier: 'B', codes: ['SOFT'], why: 'Algo blanda y con poco contraste.', plan: 'Mejora gratuita en la PC (nitidez y contraste suave).' },
  'stages/etapa-07': { name: 'Resort terminado visto desde arriba (Servicios, etapa 7)', tier: 'B', codes: ['LOW_RES'], why: 'Mide 1280 px de ancho.', plan: 'Mejora gratuita en la PC.' },
};
const lookup = (id) => D[id] ?? D[id.replace(/^(cms\/[0-9a-f]{6}).*/, '$1')];

const photos = [];
const seen = new Set();
for (const r of inv) {
  if (r.role === 'fallback' || r.role === 'og') continue;
  if (r.id === 'lopesan/hero') {
    photos.find((p) => p.id.startsWith('cms/7212af')).usages.push({ page: r.page, role: r.role });
    continue;
  }
  const d = lookup(r.id);
  if (!d) throw new Error('no decision for ' + r.id);
  if (seen.has(r.id)) continue;
  seen.add(r.id);
  photos.push({
    id: r.id, short: /^cms/.test(r.id) ? r.id.slice(0, 10) : r.id, project: r.project || r.page, page: r.page, role: r.role,
    position: r.pos || null, orig_w: r.orig_w, orig_h: r.orig_h, sharpness: r.sharpness, noise_est: r.noise_est,
    dup_group: r.dup_group || null, original_path: r.original_path, ...d, usages: [{ page: r.page, role: r.role }],
  });
}
for (const p of photos) if (p.native) {
  const f = inv.find((r) => r.id === p.native);
  p.native_w = f.orig_w; p.native_h = f.orig_h; p.native_path = f.original_path;
}

const tierCount = { A: 0, B: 0, C: 0, D: 0 };
photos.forEach((p) => tierCount[p.tier]++);
writeFileSync(join(OUT, 'audit.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), totals: tierCount, photos }, null, 1));

// ── overlay for tier C regions ──
mkdirSync(join(OUT, 'regions'), { recursive: true });
for (const p of photos.filter((x) => x.tier === 'C')) {
  const W = 1600;
  const meta = await sharp(join(ROOT, p.original_path)).rotate().resize(W).toBuffer({ resolveWithObject: true });
  const H = meta.info.height;
  const polys = p.regions
    .map((rg) => `<polygon points="${rg.polygon.map(([x, y]) => `${x * W},${y * H}`).join(' ')}" fill="rgba(255,0,0,0.35)" stroke="#ff0" stroke-width="3"/>`)
    .join('');
  await sharp(meta.data)
    .composite([{ input: Buffer.from(`<svg width="${W}" height="${H}">${polys}</svg>`) }])
    .jpeg({ quality: 80 })
    .toFile(join(OUT, 'regions', `${p.short.replace('/', '-')}.jpg`));
}

// ── PHOTO-AUDIT.md (Spanish, plain) ──
const groups = new Map();
for (const p of photos) {
  const k = p.role === 'stage' ? 'Servicios (etapas)' : p.project;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(p);
}
let md =
  `# Auditoría de fotos del sitio — constructorasd.com\n\n_Ronda 23-nov-2026 · se revisaron todas las fotos que el sitio puede mostrar (${photos.length} fotos distintas)._\n\n` +
  `**Cómo leer esta hoja.** Cada foto tiene un nivel:\n\n- **A** — está bien, no se toca.\n- **B** — se mejora de forma automática y gratuita en la computadora (más nitidez, luz o tamaño); no se inventa nada.\n- **C** — está bien pero tiene desorden en el suelo; se limpia **solo esa zona** con una herramienta de IA y el resto de la foto queda idéntico.\n- **D** — no se puede arreglar bien; hay que **tomar una foto nueva** (ver \`NEED-NEW-PHOTOS.md\`).\n\n` +
  `## Totales\n\n| Nivel | Fotos |\n|---|---|\n| A — se deja igual | ${tierCount.A} |\n| B — mejora automática | ${tierCount.B} |\n| C — limpieza con IA | ${tierCount.C} |\n| D — reemplazar | ${tierCount.D} |\n| **Total** | **${photos.length}** |\n\n` +
  `> Nota: la foto de Inicio (portada) y la portada de Lopesan son la misma imagen. La foto de la fachada de colores se repite en Plaza Roque y en Servicios (etapa 5).\n\n`;
for (const [k, list] of groups) {
  md += `## ${k}\n\n| Foto | Nivel | Qué le pasa | Qué se hará |\n|---|---|---|---|\n` +
    list.map((p) => `| ${p.name}${p.usages.length > 1 ? ' (también portada de Inicio)' : ''} | ${p.tier} | ${p.why} | ${p.plan} |`).join('\n') + '\n\n';
}
md += `## Hallazgos que conviene saber\n\n- **Villa Cacique 38:** solo tiene la foto de tarjeta (no hay galería); la madera suelta está en esa foto y es la única candidata a limpieza con IA.\n- **Lopesan Bloque F:** de las 9 fotos de la galería, 4 se quedan y 5 pasan a nivel D (montones de material o encuadre pobre). Quedan pocas fotos buenas; conviene sumar fotos nuevas.\n- **Olea:** se ve algo oscura, pero no tiene grano excesivo; entra a la mejora automática por tamaño y luz.\n- **Tamaño real:** varias portadas de proyectos (Poseidonia, Riviera Bay, City Place, Monterezzo, Elements Volare, Olea) miden solo 1280 px en su origen; hoy están agrandadas sin ganar detalle.\n`;
writeFileSync(join(OUT, 'PHOTO-AUDIT.md'), md);

// ── NEED-NEW-PHOTOS.md (WR8) ──
const need = {
  'cms/929f73': 'Vista general del terreno del Bloque F con la estructura al fondo, desde el borde del terreno, sin charcos en el encuadre.',
  'cms/fdabf2': 'Un nivel del Bloque F con el encofrado ya armado y el piso barrido (el material guardado, fuera de la foto).',
  'cms/8fe6b2': 'Interior de un nivel con losa terminada o encofrada, tomado desde un extremo a lo largo del pasillo, con el piso despejado.',
  'cms/f2014c': 'Panorámica del Bloque F desde un punto alto o desde la calle, mostrando el edificio completo.',
  'cms/1d65dc': 'Detalle de puntales ya instalados bajo una losa (en uso, no amontonados).',
  'cms/6f2f5c': 'Fachada ACM de Plaza Roque, de frente y un poco desde abajo, con cielo despejado; foto original del celular, sin recortar.',
  'stages/etapa-05': 'Otra fachada o acabado exterior terminado (distinto de Plaza Roque), foto horizontal y de cerca.',
};
let nn =
  `# Fotos nuevas que necesitamos\n\n_Para reenviar a los residentes de obra. Lenguaje llano, sin términos técnicos._\n\n## Reglas para todas las fotos\n\n1. Tomar la foto con el celular en **horizontal** (acostado).\n2. **Sin zoom digital**: si hay que acercarse, caminar hasta el lugar.\n3. Mejor entre las **8:00 y las 10:00 a. m.** o después de las **3:30 p. m.** (sol suave, sin sombras duras ni reflejos).\n4. **Antes de fotografiar, despejar el primer plano:** que no haya tablas, tubos, paneles, lonas ni basura tirados en el piso frente a la cámara.\n5. Que no salgan personas en el encuadre (o que estén lejos).\n6. Enviar la foto **original** por WhatsApp como documento (no como imagen comprimida).\n\n## Qué fotografiar\n\n`;
for (const p of photos.filter((x) => x.tier === 'D')) {
  const where = p.role === 'stage' ? 'Servicios, etapa 5' : p.project;
  nn += `- **${where}** — reemplaza: _${p.name}_.\n  Fotografiar: ${need[p.id] ?? need[p.id.slice(0, 10)]}\n`;
}
nn += `\n_Además, la galería de Lopesan Bloque F queda con 3 fotos buenas más la portada: cualquier foto nueva del avance (estructura, fachada, interiores terminados) suma._\n`;
writeFileSync(join(OUT, 'NEED-NEW-PHOTOS.md'), nn);
console.log('tiers', tierCount, 'photos', photos.length);
