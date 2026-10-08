import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DevNotesService, DevNote, NoteVersion } from '../dev-notes.service';
import { MarkdownEditor } from '../ui/markdown-editor/markdown-editor';

type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';
const DRAFT_KEY = (id: string) => `csd-admin:note-draft:${id}`;

const TEMPLATES: Record<string, string> = {
  HANDOFF: '## Hecho\n- \n\n## Pendiente\n- \n\n## Bloqueos\n- \n\n## Próximos pasos\n- \n',
  'Decisión': '## Contexto\n\n## Opciones\n1. \n2. \n\n## Decisión\n\n## Consecuencias\n',
  Bug: '## Pasos\n1. \n\n## Esperado\n\n## Actual\n\n## Causa\n\n## Fix\n',
};

@Component({
  selector: 'app-admin-dev-notes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MarkdownEditor, DatePipe],
  templateUrl: './dev-notes-page.html',
  styleUrl: './admin.scss',
})
export class DevNotesPage implements OnDestroy {
  private svc = inject(DevNotesService);

  readonly notes = signal<DevNote[]>([]);
  readonly selected = signal<DevNote | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly showArchived = signal(false);
  readonly saveState = signal<SaveState>('idle');
  readonly savedAt = signal<number>(0);
  readonly conflict = signal<DevNote | null>(null);
  readonly versions = signal<NoteVersion[]>([]);
  readonly showVersions = signal(false);
  readonly fullscreen = signal(false);
  readonly flash = signal('');
  readonly templates = Object.keys(TEMPLATES);

