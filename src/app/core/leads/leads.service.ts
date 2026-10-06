import { Injectable } from '@angular/core';
import { environment } from '@env';

export interface ContactPayload {
  locale: 'es' | 'en';
  name: string;
  company?: string;
  email: string;
  phone?: string;
  phoneE164?: string | null; // normalized E.164 when deducible (WD3/WF4)
  projectType?: string;
  message: string;
  consent: boolean;
  website?: string; // honeypot
  startedAt?: number;
  page?: string;
}

export interface SubmitResult {
  ok: boolean;
  errors?: string[];
  error?: string;
}

/**
 * Talks to the web-contact / web-apply edge functions with the public anon key (rule 5 — never the
 * service role). The functions validate, anti-spam, persist, then email. If Supabase isn't configured
 * (local dev without .env.local), it degrades to an offline stub so the UI still works.
 */
@Injectable({ providedIn: 'root' })
export class LeadsService {
  private get base(): string {
    return (environment.supabaseUrl || '').replace(/\/$/, '');
  }
  private get anon(): string {
    return environment.supabaseAnonKey || '';
  }
  private get configured(): boolean {
    return !!this.base && !!this.anon;
  }

  async submitContact(payload: ContactPayload): Promise<SubmitResult> {
    if (!this.configured) return this.stub();
    try {
      const res = await fetch(`${this.base}/functions/v1/web-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.anon,
          Authorization: `Bearer ${this.anon}`,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as SubmitResult;
      if (res.ok) return { ok: true };
      return { ok: false, errors: body.errors, error: body.error ?? `http_${res.status}` };
    } catch (e) {
      console.error('[LeadsService] contact failed', e);
      return { ok: false, error: 'network' };
    }
  }

  async submitApplication(form: FormData): Promise<SubmitResult> {
    if (!this.configured) return this.stub();
    try {
      const res = await fetch(`${this.base}/functions/v1/web-apply`, {
        method: 'POST',
        headers: { apikey: this.anon, Authorization: `Bearer ${this.anon}` },
        body: form,
      });
      const body = (await res.json().catch(() => ({}))) as SubmitResult;
      if (res.ok) return { ok: true };
      return { ok: false, errors: body.errors, error: body.error ?? `http_${res.status}` };
    } catch (e) {
      console.error('[LeadsService] application failed', e);
      return { ok: false, error: 'network' };
    }
  }

  private async stub(): Promise<SubmitResult> {
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true };
  }
}
