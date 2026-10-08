import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon, IconName } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonTone = 'light' | 'dark' | 'auto';

/**
 * Button (DESIGN-BRIEF §6). Renders as a routerLink, an <a href>, or a <button> depending on inputs.
 * 48px tall, radius --r-sm, weight 500, no uppercase. Optional trailing arrow shifts 4px on hover.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, NgTemplateOutlet],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-tone]': "tone() === 'auto' ? null : tone()",
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  /**
   * Surface the button sits on. `dark` makes the secondary/ghost variants bone (text+border+translucent
   * fill) so they read over a dark section or the hero photo. Set it explicitly on dark sections (hero, CTA
   * band, footer) — this is prerender-correct, unlike the old `:host-context` rule which Angular's emulated
   * encapsulation never compiled (WM1).
   */
  readonly tone = input<ButtonTone>('auto');
  readonly routerLink = input<string | unknown[] | null>(null);
  readonly href = input<string | null>(null);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input<boolean>(false);
  readonly icon = input<IconName | null>('arrow-right');
  /** For href links to external sites: adds target + rel. */
  readonly external = input<boolean>(false);
  /** Accessible label when the button content is not descriptive on its own. */
  readonly ariaLabel = input<string>('');
}
