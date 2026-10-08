import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { LeadsService } from '../../core/leads/leads.service';
import { pathFor } from '../../core/i18n/localized-routes';
import { toE164 } from '../../core/forms/phone-format';
import { PhoneFormatDirective } from '../../core/forms/phone-format.directive';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';
import { CV_ACCEPT, CV_MAX_MB, validateCvFile } from './cv-validation';

const MSG_MAX = 3000;
const COUNTER_FROM = 2500;

/**
 * Spontaneous / position application form (WB6). Mirrors ContactForm's live phone mask (WD3/WF4),
 * message length validation + counter, server error mapping and "Enviar otro mensaje" success state
 * (WE9/WF8). CV accepts PDF/DOC/DOCX with a 5 MB client-side check. Honeypot for anti-spam.
 */
@Component({
  selector: 'app-apply-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, TPipe, PhoneFormatDirective],
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
  readonly errorKind = signal<'none' | 'rate' | 'generic'>('none');
  readonly fileName = signal('');
  readonly fileError = signal('');
  private startedAt = Date.now();
  readonly accept = CV_ACCEPT.join(',');
  readonly maxLen = MSG_MAX;
  readonly privacidadPath = computed(() => pathFor('privacidad', this.i18n.locale()) ?? '/privacidad');

  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    mensaje: ['', [Validators.minLength(10), Validators.maxLength(MSG_MAX)]],
    consent: [false, [Validators.requiredTrue]],
    website: [''], // honeypot
  });

  private readonly mensajeValue = toSignal(this.form.controls.mensaje.valueChanges, {
    initialValue: this.form.controls.mensaje.value,
  });
  readonly mensajeLen = computed(() => this.mensajeValue().length);
  readonly showCounter = computed(() => this.mensajeLen() >= COUNTER_FROM);

  private file: File | null = null;

  constructor() {
    effect(() => {
      if (this.submitted()) {
        queueMicrotask(() => {
          const el = this.successHeading()?.nativeElement;
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el?.focus();
        });
      }
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.fileError.set('');
    if (!f) {
      this.file = null;
      this.fileName.set('');
      return;
    }
    const err = validateCvFile(f.name, f.size);
    if (err) {
      this.fileError.set(err === 'cv_type'
        ? this.i18n.t('Formato no válido. Usa PDF, DOC o DOCX.')
        : this.i18n.t('El archivo supera los {mb} MB.', { mb: CV_MAX_MB }));
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

  mensajeError(): string | null {
    const c = this.form.controls.mensaje;
    if (!this.showError('mensaje')) return null;
    if (c.hasError('maxlength')) return 'El mensaje supera los {max} caracteres.';
    return 'Mínimo 10 caracteres';
  }

  async onSubmit(): Promise<void> {
    this.errorKind.set('none');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    if (!this.file) {
      this.fileError.set(this.i18n.t('Adjunta tu CV.'));
      return;
    }
    if (this.form.controls.website.value) return;
    this.submitting.set(true);
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.set('locale', this.i18n.locale());
    fd.set('jobSlug', this.jobSlug() || '');
    fd.set('name', v.nombre);
    fd.set('email', v.email);
    fd.set('phone', v.telefono);
    fd.set('phoneE164', toE164(v.telefono) ?? '');
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
      return;
    }
    if (result.error === 'rate_limited') {
      this.errorKind.set('rate');
      return;
    }
    if (result.errors?.length) {
      this.applyServerErrors(result.errors);
      return;
    }
    this.errorKind.set('generic');
  }

  resetForm(): void {
    this.form.reset();
    this.file = null;
    this.fileName.set('');
    this.fileError.set('');
    this.submitted.set(false);
    this.errorKind.set('none');
    this.startedAt = Date.now();
  }

  private applyServerErrors(errors: string[]): void {
    const map: Record<string, keyof typeof this.form.controls> = {
      name: 'nombre',
      email: 'email',
      consent: 'consent',
    };
    for (const code of errors) {
      const ctrl = map[code];
      if (!ctrl) continue;
      this.form.controls[ctrl].setErrors({ ...(this.form.controls[ctrl].errors ?? {}), server: true });
      this.form.controls[ctrl].markAsTouched();
    }
    this.focusFirstInvalid();
  }

  private focusFirstInvalid(): void {
    const order: (keyof typeof this.form.controls)[] = ['nombre', 'email', 'mensaje', 'consent'];
    const first = order.find((n) => this.form.controls[n].invalid);
    if (!first || typeof document === 'undefined') return;
    queueMicrotask(() => document.querySelector<HTMLElement>(`#af-${first}`)?.focus());
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
