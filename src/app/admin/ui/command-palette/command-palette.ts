import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../admin-auth.service';

interface Command {
  readonly label: string;
  readonly hint?: string;
  readonly kind: 'ir' | 'acción';
  run(): unknown;
}

// Ctrl/Cmd+K command palette (WN4) — fuzzy jump across admin routes + a few actions. Keyboard-first,
// admin-only (lives in the lazy admin chunk). Browser-only: HostListener bindings never fire during SSR.
@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  readonly open = signal(false);
  readonly query = signal('');
  readonly active = signal(0);

  private readonly commands: readonly Command[] = [
    ...(
      [
        ['Panel', '/admin/panel'],
        ['Inicio', '/admin/contenido/inicio'],
        ['Proyectos', '/admin/contenido/proyectos'],
        ['Clientes', '/admin/contenido/clientes'],
        ['Noticias', '/admin/contenido/noticias'],
        ['Vacantes', '/admin/contenido/vacantes'],
        ['Empresa', '/admin/contenido/empresa'],
        ['Etapas', '/admin/contenido/etapas'],
        ['Sectores', '/admin/contenido/sectores'],
        ['Equipos', '/admin/contenido/equipos'],
        ['Páginas (SEO)', '/admin/contenido/paginas'],
        ['Textos del sitio', '/admin/textos'],
        ['Biblioteca', '/admin/contenido/biblioteca'],
        ['Export JSON', '/admin/contenido'],
        ['Leads', '/admin/leads'],
        ['Dev notes', '/admin/notas'],
        ['Ajustes', '/admin/ajustes'],
        ['Apariencia', '/admin/apariencia'],
      ] as const
    ).map(
      ([label, path]): Command => ({
        label,
        hint: 'Ir a la sección',
        kind: 'ir',
        run: () => this.router.navigate([path]),
      }),
    ),
    {
      label: 'Ver el sitio',
      hint: 'Abre constructorasd.com en otra pestaña',
      kind: 'acción',
      run: () => window.open('/', '_blank'),
    },
    {
      label: 'Cerrar sesión',
      hint: 'Salir del panel',
      kind: 'acción',
      run: async () => {
        await this.auth.signOut();
        this.router.navigate(['/admin/login']);
      },
    },
  ];

  readonly results = computed<readonly Command[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.commands;
    const scored = this.commands
      .map((c) => ({ c, score: this.score(c.label.toLowerCase(), q) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score);
    return scored.map((x) => x.c);
  });

  constructor(
    private router: Router,
    private auth: AdminAuthService,
  ) {}

  // Subsequence match; lower score = better (contiguous / early matches rank first). -1 = no match.
  private score(label: string, q: string): number {
    const idx = label.indexOf(q);
    if (idx >= 0) return idx; // contiguous substring — best, ranked by position
    let li = 0;
    let gaps = 0;
    for (const ch of q) {
      const found = label.indexOf(ch, li);
      if (found < 0) return -1;
      gaps += found - li;
      li = found + 1;
    }
    return 100 + gaps; // fuzzy subsequence — always after substrings
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.open() ? this.close() : this.openPalette();
      return;
    }
    if (!this.open()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.exec(this.active());
    }
  }

  openPalette(): void {
    this.query.set('');
    this.active.set(0);
    this.open.set(true);
    queueMicrotask(() => this.input()?.nativeElement.focus());
  }

  close(): void {
    this.open.set(false);
  }

  onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  private move(delta: number): void {
    const n = this.results().length;
    if (!n) return;
    this.active.set((this.active() + delta + n) % n);
  }

  async exec(i: number): Promise<void> {
    const cmd = this.results()[i];
    if (!cmd) return;
    this.close();
    await cmd.run();
  }
}
