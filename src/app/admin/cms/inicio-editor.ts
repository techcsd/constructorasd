import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../content.service';
import { CmsService } from './cms.service';
import { MediaUploader } from '../ui/media-uploader/media-uploader';
import { AdminThumb } from '../ui/admin-thumb/admin-thumb';
import type { MediaRow } from './cms.models';
import { HOME } from '../../../content/home';
import type { HomeContent } from '../../../content/types';

/**
 * "Inicio" editor (WL2/WL3/WN1) — a structured form over web.site_content.home. Defaults come from the
 * committed TS seed (so it opens with the current site values) and the DB override wins when present.
 */
@Component({
  selector: 'app-cms-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule, MediaUploader, AdminThumb],
  templateUrl: './inicio-editor.html',
  styleUrl: './admin-cms.scss',
})
export class InicioEditor {
  private content = inject(ContentService);
  private cms = inject(CmsService);

  model: HomeContent = structuredClone(HOME);
  readonly heroMedia = signal<MediaRow | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  // Internal routes offered by the link pickers (external URLs are typed free-form).
  readonly routes = ['proyectos', 'contacto', 'empresa', 'servicios', 'clientes', 'noticias', 'vacantes'];

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const rows = await this.content.list();
      const h = rows.find((r) => r.key === 'home')?.data as HomeContent | undefined;
      if (h) this.model = { ...structuredClone(HOME), ...h };
      if (this.model.hero.mediaId) {
        const media = await this.cms.listMedia();
        this.heroMedia.set(media.find((m) => m.id === this.model.hero.mediaId) ?? null);
      }
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }

  trackByIndex(i: number): number { return i; }
  setFeaturedIds(csv: string): void { this.model.featuredProjects.ids = csv.split(',').map((s) => s.trim()).filter(Boolean); }

  // Hero media
  onHeroMedia(m: MediaRow): void {
    this.heroMedia.set(m);
    this.model.hero.mediaId = m.id;
    if (!this.model.hero.alt.es) this.model.hero.alt.es = m.alt_es ?? '';
    if (!this.model.hero.alt.en) this.model.hero.alt.en = m.alt_en ?? '';
  }
  clearHero(): void { this.heroMedia.set(null); this.model.hero.mediaId = null; }
  heroThumb(): string | null { return this.heroMedia() ? this.cms.thumbUrl(this.heroMedia()!.path, 480) : null; }
  heroDownload(): string | null { return this.heroMedia() ? this.cms.downloadUrl(this.heroMedia()!.path, 'hero-inicio.jpg') : null; }

  // Stats
  addStat(): void { this.model.stats.push({ value: '', suffix: '', label: { es: '', en: '' } }); }
  removeStat(i: number): void { this.model.stats.splice(i, 1); }
  moveStat(i: number, d: number): void {
    const j = i + d; const s = this.model.stats;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
  }

  // Advantages
  addAdvantage(): void { this.model.advantages.push({ title: { es: '', en: '' }, text: { es: '', en: '' } }); }
  removeAdvantage(i: number): void { this.model.advantages.splice(i, 1); }

  private validate(): string | null {
    const h = this.model.hero;
    if (!h.title.es.trim() || !h.title.en.trim()) return 'El título del hero es obligatorio en ES y EN.';
    if (h.emphasis.es.trim() && !h.title.es.includes(h.emphasis.es.trim())) return 'La palabra enfatizada (ES) debe aparecer dentro del título (ES).';
    if (h.emphasis.en.trim() && !h.title.en.includes(h.emphasis.en.trim())) return 'La palabra enfatizada (EN) debe aparecer dentro del título (EN).';
    if (h.mediaId && (!h.alt.es.trim() || !h.alt.en.trim())) return 'La imagen del hero necesita texto alternativo en ES y EN.';
    if (this.model.stats.length < 3) return 'Se necesitan al menos 3 números (stats).';
    return null;
  }

  async save(): Promise<void> {
    const v = this.validate();
    if (v) { this.error.set(v); this.saved.set(false); return; }
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try {
      this.model.stats = this.model.stats.filter((s) => s.value.trim() || s.label.es.trim());
      this.model.advantages = this.model.advantages.filter((a) => a.title.es.trim() || a.text.es.trim());
      await this.content.save('home', this.model);
      this.saved.set(true);
    } catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
