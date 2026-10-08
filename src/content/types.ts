// Content model (CLAUDE.md rule 10 / WA8). Interfaces mirror the future `web.*` tables field-for-field
// (camelCase here ↔ snake_case in Postgres). See docs/CONTENT-MODEL.md for the TS ↔ SQL mapping.
// Don't add a field that couldn't be a column.

/** Bilingual string. The key convention elsewhere is "Spanish is the source"; content objects carry both. */
export interface LocalizedText {
  es: string;
  en: string;
}
export type L = LocalizedText;

export type SectorId =
  | 'hotelero'
  | 'institucional'
  | 'hospitalario'
  | 'industrial'
  | 'residencial'
  | 'minero';

export type StageId =
  | 'etapa-01'
  | 'etapa-02'
  | 'etapa-03'
  | 'etapa-04'
  | 'etapa-05'
  | 'etapa-06'
  | 'etapa-07';

/** Reference to an optimized image: `src` is a key in content/image-manifest.json; `alt` is bilingual. */
export interface ImageRef {
  src: string;
  alt: L;
}

export type ProjectStatus = 'ejecutado' | 'en_ejecucion';

export interface Project {
  slug: string;
  name: string; // proper noun — same in both languages
  client: string; // proper noun
  sector: SectorId;
  location: L;
  year?: number;
  status: ProjectStatus;
  summary: L;
  body?: L;
  scope: StageId[];
  cover: ImageRef;
  gallery: ImageRef[];
  featured: boolean;
  order: number;
}

export type ClientGroup = 'promotores' | 'hoteleria' | 'industria_mineria' | 'instituciones';

export interface Client {
  slug: string;
  name: string;
  group: ClientGroup;
  logo?: ImageRef;
  order: number;
}

export interface StageFact {
  label: L;
  value: string;
}

export interface Stage {
  id: StageId;
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: L;
  tagline: L;
  description: L;
  capabilities: L[];
  images: ImageRef[];
  coverMediaId?: string | null;         // CMS media for the accordion/servicios cover (WL4); null → images[0]
  galleryMediaIds?: string[];           // extra CMS images for /servicios (WL4)
  facts?: StageFact[];
  note?: L;
}

export interface Sector {
  id: SectorId;
  name: L;
  blurb: L;
  projects: string[]; // project slugs
}

export interface Equipment {
  index: number;
  name: L;
}

export type JobType = 'tiempo_completo' | 'por_proyecto';

export interface Job {
  slug: string;
  title: L;
  area: L;
  location: L;
  type: JobType;
  summary: L;
  requirements: L[];
  open: boolean;
  publishedAt: string; // ISO date
}

export interface Post {
  slug: string;
  title: L;
  excerpt: L;
  cover?: ImageRef;
  publishedAt: string; // ISO date
  body: { es: string; en: string }; // markdown
}

export interface Stat {
  value: string;
  label: L;
}

export interface Advantage {
  title: L;
  text: L;
}

export interface Company {
  name: string;
  shortName: string;
  tagline: L;
  description: L;
  mission: L;
  vision: L;
  values: L[];
  philosophyQuote: L;
  philosophyAttribution: L;
  stats: Stat[];
  advantages: Advantage[];
  phones: string[];
  email: string;
  instagram: string;
  whatsapp: string; // E.164 digits for wa.me
  presence: L;
  founded?: number;
  offices?: Office[];
}

/** An office/presence pin for the contact map (WD2/WG1). `query` is what Google Maps geocodes. */
export interface Office {
  city: L;
  query: string; // e.g. "Santo Domingo, República Dominicana" — city center until an exact address (WG1)
  addressLine?: L; // optional exact street line, once confirmed
  directionsUrl: string; // "Cómo llegar" deep link
}

// ── Home ("Inicio") content (WL2/WL3/WN1) — editable from /admin › Inicio. Stored in web.site_content.home.
export interface HomeHero {
  mediaId?: string | null;              // CMS media id for the hero photo; null → the build asset 'lopesan/hero'
  image?: string;                       // resolved manifest key (set by gen-content when mediaId is present)
  focal?: { x: number; y: number };     // focal point 0..1
  alt: L;
  title: L;
  emphasis: L;                          // the word/phrase inside the title rendered in serif <em>
  lead: L;
  eyebrow: L;
  primary: { label: L; href: string };
  secondary: { label: L; href: string };
}
export interface HomeStat { value: string; suffix?: string; label: L }
export interface HomeIntro { eyebrow: L; title: L; text: L; linkLabel: L; href: string }
export interface HomeSectorsBlock { title: L; lead: L }
export interface HomeQuote { text: L; author: L }
export interface HomeAdvantage { title: L; text: L }
export interface HomeCta { title: L; buttonLabel: L; href: string; showPhones: boolean }
export interface HomeSelection { mode: 'auto' | 'manual'; ids: string[]; max?: number }

export interface HomeContent {
  hero: HomeHero;
  stats: HomeStat[];
  intro: HomeIntro;
  featuredProjects: HomeSelection;      // auto = first N featured by sort_order; manual = explicit slugs
  sectors: HomeSectorsBlock;
  quote: HomeQuote;
  clientsOnHome: HomeSelection;
  advantages: HomeAdvantage[];
  cta: HomeCta;
}
