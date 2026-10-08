import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AdminAuthService } from '../admin-auth.service';
import { PublishBar } from '../ui/publish-bar/publish-bar';
import { CommandPalette } from '../ui/command-palette/command-palette';

const RAIL_KEY = 'csd-admin-rail';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PublishBar, CommandPalette],
  templateUrl: './admin-shell.html',
  styleUrl: './admin.scss',
})
export class AdminShell {
  private auth = inject(AdminAuthService);
  private router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly email = this.auth.email;

  // Collapsed sidebar (240 ↔ 64 px), remembered across sessions. SSR renders expanded.
  readonly collapsed = signal(this.isBrowser && localStorage.getItem(RAIL_KEY) === '1');

  constructor() {
    inject(Title).setTitle('Panel — CSD');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  toggleRail(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    if (this.isBrowser) localStorage.setItem(RAIL_KEY, next ? '1' : '0');
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
