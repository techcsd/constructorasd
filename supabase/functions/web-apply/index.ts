// web-apply (WA12 / WB6) — multipart CV upload (≤5 MB, pdf/doc/docx) → private web-cv bucket →
// job_applications row → email info@ with a 7-day signed download link. Persist-first.
import { validateApplication, isLikelySpam } from '../_shared/validate.ts';
import { admin, clientIp, ipHash, json, rateLimit, sendEmail } from '../_shared/util.ts';
import { corsHeaders } from '../_shared/cors.ts';

const MAX = 5 * 1024 * 1024;
const MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, origin);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: 'bad_form' }, 400, origin);
  }

  const d = {
    locale: form.get('locale'),
    jobSlug: form.get('jobSlug') || null,
    name: form.get('name'),
    email: form.get('email'),
    phone: form.get('phone'),
    phoneE164: form.get('phoneE164') || null,
    message: form.get('message'),
    consent: form.get('consent') === 'true',
    website: form.get('website') ?? '',
    startedAt: Number(form.get('startedAt') ?? 0),
  };

  if (isLikelySpam(d as never, Date.now()).spam) return json({ ok: true }, 200, origin);

  const v = validateApplication(d as never);
  if (!v.ok) return json({ ok: false, errors: v.errors }, 400, origin);

  const file = form.get('cv');
  if (!(file instanceof File)) return json({ ok: false, errors: ['cv'] }, 400, origin);
  if (file.size > MAX) return json({ ok: false, errors: ['cv_size'] }, 400, origin);
  const ext = MIME[file.type];
  if (!ext) return json({ ok: false, errors: ['cv_mime'] }, 400, origin);

  const db = admin();
  const iph = await ipHash(clientIp(req));
  if (!(await rateLimit(db, `apply:${iph}`, 5, 10 * 60 * 1000))) {
    return json({ ok: false, error: 'rate_limited' }, 429, origin);
  }

  const now = new Date();
  const uuid = crypto.randomUUID();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${uuid}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const up = await db.storage.from('web-cv').upload(path, bytes, { contentType: file.type, upsert: false });
  if (up.error) return json({ ok: false, error: 'upload' }, 500, origin);

  const row = {
    locale: String(d.locale),
    job_slug: d.jobSlug ? String(d.jobSlug) : null,
    name: String(d.name).trim(),
    email: String(d.email).trim(),
    phone: d.phone ? String(d.phone).trim() : null,
    phone_e164: d.phoneE164 ? String(d.phoneE164).trim() : null,
    message: d.message ? String(d.message).trim() : null,
    cv_path: path,
    cv_size: file.size,
    cv_mime: file.type,
    consent: d.consent === true,
    ip_hash: iph,
    user_agent: req.headers.get('user-agent'),
  };
  const { data: inserted, error } = await db
    .schema('web')
    .from('job_applications')
    .insert(row)
    .select('id')
    .single();
  if (error) return json({ ok: false, error: 'db' }, 500, origin);

  const signed = await db.storage.from('web-cv').createSignedUrl(path, 7 * 24 * 60 * 60);
  const link = signed.data?.signedUrl ?? '(no link)';

  await sendEmail({
    subject: `[Web] Nueva candidatura — ${row.name}${row.job_slug ? ` (${row.job_slug})` : ' (espontánea)'}`,
    replyTo: row.email,
    text:
      `Nueva candidatura\n\nNombre: ${row.name}\nEmail: ${row.email}\nTeléfono: ${row.phone ?? '—'}\n` +
      `Vacante: ${row.job_slug ?? 'Espontánea'}\nIdioma: ${row.locale}\n\n` +
      `Mensaje:\n${row.message ?? '—'}\n\nCV (enlace válido 7 días):\n${link}\n`,
  });

  return json({ ok: true, id: inserted.id }, 200, origin);
});
