import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageFigure } from '../image-figure/image-figure';

// Neutral country-level placeholders (WE12) — shown in detail facts, omitted from the card meta line.
const PLACEHOLDER_CITIES = new Set(['República Dominicana', 'Dominican Republic']);

/**
 * ProjectCard (DESIGN-BRIEF §6). Image 4:5 (index) or 16:10 (featured); below it the name and a
 * `CLIENTE · Sector · Ciudad` meta line. No text overlay on the image (except a featured hero handles
 * its own overlay elsewhere).
 */
@Component({
  selector: 'app-project-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImageFigure],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
  host: { '[class.is-featured]': 'featured()' },
})
export class ProjectCard {
  readonly name = input.required<string>();
  readonly client = input<string>('');
  readonly sector = input<string>('');
  readonly city = input<string>('');
  readonly image = input<string>('');
  readonly focal = input<{ x: number; y: number } | undefined>(undefined);
  readonly alt = input<string>('');
  readonly featured = input<boolean>(false);
  readonly priority = input<boolean>(false); // eager + fetchpriority for above-the-fold cards (WE5)
  readonly routerLink = input<string | null>(null);

  readonly aspect = computed(() => (this.featured() ? '16 / 10' : '4 / 5'));
  readonly meta = computed(() => {
    // WE12 — the neutral country placeholder reads as repetitive filler across cards; drop it from the
    // card meta (it still shows in the project-detail facts). Confirmed cities are kept.
    const city = PLACEHOLDER_CITIES.has(this.city().trim()) ? '' : this.city();
    return [this.client(), this.sector(), city].filter((p) => !!p).join(' · ');
  });
  readonly altText = computed(() => this.alt() || this.name());
}
