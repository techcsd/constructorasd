import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CmsService } from '../../cms/cms.service';

type State = 'loading' | 'clean' | 'changes' | 'publishing' | 'slow' | 'done' | 'error';

/**
 * Publish bar (WJ5 / WK2). Shows "N cambios sin publicar — Publicar" / "Todo publicado", triggers the
 * web-publish rebuild and tracks the deploy via /version.json polling (token-free: no Vercel token needed).
 * When the built revision changes, the new deploy is live. A live elapsed timer makes the wait tangible, and
 * if it runs long we surface a "Ver en Vercel" link so the real deploy can be inspected in the dashboard.
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
  readonly elapsed = signal(0); // seconds since publish
  readonly vercelState = signal(''); // real Vercel state when a token is configured (else empty)
  private vercelOff = false; // becomes true once we learn no token is configured (stop asking)
  /** Vercel deployments dashboard for this project (public URL, not a secret). */
  readonly vercelUrl = 'https://vercel.com/xaviel-csd/constructorasd/deployments';

  private startRev: string | null = null;
  private startedAt = 0;
  private timer?: ReturnType<typeof setInterval>;
  private tick?: ReturnType<typeof setInterval>;
  private deadline = 0;

  constructor() { void this.refresh(); }
  ngOnDestroy(): void { this.stopTimers(); }

  private stopTimers(): void { clearInterval(this.timer); clearInterval(this.tick); }

  async refresh(): Promise<void> {
    this.stopTimers();
    try { this.state.set((await this.cms.unpublishedChanges()) ? 'changes' : 'clean'); }
    catch { this.state.set('changes'); }
  }

  elapsedLabel(): string {
    const s = this.elapsed();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  private startWatch(): void {
    this.stopTimers();
    this.tick = setInterval(() => this.elapsed.set(Math.floor((Date.now() - this.startedAt) / 1000)), 1000);
    this.timer = setInterval(() => void this.poll(), 10000);
  }

  private readonly STATE_LABELS: Record<string, string> = {
    QUEUED: 'en cola', INITIALIZING: 'iniciando', BUILDING: 'compilando', READY: 'listo', CANCELED: 'cancelado', ERROR: 'error',
  };
  vercelLabel(): string { return this.STATE_LABELS[this.vercelState()] ?? this.vercelState().toLowerCase(); }

  async publish(): Promise<void> {
    this.error.set(null);
    this.vercelState.set('');
    this.startRev = await this.cms.siteVersion();
    this.startedAt = Date.now();
    this.elapsed.set(0);
    this.state.set('publishing');
    const err = await this.cms.publish();
    if (err) { this.error.set('No se pudo publicar — ' + err); this.state.set('error'); this.stopTimers(); return; }
    this.deadline = Date.now() + 6 * 60 * 1000;
    this.startWatch();
  }

  private async poll(): Promise<void> {
    // Primary, always-reliable signal: a new built revision means the new deploy is live.
    const rev = await this.cms.siteVersion();
    if (rev && rev !== this.startRev) { this.stopTimers(); this.state.set('done'); return; }
    // Secondary (only if a Vercel token is configured): surface the real state and catch a failed build fast.
    if (!this.vercelOff) {
      const st = await this.cms.deployStatus();
      if (st && st.configured === false) this.vercelOff = true;
      else if (st?.configured && st.state) {
        this.vercelState.set(st.state);
        if (st.state === 'ERROR' || st.state === 'CANCELED') {
          this.stopTimers();
          this.error.set('El deploy falló en Vercel. Revisa el panel.');
          this.state.set('error');
          return;
        }
      }
    }
    if (Date.now() > this.deadline) { this.stopTimers(); this.state.set('slow'); }
  }

  async check(): Promise<void> {
    const rev = await this.cms.siteVersion();
    if (rev && rev !== this.startRev) { this.stopTimers(); this.state.set('done'); return; }
    this.deadline = Date.now() + 3 * 60 * 1000;
    this.state.set('publishing');
    this.startWatch();
  }
}
