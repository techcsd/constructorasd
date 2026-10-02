// gen-content.mjs — prebuild: fetch the editable site content from web.site_content and write it to
// src/content/_overrides.json, which the content modules merge over their TS seeds. Reads supabaseUrl +
// anon key from the generated environment.ts (so it uses the build's env). Best-effort: on any failure it
// writes {} and the build falls back to the hardcoded seeds — the build NEVER breaks.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'content', '_overrides.json');

function envFromGenerated() {
  try {
    const env = readFileSync(join(ROOT, 'src', 'environments', 'environment.ts'), 'utf8');
    const url = env.match(/"supabaseUrl"\s*:\s*"([^"]+)"/)?.[1];
    const anon = env.match(/"supabaseAnonKey"\s*:\s*"([^"]+)"/)?.[1];
    return { url, anon };
  } catch {
    return {};
  }
}

async function main() {
  const { url, anon } = envFromGenerated();
  if (!url || !anon) {
    writeFileSync(OUT, '{}\n');
    console.log('[gen-content] ⏭  no supabase env — using seeds ({}).');
    return;
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/site_content?select=key,data`, {
      headers: { apikey: anon, Authorization: 'Bearer ' + anon, 'Accept-Profile': 'web' },
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
    const rows = await res.json();
    const out = {};
    for (const r of rows) out[r.key] = r.data;
    writeFileSync(OUT, JSON.stringify(out) + '\n');
    console.log(`[gen-content] ✓ ${rows.length} section(s) from DB → _overrides.json.`);
  } catch (e) {
    writeFileSync(OUT, '{}\n');
    console.log(`[gen-content] ⚠ ${e.message} — using seeds ({}).`);
  }
}

await main();
