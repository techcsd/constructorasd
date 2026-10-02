import { ChangeDetectionStrategy, Component, SecurityContext, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { Icon } from '../../ui/icon/icon';
import { DevNote, DevNoteInput, DevNotesService, NotePriority, NoteStatus } from '../dev-notes.service';

interface Draft {
  title: string;
  body: string;
  status: NoteStatus;
  priority: NotePriority;
  tags: string;
}
const EMPTY: Draft = { title: '', body: '', status: 'open', priority: 'medium', tags: '' };

@Component({
  selector: 'app-dev-notes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon],
  templateUrl: './dev-notes-page.html',
  styleUrl: './admin.scss',
})
export class DevNotesPage {
  private svc = inject(DevNotesService);
  private sanitizer = inject(DomSanitizer);

  readonly notes = signal<DevNote[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly filterStatus = signal<'all' | NoteStatus>('all');
  readonly search = signal('');

  readonly editingId = signal<string | 'new' | null>(null); // null = list; otherwise editor open
  readonly draft = signal<Draft>({ ...EMPTY });
  readonly preview = signal(false);
  readonly saving = signal(false);

  readonly priorities: NotePriority[] = ['high', 'medium', 'low'];

  readonly counts = computed(() => {
    const n = this.notes();
    return { all: n.length, open: n.filter((x) => x.status === 'open').length, done: n.filter((x) => x.status === 'done').length };
  });

  readonly filtered = computed(() => {
    const s = this.search().toLowerCase().trim();
    const st = this.filterStatus();
    const rank = { high: 0, medium: 1, low: 2 };
    return this.notes()
      .filter((n) => (st === 'all' || n.status === st))
      .filter((n) => !s || n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s) || n.tags.some((t) => t.toLowerCase().includes(s)))
      .sort((a, b) => rank[a.priority] - rank[b.priority]);
  });

  readonly previewHtml = computed(() => {
    const html = marked.parse(this.draft().body || '*(vacío)*', { async: false }) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  });

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.notes.set(await this.svc.list());
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  newNote(): void {
    this.draft.set({ ...EMPTY });
    this.preview.set(false);
    this.editingId.set('new');
  }

  edit(n: DevNote): void {
    this.draft.set({ title: n.title, body: n.body, status: n.status, priority: n.priority, tags: n.tags.join(', ') });
    this.preview.set(false);
    this.editingId.set(n.id);
  }

  cancel(): void {
    this.editingId.set(null);
    this.error.set(null);
  }

  patch<K extends keyof Draft>(k: K, v: Draft[K]): void {
    this.draft.update((d) => ({ ...d, [k]: v }));
  }

  private toInput(d: Draft): DevNoteInput {
    return {
      title: d.title.trim(),
      body: d.body,
      status: d.status,
      priority: d.priority,
      tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d.title.trim()) {
      this.error.set('El título es obligatorio.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const id = this.editingId();
      if (id === 'new') await this.svc.create(this.toInput(d));
      else if (id) await this.svc.update(id, this.toInput(d));
      this.editingId.set(null);
      await this.load();
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  async toggleStatus(n: DevNote): Promise<void> {
    try {
      await this.svc.update(n.id, { status: n.status === 'open' ? 'done' : 'open' });
      await this.load();
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  async remove(n: DevNote): Promise<void> {
    if (typeof window !== 'undefined' && !window.confirm(`¿Borrar "${n.title}"?`)) return;
    try {
      await this.svc.remove(n.id);
      await this.load();
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
