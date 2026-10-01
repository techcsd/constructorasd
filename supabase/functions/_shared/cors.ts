// CORS for the web-* edge functions. Allows the apex/www domain, Vercel preview URLs and localhost.
const STATIC_ALLOW = new Set([
  'https://constructorasd.com',
  'https://www.constructorasd.com',
  'http://localhost:4200',
]);
// Any *.vercel.app preview for this project.
const VERCEL_RE = /^https:\/\/constructorasd[a-z0-9-]*\.vercel\.app$/i;

export function allowOrigin(origin: string | null): string {
  if (!origin) return 'https://constructorasd.com';
  if (STATIC_ALLOW.has(origin) || VERCEL_RE.test(origin)) return origin;
  return 'https://constructorasd.com';
}

export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowOrigin(origin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
