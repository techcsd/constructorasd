import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ImageFigure } from '../image-figure/image-figure';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

export interface GalleryImage {
  src: string;
  alt: string;
  /** Crop centre 0..1 from the admin focal picker. */
  focal?: { x: number; y: number };
}

const CAP = 12; // photos shown before "Ver todas"

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

  readonly expanded = signal(false);
  /**
   * Layout so the grid never ends on an orphan row (WP2). Desktop = 3 columns with the first photo featured
   * (2×2); mobile = 2 columns with the first photo spanning the row. Collapsed: show ≤12, trimmed to a full
   * last row at each breakpoint. Expanded: show everything and stretch the last photo over the remainder.
   */
  readonly layout = computed(() => {
    const n = this.images().length;
    const ex = this.expanded();
    const base = ex ? n : Math.min(n, CAP);
    const fd = base >= 3; // featured on desktop
    const fm = base >= 2; // featured on mobile
    const r = base - 1;
    let visD = base;
    let visM = base;
    if (!ex) {
      visD = fd ? 1 + r - ((((r - 2) % 3) + 3) % 3) : base;
      visM = fm ? 1 + r - (r % 2) : base;
    }
    let spanD = 1;
    let spanM = 1;
    if (ex) {
      const cellsD = fd ? 4 + r : n;
      const remD = cellsD % 3;
      spanD = remD ? 1 + (3 - remD) : 1;
      const cellsM = fm ? 2 + r : n;
      spanM = cellsM % 2 ? 2 : 1;
    }
    return { base, fd, fm, visD, visM, spanD, spanM, hasMore: !ex && n > Math.min(visD, visM) };
  });

  private touchX = 0;
  private opener: HTMLElement | null = null;
  private lightbox = viewChild<ElementRef<HTMLElement>>('lightbox');

  showAll(): void {
    this.expanded.set(true);
  }

  open(i: number): void {
    if (typeof document !== 'undefined') {
      this.opener = document.activeElement as HTMLElement | null; // the thumbnail — restore focus on close
      document.body.style.overflow = 'hidden';
    }
    this.openIndex.set(i);
    queueMicrotask(() =>
      this.lightbox()?.nativeElement.querySelector<HTMLElement>('.gallery__close')?.focus(),
    );
  }
  close(): void {
    this.openIndex.set(-1);
    if (typeof document !== 'undefined') document.body.style.overflow = '';
    this.opener?.focus();
    this.opener = null;
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

  // Keep Tab inside the open lightbox (modal focus trap).
  onLightboxKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const panel = this.lightbox()?.nativeElement;
    if (!panel) return;
    const f = panel.querySelectorAll<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
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
