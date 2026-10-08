import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService, AjustesData } from '../settings.service';

/** Ajustes (WN2) — global settings over web.site_settings.data. Email destinations take effect within ~1
 *  min without a publish (edge functions read them live); the rest apply on the next publish/build. */
@Component({
  selector: 'app-admin-ajustes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule],
  templateUrl: './ajustes-page.html',
  styleUrl: './admin.scss',
})
export class AjustesPage {
  private settings = inject(SettingsService);
  model: Required<AjustesData> = {
    emails: { contact: '', applications: '', cc: '' },
    whatsappMessage: { es: '', en: '' },
    social: { instagram: '', linkedin: '', facebook: '' },
    legal: { razonSocial: '', rnc: '', direccion: '' },
    maintenance: { on: false, message_es: '', message_en: '' },
    analytics: true,
  };
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  constructor() { void this.load(); }
  async load(): Promise<void> {
    try {
      const d = (await this.settings.get()).data;
      this.model = {
        emails: { contact: d.emails?.contact ?? '', applications: d.emails?.applications ?? '', cc: d.emails?.cc ?? '' },
        whatsappMessage: { es: d.whatsappMessage?.es ?? '', en: d.whatsappMessage?.en ?? '' },
        social: { instagram: d.social?.instagram ?? '', linkedin: d.social?.linkedin ?? '', facebook: d.social?.facebook ?? '' },
        legal: { razonSocial: d.legal?.razonSocial ?? '', rnc: d.legal?.rnc ?? '', direccion: d.legal?.direccion ?? '' },
        maintenance: { on: d.maintenance?.on ?? false, message_es: d.maintenance?.message_es ?? '', message_en: d.maintenance?.message_en ?? '' },
        analytics: d.analytics ?? true,
      };
    } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }

  private emailOk(s?: string): boolean { return !s || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); }
  async save(): Promise<void> {
    for (const e of [this.model.emails.contact, this.model.emails.applications, this.model.emails.cc]) {
      if (!this.emailOk(e)) { this.error.set('Revisa los correos: "' + e + '" no es válido.'); return; }
    }
    this.saving.set(true); this.error.set(null); this.saved.set(false);
    try { await this.settings.saveData(this.model); this.saved.set(true); }
    catch (e) { this.error.set('No se pudo guardar. ' + (e as Error).message); } finally { this.saving.set(false); }
  }
}
