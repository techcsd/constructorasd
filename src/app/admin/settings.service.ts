import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { getSupabase } from './admin.supabase';

export interface SiteSettings {
  accent: string | null;
}

/** Live appearance settings (web.site_settings, single row). Admin writes; the public site reads. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private sb = getSupabase(inject(PLATFORM_ID));

  async get(): Promise<SiteSettings> {
    if (!this.sb) return { accent: null };
    const { data, error } = await this.sb.from('site_settings').select('accent').eq('id', 1).single();
    if (error) throw new Error(error.message);
    return data as SiteSettings;
  }

  async setAccent(accent: string | null): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('site_settings').update({ accent }).eq('id', 1);
    if (error) throw new Error(error.message);
  }
}
