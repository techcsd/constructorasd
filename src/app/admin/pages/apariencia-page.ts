import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../settings.service';

const DEFAULT_ACCENT = '#c2410c'; // the design default (--accent / oxide-500)

@Component({
  selector: 'app-admin-apariencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './apariencia-page.html',
  styleUrl: './admin.scss',
})
export class ApparienciaPage {
  private svc = inject(SettingsService);

  readonly accent = signal<string>(DEFAULT_ACCENT);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  readonly DEFAULT = DEFAULT_ACCENT;

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    try {
      const s = await this.svc.get();
      this.accent.set(s.accent || DEFAULT_ACCENT);
      this.preview();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  setAccent(v: string): void {
    this.accent.set(v);
    this.saved.set(false);
    this.preview();
  }

  private preview(): void {
    if (typeof document !== 'undefined') document.documentElement.style.setProperty('--accent', this.accent());
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.svc.setAccent(this.accent());
      this.saved.set(true);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  async reset(): Promise<void> {
    this.accent.set(DEFAULT_ACCENT);
    this.preview();
    this.saving.set(true);
    try {
      await this.svc.setAccent(null);
      this.saved.set(true);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
