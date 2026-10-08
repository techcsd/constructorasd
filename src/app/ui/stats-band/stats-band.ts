import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CountUp } from '../../core/count-up.directive';

export interface StatItem {
  value: string;
  label: string;
}

/** StatsBand (DESIGN-BRIEF §6): dark band, serif numerals at display size, hairlines between items. */
@Component({
  selector: 'app-stats-band',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CountUp],
  templateUrl: './stats-band.html',
  styleUrl: './stats-band.scss',
  host: { 'data-tone': 'dark', class: 'tone-dark' },
})
export class StatsBand {
  readonly stats = input.required<StatItem[]>();
}
