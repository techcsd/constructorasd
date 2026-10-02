import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getSupabase } from './admin.supabase';

/**
 * Gate the authed admin area. On the server (prerender) it allows the shell to render; the real check
 * runs in the browser against the persisted Supabase session, redirecting to /admin/login if absent.
 */
export const adminGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;
  const sb = getSupabase(platformId);
  const router = inject(Router);
  const { data } = await sb!.auth.getSession();
  return data.session ? true : router.createUrlTree(['/admin/login']);
};
