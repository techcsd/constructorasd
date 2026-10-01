import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icon, IconName } from '../icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

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
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
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
