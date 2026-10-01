import { describe, it, expect } from 'vitest';
import {
  validateContact,
  validateApplication,
  isLikelySpam,
  countLinks,
  MIN_FILL_MS,
} from './lead-validation';

const okContact = {
  locale: 'es',
  name: 'Ana',
  email: 'ana@example.com',
  message: 'Quisiera cotizar la estructura de un bloque de habitaciones en Punta Cana.',
  consent: true,
};

describe('lead validation', () => {
  it('accepts a valid contact', () => {
    expect(validateContact(okContact).ok).toBe(true);
  });

  it('rejects missing/invalid fields', () => {
    expect(validateContact({ ...okContact, email: 'nope' }).errors).toContain('email');
    expect(validateContact({ ...okContact, consent: false }).errors).toContain('consent');
    expect(validateContact({ ...okContact, message: 'corto' }).errors).toContain('message_short');
    expect(validateContact({ ...okContact, locale: 'fr' }).errors).toContain('locale');
  });

  it('validates applications (no message required)', () => {
    expect(validateApplication({ locale: 'en', name: 'Joe', email: 'j@e.com', consent: true }).ok).toBe(true);
    expect(validateApplication({ locale: 'en', name: 'Joe', email: 'j@e.com', consent: false }).ok).toBe(false);
  });

  it('counts links', () => {
    expect(countLinks('see http://a.com and www.b.com and https://c.com/x')).toBe(3);
  });

  it('flags spam: honeypot, too fast, too many links', () => {
    const now = 1_000_000_000_000;
    expect(isLikelySpam({ website: 'x' }, now).reason).toBe('honeypot');
    expect(isLikelySpam({ startedAt: now - 1000 }, now).reason).toBe('too_fast');
    expect(isLikelySpam({ startedAt: now - MIN_FILL_MS - 1 }, now).spam).toBe(false);
    expect(isLikelySpam({ message: 'http://a www.b https://c http://d.e' }, now).reason).toBe('links');
  });
});
