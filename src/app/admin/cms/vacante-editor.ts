import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CmsService } from './cms.service';
import type { JobRow } from './cms.models';

type Editable = Partial<JobRow>;
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Component({
  selector: 'app-cms-vacante-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './vacante-editor.html',
  styleUrl: './admin-cms.scss',
})
export class VacanteEditor {
  private cms = inject(CmsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly id = this.route.snapshot.queryParamMap.get('id');
  readonly isNew = !this.id;
  readonly j = signal<Editable>({ type: 'tiempo_completo', open: true, published: false, requirements_es: [], requirements_en: [] });
  readonly reqEs = signal('');
  readonly reqEn = signal('');
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
        const row = await this.cms.get<JobRow>('jobs', this.id!);
        if (!row) { this.error.set('Vacante no encontrada.'); return; }
        this.j.set(row); this.slugEdited = true;
        this.originalSlug = row.slug; this.originalPublished = !!row.published;
        this.reqEs.set((row.requirements_es ?? []).join('\n'));
        this.reqEn.set((row.requirements_en ?? []).join('\n'));
      }
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  onTitle(v: string): void { this.j.update((x) => ({ ...x, title_es: v })); if (this.isNew && !this.slugEdited) this.j.update((x) => ({ ...x, slug: slugify(v) })); }
  onSlug(v: string): void { this.slugEdited = true; this.j.update((x) => ({ ...x, slug: slugify(v) })); }
  set<K extends keyof JobRow>(k: K, v: JobRow[K]): void { this.j.update((x) => ({ ...x, [k]: v })); }

  async save(): Promise<void> {
    const j = this.j();
    if (!j.title_es?.trim() || !j.title_en?.trim()) { this.error.set('El título es obligatorio en ES y EN.'); return; }
    if (!j.slug?.trim()) { this.error.set('El slug es obligatorio.'); return; }
    this.saving.set(true); this.error.set(null);
    try {
      const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
      const row: Editable = {
        ...(this.isNew ? {} : { id: this.id! }), slug: j.slug, title_es: j.title_es, title_en: j.title_en,
        area_es: j.area_es ?? '', area_en: j.area_en ?? '', location_es: j.location_es ?? '', location_en: j.location_en ?? '',
        type: j.type, summary_es: j.summary_es ?? '', summary_en: j.summary_en ?? '',
        requirements_es: lines(this.reqEs()), requirements_en: lines(this.reqEn()),
        open: !!j.open, published: !!j.published, published_at: j.published_at || new Date().toISOString().slice(0, 10),
      };
      const saved = await this.cms.upsert<Editable>('jobs', row);
      if (!this.isNew && this.originalPublished && this.originalSlug && saved.slug && this.originalSlug !== saved.slug) {
        try { await this.cms.recordSlugRedirect('vacantes', this.originalSlug, saved.slug); } catch { /* non-fatal */ }
      }
      this.router.navigate(['/admin/contenido/vacantes']);
    } catch (e) {
      const msg = (e as Error).message;
      this.error.set(/duplicate|unique/i.test(msg) ? 'Ese slug ya existe.' : 'No se pudo guardar. ' + msg);
    } finally { this.saving.set(false); }
  }
}
