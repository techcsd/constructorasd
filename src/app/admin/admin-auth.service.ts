import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { getSupabase } from './admin.supabase';

/** Supabase-Auth session state for the admin panel. Browser-only; a no-op during prerender. */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private sb = getSupabase(inject(PLATFORM_ID));

  private _email = signal<string | null>(null);
  readonly email = this._email.asReadonly();
  readonly ready = signal(false);
  /** True when the user arrived via an invite / password-reset link and must set a password. */
  readonly recovery = signal(false);

  constructor() {
    if (!this.sb) {
      this.ready.set(true);
      return;
    }
    this.sb.auth.getSession().then(({ data }) => {
      this._email.set(data.session?.user?.email ?? null);
      this.ready.set(true);
    });
    this.sb.auth.onAuthStateChange((event, session) => {
      this._email.set(session?.user?.email ?? null);
      if (event === 'PASSWORD_RECOVERY') this.recovery.set(true);
    });
  }

  /** Set a new password (invite / recovery flow), then clear recovery mode. */
  async setPassword(password: string): Promise<string | null> {
    if (!this.sb) return 'offline';
    const { error } = await this.sb.auth.updateUser({ password });
    if (!error) this.recovery.set(false);
    return error?.message ?? null;
  }

  async signIn(email: string, password: string): Promise<string | null> {
    if (!this.sb) return 'offline';
    const { error } = await this.sb.auth.signInWithPassword({ email: email.trim(), password });
    return error?.message ?? null;
  }

  async signOut(): Promise<void> {
    await this.sb?.auth.signOut();
  }
}
