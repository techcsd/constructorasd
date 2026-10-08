import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * appHeroMotion (WL5/WN3) — starts Ken Burns on the hero photo only AFTER `load` (so the LCP image isn't
 * measured mid-transform) and pauses it while the tab is hidden. Browser-only (afterNextRender), SSR-safe,
 * and a no-op under reduced motion. The hero text stagger is a pure CSS auto-play animation (ends visible
 * even without JS), so this directive only owns the photo.
 */
@Directive({ selector: '[appHeroMotion]', standalone: true })
export class HeroMotion {
  private host = inject(ElementRef<HTMLElement>);

  constructor() {
    afterNextRender(() => {
      if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const media = this.host.nativeElement.querySelector('.home-hero__media');
      if (!media) return;
      const play = () => media.classList.add('is-playing');
      if (document.readyState === 'complete') play();
      else window.addEventListener('load', play, { once: true });
      document.addEventListener('visibilitychange', () => media.classList.toggle('is-paused', document.hidden));
    });
  }
}
