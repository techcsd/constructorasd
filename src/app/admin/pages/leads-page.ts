import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { Application, AppStatus, Lead, LeadStatus, LeadsAdminService, InboxNote, StatusChange } from '../leads.service';

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './leads-page.html',
  styleUrl: './admin.scss',
})
export class LeadsPage implements OnDestroy {
  private svc = inject(LeadsAdminService);
  private title = inject(Title);
  private sanitizer = inject(DomSanitizer);

  readonly tab = signal<'mensajes' | 'postulaciones'>('mensajes');
  readonly leads = signal<Lead[]>([]);
  readonly apps = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly openId = signal<string | null>(null);
  readonly toast = signal<string | null>(null);

  readonly leadStatuses: LeadStatus[] = ['nuevo', 'contactado', 'descartado'];
  readonly appStatuses: AppStatus[] = ['nuevo', 'revisado', 'descartado'];

  // filters
  readonly fStatus = signal('');
  readonly fType = signal('');
  readonly fLocale = signal('');
  readonly fQuery = signal('');

  // detail
  readonly notes = signal<InboxNote[]>([]);
  readonly history = signal<StatusChange[]>([]);
  readonly cvSignedUrl = signal<string | null>(null);
  readonly cvSafe = signal<SafeResourceUrl | null>(null);
  noteDraft = '';

  private unsub: () => void = () => {};

  readonly unread = computed(() => this.leads().filter((l) => !l.read_at).length);
  readonly newApps = computed(() => this.apps().filter((a) => a.status === 'nuevo').length);

  readonly projectTypes = computed(() => [...new Set(this.leads().map((l) => l.project_type).filter(Boolean))] as string[]);
  readonly filteredLeads = computed(() => {
    const q = this.fQuery().toLowerCase().trim();
    return this.leads().filter((l) =>
      (!this.fStatus() || l.status === this.fStatus()) &&
      (!this.fType() || l.project_type === this.fType()) &&
      (!this.fLocale() || l.locale === this.fLocale()) &&
      (!q || [l.name, l.company, l.email, l.message].some((x) => (x ?? '').toLowerCase().includes(q))));
  });
  readonly openLead = computed(() => this.leads().find((l) => l.id === this.openId()) ?? null);
  readonly openApp = computed(() => this.apps().find((a) => a.id === this.openId()) ?? null);

  constructor() { void this.load(); }
  ngOnDestroy(): void { this.unsub(); }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [leads, apps] = await Promise.all([this.svc.leads(), this.svc.applications()]);
      this.leads.set(leads); this.apps.set(apps);
      this.refreshTitle();
      this.unsub();
      this.unsub = this.svc.subscribeLeads((lead) => {
        this.leads.set([lead, ...this.leads()]);
        this.toast.set(`Nuevo mensaje de ${lead.name}`);
        this.refreshTitle();
        setTimeout(() => this.toast.set(null), 8000);
      });
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }
  private refreshTitle(): void {
    const n = this.unread();
    this.title.setTitle(n > 0 ? `(${n}) Admin — CSD` : 'Panel — CSD');
  }

  async openMessage(l: Lead): Promise<void> {
    this.openId.set(l.id);
    if (!l.read_at) { await this.svc.markRead('leads', l.id); l.read_at = new Date().toISOString(); this.leads.set([...this.leads()]); this.refreshTitle(); }
    this.notes.set(await this.svc.notes('lead', l.id));
    this.history.set(await this.svc.history(l.id));
  }
  async openApplication(a: Application): Promise<void> {
    this.openId.set(a.id);
    const url = await this.svc.cvUrl(a.cv_path);
    this.cvSignedUrl.set(url);
    this.cvSafe.set(url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null);
    this.notes.set(await this.svc.notes('application', a.id));
    this.history.set(await this.svc.history(a.id));
  }
  close(): void { this.openId.set(null); this.cvSignedUrl.set(null); this.cvSafe.set(null); }

  async setLeadStatus(l: Lead, status: LeadStatus): Promise<void> {
    try { await this.svc.setLeadStatus(l.id, status); l.status = status; this.leads.set([...this.leads()]); this.history.set(await this.svc.history(l.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }
  async setAppStatus(a: Application, status: AppStatus): Promise<void> {
    try { await this.svc.setAppStatus(a.id, status); a.status = status; this.apps.set([...this.apps()]); this.history.set(await this.svc.history(a.id)); }
    catch (e) { this.error.set((e as Error).message); }
  }

  async addNote(kind: 'lead' | 'application'): Promise<void> {
    const body = this.noteDraft.trim(); if (!body || !this.openId()) return;
    try { const n = await this.svc.addNote(kind, this.openId()!, body); this.notes.set([...this.notes(), n]); this.noteDraft = ''; }
    catch (e) { this.error.set((e as Error).message); }
  }

  replyMailto(l: Lead): string {
    const greet = l.locale === 'en' ? 'Hello' : 'Hola';
    const body = encodeURIComponent(`${greet} ${l.name},\n\n`);
    return `mailto:${l.email}?subject=${encodeURIComponent('Re: su solicitud a Constructora SD')}&body=${body}`;
  }
  waUrl(l: Lead): string | null { return l.phone_e164 ? `https://wa.me/${l.phone_e164.replace('+', '')}` : null; }

  exportCsv(): void {
    const rows = this.filteredLeads();
    const head = ['Fecha', 'Nombre', 'Empresa', 'Email', 'Teléfono', 'Tipo', 'Idioma', 'Estado', 'Mensaje'];
    const esc = (s: unknown) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const lines = [head.join(';'), ...rows.map((l) => [l.created_at, l.name, l.company, l.email, l.phone, l.project_type, l.locale, l.status, l.message].map(esc).join(';'))];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads.csv'; a.click();
  }

  fmt(iso: string): string { return new Date(iso).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  isPdf(a: Application): boolean { return a.cv_mime === 'application/pdf'; }
}
