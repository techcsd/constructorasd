// Pure validation + anti-spam helpers for the contact/application forms. Single source: the Angular
// client (optimistic pre-check) and vitest import this; the edge functions mirror the same checks
// server-side (authoritative). No framework/Deno/node specifics here.

export interface ContactInput {
  locale?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  message?: string;
  consent?: boolean;
  website?: string; // honeypot — must be empty
  startedAt?: number; // epoch ms when the form was shown
}

export interface ApplicationInput {
  locale?: string;
  jobSlug?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  consent?: boolean;
  website?: string;
  startedAt?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_FILL_MS = 3000; // must take ≥ 3s to fill (bot guard, WB5)
export const MSG_MIN = 20;
export const MSG_MAX = 3000;
export const MAX_LINKS = 3;

export function countLinks(s: string): number {
  return (s.match(/https?:\/\/|www\./gi) ?? []).length;
}

export function validateContact(d: ContactInput): ValidationResult {
  const e: string[] = [];
  if (!d.name || !d.name.trim()) e.push('name');
  if (!d.email || !EMAIL_RE.test(d.email)) e.push('email');
  if (!d.message || d.message.trim().length < MSG_MIN) e.push('message_short');
  if (d.message && d.message.length > MSG_MAX) e.push('message_long');
  if (d.consent !== true) e.push('consent');
  if (d.locale !== 'es' && d.locale !== 'en') e.push('locale');
  return { ok: e.length === 0, errors: e };
}

export function validateApplication(d: ApplicationInput): ValidationResult {
  const e: string[] = [];
  if (!d.name || !d.name.trim()) e.push('name');
  if (!d.email || !EMAIL_RE.test(d.email)) e.push('email');
  if (d.consent !== true) e.push('consent');
  if (d.locale !== 'es' && d.locale !== 'en') e.push('locale');
  return { ok: e.length === 0, errors: e };
}

export interface SpamResult {
  spam: boolean;
  reason?: string;
}

/** Honeypot + minimum fill time + link-stuffing. `now` is epoch ms (injectable for tests). */
export function isLikelySpam(
  d: { website?: string; startedAt?: number; message?: string },
  now: number,
): SpamResult {
  if (d.website && d.website.trim() !== '') return { spam: true, reason: 'honeypot' };
  if (typeof d.startedAt === 'number' && now - d.startedAt < MIN_FILL_MS) {
    return { spam: true, reason: 'too_fast' };
  }
  if (d.message && countLinks(d.message) > MAX_LINKS) return { spam: true, reason: 'links' };
  return { spam: false };
}
