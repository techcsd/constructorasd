import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CmsService } from './cms.service';
import { MediaUploader } from '../ui/media-uploader/media-uploader';
import type { PostRow, MediaRow } from './cms.models';

type Editable = Partial<PostRow>;
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Component({
  selector: 'app-cms-noticia-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MediaUploader],
  templateUrl: './noticia-editor.html',
  styleUrl: './admin-cms.scss',
})
export class NoticiaEditor {
  private cms = inject(CmsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly id = this.route.snapshot.queryParamMap.get('id');
  readonly isNew = !this.id;
  readonly p = signal<Editable>({ published: false, published_at: new Date().toISOString().slice(0, 10) });
  readonly cover = signal<MediaRow | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  private slugEdited = false;
  private originalSlug = '';
  private originalPublished = false;

  constructor() { this.load(); }
  async load(): Promise<void> {
    try {
      if (!this.isNew) {
        const row = await this.cms.get<PostRow>('posts', this.id!);
        if (!row) { this.error.set('Noticia no encontrada.'); return; }
        this.p.set({ ...row, published_at: row.published_at?.slice(0, 10) ?? '' }); this.slugEdited = true;
        this.originalSlug = row.slug; this.originalPublished = !!row.published;
        if (row.cover_media_id) { const m = await this.cms.listMedia(); this.cover.set(m.find((x) => x.id === row.cover_media_id) ?? null); }
      }
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  onTitle(v: string): void { this.p.update((x) => ({ ...x, title_es: v })); if (this.isNew && !this.slugEdited) this.p.update((x) => ({ ...x, slug: slugify(v) })); }
  onSlug(v: string): void { this.slugEdited = true; this.p.update((x) => ({ ...x, slug: slugify(v) })); }
  set<K extends keyof PostRow>(k: K, v: PostRow[K]): void { this.p.update((x) => ({ ...x, [k]: v })); }
  onCover(m: MediaRow): void { this.cover.set(m); }
  coverUrl(): string | null { return this.cover() ? this.cms.thumbUrl(this.cover()!.path, 480) : null; }

  async save(): Promise<void> {
    const p = this.p();
    if (!p.title_es?.trim() || !p.title_en?.trim()) { this.error.set('El título es obligatorio en ES y EN.'); return; }
    if (!p.slug?.trim()) { this.error.set('El slug es obligatorio.'); return; }
    this.saving.set(true); this.error.set(null);
    try {
      const row: Editable = {
        ...(this.isNew ? {} : { id: this.id! }), slug: p.slug, title_es: p.title_es, title_en: p.title_en,
        excerpt_es: p.excerpt_es ?? '', excerpt_en: p.excerpt_en ?? '', body_es: p.body_es ?? '', body_en: p.body_en ?? '',
        cover_media_id: this.cover()?.id ?? null, published_at: p.published_at || null, published: !!p.published,
      };
      const saved = await this.cms.upsert<Editable>('posts', row);
      if (!this.isNew && this.originalPublished && this.originalSlug && saved.slug && this.originalSlug !== saved.slug) {
        try { await this.cms.recordSlugRedirect('noticias', this.originalSlug, saved.slug); } catch { /* non-fatal */ }
      }
      this.router.navigate(['/admin/contenido/noticias']);
    } catch (e) {
      const msg = (e as Error).message;
      this.error.set(/duplicate|unique/i.test(msg) ? 'Ese slug ya existe.' : 'No se pudo guardar. ' + msg);
    } finally { this.saving.set(false); }
  }
}
