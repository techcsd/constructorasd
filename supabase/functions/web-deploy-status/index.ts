// web-deploy-status (WK2) — report the latest PRODUCTION deployment's state to the admin publish bar.
// Inert until a VERCEL_TOKEN secret is set: returns { configured: false } so the bar falls back to its
// token-free version.json polling. Verifies the caller is the admin. The Vercel token NEVER reaches the
// browser — it lives only in this edge function's secrets.
import { admin, json } from '../_shared/util.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ADMIN_EMAIL = 'tecnologia@constructorasd.com';
const PROJECT = Deno.env.get('VERCEL_PROJECT_ID') ?? '';
const TEAM = Deno.env.get('VERCEL_TEAM') ?? ''; // team slug

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== 'POST' && req.method !== 'GET') return json({ error: 'method' }, 405, origin);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'no_token' }, 401, origin);
  const { data, error } = await admin().auth.getUser(token);
  if (error || (data.user?.email ?? '').toLowerCase() !== ADMIN_EMAIL) {
    return json({ error: 'forbidden' }, 403, origin);
  }

  const vt = Deno.env.get('VERCEL_TOKEN');
  if (!vt || !PROJECT) return json({ configured: false }, 200, origin);

  const qs = new URLSearchParams({ projectId: PROJECT, target: 'production', limit: '1' });
  if (TEAM) qs.set('slug', TEAM);
  try {
    const r = await fetch(`https://api.vercel.com/v6/deployments?${qs}`, {
      headers: { Authorization: 'Bearer ' + vt },
    });
    if (!r.ok) return json({ configured: true, error: `vercel_${r.status}` }, 200, origin);
    const body = await r.json();
    const d = body.deployments?.[0];
    if (!d) return json({ configured: true, state: 'UNKNOWN' }, 200, origin);
    return json({
      configured: true,
      state: d.state ?? d.readyState ?? 'UNKNOWN', // QUEUED | BUILDING | READY | ERROR | CANCELED
      url: d.url ? `https://${d.url}` : null,
      createdAt: d.created ?? d.createdAt ?? null,
      inspectorUrl: d.inspectorUrl ?? null,
    }, 200, origin);
  } catch (e) {
    return json({ configured: true, error: (e as Error).message }, 200, origin);
  }
});
