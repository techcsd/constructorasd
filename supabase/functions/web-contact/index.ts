// web-contact (WA10 / WB5) — validate + anti-spam + persist the lead, then email via Resend.
// Persist is the source of truth; on email failure we store email_error and still return 200.
import { validateContact, isLikelySpam } from '../_shared/validate.ts';
import { admin, clientIp, ipHash, json, rateLimit, sendEmail } from '../_shared/util.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, origin);

  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400, origin);
  }

  // Silent accept for obvious bots (don't tip them off, don't persist).
  const spam = isLikelySpam(d as never, Date.now());
  if (spam.spam) return json({ ok: true }, 200, origin);

  const v = validateContact(d);
  if (!v.ok) return json({ ok: false, errors: v.errors }, 400, origin);

  const db = admin();
  const iph = await ipHash(clientIp(req));
  const allowed = await rateLimit(db, `contact:${iph}`, 5, 10 * 60 * 1000);
  if (!allowed) return json({ ok: false, error: 'rate_limited' }, 429, origin);

  const row = {
    locale: d.locale,
    name: String(d.name).trim(),
    company: d.company ? String(d.company).trim() : null,
    email: String(d.email).trim(),
    phone: d.phone ? String(d.phone).trim() : null,
    phone_e164: d.phoneE164 ? String(d.phoneE164).trim() : null,
    project_type: d.projectType ? String(d.projectType) : null,
    message: String(d.message).trim(),
    consent: d.consent === true,
    page: d.page ? String(d.page) : null,
    utm: d.utm ?? null,
    ip_hash: iph,
    user_agent: req.headers.get('user-agent'),
  };

  const { data: inserted, error } = await db.schema('web').from('leads').insert(row).select('id').single();
  if (error) return json({ ok: false, error: 'db' }, 500, origin);

  const tipo = row.project_type ?? '—';
  const mail = await sendEmail({
    subject: `[Web] Nueva solicitud — ${row.name} (${tipo})`,
    replyTo: row.email,
    text:
      `Nueva solicitud de contacto\n\n` +
      `Nombre: ${row.name}\nEmpresa: ${row.company ?? '—'}\nEmail: ${row.email}\n` +
      `Teléfono: ${row.phone ?? '—'}\nTipo de proyecto: ${tipo}\nIdioma: ${row.locale}\n\n` +
      `Mensaje:\n${row.message}\n`,
    html:
      `<h2>Nueva solicitud de contacto</h2>` +
      `<p><strong>Nombre:</strong> ${esc(row.name)}<br>` +
      `<strong>Empresa:</strong> ${esc(row.company ?? '—')}<br>` +
      `<strong>Email:</strong> ${esc(row.email)}<br>` +
      `<strong>Teléfono:</strong> ${esc(row.phone ?? '—')}<br>` +
      `<strong>Tipo:</strong> ${esc(tipo)} · <strong>Idioma:</strong> ${esc(String(row.locale))}</p>` +
      `<p><strong>Mensaje:</strong><br>${esc(row.message).replace(/\n/g, '<br>')}</p>`,
  });

  if (mail.id) {
    await db.schema('web').from('leads').update({ emailed_at: new Date().toISOString() }).eq('id', inserted.id);
  } else {
    await db.schema('web').from('leads').update({ email_error: mail.error ?? 'unknown' }).eq('id', inserted.id);
  }

  return json({ ok: true, id: inserted.id }, 200, origin);
});

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
