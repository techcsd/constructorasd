import { Directive, ElementRef, afterNextRender, inject, DestroyRef } from '@angular/core';

/**
 * appReveal — fade + 12px rise on first scroll into view (DESIGN-BRIEF §5, rewritten per WF5).
 *
 * Fixes WE2 (content left invisible): anything already inside the viewport on init is revealed
 * immediately (no observer round-trip); everything else is observed with a 0.01 threshold so even a
 * single visible pixel triggers it (the old 0.12 threshold never fired for sections taller than the
 * viewport). A 1200 ms failsafe guarantees the revealed state regardless of observer quirks, and a
 * fresh directive instance is created on every navigation (afterNextRender re-runs), so routes re-arm.
 *
 * SSR-safe: `afterNextRender` runs browser-only; prerendered HTML is fully visible without JS, and the
 * CSS only hides elements when motion is allowed.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: { '[attr.data-reveal]': '""' },
})
export class RevealDirective {
  private el = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;
      const reveal = () => node.classList.add('is-revealed');

      const reduce =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || typeof IntersectionObserver === 'undefined') {
        reveal();
        return;
      }

      // Already (partly) in view on load → reveal synchronously, before the first paint settles.
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh && rect.bottom > 0) {
        reveal();
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
        { threshold: 0.01, rootMargin: '0px 0px -5% 0px' },
      );
      io.observe(node);

      // Failsafe — never leave content stuck hidden (WF5).
      const failsafe = setTimeout(reveal, 1200);
      this.destroyRef.onDestroy(() => {
        clearTimeout(failsafe);
        io.disconnect();
      });
    });
  }
}
