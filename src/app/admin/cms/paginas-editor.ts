import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../content.service';

interface L { es: string; en: string }
interface PageMeta { eyebrow?: L; index?: string; h1?: L; emphasis?: L; lead?: L; title?: L; description?: L }

const E = (): L => ({ es: '', en: '' });

/** Form over site_content.page_meta (WJ4) — per-page hero texts + SEO title/description. */
@Component({
  selector: 'app-cms-paginas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './paginas-editor.html',
  styleUrl: './admin-cms.scss',
})
export class PaginasEditor {
  private content = inject(ContentService);
  pages: { key: string; meta: PageMeta }[] = [];
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const rows = await this.content.list();
      const data = (rows.find((r) => r.key === 'page_meta')?.data as Record<string, PageMeta>) ?? {};
      this.pages = Object.entries(data).map(([key, m]) => ({
        key,
        meta: { ...m, eyebrow: m.eyebrow ?? E(), h1: m.h1 ?? E(), emphasis: m.emphasis ?? E(), lead: m.lead ?? E(), title: m.title ?? E(), description: m.description ?? E() },
      }));
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  trackByKey(i: number, p: { key: string }): string { return p.key; }

  async save(): Promise<void> {
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try {
      const out: Record<string, PageMeta> = {};
      for (const p of this.pages) out[p.key] = p.meta;
      await this.content.save('page_meta', out);
      this.saved.set(true);
    } catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
