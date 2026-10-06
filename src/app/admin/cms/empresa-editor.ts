import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../content.service';

interface L { es: string; en: string }
interface Office { city: L; query: string; addressLine?: L; directionsUrl: string }
interface Stat { value: string; label: L }
interface Advantage { title: L; text: L }
interface Company {
  name: string; shortName: string; tagline: L; description: L; mission: L; vision: L;
  values: L[]; philosophyQuote: L; philosophyAttribution: L; stats: Stat[]; advantages: Advantage[];
  phones: string[]; email: string; instagram: string; whatsapp: string; presence: L; founded?: number;
  offices?: Office[];
}

const EMPTY_L = (): L => ({ es: '', en: '' });

/** Structured form over web.site_content.company (WJ4) — replaces hand-editing the JSON. */
@Component({
  selector: 'app-cms-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './empresa-editor.html',
  styleUrl: './admin-cms.scss',
})
export class EmpresaEditor {
  private content = inject(ContentService);
  model: Company = { name: '', shortName: '', tagline: EMPTY_L(), description: EMPTY_L(), mission: EMPTY_L(), vision: EMPTY_L(), values: [], philosophyQuote: EMPTY_L(), philosophyAttribution: EMPTY_L(), stats: [], advantages: [], phones: [], email: '', instagram: '', whatsapp: '', presence: EMPTY_L(), offices: [] };
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const rows = await this.content.list();
      const c = rows.find((r) => r.key === 'company')?.data as Company | undefined;
      if (c) this.model = { ...this.model, ...c, values: c.values ?? [], stats: c.stats ?? [], advantages: c.advantages ?? [], phones: c.phones ?? [], offices: c.offices ?? [] };
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }

  addValue(): void { this.model.values.push(EMPTY_L()); }
  removeValue(i: number): void { this.model.values.splice(i, 1); }
  addPhone(): void { this.model.phones.push(''); }
  removePhone(i: number): void { this.model.phones.splice(i, 1); }
  trackByIndex(i: number): number { return i; }
  addStat(): void { this.model.stats.push({ value: '', label: EMPTY_L() }); }
  removeStat(i: number): void { this.model.stats.splice(i, 1); }
  addAdvantage(): void { this.model.advantages.push({ title: EMPTY_L(), text: EMPTY_L() }); }
  removeAdvantage(i: number): void { this.model.advantages.splice(i, 1); }
  addOffice(): void { (this.model.offices ??= []).push({ city: EMPTY_L(), query: '', addressLine: EMPTY_L(), directionsUrl: '' }); }
  removeOffice(i: number): void { this.model.offices?.splice(i, 1); }

  async save(): Promise<void> {
    if (!this.model.name.trim()) { this.error.set('El nombre de la empresa es obligatorio.'); return; }
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try {
      // drop empty array rows before saving
      this.model.phones = this.model.phones.filter((p) => p.trim());
      this.model.values = this.model.values.filter((v) => v.es.trim() || v.en.trim());
      await this.content.save('company', this.model);
      this.saved.set(true);
    } catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
