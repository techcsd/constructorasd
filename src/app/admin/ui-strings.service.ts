import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { getSupabase } from './admin.supabase';

export interface UiString {
  key: string;
  es: string | null;
  en: string | null;
  context: string | null;
  page: string | null;
  updated_at: string;
}

/** CRUD for web.ui_strings (WL6). Admin writes; the build (gen-content) reads with the anon key. */
@Injectable({ providedIn: 'root' })
export class UiStringsService {
  private sb = getSupabase(inject(PLATFORM_ID));

  async list(): Promise<UiString[]> {
    if (!this.sb) return [];
    const { data, error } = await this.sb.from('ui_strings').select('*').order('key');
    if (error) throw new Error(error.message);
    return (data ?? []) as UiString[];
  }

  async save(key: string, patch: Partial<Pick<UiString, 'es' | 'en'>>): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('ui_strings').update(patch).eq('key', key);
    if (error) throw new Error(error.message);
  }
}
