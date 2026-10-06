// Row shapes for the CMS tables (web schema). Untyped supabase client → these are hand-written mirrors
// of sql/2026-10-06-cms-schema.sql. Bilingual text is *_es / *_en columns.

export interface MediaRow {
  id: string;
  bucket: string;
  path: string;
  original_name?: string | null;
  mime: string;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  sha256?: string | null;
  alt_es: string;
  alt_en: string;
  focal_x: number;
  focal_y: number;
  deleted_at?: string | null;
  updated_at?: string;
}

export interface ClientRow {
  id: string;
  slug: string;
  name: string;
  group_key: 'promotores' | 'hoteleria' | 'industria_mineria' | 'instituciones';
  logo_media_id?: string | null;
  published: boolean;
  sort_order: number;
  deleted_at?: string | null;
  updated_at?: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  client_id?: string | null;
  client_name?: string | null;
  sector_key?: string | null;
  location_es: string;
  location_en: string;
  year?: number | null;
  status?: 'ejecutado' | 'en_ejecucion' | null;
  summary_es: string;
  summary_en: string;
  body_es: string;
  body_en: string;
  scope: string[];
  cover_media_id?: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  seo_title_es: string;
  seo_title_en: string;
  seo_description_es: string;
  seo_description_en: string;
  deleted_at?: string | null;
  updated_at?: string;
}

export interface ProjectImageRow {
  id: string;
  project_id: string;
  media_id: string;
  sort_order: number;
  caption_es: string;
  caption_en: string;
}

export interface PostRow {
  id: string;
  slug: string;
  title_es: string;
  title_en: string;
  excerpt_es: string;
  excerpt_en: string;
  body_es: string;
  body_en: string;
  cover_media_id?: string | null;
  published_at?: string | null;
  published: boolean;
  sort_order: number;
  deleted_at?: string | null;
  updated_at?: string;
}

export interface JobRow {
  id: string;
  slug: string;
  title_es: string;
  title_en: string;
  area_es: string;
  area_en: string;
  location_es: string;
  location_en: string;
  type?: 'tiempo_completo' | 'por_proyecto' | null;
  summary_es: string;
  summary_en: string;
  requirements_es: string[];
  requirements_en: string[];
  open: boolean;
  published: boolean;
  sort_order: number;
  published_at?: string | null;
  deleted_at?: string | null;
  updated_at?: string;
}

export const SECTORS = [
  { key: 'hotelero', label: 'Hotelero y turístico' },
  { key: 'institucional', label: 'Institucional y comercial' },
  { key: 'hospitalario', label: 'Hospitalario' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'residencial', label: 'Residencial' },
  { key: 'minero', label: 'Minero' },
] as const;

export const STAGES = [
  { id: 'etapa-01', label: '01 · Acero e ingeniería de encofrado' },
  { id: 'etapa-02', label: '02 · Movimiento de tierras' },
  { id: 'etapa-03', label: '03 · Cimentación y obra civil' },
  { id: 'etapa-04', label: '04 · Estructura' },
  { id: 'etapa-05', label: '05 · Sistemas livianos' },
  { id: 'etapa-06', label: '06 · Terminaciones' },
  { id: 'etapa-07', label: '07 · Entrega llave en mano' },
] as const;

export const CLIENT_GROUPS = [
  { key: 'promotores', label: 'Promotores' },
  { key: 'hoteleria', label: 'Hotelería' },
  { key: 'industria_mineria', label: 'Industria y minería' },
  { key: 'instituciones', label: 'Instituciones' },
] as const;
