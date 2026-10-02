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
  project_type: string | null;
  message: string;
  page: string | null;
  status: LeadStatus;
  emailed_at: string | null;
  email_error: string | null;
}

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

const LEAD_COLS = 'id,created_at,locale,name,company,email,phone,project_type,message,page,status,emailed_at,email_error';
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
}
