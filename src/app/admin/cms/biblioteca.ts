import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CmsService } from './cms.service';
import { MediaUploader } from '../ui/media-uploader/media-uploader';
import type { MediaRow } from './cms.models';

/** Biblioteca de medios (WJ2 §2): lista, búsqueda, conteo de uso y borrado solo si no se usa. */
@Component({
  selector: 'app-cms-biblioteca',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MediaUploader],
  templateUrl: './biblioteca.html',
  styleUrl: './admin-cms.scss',
})
export class Biblioteca {
  private cms = inject(CmsService);
  readonly media = signal<MediaRow[]>([]);
  readonly usage = signal<Record<string, number>>({});
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.media().filter((m) => !q || (m.original_name ?? '').toLowerCase().includes(q) || m.alt_es.toLowerCase().includes(q) || m.alt_en.toLowerCase().includes(q));
  });

  constructor() { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [media, usage] = await Promise.all([this.cms.listMedia(), this.cms.mediaUsage()]);
      this.media.set(media);
      this.usage.set(usage);
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  url(m: MediaRow): string { return this.cms.thumbUrl(m.path, 320); }
  uses(m: MediaRow): number { return this.usage()[m.id] ?? 0; }

  onUploaded(): void { void this.load(); }

  async remove(m: MediaRow): Promise<void> {
    if (this.uses(m) > 0) { this.error.set('No se puede borrar: la imagen se está usando.'); return; }
    if (!confirm('¿Borrar esta imagen de la biblioteca?')) return;
    try { await this.cms.softDelete('media', m.id); this.media.set(this.media().filter((x) => x.id !== m.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }
}
