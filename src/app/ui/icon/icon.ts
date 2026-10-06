import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'arrow-right'
  | 'arrow-left'
  | 'grid'
  | 'arrow-up-right'
  | 'chevron-down'
  | 'menu'
  | 'close'
  | 'phone'
  | 'mail'
  | 'instagram'
  | 'whatsapp'
  | 'map-pin'
  | 'download'
  | 'check'
  | 'external';

/** Inline SVG icon from the single sprite (public/icons.svg). stroke=currentColor (CLAUDE.md rule 9). */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  host: { class: 'app-icon' },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<number>(24);
  /** Accessible label; when omitted the icon is decorative (aria-hidden). */
  readonly label = input<string>('');

  readonly href = computed(() => `/icons.svg#${this.name()}`);
  readonly decorative = computed(() => !this.label());
}
