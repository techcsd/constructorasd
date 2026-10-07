import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CmsService } from './cms.service';
import { MediaUploader } from '../ui/media-uploader/media-uploader';
import { AdminThumb } from '../ui/admin-thumb/admin-thumb';
import type { ClientRow, MediaRow } from './cms.models';
import { CLIENT_GROUPS } from './cms.models';

type Editable = Partial<ClientRow>;
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Component({
  selector: 'app-cms-cliente-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MediaUploader, AdminThumb],
  templateUrl: './cliente-editor.html',
  styleUrl: './admin-cms.scss',
})
export class ClienteEditor {
  private cms = inject(CmsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly groups = CLIENT_GROUPS;

  readonly id = this.route.snapshot.queryParamMap.get('id');
  readonly isNew = !this.id;
  readonly c = signal<Editable>({ group_key: 'promotores', published: true });
  readonly logo = signal<MediaRow | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  private slugEdited = false;

  constructor() { this.load(); }
  async load(): Promise<void> {
    try {
      if (!this.isNew) {
        const row = await this.cms.get<ClientRow>('clients', this.id!);
        if (!row) { this.error.set('Cliente no encontrado.'); return; }
        this.c.set(row); this.slugEdited = true;
        if (row.logo_media_id) { const m = await this.cms.listMedia(); this.logo.set(m.find((x) => x.id === row.logo_media_id) ?? null); }
      }
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  onName(v: string): void { this.c.update((x) => ({ ...x, name: v })); if (this.isNew && !this.slugEdited) this.c.update((x) => ({ ...x, slug: slugify(v) })); }
  onSlug(v: string): void { this.slugEdited = true; this.c.update((x) => ({ ...x, slug: slugify(v) })); }
  set<K extends keyof ClientRow>(k: K, v: ClientRow[K]): void { this.c.update((x) => ({ ...x, [k]: v })); }
  onLogo(m: MediaRow): void { this.logo.set(m); }
  logoUrl(): string | null { return this.logo() ? this.cms.thumbUrl(this.logo()!.path, 240) : null; }

  async save(): Promise<void> {
    const c = this.c();
    if (!c.name?.trim()) { this.error.set('El nombre es obligatorio.'); return; }
    if (!c.slug?.trim()) { this.error.set('El slug es obligatorio.'); return; }
    this.saving.set(true); this.error.set(null);
    try {
      const row: Editable = { ...(this.isNew ? {} : { id: this.id! }), slug: c.slug, name: c.name, group_key: c.group_key, logo_media_id: this.logo()?.id ?? null, published: !!c.published };
      await this.cms.upsert<Editable>('clients', row);
      this.router.navigate(['/admin/contenido/clientes']);
    } catch (e) {
      const msg = (e as Error).message;
      this.error.set(/duplicate|unique/i.test(msg) ? 'Ese slug ya existe.' : 'No se pudo guardar. ' + msg);
    } finally { this.saving.set(false); }
  }
}
