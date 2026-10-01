import { describe, it, expect } from 'vitest';
import { COMPANY } from './company';
import { STAGES } from './stages';
import { PROJECTS } from './projects';
import { CLIENTS } from './clients';
import { SECTORS } from './sectors';
import { EQUIPMENT, FORMWORK_SYSTEMS } from './equipment';
import { JOBS } from './jobs';
import { POSTS } from './posts';
import manifest from './image-manifest.json';

const MANIFEST = manifest as Record<string, unknown>;
const SECTOR_IDS = new Set(SECTORS.map((s) => s.id));
const STAGE_IDS = new Set(STAGES.map((s) => s.id));

// Recursively assert every { es, en } leaf has non-empty strings.
function checkL(obj: unknown, path: string): void {
  if (obj == null || typeof obj !== 'object') return;
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.includes('es') && keys.includes('en') && typeof o['es'] === 'string') {
    expect(String(o['es']).trim(), `${path}.es`).not.toBe('');
    expect(String(o['en']).trim(), `${path}.en`).not.toBe('');
    return;
  }
  for (const k of keys) checkL(o[k], `${path}.${k}`);
}

describe('content model', () => {
  it('every localized field has non-empty es + en', () => {
    checkL(COMPANY, 'company');
    checkL(STAGES, 'stages');
    checkL(SECTORS, 'sectors');
    checkL(EQUIPMENT, 'equipment');
    // projects: skip the client field (can be '' for Plaza Roque) — covered separately
    checkL(
      PROJECTS.map((p) => ({ ...p, client: 'x' })),
      'projects',
    );
  });

  it('project slugs are unique', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('client slugs are unique and every client has a group', () => {
    const slugs = CLIENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of CLIENTS) expect(c.group, c.name).toBeTruthy();
  });

  it('every project has a valid sector and a cover image that exists in the manifest', () => {
    for (const p of PROJECTS) {
      expect(SECTOR_IDS.has(p.sector), `${p.slug} sector`).toBe(true);
      expect(p.cover.src, `${p.slug} cover`).toBeTruthy();
      expect(MANIFEST[p.cover.src], `cover ${p.cover.src} in manifest`).toBeTruthy();
      for (const g of p.gallery) {
        expect(MANIFEST[g.src], `gallery ${g.src} in manifest`).toBeTruthy();
      }
      for (const s of p.scope) expect(STAGE_IDS.has(s), `${p.slug} scope ${s}`).toBe(true);
    }
  });

  it('the featured set is Lopesan, Poseidonia, Hospital Barahona, Brisas City Center', () => {
    const featured = PROJECTS.filter((p) => p.featured)
      .map((p) => p.slug)
      .sort();
    expect(featured).toEqual(
      ['brisas-city-center', 'hospital-barahona', 'lopesan-costa-bavaro-bloque-f', 'poseidonia'].sort(),
    );
  });

  it('sector project references point to real projects', () => {
    const slugs = new Set(PROJECTS.map((p) => p.slug));
    for (const sec of SECTORS) for (const ref of sec.projects) expect(slugs.has(ref), ref).toBe(true);
  });

  it('every stage has 4 capabilities and a cover image in the manifest', () => {
    for (const s of STAGES) {
      expect(s.capabilities.length, `${s.id} capabilities`).toBe(4);
      for (const img of s.images) expect(MANIFEST[img.src], `stage ${img.src}`).toBeTruthy();
    }
    expect(STAGES.length).toBe(7);
  });

  it('equipment has 8 lines and 3 formwork systems', () => {
    expect(EQUIPMENT.length).toBe(8);
    expect(FORMWORK_SYSTEMS).toEqual(['Faresin', 'PERI', 'Symons']);
  });

  it('jobs and posts are empty in v1 (no fabricated content)', () => {
    expect(JOBS.length).toBe(0);
    expect(POSTS.length).toBe(0);
  });

  it('company has the four stats and six advantages', () => {
    expect(COMPANY.stats.length).toBe(4);
    expect(COMPANY.advantages.length).toBe(6);
    expect(COMPANY.founded).toBeUndefined();
  });
});
