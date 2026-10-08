import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../content.service';
import { CmsService } from './cms.service';
import { MediaUploader } from '../ui/media-uploader/media-uploader';
import { AdminThumb } from '../ui/admin-thumb/admin-thumb';
import type { MediaRow } from './cms.models';
import { STAGES } from '../../../content/stages';

interface L { es: string; en: string }
interface Fact { label: L; value: string }
interface Stage { id: string; index: number; title: L; tagline: L; description: L; capabilities: L[]; images?: { src?: string; alt?: L }[]; coverMediaId?: string | null; facts?: Fact[]; note?: L }

const E = (): L => ({ es: '', en: '' });

/** Form over site_content.stages (WJ4/WL4) — texts, capabilities, facts, and a per-stage cover image. */
@Component({
  selector: 'app-cms-etapas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule, MediaUploader, AdminThumb],
  templateUrl: './etapas-editor.html',
  styleUrl: './admin-cms.scss',
})
export class EtapasEditor {
  private content = inject(ContentService);
  private cms = inject(CmsService);
  items: Stage[] = [];
  private media: MediaRow[] = [];
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const rows = await this.content.list();
      const src = (rows.find((r) => r.key === 'stages')?.data as Stage[] | undefined) ?? (STAGES as unknown as Stage[]);
      this.items = src.map((s) => ({
        ...s, title: s.title ?? E(), tagline: s.tagline ?? E(), description: s.description ?? E(),
        capabilities: (s.capabilities ?? []).map((c) => ({ es: c?.es ?? '', en: c?.en ?? '' })),
        facts: (s.facts ?? []).map((f) => ({ label: { es: f.label?.es ?? '', en: f.label?.en ?? '' }, value: f.value ?? '' })),
      }));
      try { this.media = await this.cms.listMedia(); } catch { this.media = []; }
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  trackById(i: number, s: Stage): string { return s.id; }
  addCap(s: Stage): void { s.capabilities.push(E()); }
  removeCap(s: Stage, i: number): void { s.capabilities.splice(i, 1); }
  addFact(s: Stage): void { (s.facts ??= []).push({ label: E(), value: '' }); }
  removeFact(s: Stage, i: number): void { s.facts?.splice(i, 1); }

  // Cover image (WL4)
  private mediaOf(s: Stage): MediaRow | undefined { return s.coverMediaId ? this.media.find((m) => m.id === s.coverMediaId) : undefined; }
  coverThumb(s: Stage): string | null { const m = this.mediaOf(s); return m ? this.cms.thumbUrl(m.path, 320) : null; }
  coverDownload(s: Stage): string | null { const m = this.mediaOf(s); return m ? this.cms.downloadUrl(m.path, `${s.id}.jpg`) : null; }
  onCover(s: Stage, m: MediaRow): void { s.coverMediaId = m.id; if (!this.media.find((x) => x.id === m.id)) this.media.push(m); }
  clearCover(s: Stage): void { s.coverMediaId = null; }

  async save(): Promise<void> {
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try {
      for (const s of this.items) {
        s.capabilities = s.capabilities.filter((c) => c.es.trim() || c.en.trim());
        s.facts = (s.facts ?? []).filter((f) => f.value.trim() || f.label.es.trim());
      }
      await this.content.save('stages', this.items);
      this.saved.set(true);
    } catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
