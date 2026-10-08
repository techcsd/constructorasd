import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CmsService } from './cms.service';
import { MediaUploader } from '../ui/media-uploader/media-uploader';
import { AdminThumb } from '../ui/admin-thumb/admin-thumb';
import type { ProjectRow, MediaRow, ProjectImageRow } from './cms.models';
import { SECTORS, STAGES } from './cms.models';

type Editable = Partial<ProjectRow>;
interface GalleryItem { media: MediaRow; caption_es: string; caption_en: string; }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Component({
  selector: 'app-cms-proyecto-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, DragDropModule, MediaUploader, AdminThumb],
  templateUrl: './proyecto-editor.html',
  styleUrl: './admin-cms.scss',
})
export class ProyectoEditor {
  private cms = inject(CmsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly sectors = SECTORS;
  readonly stages = STAGES;

  readonly id = this.route.snapshot.queryParamMap.get('id');
  readonly isNew = !this.id;
  readonly p = signal<Editable>({ scope: [], location_es: '', location_en: '', summary_es: '', summary_en: '', body_es: '', body_en: '', featured: false, published: false, seo_title_es: '', seo_title_en: '', seo_description_es: '', seo_description_en: '' });
  readonly cover = signal<MediaRow | null>(null);
  readonly gallery = signal<GalleryItem[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly slugEdited = signal(false);
  private initial = '';
  private originalSlug = '';
  private originalPublished = false;

  readonly dirty = computed(() => JSON.stringify(this.snapshot()) !== this.initial);

  constructor() { this.load(); }

  // A12 — warn before losing unsaved edits (tab close / reload / external navigation).
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.dirty() && !this.saving()) { e.preventDefault(); e.returnValue = ''; }
  }

  private snapshot() {
    return { p: this.p(), cover: this.cover()?.id ?? null, gallery: this.gallery().map((g) => [g.media.id, g.caption_es, g.caption_en]) };
  }

