import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from './cms.service';
import type { JobRow } from './cms.models';

@Component({
  selector: 'app-cms-vacantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './vacantes-list.html',
  styleUrl: './admin-cms.scss',
})
export class VacantesList {
  private cms = inject(CmsService);
  readonly rows = signal<JobRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }
  async load(): Promise<void> {
    this.loading.set(true);
    try { this.rows.set(await this.cms.list<JobRow>('jobs')); }
    catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  async toggle(j: JobRow, field: 'published' | 'open'): Promise<void> {
    const v = !j[field];
    try { await this.cms.setField('jobs', j.id, { [field]: v }); j[field] = v; this.rows.set([...this.rows()]); }
    catch (e) { this.error.set((e as Error).message); }
  }
  async remove(j: JobRow): Promise<void> {
    if (!confirm('¿Eliminar esta vacante?')) return;
    try { await this.cms.softDelete('jobs', j.id); this.rows.set(this.rows().filter((x) => x.id !== j.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }
}
