import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../content.service';

interface L { es: string; en: string }
interface Equipment { index: number; name: L }

/** Form over site_content.equipment (WJ4). */
@Component({
  selector: 'app-cms-equipos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './equipos-editor.html',
  styleUrl: './admin-cms.scss',
})
export class EquiposEditor {
  private content = inject(ContentService);
  items: Equipment[] = [];
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const rows = await this.content.list();
      this.items = ((rows.find((r) => r.key === 'equipment')?.data as Equipment[]) ?? []).map((e) => ({ index: e.index, name: { es: e.name?.es ?? '', en: e.name?.en ?? '' } }));
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  add(): void { this.items.push({ index: this.items.length + 1, name: { es: '', en: '' } }); }
  removeAt(i: number): void { this.items.splice(i, 1); }
  trackByIndex(i: number): number { return i; }

  async save(): Promise<void> {
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try {
      const data = this.items.filter((e) => e.name.es.trim() || e.name.en.trim()).map((e, i) => ({ index: i + 1, name: e.name }));
      await this.content.save('equipment', data);
      this.saved.set(true);
    } catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
