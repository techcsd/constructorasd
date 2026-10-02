import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin.scss',
})
export class AdminShell {
  private auth = inject(AdminAuthService);
  private router = inject(Router);
  readonly email = this.auth.email;

  // Future modules — shown as disabled so the panel reads as a growing tool.
  readonly soon = ['Contenido'];

  constructor() {
    inject(Title).setTitle('Panel — CSD');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
