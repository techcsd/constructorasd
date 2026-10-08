import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CountUp } from '../../core/count-up.directive';
import { PROJECTS } from '../../../content/projects';
import { CLIENTS } from '../../../content/clients';
import { POSTS } from '../../../content/posts';
import { JOBS } from '../../../content/jobs';
import { CmsService } from '../cms/cms.service';
import { LeadsAdminService, type Lead } from '../leads.service';
import { DevNotesService, type DevNote } from '../dev-notes.service';

interface Tile {
  readonly label: string;
  readonly value: number;
  readonly href: string;
  readonly animate: boolean; // count-up only for values known at first render
}

// Panel (dashboard, brief §6). Landing screen of the admin: stat tiles with count-up, publish state,
// quick actions, and recent activity (dev notes + leads). All data from existing services — no new tables.
@Component({
  selector: 'app-panel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CountUp],
  templateUrl: './panel-page.html',
  styleUrl: './admin.scss',
})
export class PanelPage {
  // Synchronous content counts — known at first render, so they count up on view.
  readonly content: readonly Tile[] = [
    { label: 'Proyectos', value: PROJECTS.length, href: '/admin/contenido/proyectos', animate: true },
    { label: 'Clientes', value: CLIENTS.length, href: '/admin/contenido/clientes', animate: true },
    { label: 'Noticias', value: POSTS.length, href: '/admin/contenido/noticias', animate: true },
    { label: 'Vacantes', value: JOBS.length, href: '/admin/contenido/vacantes', animate: true },
  ];

  readonly unread = signal<number | null>(null);
  readonly notesCount = signal<number | null>(null);
  readonly loaded = signal(false);
  readonly publish = signal<'loading' | 'clean' | 'changes'>('loading');
  readonly recentNotes = signal<readonly DevNote[]>([]);
  readonly recentLeads = signal<readonly Lead[]>([]);

  constructor(
    private cms: CmsService,
    private leads: LeadsAdminService,
    private notes: DevNotesService,
  ) {
    inject(Title).setTitle('Panel — CSD');
    void this.load();
  }

  private async load(): Promise<void> {
    // Fire the independent reads together; each failure degrades to a neutral value, never blocks the others.
    const [unread, leadList, noteList, dirty] = await Promise.all([
      this.leads.unreadCount().catch(() => 0),
      this.leads.leads().catch(() => [] as Lead[]),
      this.notes.list().catch(() => [] as DevNote[]),
      this.cms.unpublishedChanges().catch(() => false),
    ]);
    this.unread.set(unread);
    this.recentLeads.set(leadList.slice(0, 5));
    this.notesCount.set(noteList.filter((n) => !n.archived).length);
    this.recentNotes.set(noteList.filter((n) => !n.archived).slice(0, 5));
    this.publish.set(dirty ? 'changes' : 'clean');
    this.loaded.set(true);
  }

  // Short Spanish relative time: "ahora", "hace 5 min", "hace 3 h", "hace 2 d", else a date.
  ago(iso: string): string {
    const then = new Date(iso).getTime();
    if (!then) return '';
    const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (s < 60) return 'ahora';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} d`;
    return new Date(iso).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
  }
}
