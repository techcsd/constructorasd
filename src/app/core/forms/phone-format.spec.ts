import { describe, it, expect } from 'vitest';
import { formatPhoneDisplay, toE164, isInternational } from './phone-format';

describe('formatPhoneDisplay (WD3/WF4)', () => {
  it('1. progressive national mask while typing', () => {
    expect(formatPhoneDisplay('809')).toBe('809');
    expect(formatPhoneDisplay('8096')).toBe('809-6');
    expect(formatPhoneDisplay('809692')).toBe('809-692');
    expect(formatPhoneDisplay('8096925906')).toBe('809-692-5906');
  });

  it('2. caps the NANP national part at 10 digits (extra digits dropped)', () => {
    // overflow past 10 national digits flips to international; the NANP part is still capped
    expect(formatPhoneDisplay('+180969259069999')).toBe('+1 809-692-5906');
  });

  it('3. reformats an already-masked value (idempotent on re-entry)', () => {
    expect(formatPhoneDisplay('809-692-5906')).toBe('809-692-5906');
  });

  it('4. deletion in the middle re-groups from the remaining digits', () => {
    // user backspaced the "2" from 809-692-5906 → raw "809-69-5906"
    expect(formatPhoneDisplay('809-69-5906')).toBe('809-695-906');
  });

  it('5. paste "(809) 692 5906" normalizes to 809-692-5906', () => {
    expect(formatPhoneDisplay('(809) 692 5906')).toBe('809-692-5906');
  });

  it('6. a leading + switches to international grouping (NANP)', () => {
    expect(formatPhoneDisplay('+18096925906')).toBe('+1 809-692-5906');
  });

  it('7. non-NANP international groups by threes after a 2-digit CC', () => {
    expect(formatPhoneDisplay('+34612345678')).toBe('+34 612 345 678');
    expect(formatPhoneDisplay('+')).toBe('+');
  });

  it('8. an 11th national digit (no +) promotes to international', () => {
    expect(isInternational('80969259061')).toBe(true);
    expect(formatPhoneDisplay('')).toBe('');
  });
});

describe('toE164', () => {
  it('derives +1 for RD area codes', () => {
    expect(toE164('809-692-5906')).toBe('+18096925906');
    expect(toE164('829 123 4567')).toBe('+18291234567');
    expect(toE164('849.123.4567')).toBe('+18491234567');
  });
  it('keeps international numbers with their +', () => {
    expect(toE164('+34 612 345 678')).toBe('+34612345678');
    expect(toE164('+1 809-692-5906')).toBe('+18096925906');
  });
  it('is null for incomplete / non-RD national numbers', () => {
    expect(toE164('809-692')).toBeNull();
    expect(toE164('')).toBeNull();
    expect(toE164('555-123-4567')).toBeNull(); // valid length, not an RD area code
  });
});
