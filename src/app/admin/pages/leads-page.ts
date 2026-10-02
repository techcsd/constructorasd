import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Application,
  AppStatus,
  Lead,
  LeadStatus,
  LeadsAdminService,
} from '../leads.service';

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './leads-page.html',
  styleUrl: './admin.scss',
})
export class LeadsPage {
  private svc = inject(LeadsAdminService);

  readonly tab = signal<'mensajes' | 'postulaciones'>('mensajes');
  readonly leads = signal<Lead[]>([]);
  readonly apps = signal<Application[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly openId = signal<string | null>(null);

  readonly leadStatuses: LeadStatus[] = ['nuevo', 'contactado', 'descartado'];
  readonly appStatuses: AppStatus[] = ['nuevo', 'revisado', 'descartado'];

  readonly newLeads = computed(() => this.leads().filter((l) => l.status === 'nuevo').length);
  readonly newApps = computed(() => this.apps().filter((a) => a.status === 'nuevo').length);

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [l, a] = await Promise.all([this.svc.leads(), this.svc.applications()]);
      this.leads.set(l);
      this.apps.set(a);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  toggle(id: string): void {
    this.openId.set(this.openId() === id ? null : id);
  }

  async setLead(l: Lead, status: LeadStatus): Promise<void> {
    try {
      await this.svc.setLeadStatus(l.id, status);
      this.leads.update((xs) => xs.map((x) => (x.id === l.id ? { ...x, status } : x)));
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  async setApp(a: Application, status: AppStatus): Promise<void> {
    try {
      await this.svc.setAppStatus(a.id, status);
      this.apps.update((xs) => xs.map((x) => (x.id === a.id ? { ...x, status } : x)));
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  async downloadCv(a: Application): Promise<void> {
    const url = await this.svc.cvUrl(a.cv_path);
    if (url && typeof window !== 'undefined') window.open(url, '_blank');
    else this.error.set('No se pudo generar el enlace del CV.');
  }

  fmt(iso: string): string {
    return new Date(iso).toLocaleString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
