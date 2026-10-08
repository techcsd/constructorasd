// Shared utilities for the web-* edge functions (Deno).
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

export const ENV_NAME = Deno.env.get('ENV_NAME') ?? 'dev';
const IP_SALT = Deno.env.get('IP_SALT') ?? 'csd-dev-salt';

export function admin(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

export function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return (xff ? xff.split(',')[0] : '').trim() || req.headers.get('x-real-ip') || '0.0.0.0';
}

export async function ipHash(ip: string): Promise<string> {
  const data = new TextEncoder().encode(IP_SALT + ':' + ip);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Fixed-window rate limit in web.rate_limits. Returns true when the request is allowed. */
export async function rateLimit(
  db: SupabaseClient,
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const { data } = await db.schema('web').from('rate_limits').select('*').eq('key', key).maybeSingle();
  if (!data || now - new Date(data.window_start).getTime() > windowMs) {
    await db
      .schema('web')
      .from('rate_limits')
      .upsert({ key, hits: 1, window_start: new Date(now).toISOString() });
    return true;
  }
  if (data.hits >= limit) return false;
  await db.schema('web').from('rate_limits').update({ hits: data.hits + 1 }).eq('key', key);
  return true;
}

export interface MailInput {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  to?: string;       // prod recipient override (from site_settings); dev always goes to MAIL_TO_DEV
  cc?: string;       // optional CC (prod only)
}

// Live global settings (web.site_settings.data), cached 60 s so the admin can change destination emails /
// WhatsApp message etc. without a redeploy (WN2). Falls back to {} on any error.
let _settingsCache: { at: number; data: Record<string, unknown> } | null = null;
export async function siteSettings(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (_settingsCache && now - _settingsCache.at < 60_000) return _settingsCache.data;
  try {
    const { data } = await admin().schema('web').from('site_settings').select('data').eq('id', 1).single();
    const d = (data?.data as Record<string, unknown>) ?? {};
    _settingsCache = { at: now, data: d };
    return d;
  } catch {
    return _settingsCache?.data ?? {};
  }
}

/** Send via Resend. In dev, redirect to MAIL_TO and prefix the subject with [DEV]. Never throws. */
export async function sendEmail(m: MailInput): Promise<{ id?: string; error?: string }> {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('MAIL_FROM') ?? 'Constructora SD <web@constructorasd.com>';
  const to = Deno.env.get('MAIL_TO') ?? 'info@constructorasd.com';
  if (!key) return { error: 'resend_not_configured' };
  const isProd = ENV_NAME === 'prod';
  const subject = isProd ? m.subject : `[DEV] ${m.subject}`;
  // prod: settings override (m.to) → MAIL_TO secret; dev: always the safe dev inbox.
  const recipient = isProd ? (m.to || to) : (Deno.env.get('MAIL_TO_DEV') ?? 'Tecnologia@constructorasd.com');
  const cc = isProd && m.cc ? [m.cc] : undefined;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [recipient],
        cc,
        subject,
        text: m.text,
        html: m.html,
        reply_to: m.replyTo,
      }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { error: `resend_${r.status}: ${JSON.stringify(body).slice(0, 180)}` };
    return { id: body.id };
  } catch (e) {
    return { error: 'resend_exception: ' + (e as Error).message };
  }
}
