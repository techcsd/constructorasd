import { ChangeDetectionStrategy, Component, DOCUMENT, computed, effect, inject, input } from '@angular/core';
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

  // Blur-up: paint the tiny LQIP (a webp data-URI) as the <picture> background so there's a blurred
  // preview while the real image loads — then the opaque <img> covers it. No JS, no extra request.
  readonly lqipBg = computed(() => {
    const e = this.entry();
    return e?.lqip ? `url("${e.lqip}")` : null;
  });

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

  // Preload a priority (LCP) image so the browser starts fetching it before the component renders.
  // Runs during prerender too → the <link rel=preload> lands in the static HTML head. Improves LCP.
  private doc = inject<Document>(DOCUMENT);
  private preloaded = false;
  private preloadEffect = effect(() => {
    const e = this.entry();
    if (!this.priority() || !e || this.preloaded) return;
    this.preloaded = true;
    const id = `preload-${this.image()}`.replace(/[^a-z0-9-]/gi, '-');
    if (this.doc.getElementById(id)) return;
    const link = this.doc.createElement('link');
    link.id = id;
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'image');
    link.setAttribute('type', 'image/avif');
    link.setAttribute('imagesrcset', this.avifSrcset());
    link.setAttribute('imagesizes', this.sizes());
    link.setAttribute('fetchpriority', 'high');
    this.doc.head.appendChild(link);
  });
}
