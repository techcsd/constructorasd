import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@env';
import type { Project } from '../../content/types';

/**
 * Draft preview (WJ5). When the URL carries ?preview=1 AND an admin Supabase session exists in this
 * browser (same origin, storage key 'csd-admin-auth'), the public pages render DRAFT content fetched
 * live from the DB (including unpublished rows) instead of the prerendered static content.
 *
 * Kept deliberately dependency-free: raw fetch with the admin JWT (read from localStorage) + the anon
 * apikey — so supabase-js never enters the public bundle. Never active for normal visitors; on any
 * failure the pages fall back to the static content. Prerender is unaffected (server never has the flag
 * or a session). Preview pages are noindex via the banner.
 */
@Injectable({ providedIn: 'root' })
export class PreviewService {
  private platformId = inject(PLATFORM_ID);
  readonly enabled = signal(false);
  readonly projects = signal<Project[] | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private get base(): string { return (environment.supabaseUrl || '').replace(/\/$/, ''); }
  private token(): string | null {
    try {
      const raw = localStorage.getItem('csd-admin-auth');
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p.access_token ?? p.currentSession?.access_token ?? p.session?.access_token ?? null;
    } catch { return null; }
  }
  publicUrl(path: string): string { return `${this.base}/storage/v1/object/public/web-media/${path}`; }

  /** Call once at app start (browser). Activates + loads drafts if ?preview=1 and an admin session exist. */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const params = new URLSearchParams(location.search);
    if (params.get('preview') !== '1') return;
    const token = this.token();
    if (!token || !this.base) return;
    this.enabled.set(true);
    void this.load(token);
  }

  private async rest<T>(token: string, path: string): Promise<T[]> {
    const r = await fetch(`${this.base}/rest/v1/${path}`, {
      headers: { apikey: environment.supabaseAnonKey, Authorization: 'Bearer ' + token, 'Accept-Profile': 'web' },
    });
    if (!r.ok) throw new Error(`${path} ${r.status}`);
    return r.json();
  }

  private async load(token: string): Promise<void> {
    this.loading.set(true);
    try {
      const [projects, media, images] = await Promise.all([
        this.rest<Record<string, unknown>>(token, 'projects?deleted_at=is.null&select=*&order=sort_order'),
        this.rest<{ id: string; path: string; alt_es: string; alt_en: string }>(token, 'media?deleted_at=is.null&select=id,path,alt_es,alt_en'),
        this.rest<Record<string, unknown>>(token, 'project_images?select=*&order=sort_order'),
      ]);
      const mById = new Map(media.map((m) => [m.id, m]));
      const img = (id: unknown) => {
        const m = id ? mById.get(id as string) : null;
        return m ? { src: this.publicUrl(m.path), alt: { es: m.alt_es ?? '', en: m.alt_en ?? '' } } : null;
      };
      const galleryBy = new Map<string, Record<string, unknown>[]>();
      for (const pi of images) {
        const pid = pi['project_id'] as string;
        (galleryBy.get(pid) ?? galleryBy.set(pid, []).get(pid)!).push(pi);
      }
      const mapped: Project[] = projects.map((p) => {
        const cover = img(p['cover_media_id']);
        const gallery = (galleryBy.get(p['id'] as string) ?? [])
          .map((pi) => { const g = img(pi['media_id']); return g ? { src: g.src, alt: { es: (pi['caption_es'] as string) || g.alt.es, en: (pi['caption_en'] as string) || g.alt.en } } : null; })
          .filter((x): x is NonNullable<typeof x> => !!x);
        return {
          slug: p['slug'] as string, name: p['name'] as string, client: (p['client_name'] as string) ?? '',
          sector: (p['sector_key'] as Project['sector']) ?? 'institucional',
          location: { es: (p['location_es'] as string) ?? '', en: (p['location_en'] as string) ?? '' },
          year: (p['year'] as number) ?? undefined, status: (p['status'] as Project['status']) ?? 'ejecutado',
          summary: { es: (p['summary_es'] as string) ?? '', en: (p['summary_en'] as string) ?? '' },
          body: { es: (p['body_es'] as string) ?? '', en: (p['body_en'] as string) ?? '' },
          scope: (p['scope'] as Project['scope']) ?? [],
          cover: cover ?? { src: '', alt: { es: '', en: '' } }, gallery,
          featured: !!p['featured'], order: (p['sort_order'] as number) ?? 0,
        };
      });
      this.projects.set(mapped);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally { this.loading.set(false); }
  }
}
