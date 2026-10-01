// web-client-error — rate-limited sink for client-side errors (no PII, ≤1 kB). Feeds web.client_errors.
import { admin, clientIp, ipHash, json, rateLimit } from '../_shared/util.ts';
import { corsHeaders } from '../_shared/cors.ts';

const cap = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : null);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, origin);

  let d: Record<string, unknown>;
  try {
    d = await req.json();
  } catch {
    return json({ ok: true }, 200, origin);
  }
  const message = cap(d.message, 1024);
  if (!message) return json({ ok: true }, 200, origin);

  const db = admin();
  const iph = await ipHash(clientIp(req));
  if (!(await rateLimit(db, `err:${iph}`, 20, 10 * 60 * 1000))) return json({ ok: true }, 200, origin);

  await db
    .schema('web')
    .from('client_errors')
    .insert({
      message,
      source: cap(d.source, 200),
      page: cap(d.page, 300),
      user_agent: cap(req.headers.get('user-agent'), 300),
      ip_hash: iph,
    });

  return json({ ok: true }, 200, origin);
});
