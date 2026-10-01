// probe-sender.mjs — find a Resend sender domain already verified for this account (SGC's), set it as
// MAIL_FROM on both projects so email works now. Reads the key from the SGC Vault; sends one probe email.
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Resolve project refs by NAME via the Management API — never hardcode the prod ref
// (verify-sin-ref-hardcodeado bans the literal). dev = sgc-dev · prod = csd-core.
const projects = await (
  await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: 'Bearer ' + TOKEN } })
).json();
const byName = (n) => projects.find((p) => p.name === n)?.id;
const REFS = { dev: byName('sgc-dev'), prod: byName('csd-core') };
if (!REFS.dev || !REFS.prod) {
  console.error('✖ could not resolve sgc-dev / csd-core by name');
  process.exit(1);
}
const CANDIDATES = ['sgcconstructorasd.com', 'constructorasd.com'];
const PROBE_TO = 'tecnologia@constructorasd.com';

async function q(ref, sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return r.ok ? r.json() : [];
}
async function setSecret(ref, name, value) {
  await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name, value }]),
  });
}

const rows = await q(REFS.dev, "select decrypted_secret from vault.decrypted_secrets where name='resend_api_key' limit 1");
const key = rows?.[0]?.decrypted_secret;
if (!key) { console.error('✖ no resend key in vault'); process.exit(1); }

let winner = '';
for (const dom of CANDIDATES) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Constructora SD <noreply@${dom}>`,
      to: [PROBE_TO],
      subject: `[probe] sender check ${dom}`,
      text: `Prueba de verificación del remitente ${dom} para el sitio web de CSD. Puedes ignorar este correo.`,
    }),
  });
  const body = await r.json().catch(() => ({}));
  console.log(`${dom}: ${r.status} ${r.ok ? 'id=' + body.id : JSON.stringify(body).slice(0, 90)}`);
  if (r.ok) { winner = dom; break; }
}

if (winner) {
  for (const ref of Object.values(REFS)) await setSecret(ref, 'MAIL_FROM', `Constructora SD <noreply@${winner}>`);
  console.log(`✔ MAIL_FROM set to noreply@${winner} on dev + prod.`);
} else {
  console.log('⚠ no candidate domain verified. Need to verify a sender domain in Resend.');
}
