import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from './cms.service';
import type { PostRow } from './cms.models';

@Component({
  selector: 'app-cms-noticias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './noticias-list.html',
  styleUrl: './admin-cms.scss',
})
export class NoticiasList {
  private cms = inject(CmsService);
  readonly rows = signal<PostRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }
  async load(): Promise<void> {
    this.loading.set(true);
    try { this.rows.set(await this.cms.list<PostRow>('posts')); }
    catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  async togglePublished(p: PostRow): Promise<void> {
    try { await this.cms.setField('posts', p.id, { published: !p.published }); p.published = !p.published; this.rows.set([...this.rows()]); }
    catch (e) { this.error.set((e as Error).message); }
  }
  async remove(p: PostRow): Promise<void> {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try { await this.cms.softDelete('posts', p.id); this.rows.set(this.rows().filter((x) => x.id !== p.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }
  fmt(iso?: string | null): string { return iso ? new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
}
