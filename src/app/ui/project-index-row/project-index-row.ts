import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageFigure } from '../image-figure/image-figure';
import { Icon } from '../icon/icon';

/** ProjectIndexRow (DESIGN-BRIEF §6): hairline list row — name / client / sector, hover thumbnail (desktop). */
@Component({
  selector: 'app-project-index-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImageFigure, Icon],
  templateUrl: './project-index-row.html',
  styleUrl: './project-index-row.scss',
})
export class ProjectIndexRow {
  readonly name = input.required<string>();
  readonly client = input<string>('');
  readonly sector = input<string>('');
  readonly image = input<string>('');
  readonly routerLink = input<string | null>(null);
  readonly altText = computed(() => this.name());
}