  // editor fields
  title = ''; body = ''; tags = ''; status: DevNote['status'] = 'open'; priority: DevNote['priority'] = 'medium';
  private loadedUpdatedAt = '';
  private debounce?: ReturnType<typeof setTimeout>;
  private retry = 0;
  private lastSnapshotLen = 0;
  private lastSnapshotAt = 0;

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    return this.notes()
      .filter((n) => n.archived === this.showArchived())
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.tags.join(' ').toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at));
  });

  constructor() { void this.load(); }
  ngOnDestroy(): void { clearTimeout(this.debounce); }

  async load(): Promise<void> {
    this.loading.set(true);
    try { this.notes.set(await this.svc.list()); } catch (e) { this.error.set((e as Error).message); } finally { this.loading.set(false); }
  }

  select(n: DevNote): void {
    void this.flush();
    this.selected.set(n);
    this.title = n.title; this.body = n.body; this.tags = n.tags.join(', '); this.status = n.status; this.priority = n.priority;
    this.loadedUpdatedAt = n.updated_at;
    this.saveState.set('idle'); this.conflict.set(null); this.showVersions.set(false);
    this.lastSnapshotLen = n.body.length; this.lastSnapshotAt = Date.now();
    // restore a newer local draft if present
    try {
      const raw = localStorage.getItem(DRAFT_KEY(n.id));
      if (raw) {
        const d = JSON.parse(raw);
        if (d.updated_at && d.updated_at > n.updated_at && confirm('Hay un borrador local más reciente de esta nota. ¿Restaurarlo?')) {
          this.title = d.title; this.body = d.body; this.tags = d.tags;
        }
      }
    } catch { /* ignore */ }
  }

  async newNote(template?: string): Promise<void> {
    const body = template ? TEMPLATES[template] ?? '' : '';
    try {
      const n = await this.svc.create({ title: '', body, status: 'open', priority: 'medium', tags: [], template: template ?? null });
      this.notes.set([n, ...this.notes()]);
      this.select(n);
    } catch (e) { this.error.set((e as Error).message); }
  }

  onField(): void {
    this.backupLocal();
    this.saveState.set('saving');
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => void this.doSave(), 700);
  }

  private patch(): Partial<DevNote> {
    return { title: this.title || this.body.split('\n')[0].slice(0, 80) || 'Sin título', body: this.body, tags: this.tags.split(',').map((t) => t.trim()).filter(Boolean), status: this.status, priority: this.priority };
  }
  private backupLocal(): void {
    const n = this.selected(); if (!n) return;
    try { localStorage.setItem(DRAFT_KEY(n.id), JSON.stringify({ title: this.title, body: this.body, tags: this.tags, updated_at: new Date().toISOString() })); } catch { /* quota */ }
  }

  private async doSave(): Promise<void> {
    const n = this.selected(); if (!n) return;
    if (!navigator.onLine) { this.saveState.set('offline'); return; }
    try {
      const res = await this.svc.save(n.id, this.patch(), this.loadedUpdatedAt);
      if (res.ok) {
        this.loadedUpdatedAt = res.updated_at; this.retry = 0;
        this.saveState.set('saved'); this.savedAt.set(Date.now());
        this.maybeSnapshot();
        localStorage.removeItem(DRAFT_KEY(n.id));
        // reflect in the list
        this.notes.set(this.notes().map((x) => x.id === n.id ? { ...x, ...this.patch(), updated_at: res.updated_at } as DevNote : x));
      } else {
        this.conflict.set(res.server); this.saveState.set('error');
      }
    } catch {
      this.saveState.set('error');
      if (this.retry < 10) { this.retry++; setTimeout(() => void this.doSave(), Math.min(30000, 1000 * 2 ** this.retry)); }
    }
  }

  private maybeSnapshot(): void {
    const n = this.selected(); if (!n) return;
    if (Math.abs(this.body.length - this.lastSnapshotLen) > 40 && Date.now() - this.lastSnapshotAt > 5 * 60 * 1000) {
      void this.svc.saveVersion(n.id, this.title, this.body);
      this.lastSnapshotLen = this.body.length; this.lastSnapshotAt = Date.now();
    }
  }

  async flush(): Promise<void> { clearTimeout(this.debounce); if (this.selected() && this.saveState() === 'saving') await this.doSave(); }

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const inField = e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void this.forceSave(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !inField) { e.preventDefault(); void this.newNote(); }
    else if (e.key === 'Escape' && this.fullscreen()) { this.fullscreen.set(false); }
    else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !inField) {
      const list = this.filtered();
      if (!list.length) return;
      e.preventDefault();
      const i = list.findIndex((x) => x.id === this.selected()?.id);
      const next = e.key === 'ArrowDown' ? Math.min(list.length - 1, i + 1) : Math.max(0, i - 1);
      this.select(list[i < 0 ? 0 : next]);
    }
  }
  @HostListener('window:beforeunload')
  onUnload(): void {
    this.backupLocal();
    // flush the latest edit server-side too (survives unload via fetch keepalive)
    const n = this.selected();
    if (n && (this.saveState() === 'saving' || this.saveState() === 'error')) this.svc.unloadSave(n.id, this.patch());
  }

  toggleFullscreen(): void { this.fullscreen.update((v) => !v); }

  async forceSave(): Promise<void> {
    const n = this.selected(); if (!n) return;
    await this.doSave();
    await this.svc.saveVersion(n.id, this.title, this.body);
    this.lastSnapshotLen = this.body.length; this.lastSnapshotAt = Date.now();
  }

  async toggleVersions(): Promise<void> {
    const n = this.selected(); if (!n) return;
    this.showVersions.set(!this.showVersions());
    if (this.showVersions()) this.versions.set(await this.svc.listVersions(n.id));
  }
  async restore(v: NoteVersion): Promise<void> {
    const n = this.selected(); if (!n) return;
    await this.svc.saveVersion(n.id, this.title, this.body); // snapshot current first
    this.title = v.title; this.body = v.body; this.onField();
    this.showVersions.set(false);
  }

  resolveConflict(keep: 'mine' | 'server'): void {
    const s = this.conflict(); if (!s) return;
    if (keep === 'server') { this.title = s.title; this.body = s.body; this.tags = s.tags.join(', '); this.status = s.status; this.priority = s.priority; }
    this.loadedUpdatedAt = s.updated_at;
    this.conflict.set(null);
    this.onField();
  }

  /** Duplicate a note (title + " (copia)"), select the copy. */
  async duplicate(n: DevNote): Promise<void> {
    void this.flush();
    try {
      const copy = await this.svc.create({ title: (n.title || 'Sin título') + ' (copia)', body: n.body, status: n.status, priority: n.priority, tags: n.tags, template: n.template });
      this.notes.set([copy, ...this.notes()]);
      this.select(copy);
    } catch (e) { this.error.set((e as Error).message); }
  }

  /** Copy the current note as Markdown (# title + body) to the clipboard. */
  copyMd(): void {
    const n = this.selected(); if (!n) return;
    void navigator.clipboard.writeText(`# ${this.title}\n\n${this.body}`);
    this.flash.set('Copiado como Markdown');
    setTimeout(() => this.flash.set(''), 1400);
  }

  async pin(n: DevNote): Promise<void> { await this.svc.setFlags(n.id, { pinned: !n.pinned }); n.pinned = !n.pinned; this.notes.set([...this.notes()]); }
  async archive(n: DevNote): Promise<void> { await this.svc.setFlags(n.id, { archived: !n.archived }); n.archived = !n.archived; this.notes.set([...this.notes()]); if (this.selected()?.id === n.id) this.selected.set(null); }
  async del(n: DevNote): Promise<void> { if (!confirm('¿Eliminar esta nota?')) return; await this.svc.remove(n.id); this.notes.set(this.notes().filter((x) => x.id !== n.id)); if (this.selected()?.id === n.id) this.selected.set(null); }

  exportMd(): void {
    const n = this.selected(); if (!n) return;
    const blob = new Blob([`# ${this.title}\n\n${this.body}`], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${this.title || 'nota'}.md`; a.click();
  }

  savedAgo(): string {
    const s = Math.round((Date.now() - this.savedAt()) / 1000);
    return s < 5 ? 'hace un momento' : s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`;
  }
}
