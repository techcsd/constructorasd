// setup-resend.mjs — read the Resend API key from the SGC Vault (authorized by Xaviel), set it as the
// RESEND_API_KEY edge secret on both projects, and pick an already-verified Resend sender domain so email
// works without new DNS. Prints only non-secret info (domain names, status). Never logs the key.
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

async function q(ref, sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!r.ok) throw new Error(`query ${ref}: ${r.status} ${(await r.text()).slice(0, 160)}`);
  return r.json();
}
async function setSecret(ref, name, value) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/secrets`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name, value }]),
  });
  if (!r.ok) throw new Error(`secret ${ref}: ${r.status} ${(await r.text()).slice(0, 160)}`);
}

// 1) Read the key from the SGC Vault (try dev, then prod).
let key = '';
for (const ref of [REFS.dev, REFS.prod]) {
  try {
    const rows = await q(
      ref,
      "select decrypted_secret from vault.decrypted_secrets where name = 'resend_api_key' limit 1",
    );
    if (rows?.[0]?.decrypted_secret) {
      key = rows[0].decrypted_secret;
      console.log(`✔ found resend_api_key in vault of ${ref === REFS.dev ? 'sgc-dev' : 'csd-core'}`);
      break;
    }
  } catch (e) {
    console.log(`  (vault read on ${ref} failed: ${e.message})`);
  }
}
if (!key) {
  console.error('✖ resend_api_key not found in either Vault. Put RESEND_API_KEY in .env.local instead.');
  process.exit(1);
}

// 2) List verified Resend domains to choose a sender that already works (no new DNS).
const dres = await fetch('https://api.resend.com/domains', { headers: { Authorization: 'Bearer ' + key } });
const domains = dres.ok ? (await dres.json()).data ?? [] : [];
console.log('Resend domains:', domains.map((d) => `${d.name} [${d.status}]`).join(', ') || '(none / no list access)');
const verified = domains.find((d) => d.status === 'verified');

// 3) Set RESEND_API_KEY on both projects; set MAIL_FROM to a verified sender if available.
for (const [env, ref] of Object.entries(REFS)) {
  await setSecret(ref, 'RESEND_API_KEY', key);
  if (verified) await setSecret(ref, 'MAIL_FROM', `Constructora SD <noreply@${verified.name}>`);
  console.log(`✔ ${env}: RESEND_API_KEY set${verified ? `, MAIL_FROM=noreply@${verified.name}` : ''}`);
}
if (!verified) {
  console.log('⚠ no verified Resend domain found — emails may fail until a sender domain is verified.');
}
