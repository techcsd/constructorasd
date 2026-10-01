import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Quote (DESIGN-BRIEF §6): Instrument Serif italic at H2 size, 1px left rule, eyebrow attribution. */
@Component({
  selector: 'app-quote',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote.html',
  styleUrl: './quote.scss',
})
export class Quote {
  readonly text = input.required<string>();
  readonly attribution = input<string>('');
}
