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
  pinned: boolean;
  archived: boolean;
  color: string | null;
  template: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteVersion { id: string; note_id: string; title: string; body: string; bytes: number; saved_at: string; }
export type DevNoteInput = Pick<DevNote, 'title' | 'body' | 'status' | 'priority' | 'tags'>;

/** CRUD + versions for web.dev_notes (RLS: admin via is_admin). */
@Injectable({ providedIn: 'root' })
export class DevNotesService {
  private sb = getSupabase(inject(PLATFORM_ID));
  private get db() { if (!this.sb) throw new Error('offline'); return this.sb; }

  async list(): Promise<DevNote[]> {
    if (!this.sb) return [];
    const { data, error } = await this.sb.from('dev_notes').select('*').order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DevNote[];
  }

  async create(note: Partial<DevNoteInput> & { template?: string | null }): Promise<DevNote> {
    const { data, error } = await this.db.from('dev_notes').insert({ title: '', body: '', ...note }).select().single();
    if (error) throw new Error(error.message);
    return data as DevNote;
  }

  /** Conflict-aware update: only writes if updated_at still matches what the editor loaded. Returns the
   *  new updated_at on success, or the server row (conflict) when someone else changed it meanwhile. */
  async save(id: string, patch: Partial<DevNote>, loadedUpdatedAt: string): Promise<{ ok: true; updated_at: string } | { ok: false; server: DevNote }> {
    const { data, error } = await this.db.from('dev_notes').update(patch).eq('id', id).eq('updated_at', loadedUpdatedAt).select().single();
    if (!error && data) return { ok: true, updated_at: (data as DevNote).updated_at };
    // 0 rows (conflict) or error → fetch the current server copy
    const { data: server } = await this.db.from('dev_notes').select('*').eq('id', id).single();
    return { ok: false, server: server as DevNote };
  }

  async setFlags(id: string, patch: Partial<Pick<DevNote, 'pinned' | 'archived' | 'color'>>): Promise<void> {
    const { error } = await this.db.from('dev_notes').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from('dev_notes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async saveVersion(noteId: string, title: string, body: string): Promise<void> {
    await this.db.from('dev_note_versions').insert({ note_id: noteId, title, body, bytes: body.length });
  }
  async listVersions(noteId: string): Promise<NoteVersion[]> {
    const { data } = await this.db.from('dev_note_versions').select('*').eq('note_id', noteId).order('saved_at', { ascending: false });
    return (data ?? []) as NoteVersion[];
  }
}
