import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CmsService } from './cms.service';
import type { ClientRow, MediaRow } from './cms.models';
import { CLIENT_GROUPS } from './cms.models';

@Component({
  selector: 'app-cms-clientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DragDropModule],
  templateUrl: './clientes-list.html',
  styleUrl: './admin-cms.scss',
})
export class ClientesList {
  private cms = inject(CmsService);
  readonly rows = signal<ClientRow[]>([]);
  readonly mediaById = signal<Record<string, MediaRow>>({});
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly groups = CLIENT_GROUPS;

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.rows().filter((c) => !q || c.name.toLowerCase().includes(q));
  });

  constructor() { this.load(); }
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [rows, media] = await Promise.all([this.cms.list<ClientRow>('clients'), this.cms.listMedia()]);
      this.rows.set(rows);
      this.mediaById.set(Object.fromEntries(media.map((m) => [m.id, m])));
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  logo(c: ClientRow): string | null {
    const m = c.logo_media_id ? this.mediaById()[c.logo_media_id] : null;
    return m ? this.cms.thumbUrl(m.path, 120) : null;
  }
  groupLabel(k: string): string { return this.groups.find((g) => g.key === k)?.label ?? k; }

  async drop(e: CdkDragDrop<ClientRow[]>): Promise<void> {
    if (e.previousIndex === e.currentIndex || this.query()) return;
    const next = [...this.rows()]; moveItemInArray(next, e.previousIndex, e.currentIndex); this.rows.set(next);
    try { await this.cms.reorder('clients', next.map((c) => c.id)); } catch (err) { this.error.set((err as Error).message); }
  }
  async togglePublished(c: ClientRow): Promise<void> {
    try { await this.cms.setField('clients', c.id, { published: !c.published }); c.published = !c.published; this.rows.set([...this.rows()]); }
    catch (e) { this.error.set((e as Error).message); }
  }
  async remove(c: ClientRow): Promise<void> {
    if (!confirm(`¿Eliminar "${c.name}"?`)) return;
    try { await this.cms.softDelete('clients', c.id); this.rows.set(this.rows().filter((x) => x.id !== c.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }
}
