import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentSection, ContentService } from '../content.service';

const LABELS: Record<string, string> = {
  company: 'Empresa (textos, misión, stats…)',
  projects: 'Proyectos',
  clients: 'Clientes',
  sectors: 'Sectores',
  stages: 'Etapas / Servicios',
  equipment: 'Equipos',
  formwork: 'Sistemas de encofrado',
  jobs: 'Vacantes',
  posts: 'Noticias',
  page_meta: 'Títulos de páginas (hero, metadatos)',
};

@Component({
  selector: 'app-admin-contenido',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './contenido-page.html',
  styleUrl: './admin.scss',
})
export class ContenidoPage {
  private svc = inject(ContentService);

  readonly sections = signal<ContentSection[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly editKey = signal<string | null>(null);
  readonly json = signal('');
  readonly saving = signal(false);

  readonly dirty = signal(false); // edited since the last publish
  readonly publishing = signal(false);
  readonly published = signal(false);

  label(k: string): string {
    return LABELS[k] ?? k;
  }

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.sections.set(await this.svc.list());
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  edit(s: ContentSection): void {
    this.editKey.set(s.key);
    this.json.set(JSON.stringify(s.data, null, 2));
    this.error.set(null);
  }

  cancel(): void {
    this.editKey.set(null);
    this.error.set(null);
  }

  async save(): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.json());
    } catch (e) {
      this.error.set('JSON inválido: ' + (e as Error).message);
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.svc.save(this.editKey()!, parsed);
      this.dirty.set(true);
      this.published.set(false);
      this.editKey.set(null);
      await this.load();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  async publish(): Promise<void> {
    this.publishing.set(true);
    this.error.set(null);
    const err = await this.svc.publish();
    this.publishing.set(false);
    if (err) this.error.set('No se pudo publicar — ' + err);
    else {
      this.published.set(true);
      this.dirty.set(false);
    }
  }

  fmt(iso: string): string {
    return new Date(iso).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
