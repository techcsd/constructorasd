import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';

/** Private admin area. /admin/login is open; everything under /admin requires a Supabase session. */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'notas' },
      { path: 'notas', loadComponent: () => import('./pages/dev-notes-page').then((m) => m.DevNotesPage) },
      { path: 'leads', loadComponent: () => import('./pages/leads-page').then((m) => m.LeadsPage) },
      { path: 'apariencia', loadComponent: () => import('./pages/apariencia-page').then((m) => m.ApparienciaPage) },
    ],
  },
];
