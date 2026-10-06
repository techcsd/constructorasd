import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
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
import { validateContact } from '../../../shared/lead-validation';
import { toE164 } from '../../core/forms/phone-format';
import { PhoneFormatDirective } from '../../core/forms/phone-format.directive';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

export const MSG_MAX = 3000;
const COUNTER_FROM = 2500;

/**
 * ContactForm (DESIGN-BRIEF §6). Reactive validation + optimistic client-side validateContact() before
 * the request so the edge function almost never rejects (WD4). Server `errors[]` map to per-field errors;
 * `rate_limited` gets a specific banner; everything else is the generic banner (WE9). Success state scrolls
 * into view, focuses its heading and offers "Enviar otro mensaje" (WF8). Phone is masked live (WD3/WF4).
 */
@Component({
  selector: 'app-contact-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, TPipe, PhoneFormatDirective],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);
  private leads = inject(LeadsService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  /** Banner kind: 'none' = no banner, 'rate' = rate-limit copy, 'generic' = fallback copy. */
  readonly errorKind = signal<'none' | 'rate' | 'generic'>('none');
  private startedAt = Date.now();
  readonly privacidadPath = computed(() => pathFor('privacidad', this.i18n.locale()) ?? '/privacidad');

  private readonly successHeading = viewChild<ElementRef<HTMLElement>>('successHeading');

  readonly sectors = ['Hotelero', 'Institucional', 'Hospitalario', 'Industrial', 'Residencial', 'Minero', 'Otro'];
  readonly maxLen = MSG_MAX;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    empresa: [''],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    tipo: ['', [Validators.required]],
    mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(MSG_MAX)]],
    consent: [false, [Validators.requiredTrue]],
    website: [''], // honeypot — must stay empty
  });

  private readonly mensajeValue = toSignal(this.form.controls.mensaje.valueChanges, {
    initialValue: this.form.controls.mensaje.value,
  });
  readonly mensajeLen = computed(() => this.mensajeValue().length);
  readonly showCounter = computed(() => this.mensajeLen() >= COUNTER_FROM);

  constructor() {
    // Move focus to the confirmation heading once the success state renders (WF8).
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

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Message-field error copy: required vs. too-short vs. too-long. */
  mensajeError(): string | null {
    const c = this.form.controls.mensaje;
    if (!this.showError('mensaje')) return null;
    if (c.hasError('required')) return 'Este campo es obligatorio.';
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
    if (this.form.controls.website.value) return; // bot caught by honeypot

    const v = this.form.getRawValue();
    // Optimistic client-side mirror of the server validator (WD4) — should never trip after the
    // reactive validators above, but keeps the request honest if copy/paste bypasses them.
    const pre = validateContact({
      locale: this.i18n.locale(),
      name: v.nombre,
      email: v.email,
      message: v.mensaje,
      consent: v.consent,
    });
    if (!pre.ok) {
      this.applyServerErrors(pre.errors);
      return;
    }

    this.submitting.set(true);
    const result = await this.leads.submitContact({
      locale: this.i18n.locale(),
      name: v.nombre,
      company: v.empresa,
      email: v.email,
      phone: v.telefono,
      phoneE164: toE164(v.telefono),
      projectType: v.tipo,
      message: v.mensaje,
      consent: v.consent,
      website: v.website,
      startedAt: this.startedAt,
      page: typeof location !== 'undefined' ? location.pathname : undefined,
    });
    this.submitting.set(false);

    if (result.ok) {
      this.submitted.set(true);
      this.trackEvent('lead_submitted');
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

  /** Reset for another message, keeping a fresh startedAt so the anti-spam timer is honest (WF8). */
  resetForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.errorKind.set('none');
    this.startedAt = Date.now();
  }

  /** Map server error codes to control-level errors, then focus the first invalid field (WE9). */
  private applyServerErrors(errors: string[]): void {
    const map: Record<string, keyof typeof this.form.controls> = {
      name: 'nombre',
      email: 'email',
      message_short: 'mensaje',
      message_long: 'mensaje',
      consent: 'consent',
    };
    for (const code of errors) {
      const ctrl = map[code];
      if (!ctrl) continue;
      const errKey = code === 'message_short' ? 'minlength' : code === 'message_long' ? 'maxlength' : 'server';
      this.form.controls[ctrl].setErrors({ ...(this.form.controls[ctrl].errors ?? {}), [errKey]: true });
      this.form.controls[ctrl].markAsTouched();
    }
    this.focusFirstInvalid();
  }

  private focusFirstInvalid(): void {
    const order: (keyof typeof this.form.controls)[] = ['nombre', 'email', 'tipo', 'mensaje', 'consent'];
    const first = order.find((n) => this.form.controls[n].invalid);
    if (!first || typeof document === 'undefined') return;
    queueMicrotask(() => document.querySelector<HTMLElement>(`#cf-${first}`)?.focus());
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
