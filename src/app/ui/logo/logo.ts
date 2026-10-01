import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo (DESIGN-BRIEF §6). Traced `.SD` monogram (currentColor) + the wordmark rebuilt as live
 * Hanken Grotesk text (brief §6 allows this). Inherits color from context, so one component serves
 * both the ink-on-light and bone-on-dark cases. See docs/DESIGN-DECISIONS.md.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  readonly wordmark = input<boolean>(true);
}