  async load(): Promise<void> {
    try {
      if (!this.isNew) {
        const row = await this.cms.get<ProjectRow>('projects', this.id!);
        if (!row) { this.error.set('Proyecto no encontrado.'); return; }
        this.p.set(row);
        this.slugEdited.set(true);
        this.originalSlug = row.slug;
        this.originalPublished = !!row.published;
        const media = await this.cms.listMedia();
        const byId = Object.fromEntries(media.map((m) => [m.id, m]));
        if (row.cover_media_id) this.cover.set(byId[row.cover_media_id] ?? null);
        const imgs = await this.cms.projectImages(row.id);
        this.gallery.set(imgs.map((i: ProjectImageRow & { media: MediaRow }) => ({ media: i.media, caption_es: i.caption_es, caption_en: i.caption_en })));
      }
      this.initial = JSON.stringify(this.snapshot());
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  onNameInput(v: string): void {
    this.p.update((x) => ({ ...x, name: v }));
    if (this.isNew && !this.slugEdited()) this.p.update((x) => ({ ...x, slug: slugify(v) }));
  }
  onSlugInput(v: string): void { this.slugEdited.set(true); this.p.update((x) => ({ ...x, slug: slugify(v) })); }
  setField<K extends keyof ProjectRow>(k: K, v: ProjectRow[K]): void { this.p.update((x) => ({ ...x, [k]: v })); }
  toggleScope(id: string): void {
    const s = new Set(this.p().scope ?? []);
    s.has(id) ? s.delete(id) : s.add(id);
    this.p.update((x) => ({ ...x, scope: [...s] }));
  }
  hasScope(id: string): boolean { return (this.p().scope ?? []).includes(id); }

  onCoverUploaded(m: MediaRow): void { this.cover.set(m); }
  onGalleryUploaded(m: MediaRow): void { this.gallery.update((g) => [...g, { media: m, caption_es: m.alt_es, caption_en: m.alt_en }]); }
  removeGallery(i: number): void { this.gallery.update((g) => g.filter((_, idx) => idx !== i)); }
  galleryDrop(e: CdkDragDrop<GalleryItem[]>): void { const next = [...this.gallery()]; moveItemInArray(next, e.previousIndex, e.currentIndex); this.gallery.set(next); }
  makeCover(i: number): void {
    const g = [...this.gallery()];
    const [item] = g.splice(i, 1);
    const old = this.cover();
    this.cover.set(item.media);
    if (old) g.unshift({ media: old, caption_es: old.alt_es, caption_en: old.alt_en });
    this.gallery.set(g);
  }

  private validate(): string | null {
    const p = this.p();
    if (!p.name?.trim()) return 'El nombre es obligatorio.';
    if (!p.slug?.trim()) return 'El slug es obligatorio.';
    if (!p.sector_key) return 'Elige un sector.';
    if (!p.status) return 'Elige el estado (ejecutado / en ejecución).';
    if (!p.summary_es?.trim() || !p.summary_en?.trim()) return 'El resumen es obligatorio en ES y EN.';
    if (p.published && !this.cover()) return 'Un proyecto publicado necesita una portada.';
    if (p.published && this.cover() && (!this.cover()!.alt_es || !this.cover()!.alt_en)) return 'La portada necesita texto alternativo en ES y EN.';
    return null;
  }

  async save(): Promise<void> {
    const v = this.validate();
    if (v) { this.error.set(v); return; }
    this.saving.set(true);
    this.error.set(null);
    try {
      const p = this.p();
      const row: Editable = {
        ...(this.isNew ? {} : { id: this.id! }),
        slug: p.slug, name: p.name, client_name: p.client_name ?? null, sector_key: p.sector_key,
        location_es: p.location_es ?? '', location_en: p.location_en ?? '', year: p.year ?? null, status: p.status,
        summary_es: p.summary_es ?? '', summary_en: p.summary_en ?? '', body_es: p.body_es ?? '', body_en: p.body_en ?? '',
        scope: p.scope ?? [], cover_media_id: this.cover()?.id ?? null, featured: !!p.featured, published: !!p.published,
        seo_title_es: p.seo_title_es ?? '', seo_title_en: p.seo_title_en ?? '', seo_description_es: p.seo_description_es ?? '', seo_description_en: p.seo_description_en ?? '',
      };
      const saved = await this.cms.upsert<Editable>('projects', row);
      await this.cms.setGallery(saved.id!, this.gallery().map((g) => ({ media_id: g.media.id, caption_es: g.caption_es, caption_en: g.caption_en })));
      // A published project that changed slug keeps its old URL alive (301 stub, both languages).
      if (!this.isNew && this.originalPublished && this.originalSlug && saved.slug && this.originalSlug !== saved.slug) {
        try { await this.cms.recordSlugRedirect('proyectos', this.originalSlug, saved.slug); } catch { /* non-fatal */ }
      }
      this.originalSlug = saved.slug ?? this.originalSlug;
      this.originalPublished = !!row.published;
      this.initial = JSON.stringify(this.snapshot());
      this.router.navigate(['/admin/contenido/proyectos']);
    } catch (e) {
      const msg = (e as Error).message;
      this.error.set(/duplicate key|unique/i.test(msg) ? 'Ese slug ya existe. Elige otro.' : 'No se pudo guardar. ' + msg);
    } finally {
      this.saving.set(false);
    }
  }

  coverUrl(): string | null { return this.cover() ? this.cms.thumbUrl(this.cover()!.path, 480) : null; }
  galleryUrl(m: MediaRow): string { return this.cms.thumbUrl(m.path, 240); }

  private ext(path: string): string { return (path.split('.').pop() || 'jpg').toLowerCase(); }
  coverDownloadUrl(): string | null {
    const c = this.cover(); if (!c) return null;
    return this.cms.downloadUrl(c.path, `${this.p().slug || 'proyecto'}-portada.${this.ext(c.path)}`);
  }
  galleryDownloadUrl(m: MediaRow, i: number): string {
    return this.cms.downloadUrl(m.path, `${this.p().slug || 'proyecto'}-${i + 1}.${this.ext(m.path)}`);
  }
}
