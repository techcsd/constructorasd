import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

/**
 * Admin thumbnail with a graceful load state: a shimmer skeleton while the image loads, a soft fade-in on
 * load, and a neutral "—" when there's no image or it fails. Fills its host box (size it from the parent).
 * `fit` = 'cover' (default, crops to box) or 'contain' (logos — letterboxed on the sunken background).
 */
@Component({
  selector: 'app-admin-thumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-thumb.html',
  styleUrl: './admin-thumb.scss',
})
export class AdminThumb {
  readonly src = input<string | null>(null);
  readonly alt = input('');
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    // Re-arm the skeleton whenever the source changes (e.g. replacing a cover).
    effect(() => { this.src(); this.state.set('loading'); });
  }
}
