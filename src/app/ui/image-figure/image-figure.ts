import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import manifestJson from '../../../content/image-manifest.json';

interface ImageEntry {
  hash: string;
  width: number;
  height: number;
  aspect: number;
  widths: number[];
  variants: { avif: Record<string, string>; webp: Record<string, string> };
  lqip: string;
}
const MANIFEST = manifestJson as unknown as Record<string, ImageEntry>;

/**
 * ImageFigure (DESIGN-BRIEF §6 / §8). Hand-rolled <picture> with AVIF + WebP srcset and a reserved
 * aspect-ratio (no CLS), plus a blurred LQIP. When the image key is absent from the manifest it renders
 * a neutral concrete placeholder with a thin label — never a stock/generated image (brief §1.7).
 * (Deviation from "NgOptimizedImage wrapper" noted in DESIGN-DECISIONS: a static <picture> gives the
 *  same AVIF/WebP srcset + reserved ratio without a custom image loader.)
 */
@Component({
  selector: 'app-image-figure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-figure.html',
  styleUrl: './image-figure.scss',
})
export class ImageFigure {
  readonly image = input<string>('');
  readonly alt = input.required<string>();
  /** CSS aspect-ratio, e.g. '16 / 10', '4 / 5', '3 / 2'. */
  readonly aspect = input<string>('3 / 2');
  readonly priority = input<boolean>(false);
  readonly caption = input<string>('');
  readonly sizes = input<string>('(min-width: 1024px) 50vw, 100vw');

  readonly entry = computed<ImageEntry | undefined>(() => MANIFEST[this.image()]);

  readonly avifSrcset = computed(() => this.buildSrcset('avif'));
  readonly webpSrcset = computed(() => this.buildSrcset('webp'));
  readonly fallbackSrc = computed(() => {
    const e = this.entry();
    if (!e) return '';
    const w = e.widths[e.widths.length - 1];
    return e.variants.webp[String(w)];
  });

  private buildSrcset(fmt: 'avif' | 'webp'): string {
    const e = this.entry();
    if (!e) return '';
    return e.widths.map((w) => `${e.variants[fmt][String(w)]} ${w}w`).join(', ');
  }
}
