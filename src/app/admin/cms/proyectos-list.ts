import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CmsService } from './cms.service';
import { AdminThumb } from '../ui/admin-thumb/admin-thumb';
import type { ProjectRow, MediaRow } from './cms.models';
import { SECTORS } from './cms.models';

@Component({
  selector: 'app-cms-proyectos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DragDropModule, AdminThumb],
  templateUrl: './proyectos-list.html',
  styleUrl: './admin-cms.scss',
})
export class ProyectosList {
  private cms = inject(CmsService);

  readonly rows = signal<ProjectRow[]>([]);
  readonly mediaById = signal<Record<string, MediaRow>>({});
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly showTrash = signal(false);
  readonly trash = signal<ProjectRow[]>([]);

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.rows().filter((p) => !q || p.name.toLowerCase().includes(q) || (p.client_name ?? '').toLowerCase().includes(q));
  });

  constructor() { this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [rows, media] = await Promise.all([this.cms.list<ProjectRow>('projects'), this.cms.listMedia()]);
      this.rows.set(rows);
      this.mediaById.set(Object.fromEntries(media.map((m) => [m.id, m])));
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  cover(p: ProjectRow): string | null {
    const m = p.cover_media_id ? this.mediaById()[p.cover_media_id] : null;
    return m ? this.cms.thumbUrl(m.path, 160) : null;
  }
  sectorLabel(key: string | null | undefined): string {
    return SECTORS.find((s) => s.key === key)?.label ?? '—';
  }

  async drop(e: CdkDragDrop<ProjectRow[]>): Promise<void> {
    if (e.previousIndex === e.currentIndex || this.query()) return; // reorder only on the unfiltered list
    const next = [...this.rows()];
    moveItemInArray(next, e.previousIndex, e.currentIndex);
    this.rows.set(next);
    try { await this.cms.reorder('projects', next.map((p) => p.id)); } catch (err) { this.error.set((err as Error).message); }
  }

  async togglePublished(p: ProjectRow): Promise<void> {
    const v = !p.published;
    try { await this.cms.setField('projects', p.id, { published: v }); p.published = v; this.rows.set([...this.rows()]); }
    catch (e) { this.error.set((e as Error).message); }
  }
  async toggleFeatured(p: ProjectRow): Promise<void> {
    const v = !p.featured;
    try { await this.cms.setField('projects', p.id, { featured: v }); p.featured = v; this.rows.set([...this.rows()]); }
    catch (e) { this.error.set((e as Error).message); }
  }

  async remove(p: ProjectRow): Promise<void> {
    if (!confirm(`¿Enviar "${p.name}" a la papelera? Podrás restaurarlo 30 días.`)) return;
    try { await this.cms.softDelete('projects', p.id); this.rows.set(this.rows().filter((x) => x.id !== p.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }

  async toggleTrash(): Promise<void> {
    this.showTrash.set(!this.showTrash());
    if (this.showTrash()) this.trash.set(await this.cms.listDeleted<ProjectRow>('projects'));
  }
  async restore(p: ProjectRow): Promise<void> {
    try { await this.cms.restore('projects', p.id); this.trash.set(this.trash().filter((x) => x.id !== p.id)); await this.load(); }
    catch (e) { this.error.set((e as Error).message); }
  }
}
