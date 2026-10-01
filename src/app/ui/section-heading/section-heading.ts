import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Eyebrow } from '../eyebrow/eyebrow';

/** SectionHeading (DESIGN-BRIEF §6): eyebrow + H2 (≤14 words) + optional lead, asymmetric grid. */
@Component({
  selector: 'app-section-heading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Eyebrow],
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss',
})
export class SectionHeading {
  readonly eyebrow = input<string>('');
  readonly index = input<string>('');
  readonly heading = input.required<string>();
  readonly lead = input<string>('');
}
