import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ImageFigure } from '../image-figure/image-figure';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

export interface GalleryImage {
  src: string;
  alt: string;
}

/**
 * Gallery + lightbox (DESIGN-BRIEF §7). Thumbnail grid that opens a full-screen lightbox with
 * keyboard (←/→/Esc) and touch-swipe navigation. No third-party library (own component).
 */
@Component({
  selector: 'app-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageFigure, Icon, TPipe],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class Gallery {
  readonly images = input.required<GalleryImage[]>();

  readonly openIndex = signal(-1);
  readonly isOpen = computed(() => this.openIndex() >= 0);
  readonly current = computed(() => this.images()[this.openIndex()]);
  readonly count = computed(() => this.images().length);

  private touchX = 0;

  open(i: number): void {
    this.openIndex.set(i);
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }
  close(): void {
    this.openIndex.set(-1);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }
  next(): void {
    if (!this.isOpen()) return;
    this.openIndex.set((this.openIndex() + 1) % this.count());
  }
  prev(): void {
    if (!this.isOpen()) return;
    this.openIndex.set((this.openIndex() - 1 + this.count()) % this.count());
  }

  onKey(e: KeyboardEvent): void {
    if (!this.isOpen()) return;
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.next();
    else if (e.key === 'ArrowLeft') this.prev();
  }

  onTouchStart(e: TouchEvent): void {
    this.touchX = e.changedTouches[0].clientX;
  }
  onTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) this.next();
      else this.prev();
    }
  }
}
