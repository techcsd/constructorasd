import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { pathFor } from '../../core/i18n/localized-routes';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { TPipe } from '../../core/i18n/t.pipe';

/**
 * ContactForm (DESIGN-BRIEF §6). UI + inline validation only in Prompt 1 — submit resolves against a
 * 600 ms stub; the edge function + Resend land in Prompt 3. Includes a honeypot (`website`) for the
 * future anti-spam check (WB5). Success state replaces the form with a short confirmation.
 */
@Component({
  selector: 'app-contact-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Icon, TPipe],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly privacidadPath = computed(() => pathFor('privacidad', this.i18n.locale()) ?? '/privacidad');

  readonly sectors = ['Hotelero', 'Institucional', 'Hospitalario', 'Industrial', 'Residencial', 'Minero', 'Otro'];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    empresa: [''],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    tipo: ['', [Validators.required]],
    mensaje: ['', [Validators.required]],
    consent: [false, [Validators.requiredTrue]],
    website: [''], // honeypot — must stay empty
  });

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.controls.website.value) return; // bot caught by honeypot
    this.submitting.set(true);
    // Prompt 1 stub — Prompt 3 posts to the web-contact edge function with the anon key.
    await new Promise((r) => setTimeout(r, 600));
    this.submitting.set(false);
    this.submitted.set(true);
  }
}
