import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * appReveal — fade + 12px rise on first scroll into view (DESIGN-BRIEF §5).
 * SSR-safe: `afterNextRender` runs browser-only, so prerendered HTML is fully visible without JS.
 * Respects `prefers-reduced-motion` (the CSS does the actual hiding only when motion is allowed).
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: { '[attr.data-reveal]': '""' },
})
export class RevealDirective {
  private el = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;
      const reduce =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || typeof IntersectionObserver === 'undefined') {
        node.classList.add('is-revealed');
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add('is-revealed');
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      );
      io.observe(node);
    });
  }
}
