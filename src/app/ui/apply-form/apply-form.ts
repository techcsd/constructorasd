import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { LeadsService } from '../../core/leads/leads.service';
import { pathFor } from '../../core/i18n/localized-routes';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

const MAX_MB = 5;
const ACCEPT = ['.pdf', '.doc', '.docx'];

/**
 * Spontaneous / position application form (WB6). UI + validation only in Prompt 1/2 — submit resolves
 * against a stub; the web-apply edge function (Storage + email) lands in Prompt 3. CV accepts PDF/DOC/DOCX
 * with a 5 MB client-side check. Honeypot for anti-spam.
 */
@Component({
  selector: 'app-apply-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, TPipe],
  templateUrl: './apply-form.html',
  styleUrl: './apply-form.scss',
})
export class ApplyForm {
  /** Optional position title (prefilled on a job-detail page). */
  readonly position = input<string>('');
  /** Optional job slug (from the job-detail route); empty = spontaneous application. */
  readonly jobSlug = input<string>('');

  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);
  private leads = inject(LeadsService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal(false);
  readonly fileName = signal('');
  readonly fileError = signal('');
  private readonly startedAt = Date.now();
  readonly accept = ACCEPT.join(',');
  readonly privacidadPath = computed(() => pathFor('privacidad', this.i18n.locale()) ?? '/privacidad');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    mensaje: [''],
    consent: [false, [Validators.requiredTrue]],
    website: [''], // honeypot
  });

  private file: File | null = null;

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.fileError.set('');
    if (!f) {
      this.file = null;
      this.fileName.set('');
      return;
    }
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    if (!ACCEPT.includes(ext)) {
      this.fileError.set(this.i18n.t('Formato no válido. Usa PDF, DOC o DOCX.'));
      this.file = null;
      this.fileName.set('');
      input.value = '';
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      this.fileError.set(this.i18n.t('El archivo supera los {mb} MB.', { mb: MAX_MB }));
      this.file = null;
      this.fileName.set('');
      input.value = '';
      return;
    }
    this.file = f;
    this.fileName.set(f.name);
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.file) {
      this.fileError.set(this.i18n.t('Adjunta tu CV.'));
      return;
    }
    if (this.form.controls.website.value) return;
    this.submitting.set(true);
    this.submitError.set(false);
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.set('locale', this.i18n.locale());
    fd.set('jobSlug', this.jobSlug() || '');
    fd.set('name', v.nombre);
    fd.set('email', v.email);
    fd.set('phone', v.telefono);
    fd.set('message', v.mensaje);
    fd.set('consent', String(v.consent));
    fd.set('website', v.website);
    fd.set('startedAt', String(this.startedAt));
    fd.set('cv', this.file, this.file.name);
    const result = await this.leads.submitApplication(fd);
    this.submitting.set(false);
    if (result.ok) {
      this.submitted.set(true);
      this.trackEvent('application_submitted');
    } else {
      this.submitError.set(true);
    }
  }

  private async trackEvent(name: string): Promise<void> {
    try {
      const { track } = await import('@vercel/analytics');
      track(name);
    } catch {
      /* analytics optional */
    }
  }
}
