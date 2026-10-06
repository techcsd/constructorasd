import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatPhoneDisplay } from './phone-format';

/**
 * Live phone mask (WD3 / WF4). Reformats the host <input> on every keystroke / paste while keeping the
 * caret anchored to the same digit, so the control value is always the formatted display string
 * ("809-692-5906"). Pure formatting lives in phone-format.ts; the e164 is derived at submit time.
 *
 *   <input appPhoneFormat formControlName="telefono" />
 */
@Directive({
  selector: '[appPhoneFormat]',
  standalone: true,
  host: { inputmode: 'tel', autocomplete: 'tel' },
})
export class PhoneFormatDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly ngControl = inject(NgControl, { optional: true });

  @HostListener('input')
  onInput(): void {
    const prev = this.el.value;
    const caret = this.el.selectionStart ?? prev.length;
    const digitsBeforeCaret = countDigits(prev.slice(0, caret));

    const formatted = formatPhoneDisplay(prev);
    this.write(formatted);

    const next = caretAfterNthDigit(formatted, digitsBeforeCaret);
    this.el.setSelectionRange(next, next);
  }

  // Programmatic values (rare here) still get normalized on blur.
  @HostListener('blur')
  onBlur(): void {
    const formatted = formatPhoneDisplay(this.el.value);
    if (formatted !== this.el.value) this.write(formatted);
  }

  private write(value: string): void {
    this.el.value = value;
    // Keep the model equal to the formatted string without bouncing it back through the view writer
    // (which would reset the caret we are about to restore).
    this.ngControl?.control?.setValue(value, { emitModelToViewChange: false });
  }
}

function countDigits(s: string): number {
  return (s.match(/\d/g) ?? []).length;
}

/** Index in `formatted` just after its Nth digit, so the caret tracks the same digit across reformats. */
function caretAfterNthDigit(formatted: string, n: number): number {
  if (n <= 0) return formatted.startsWith('+') ? Math.min(1, formatted.length) : 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted.charCodeAt(i) >= 48 && formatted.charCodeAt(i) <= 57) {
      if (++seen === n) return i + 1;
    }
  }
  return formatted.length;
}
