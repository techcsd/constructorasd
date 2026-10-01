import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Eyebrow (DESIGN-BRIEF §3 / §6): a 24px hairline + uppercase label, with an optional index (01). */
@Component({
  selector: 'app-eyebrow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eyebrow.html',
  styleUrl: './eyebrow.scss',
})
export class Eyebrow {
  readonly label = input.required<string>();
  readonly index = input<string>('');
}
