import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { getSupabase } from './admin.supabase';

export type LeadStatus = 'nuevo' | 'contactado' | 'descartado';
export type AppStatus = 'nuevo' | 'revisado' | 'descartado';

export interface Lead {
  id: string;
  created_at: string;
  locale: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  phone_e164: string | null;
  project_type: string | null;
  message: string;
  page: string | null;
  status: LeadStatus;
  read_at: string | null;
  emailed_at: string | null;
  email_error: string | null;
}

export interface InboxNote { id: string; kind: string; ref_id: string; body: string; created_at: string; }
export interface StatusChange { id: string; from_status: string | null; to_status: string | null; changed_at: string; }

export interface Application {
  id: string;
  created_at: string;
  locale: string;
  job_slug: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  cv_path: string;
  cv_size: number | null;
  cv_mime: string | null;
  status: AppStatus;
}

const LEAD_COLS = 'id,created_at,locale,name,company,email,phone,phone_e164,project_type,message,page,status,read_at,emailed_at,email_error';
const APP_COLS = 'id,created_at,locale,job_slug,name,email,phone,message,cv_path,cv_size,cv_mime,status';

/** Admin read + status updates for the lead inbox (contact + CV applications). RLS: admin email only. */
@Injectable({ providedIn: 'root' })
export class LeadsAdminService {
  private sb = getSupabase(inject(PLATFORM_ID));

  async leads(): Promise<Lead[]> {
    if (!this.sb) return [];
    const { data, error } = await this.sb.from('leads').select(LEAD_COLS).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Lead[];
  }

  async applications(): Promise<Application[]> {
    if (!this.sb) return [];
    const { data, error } = await this.sb.from('job_applications').select(APP_COLS).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Application[];
  }

  async setLeadStatus(id: string, status: LeadStatus): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('leads').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async setAppStatus(id: string, status: AppStatus): Promise<void> {
    if (!this.sb) return;
    const { error } = await this.sb.from('job_applications').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Short-lived signed URL to download a CV from the private bucket. */
  async cvUrl(path: string): Promise<string | null> {
    if (!this.sb) return null;
    const { data, error } = await this.sb.storage.from('web-cv').createSignedUrl(path, 120);
    if (error) return null;
    return data.signedUrl;
  }

  // ── v2: read state, notes, history, realtime ──
  async unreadCount(): Promise<number> {
    if (!this.sb) return 0;
    const { count } = await this.sb.from('leads').select('id', { count: 'exact', head: true }).is('read_at', null);
    return count ?? 0;
  }
  async markRead(table: 'leads' | 'job_applications', id: string): Promise<void> {
    if (!this.sb) return;
    await this.sb.from(table).update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
  }
  async notes(kind: 'lead' | 'application', refId: string): Promise<InboxNote[]> {
    if (!this.sb) return [];
    const { data } = await this.sb.from('inbox_notes').select('*').eq('kind', kind).eq('ref_id', refId).order('created_at');
    return (data ?? []) as InboxNote[];
  }
  async addNote(kind: 'lead' | 'application', refId: string, body: string): Promise<InboxNote> {
    const { data, error } = await this.sb!.from('inbox_notes').insert({ kind, ref_id: refId, body }).select().single();
    if (error) throw new Error(error.message);
    return data as InboxNote;
  }
  async history(refId: string): Promise<StatusChange[]> {
    if (!this.sb) return [];
    const { data } = await this.sb.from('inbox_status_history').select('*').eq('ref_id', refId).order('changed_at');
    return (data ?? []) as StatusChange[];
  }
  /** Realtime: call cb on a new lead INSERT. Returns an unsubscribe fn. */
  subscribeLeads(cb: (lead: Lead) => void): () => void {
    if (!this.sb) return () => {};
    const ch = this.sb.channel('web-leads-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'web', table: 'leads' }, (p) => cb(p.new as Lead))
      .subscribe();
    return () => { void this.sb!.removeChannel(ch); };
  }
}
