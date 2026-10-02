// web-publish — triggers a site rebuild so content/appearance changes go live. Verifies the caller is the
// admin (JWT email), then POSTs the Vercel deploy hook (URL in the VERCEL_DEPLOY_HOOK secret).
import { admin, json } from '../_shared/util.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ADMIN_EMAIL = 'tecnologia@constructorasd.com';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, origin);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'no_token' }, 401, origin);

  const { data, error } = await admin().auth.getUser(token);
  if (error || (data.user?.email ?? '').toLowerCase() !== ADMIN_EMAIL) {
    return json({ error: 'forbidden' }, 403, origin);
  }

  const hook = Deno.env.get('VERCEL_DEPLOY_HOOK');
  if (!hook) return json({ error: 'deploy_hook_not_configured' }, 500, origin);

  try {
    const r = await fetch(hook, { method: 'POST' });
    return json({ ok: r.ok, status: r.status }, r.ok ? 200 : 502, origin);
  } catch (e) {
    return json({ error: (e as Error).message }, 502, origin);
  }
});
