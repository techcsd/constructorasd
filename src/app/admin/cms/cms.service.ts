import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '@env';
import { getSupabase } from '../admin.supabase';
import type { MediaRow, ProjectImageRow } from './cms.models';

/**
 * CRUD for the normalized CMS tables (web schema) + media upload to the web-media bucket. Admin-session
 * only (anon key + RLS via web.is_admin()); never the service role. All writes are plain supabase-js
 * calls so RLS is the authority. Soft-delete via deleted_at; ordering via sort_order.
 */
@Injectable({ providedIn: 'root' })
export class CmsService {
  private sb = getSupabase(inject(PLATFORM_ID));

  private get db() {
    if (!this.sb) throw new Error('offline');
    return this.sb;
  }

  /** List non-deleted rows ordered by sort_order (admin sees drafts too). */
  async list<T>(table: string): Promise<T[]> {
    const { data, error } = await this.db
      .from(table)
      .select('*')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  }

  async listDeleted<T>(table: string): Promise<T[]> {
    const { data, error } = await this.db.from(table).select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  }

  async get<T>(table: string, id: string): Promise<T | null> {
    const { data, error } = await this.db.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as T | null;
  }

  /** Insert (no id) or update (id present). Returns the row. */
  async upsert<T extends { id?: string }>(table: string, row: T): Promise<T> {
    const q = row.id
      ? this.db.from(table).update(row).eq('id', row.id).select('*').single()
      : this.db.from(table).insert(row).select('*').single();
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data as T;
  }

