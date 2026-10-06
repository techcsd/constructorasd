import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CmsService } from '../../cms/cms.service';

type State = 'loading' | 'clean' | 'changes' | 'publishing' | 'slow' | 'done' | 'error';

/**
 * Publish bar (WJ5). Shows "N cambios sin publicar — Publicar" / "Todo publicado", triggers the
 * web-publish rebuild and tracks the deploy via /version.json polling (WK2 degraded path — no Vercel
 * token needed): when the built revision changes, the new deploy is live.
 */
@Component({
  selector: 'app-publish-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publish-bar.html',
  styleUrl: './publish-bar.scss',
})
export class PublishBar implements OnDestroy {
  private cms = inject(CmsService);
  readonly state = signal<State>('loading');
  readonly error = signal<string | null>(null);
  private startRev: string | null = null;
  private timer?: ReturnType<typeof setInterval>;
  private deadline = 0;

  constructor() { void this.refresh(); }
  ngOnDestroy(): void { clearInterval(this.timer); }

  async refresh(): Promise<void> {
    try { this.state.set((await this.cms.unpublishedChanges()) ? 'changes' : 'clean'); }
    catch { this.state.set('changes'); }
  }

  async publish(): Promise<void> {
    this.error.set(null);
    this.startRev = await this.cms.siteVersion();
    this.state.set('publishing');
    const err = await this.cms.publish();
    if (err) { this.error.set('No se pudo publicar — ' + err); this.state.set('error'); return; }
    this.deadline = Date.now() + 6 * 60 * 1000;
    clearInterval(this.timer);
    this.timer = setInterval(() => void this.poll(), 10000);
  }

  private async poll(): Promise<void> {
    const rev = await this.cms.siteVersion();
    if (rev && rev !== this.startRev) { clearInterval(this.timer); this.state.set('done'); return; }
    if (Date.now() > this.deadline) { clearInterval(this.timer); this.state.set('slow'); }
  }

  async check(): Promise<void> {
    const rev = await this.cms.siteVersion();
    if (rev && rev !== this.startRev) this.state.set('done');
    else { this.deadline = Date.now() + 3 * 60 * 1000; this.state.set('publishing'); clearInterval(this.timer); this.timer = setInterval(() => void this.poll(), 10000); }
  }
}
