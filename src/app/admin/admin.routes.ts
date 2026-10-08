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
      { path: 'ajustes', loadComponent: () => import('./pages/ajustes-page').then((m) => m.AjustesPage) },
      { path: 'textos', loadComponent: () => import('./pages/textos-page').then((m) => m.TextosPage) },
      { path: 'contenido', loadComponent: () => import('./pages/contenido-page').then((m) => m.ContenidoPage) },
      { path: 'contenido/inicio', loadComponent: () => import('./cms/inicio-editor').then((m) => m.InicioEditor) },
      { path: 'contenido/proyectos', loadComponent: () => import('./cms/proyectos-list').then((m) => m.ProyectosList) },
      { path: 'contenido/proyectos/editar', loadComponent: () => import('./cms/proyecto-editor').then((m) => m.ProyectoEditor) },
      { path: 'contenido/clientes', loadComponent: () => import('./cms/clientes-list').then((m) => m.ClientesList) },
      { path: 'contenido/clientes/editar', loadComponent: () => import('./cms/cliente-editor').then((m) => m.ClienteEditor) },
      { path: 'contenido/noticias', loadComponent: () => import('./cms/noticias-list').then((m) => m.NoticiasList) },
      { path: 'contenido/noticias/editar', loadComponent: () => import('./cms/noticia-editor').then((m) => m.NoticiaEditor) },
      { path: 'contenido/vacantes', loadComponent: () => import('./cms/vacantes-list').then((m) => m.VacantesList) },
      { path: 'contenido/vacantes/editar', loadComponent: () => import('./cms/vacante-editor').then((m) => m.VacanteEditor) },
      { path: 'contenido/empresa', loadComponent: () => import('./cms/empresa-editor').then((m) => m.EmpresaEditor) },
      { path: 'contenido/etapas', loadComponent: () => import('./cms/etapas-editor').then((m) => m.EtapasEditor) },
      { path: 'contenido/sectores', loadComponent: () => import('./cms/sectores-editor').then((m) => m.SectoresEditor) },
      { path: 'contenido/equipos', loadComponent: () => import('./cms/equipos-editor').then((m) => m.EquiposEditor) },
      { path: 'contenido/paginas', loadComponent: () => import('./cms/paginas-editor').then((m) => m.PaginasEditor) },
      { path: 'contenido/biblioteca', loadComponent: () => import('./cms/biblioteca').then((m) => m.Biblioteca) },
    ],
  },
];
