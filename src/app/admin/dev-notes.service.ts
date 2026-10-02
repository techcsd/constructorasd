import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { getSupabase } from './admin.supabase';

export type NoteStatus = 'open' | 'done';
export type NotePriority = 'low' | 'medium' | 'high';

export interface DevNote {
  id: string;
  title: string;
  body: string;
  status: NoteStatus;
  priority: NotePriority;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type DevNoteInput = Pick<DevNote, 'title' | 'body' | 'status' | 'priority' | 'tags'>;

/** CRUD for web.dev_notes via the authed admin Supabase client (RLS: authenticated only). */
@Injectable({ providedIn: 'root' })
export class DevNotesService {
  private sb = getSupabase(inject(PLATFORM_ID));

  async list(): Promise<DevNote[]> {
    if (!this.sb) return []; // server / prerender
    const { data, error } = await this.sb.from('dev_notes').select('*').order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DevNote[];
  }

  async create(note: DevNoteInput): Promise<DevNote> {
    if (!this.sb) throw new Error('offline');
    const { data, error } = await this.sb.from('dev_notes').insert(note).select().single();
    if (error) throw new Error(error.message);
    return data as DevNote;
  }

  async update(id: string, note: Partial<DevNoteInput>): Promise<void> {
    if (!this.sb) throw new Error('offline');
    const { error } = await this.sb.from('dev_notes').update(note).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async remove(id: string): Promise<void> {
    if (!this.sb) throw new Error('offline');
    const { error } = await this.sb.from('dev_notes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