  async softDelete(table: string, id: string): Promise<void> {
    const { error } = await this.db.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async restore(table: string, id: string): Promise<void> {
    const { error } = await this.db.from(table).update({ deleted_at: null }).eq('id', id);
    if (error) throw new Error(error.message);
  }
  async setField(table: string, id: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await this.db.from(table).update(patch).eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Persist a new order (array of ids in the desired order). */
  async reorder(table: string, ids: string[]): Promise<void> {
    await Promise.all(ids.map((id, i) => this.db.from(table).update({ sort_order: i }).eq('id', id)));
  }

  // ── slug redirects (A03b) ──
  // Localized detail-route bases — MUST match core/i18n/localized-routes.ts (ES ↔ EN segments).
  private static readonly DETAIL_BASES: Record<string, { es: string; en: string }> = {
    proyectos: { es: 'proyectos', en: 'projects' },
    noticias: { es: 'noticias', en: 'news' },
    vacantes: { es: 'vacantes', en: 'careers' },
  };

  /**
   * Record 301-equivalent redirects (both languages) when a PUBLISHED detail slug changes, so the old
   * URL keeps working. The build (gen-content → gen-redirects) turns web.slug_redirects into static
   * redirect stubs in the prerendered output. Also repoints existing chains (A→B then B→C ⇒ A→C) and
   * clears any stale redirect that would shadow the newly-reused slug.
   */
  async recordSlugRedirect(entity: 'proyectos' | 'noticias' | 'vacantes', oldSlug: string, newSlug: string): Promise<void> {
    if (!oldSlug || !newSlug || oldSlug === newSlug) return;
    const b = CmsService.DETAIL_BASES[entity];
    const rows = [
      { from_path: `/${b.es}/${oldSlug}`, to_path: `/${b.es}/${newSlug}` },
      { from_path: `/en/${b.en}/${oldSlug}`, to_path: `/en/${b.en}/${newSlug}` },
    ];
    for (const r of rows) {
      // repoint any redirect that pointed at the slug we're vacating
      await this.db.from('slug_redirects').update({ to_path: r.to_path }).eq('to_path', r.from_path);
    }
    const { error } = await this.db.from('slug_redirects').upsert(rows, { onConflict: 'from_path' });
    if (error) throw new Error(error.message);
    // a live page now owns the new path — it must not be shadowed by an old redirect
    await this.db.from('slug_redirects').delete().in('from_path', rows.map((r) => r.to_path));
  }

  // ── media ──
  publicUrl(path: string): string {
    return this.db.storage.from('web-media').getPublicUrl(path).data.publicUrl;
  }

  /**
   * Small, on-the-fly resized thumbnail via Supabase image transform — so the admin never downloads the
   * 4 MB originals just to show a 160 px thumb (both csd projects have transforms enabled). `resize: cover`
   * crops to the box. SVGs can't be transformed, so they return the (tiny) original.
   */
  thumbUrl(path: string, width = 240, height?: number): string {
    if (/\.svg$/i.test(path)) return this.publicUrl(path);
    return this.db.storage.from('web-media').getPublicUrl(path, {
      transform: { width, height: height ?? width, resize: 'cover', quality: 70 },
    }).data.publicUrl;
  }

  /**
   * URL that downloads the ORIGINAL (full-resolution) file with an attachment disposition — for pulling a
   * photo out to edit/upscale it elsewhere. `?download=<filename>` makes Supabase send
   * `Content-Disposition: attachment`, so the browser saves it (not a thumbnail, not a navigation).
   */
  downloadUrl(path: string, filename?: string): string {
    return this.db.storage.from('web-media').getPublicUrl(path, { download: filename || true }).data.publicUrl;
  }

  /** Upload a pasted/inline image to web-media/notes/<uuid>.<ext> (no media row); returns its public URL. */
  async uploadInline(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `notes/${crypto.randomUUID()}.${ext}`;
    const up = await this.db.storage.from('web-media').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) throw new Error(up.error.message);
    return this.publicUrl(path);
  }

  async listMedia(): Promise<MediaRow[]> {
    const { data, error } = await this.db.from('media').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MediaRow[];
  }

  /** Upload a file to web-media/<yyyy>/<mm>/<uuid>.<ext> and create the media row. */
  async uploadMedia(file: File, alt: { es: string; en: string }, dims: { width: number; height: number }, sha256: string): Promise<MediaRow> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const now = new Date();
    const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext}`;
    const up = await this.db.storage.from('web-media').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) throw new Error(up.error.message);
    const row = {
      bucket: 'web-media', path, original_name: file.name, mime: file.type, bytes: file.size,
      width: dims.width, height: dims.height, sha256, alt_es: alt.es, alt_en: alt.en, created_by: 'admin',
    };
    const { data, error } = await this.db.from('media').insert(row).select('*').single();
    if (error) throw new Error(error.message);
    return data as MediaRow;
  }

  /** Count how many records reference each media id (covers, logos, gallery). */
  async mediaUsage(): Promise<Record<string, number>> {
    const usage: Record<string, number> = {};
    const bump = (id?: string | null) => { if (id) usage[id] = (usage[id] ?? 0) + 1; };
    const [proj, cli, post, gal] = await Promise.all([
      this.db.from('projects').select('cover_media_id').is('deleted_at', null),
      this.db.from('clients').select('logo_media_id').is('deleted_at', null),
      this.db.from('posts').select('cover_media_id').is('deleted_at', null),
      this.db.from('project_images').select('media_id'),
    ]);
    (proj.data ?? []).forEach((r: { cover_media_id?: string | null }) => bump(r.cover_media_id));
    (cli.data ?? []).forEach((r: { logo_media_id?: string | null }) => bump(r.logo_media_id));
    (post.data ?? []).forEach((r: { cover_media_id?: string | null }) => bump(r.cover_media_id));
    (gal.data ?? []).forEach((r: { media_id?: string | null }) => bump(r.media_id));
    return usage;
  }

  async updateMediaAlt(id: string, alt: { es: string; en: string }, focal?: { x: number; y: number }): Promise<void> {
    const patch: Record<string, unknown> = { alt_es: alt.es, alt_en: alt.en };
    if (focal) { patch['focal_x'] = focal.x; patch['focal_y'] = focal.y; }
    const { error } = await this.db.from('media').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ── project gallery ──
  async projectImages(projectId: string): Promise<(ProjectImageRow & { media: MediaRow })[]> {
    const { data, error } = await this.db
      .from('project_images')
      .select('*, media:media_id(*)')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as (ProjectImageRow & { media: MediaRow })[];
  }

  /** Replace a project's gallery with the given ordered media ids (captions optional). */
  async setGallery(projectId: string, items: { media_id: string; caption_es?: string; caption_en?: string }[]): Promise<void> {
    const del = await this.db.from('project_images').delete().eq('project_id', projectId);
    if (del.error) throw new Error(del.error.message);
    if (!items.length) return;
    const rows = items.map((it, i) => ({ project_id: projectId, media_id: it.media_id, sort_order: i, caption_es: it.caption_es ?? '', caption_en: it.caption_en ?? '' }));
    const { error } = await this.db.from('project_images').insert(rows);
    if (error) throw new Error(error.message);
  }

  // ── publish ──
  /** Trigger a rebuild (web-publish → Vercel deploy hook). Returns null on success, else an error string. */
  async publish(): Promise<string | null> {
    const { data: sess } = await this.db.auth.getSession();
    const token = sess.session?.access_token;
    const base = (environment.supabaseUrl || '').replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/functions/v1/web-publish`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return `${res.status}: ${(await res.text()).slice(0, 140)}`;
      await this.markPublished();
      return null;
    } catch (e) { return (e as Error).message; }
  }

  /** Stamp site_state.last_published_at so the "cambios sin publicar" counter resets. */
  async markPublished(): Promise<void> {
    await this.db.from('site_state').upsert({ key: 'last_published_at', value: new Date().toISOString() }, { onConflict: 'key' });
  }

  /**
   * Real Vercel deploy state via the web-deploy-status edge function (the token lives there, never in the
   * browser). Returns { configured:false } until a VERCEL_TOKEN secret is set — the publish bar then uses
   * its token-free version.json polling. Null on network error.
   */
  async deployStatus(): Promise<{ configured: boolean; state?: string; url?: string | null; inspectorUrl?: string | null; error?: string } | null> {
    const { data: sess } = await this.db.auth.getSession();
    const token = sess.session?.access_token;
    const base = (environment.supabaseUrl || '').replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/functions/v1/web-deploy-status`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  /** Current built revision from /version.json (for the degraded deploy-detection path). */
  async siteVersion(): Promise<string | null> {
    try {
      const r = await fetch('/version.json?ts=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return null;
      return (await r.json()).rev ?? null;
    } catch { return null; }
  }

  /**
   * Is any content newer than what's live? The "published watermark" is the LATER of the live build time
   * (`version.json` builtAt — refreshed by ANY deploy, git push or admin Publicar) and the last admin
   * publish stamp (set the instant you click, before the rebuild finishes). This auto-clears after any
   * deploy, so it never gets stuck on "cambios sin publicar" just because a deploy went out via git.
   * Timestamps are parsed (not string-compared): Postgres returns `…+00:00`, JS emits `…Z`.
   */
  async unpublishedChanges(): Promise<boolean> {
    const ms = (s: string | null | undefined): number | null => { const t = s ? Date.parse(s) : NaN; return Number.isNaN(t) ? null : t; };
    let builtAt: string | null = null;
    try {
      const r = await fetch('/version.json?ts=' + Date.now(), { cache: 'no-store' });
      if (r.ok) builtAt = (await r.json()).builtAt ?? null;
    } catch { /* ignore */ }
    const { data } = await this.db.from('site_state').select('value').eq('key', 'last_published_at').maybeSingle();
    const stamp = (data?.value as string | null) ?? null;
    const watermark = Math.max(ms(builtAt) ?? 0, ms(stamp) ?? 0);
    const tables = ['projects', 'clients', 'posts', 'jobs', 'media', 'site_content'];
    let newest = 0;
    for (const t of tables) {
      const { data: rows } = await this.db.from(t).select('updated_at').order('updated_at', { ascending: false }).limit(1);
      const u = ms(rows?.[0]?.updated_at as string | undefined);
      if (u && u > newest) newest = u;
    }
    if (!newest) return false;
    if (!watermark) return true;
    return newest > watermark + 5000; // 5s grace for build/DB clock skew
  }
}
