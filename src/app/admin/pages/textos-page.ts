import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiStringsService, UiString } from '../ui-strings.service';
import enBase from '../../../content/i18n/en.json';
import esBase from '../../../content/i18n/es.json';

type Row = UiString & { _saved?: boolean };

/** "Textos del sitio" (WL6) — every UI string editable with search, "modificados" filter, inline autosave,
 *  reset-to-default and CSV. The key is the Spanish source text, so it's human-readable on its own. */
@Component({
  selector: 'app-admin-textos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './textos-page.html',
  styleUrl: './admin.scss',
})
export class TextosPage {
  private svc = inject(UiStringsService);
  private en = enBase as Record<string, string>;
  private es = esBase as Record<string, string>;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly all = signal<Row[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly onlyModified = signal(false);

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.all().filter((r) =>
      (!this.onlyModified() || this.isModified(r)) &&
      (!q || r.key.toLowerCase().includes(q) || (r.en ?? '').toLowerCase().includes(q) || (r.es ?? '').toLowerCase().includes(q)));
  });
  readonly modifiedCount = computed(() => this.all().filter((r) => this.isModified(r)).length);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      // Show the effective value so the field isn't blank; save only writes what the admin changes.
      this.all.set((await this.svc.list()).map((r) => ({ ...r, es: r.es ?? this.defaultEs(r), en: r.en ?? this.defaultEn(r) })));
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }

  defaultEs(r: Row): string { return this.es[r.key] ?? r.key; }
  defaultEn(r: Row): string { return this.en[r.key] ?? ''; }
  isModified(r: Row): boolean { return (r.es ?? '') !== this.defaultEs(r) || (r.en ?? '') !== this.defaultEn(r); }

  onEdit(r: Row): void {
    r._saved = false;
    clearTimeout(this.timers.get(r.key));
    this.timers.set(r.key, setTimeout(() => void this.save(r), 700));
  }
  async save(r: Row): Promise<void> {
    try { await this.svc.save(r.key, { es: r.es, en: r.en }); r._saved = true; this.all.set([...this.all()]); }
    catch (e) { this.error.set((e as Error).message); }
  }
  reset(r: Row): void {
    r.es = this.defaultEs(r);
    r.en = this.defaultEn(r);
    this.all.set([...this.all()]);
    void this.save(r);
  }

  exportCsv(): void {
    const esc = (s: unknown) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const lines = [['clave', 'es', 'en', 'modificado'].join(';'),
      ...this.all().map((r) => [r.key, r.es, r.en, this.isModified(r) ? 'sí' : ''].map(esc).join(';'))];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'textos-del-sitio.csv'; a.click();
  }
}
