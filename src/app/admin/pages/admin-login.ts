import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin.scss',
})
export class AdminLogin {
  private auth = inject(AdminAuthService);
  private router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly newPassword = signal('');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly recovery = this.auth.recovery; // set-password mode after an invite/reset link

  constructor() {
    inject(Title).setTitle('Panel — CSD');
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  async submit(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    const err = await this.auth.signIn(this.email(), this.password());
    this.busy.set(false);
    if (err) this.error.set(err === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : err);
    else this.router.navigate(['/admin']);
  }

  async setPassword(): Promise<void> {
    if (this.busy()) return;
    if (this.newPassword().length < 8) {
      this.error.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const err = await this.auth.setPassword(this.newPassword());
    this.busy.set(false);
    if (err) this.error.set(err);
    else this.router.navigate(['/admin']);
  }
}
