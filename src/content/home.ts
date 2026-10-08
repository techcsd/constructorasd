// Home ("Inicio") content (WL2/WL3/WN1) — editable from /admin › Inicio (web.site_content.home).
// The seed is derived from the existing page-meta + company seeds (single source); the DB override wins
// field-by-field via ov(). Hero image stays the build asset 'lopesan/hero' until a mediaId is set (Phase 2).
import { HomeContent } from './types';
import { ov } from './_overrides';
import { COMPANY } from './company';
import { PAGE_META } from './page-meta';

const m = PAGE_META['home'];
const EMPTY = { es: '', en: '' };

const HOME_SEED: HomeContent = {
  hero: {
    mediaId: null,
    alt: {
      es: 'Estructura y encofrado de gran altura en obra — Lopesan Costa Bávaro',
      en: 'High-rise structure and formwork on site — Lopesan Costa Bávaro',
    },
    title: m.h1,
    emphasis: m.emphasis ?? EMPTY,
    lead: m.lead ?? EMPTY,
    eyebrow: m.eyebrow ?? EMPTY,
    primary: { label: { es: 'Ver proyectos', en: 'See projects' }, href: 'proyectos' },
    secondary: { label: { es: 'Hablemos', en: "Let's talk" }, href: 'contacto' },
  },
  stats: COMPANY.stats.map((s) => {
    const mt = /^(\d+)(.*)$/.exec(s.value);
    return { value: mt ? mt[1] : s.value, suffix: mt ? mt[2] : '', label: s.label };
  }),
  intro: {
    eyebrow: { es: 'La empresa', en: 'The company' },
    title: { es: 'Un solo equipo, todo el ciclo constructivo.', en: 'One team, the whole construction cycle.' },
    text: COMPANY.description,
    linkLabel: { es: 'Conocer la empresa', en: 'About the company' },
    href: 'empresa',
  },
  featuredProjects: { mode: 'auto', ids: [] },
  sectors: { title: { es: 'Sectores en los que construimos.', en: 'Sectors we build in.' }, lead: EMPTY },
  quote: { text: COMPANY.philosophyQuote, author: COMPANY.philosophyAttribution },
  clientsOnHome: { mode: 'auto', ids: [], max: 12 },
  advantages: COMPANY.advantages,
  cta: {
    title: { es: 'Construyamos juntos el próximo proyecto.', en: "Let's build the next project together." },
    buttonLabel: { es: 'Hablemos', en: "Let's talk" },
    href: 'contacto',
    showPhones: true,
  },
};

export const HOME: HomeContent = ov('home', HOME_SEED);
