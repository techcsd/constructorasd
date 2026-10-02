import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '@env';
import { getSupabase } from './admin.supabase';

export interface ContentSection {
  key: string;
  data: unknown;
  updated_at: string;
}

/** Read/write the editable site content (web.site_content). RLS: admin email only. */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private sb = getSupabase(inject(PLATFORM_ID));

  async list(): Promise<ContentSection[]> {
    if (!this.sb) return [];
    const { data, error } = await this.sb.from('site_content').select('*').order('key');
    if (error) throw new Error(error.message);
    return (data ?? []) as ContentSection[];
  }

  async save(key: string, data: unknown): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('site_content').upsert({ key, data }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  }

  /** Trigger a rebuild so content changes go live (web-publish edge function → Vercel deploy hook). */
  async publish(): Promise<string | null> {
    if (!this.sb) return 'offline';
    const { data: sess } = await this.sb.auth.getSession();
    const token = sess.session?.access_token;
    const base = (environment.supabaseUrl || '').replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/functions/v1/web-publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return `${res.status}: ${(await res.text()).slice(0, 140)}`;
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }
}
