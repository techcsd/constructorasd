// Server-side (authoritative) validators — mirror of src/shared/lead-validation.ts. Keep in sync.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_FILL_MS = 3000;
export const MSG_MIN = 10; // WF3 — keep equal to src/shared/lead-validation.ts (asserted in lead-validation.spec.ts)
export const MSG_MAX = 3000;
export const MAX_LINKS = 3;

export function countLinks(s: string): number {
  return (s.match(/https?:\/\/|www\./gi) ?? []).length;
}

export function validateContact(d: Record<string, unknown>): { ok: boolean; errors: string[] } {
  const e: string[] = [];
  const name = String(d.name ?? '');
  const email = String(d.email ?? '');
  const message = String(d.message ?? '');
  if (!name.trim()) e.push('name');
  if (!EMAIL_RE.test(email)) e.push('email');
  if (message.trim().length < MSG_MIN) e.push('message_short');
  if (message.length > MSG_MAX) e.push('message_long');
  if (d.consent !== true) e.push('consent');
  if (d.locale !== 'es' && d.locale !== 'en') e.push('locale');
  return { ok: e.length === 0, errors: e };
}

export function validateApplication(d: Record<string, unknown>): { ok: boolean; errors: string[] } {
  const e: string[] = [];
  if (!String(d.name ?? '').trim()) e.push('name');
  if (!EMAIL_RE.test(String(d.email ?? ''))) e.push('email');
  if (d.consent !== true) e.push('consent');
  if (d.locale !== 'es' && d.locale !== 'en') e.push('locale');
  return { ok: e.length === 0, errors: e };
}

export function isLikelySpam(
  d: { website?: unknown; startedAt?: unknown; message?: unknown },
  now: number,
): { spam: boolean; reason?: string } {
  if (typeof d.website === 'string' && d.website.trim() !== '') return { spam: true, reason: 'honeypot' };
  if (typeof d.startedAt === 'number' && now - d.startedAt < MIN_FILL_MS) {
    return { spam: true, reason: 'too_fast' };
  }
  if (typeof d.message === 'string' && countLinks(d.message) > MAX_LINKS) {
    return { spam: true, reason: 'links' };
  }
  return { spam: false };
}
