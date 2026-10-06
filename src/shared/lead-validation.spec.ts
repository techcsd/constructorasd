import { describe, it, expect } from 'vitest';
import {
  validateContact,
  validateApplication,
  isLikelySpam,
  countLinks,
  MIN_FILL_MS,
  MSG_MIN,
} from './lead-validation';
import { MSG_MIN as EDGE_MSG_MIN } from '../../supabase/functions/_shared/validate';

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

  it('keeps MSG_MIN in sync between the client and the edge function (WD4/WF3)', () => {
    expect(MSG_MIN).toBe(10);
    expect(EDGE_MSG_MIN).toBe(MSG_MIN);
  });

  it('accepts a 10-char message but rejects a 9-char one', () => {
    expect(validateContact({ ...okContact, message: '1234567890' }).ok).toBe(true);
    expect(validateContact({ ...okContact, message: '123456789' }).errors).toContain('message_short');
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
