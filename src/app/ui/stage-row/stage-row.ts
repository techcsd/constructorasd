import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ImageFigure } from '../image-figure/image-figure';
import { Icon } from '../icon/icon';

export interface StageHeight {
  value: string;
  label: string;
}

/**
 * StageRow (DESIGN-BRIEF §6). A table-like hairline row for the construction stages: index, title,
 * one-line description, chevron. Expands via native <details>/<summary> (no JS) to reveal the 4
 * capabilities (+ optional heights table and image). Accessible and works without hydration.
 */
@Component({
  selector: 'app-stage-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ImageFigure, Icon],
  templateUrl: './stage-row.html',
  styleUrl: './stage-row.scss',
})
export class StageRow {
  readonly index = input.required<string>();
  readonly title = input.required<string>();
  readonly summary = input.required<string>();
  readonly capabilities = input.required<string[]>();
  readonly heights = input<StageHeight[]>([]);
  readonly image = input<string>('');
  readonly imageAlt = input<string>('');
  readonly open = input<boolean>(false);
}
