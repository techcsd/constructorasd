import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../content.service';

interface L { es: string; en: string }
interface Sector { id: string; name: L; blurb: L; projects?: string[] }

/** Form over site_content.sectors (WJ4) — ids are fixed; edit name + blurb. */
@Component({
  selector: 'app-cms-sectores',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './sectores-editor.html',
  styleUrl: './admin-cms.scss',
})
export class SectoresEditor {
  private content = inject(ContentService);
  items: Sector[] = [];
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const rows = await this.content.list();
      this.items = ((rows.find((r) => r.key === 'sectors')?.data as Sector[]) ?? []).map((s) => ({ id: s.id, name: { es: s.name?.es ?? '', en: s.name?.en ?? '' }, blurb: { es: s.blurb?.es ?? '', en: s.blurb?.en ?? '' }, projects: s.projects ?? [] }));
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  trackById(i: number, s: Sector): string { return s.id; }

  async save(): Promise<void> {
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try { await this.content.save('sectors', this.items); this.saved.set(true); }
    catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
