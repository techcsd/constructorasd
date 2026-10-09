import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Tiny inline-SVG sparkline (brief §4). Normalises a number[] to a polyline + soft area fill. Pure SVG,
// no library, inherits currentColor. Admin-only (lazy chunk). A flat series renders a centred baseline.
@Component({
  selector: 'app-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (points().length > 1) {
      <svg class="spk" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
        <polygon class="spk__area" [attr.points]="area()" />
        <polyline class="spk__line" [attr.points]="line()" />
      </svg>
    }
  `,
  styleUrl: './sparkline.scss',
})
export class Sparkline {
  readonly values = input<readonly number[]>([]);

  // [x,y] pairs mapped into a 100×30 box with 1px vertical padding; flat series sits on the mid-line.
  readonly points = computed<[number, number][]>(() => {
    const v = this.values();
    if (v.length < 2) return [];
    const max = Math.max(...v);
    const min = Math.min(...v);
    const span = max - min || 1;
    const stepX = 100 / (v.length - 1);
    return v.map((n, i) => {
      const x = i * stepX;
      const y = max === min ? 15 : 29 - ((n - min) / span) * 28;
      return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    });
  });

  readonly line = computed(() => this.points().map(([x, y]) => `${x},${y}`).join(' '));
  readonly area = computed(() => {
    const p = this.points();
    if (!p.length) return '';
    return `0,30 ${this.line()} 100,30`;
  });
}
