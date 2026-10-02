import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env';

/**
 * Lazily-created Supabase client for the /admin panel ONLY. Uses the public anon key + Supabase Auth
 * (email+password); never the service role (rule 5). Browser-only — never instantiated during prerender,
 * so supabase-js stays out of the public bundle (it's imported only by the lazy admin chunk) and never
 * touches window/localStorage on the server. `db.schema = 'web'` so `.from('dev_notes')` hits web.dev_notes.
 */
let client: SupabaseClient | null = null;

export function getSupabase(platformId: object): SupabaseClient | null {
  if (!isPlatformBrowser(platformId)) return null;
  if (!client) {
    // Cast: the `web` schema generic differs from the default `public`; we have no generated DB types,
    // so queries are untyped anyway. Runtime still targets `web` via the db.schema option above.
    client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'csd-admin-auth' },
      db: { schema: 'web' },
    }) as unknown as SupabaseClient;
  }
  return client;
}
