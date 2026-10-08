import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * appCountUp (WN3) — animates a numeral from 0 to its value (expo.out, 900 ms) the first time it scrolls
 * into view, preserving any suffix ("45+" → counts 0…45 then "+"). Browser-only, SSR-safe (the prerendered
 * text is the final value), and a no-op under reduced motion or when there's no leading number.
 */
@Directive({ selector: '[appCountUp]', standalone: true })
export class CountUp {
  private el = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;
      if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (typeof IntersectionObserver === 'undefined' || typeof requestAnimationFrame === 'undefined') return;

      const raw = (node.textContent ?? '').trim();
      const m = /^(\d+)(.*)$/.exec(raw);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const suffix = m[2];
      if (!target) return;

      const run = () => {
        const dur = 900;
        const start = performance.now();
        const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
        node.textContent = '0' + suffix;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          node.textContent = Math.round(expoOut(t) * target) + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else node.textContent = target + suffix;
        };
        requestAnimationFrame(tick);
      };

      const io = new IntersectionObserver(
        (entries) => { for (const e of entries) if (e.isIntersecting) { run(); io.disconnect(); } },
        { threshold: 0.4 },
      );
      io.observe(node);
    });
  }
}
