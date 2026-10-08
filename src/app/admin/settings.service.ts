import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { getSupabase } from './admin.supabase';

/** Global settings stored in web.site_settings.data (jsonb). Read by the public site + edge functions. */
export interface AjustesData {
  emails?: { contact?: string; applications?: string; cc?: string };
  whatsappMessage?: { es: string; en: string };
  social?: { instagram?: string; linkedin?: string; facebook?: string };
  legal?: { razonSocial?: string; rnc?: string; direccion?: string };
  maintenance?: { on: boolean; message_es: string; message_en: string };
  analytics?: boolean;
}

export interface SiteSettings {
  accent: string | null;
  data: AjustesData;
}

/** Live settings (web.site_settings, single row). Admin writes; the public site + edge functions read. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private sb = getSupabase(inject(PLATFORM_ID));

  async get(): Promise<SiteSettings> {
    if (!this.sb) return { accent: null, data: {} };
    const { data, error } = await this.sb.from('site_settings').select('accent, data').eq('id', 1).single();
    if (error) throw new Error(error.message);
    return { accent: (data as { accent: string | null }).accent ?? null, data: ((data as { data: AjustesData }).data ?? {}) };
  }

  async setAccent(accent: string | null): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('site_settings').update({ accent }).eq('id', 1);
    if (error) throw new Error(error.message);
  }

  async saveData(d: AjustesData): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('site_settings').update({ data: d }).eq('id', 1);
    if (error) throw new Error(error.message);
  }
}
