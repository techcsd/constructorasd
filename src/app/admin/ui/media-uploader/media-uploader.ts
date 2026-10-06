import { ChangeDetectionStrategy, Component, output, input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../cms/cms.service';
import type { MediaRow } from '../../cms/cms.models';

interface Pending {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  sha256: string;
  altEs: string;
  altEn: string;
  error: string | null;
  warn: string | null;
  uploading: boolean;
}

const MAX_BYTES = 15 * 1024 * 1024;
const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

/**
 * Drag-and-drop / click uploader for web-media (WJ2). Client-side validation (type, ≤15 MB, width ≥1200
 * with a warning under 1600), requires alt ES/EN before upload, then creates the web.media row and emits
 * it. One file (cover) or many (gallery) via `multiple`.
 */
@Component({
  selector: 'app-media-uploader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './media-uploader.html',
  styleUrl: './media-uploader.scss',
})
export class MediaUploader {
  readonly multiple = input(false);
  readonly label = input('Subir imagen');
  readonly uploaded = output<MediaRow>();

  private cms = inject(CmsService);
  readonly pending = signal<Pending[]>([]);
  readonly dragOver = signal(false);

  async onFiles(files: FileList | null): Promise<void> {
    if (!files) return;
    const list = this.multiple() ? Array.from(files) : [files[0]];
    for (const file of list) {
      if (!file) continue;
      const p: Pending = { file, previewUrl: URL.createObjectURL(file), width: 0, height: 0, sha256: '', altEs: '', altEn: '', error: null, warn: null, uploading: false };
      if (!OK_MIME.has(file.type)) p.error = 'Formato no válido (usa JPG, PNG, WebP o SVG).';
      else if (file.size > MAX_BYTES) p.error = 'El archivo supera los 15 MB.';
      if (!p.error && file.type !== 'image/svg+xml') {
        try {
          const dim = await this.dimensions(p.previewUrl);
          p.width = dim.w; p.height = dim.h;
          if (dim.w < 1200) p.error = `Ancho mínimo 1200 px (esta tiene ${dim.w} px).`;
          else if (dim.w < 1600) p.warn = `Recomendado ≥ 1600 px (esta tiene ${dim.w} px).`;
        } catch { /* ignore */ }
      }
      if (!p.error) p.sha256 = await this.sha256(file);
      this.pending.update((q) => [...q, p]);
    }
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(false);
    void this.onFiles(e.dataTransfer?.files ?? null);
  }

  remove(p: Pending): void {
    URL.revokeObjectURL(p.previewUrl);
    this.pending.update((q) => q.filter((x) => x !== p));
  }

  canUpload(p: Pending): boolean {
    return !p.error && !p.uploading && !!p.altEs.trim() && !!p.altEn.trim();
  }

  async upload(p: Pending): Promise<void> {
    if (!this.canUpload(p)) return;
    p.uploading = true;
    this.pending.update((q) => [...q]);
    try {
      const media = await this.cms.uploadMedia(p.file, { es: p.altEs.trim(), en: p.altEn.trim() }, { width: p.width, height: p.height }, p.sha256);
      this.uploaded.emit(media);
      this.remove(p);
    } catch (e) {
      p.error = (e as Error).message;
      p.uploading = false;
      this.pending.update((q) => [...q]);
    }
  }

  private dimensions(url: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
  }

  private async sha256(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
