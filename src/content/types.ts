// Content model (CLAUDE.md rule 10 / WA8). Interfaces mirror the future `web.*` tables field-for-field
// (camelCase here ↔ snake_case in Postgres). Don't add a field that couldn't be a column.
import { LocalizedText } from './page-meta';

export type { LocalizedText };

export type Sector =
  | 'hotelero'
  | 'institucional'
  | 'hospitalario'
  | 'industrial'
  | 'residencial'
  | 'minero';

export interface Stat {
  value: string; // e.g. "45+"
  label: LocalizedText;
}

export interface Stage {
  index: string; // "01".."07"
  slug: string; // etapa-01 … (anchor)
  title: LocalizedText;
  summary: LocalizedText;
  capabilities: LocalizedText[]; // 4 bullets
  /** Stage 04 only: the heights table (value + label). */
  heights?: { value: string; label: LocalizedText }[];
}

export interface Project {
  slug: string;
  name: string; // proper noun — same in both languages
  client: string; // proper noun
  sector?: Sector;
  city?: string;
  featured?: boolean;
  /** Image key in public/img/manifest.json (Prompt 2); absent → neutral placeholder. */
  image?: string;
}

export interface Client {
  name: string; // proper noun
  /** Grouping for the Clientes page. */
  group: 'promotores' | 'hoteleria' | 'industria' | 'instituciones';
  /** Monochrome SVG path under /img/clients/ when available; else render the name as text. */
  logo?: string;
}

export interface Advantage {
  index: string;
  title: LocalizedText;
  body: LocalizedText;
}
