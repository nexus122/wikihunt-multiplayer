import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  activeTab: 'login' | 'register' = 'login';
  email = '';
  password = '';
  magicLinkMode = false;
  loading = false;
  message = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  async signInWithGoogle(): Promise<void> {
    this.error = '';
    const redirectTo = `${window.location.origin}/setup-profile`;
    const { error } = await this.authService.signInWithGoogle(redirectTo);
    if (error) this.error = error.message;
  }

  async submitForm(): Promise<void> {
    if (!this.email.trim()) { this.error = 'Introduce tu email'; return; }
    this.loading = true;
    this.error = '';
    this.message = '';

    try {
      if (this.magicLinkMode) {
        const { error } = await this.authService.signInWithMagicLink(this.email.trim());
        if (error) { this.error = error.message; return; }
        this.message = 'Revisa tu email — te hemos enviado un enlace mágico.';
        return;
      }

      if (!this.password) { this.error = 'Introduce tu contraseña'; return; }

      if (this.activeTab === 'login') {
        const { error } = await this.authService.signInWithEmail(this.email.trim(), this.password);
        if (error) { this.error = error.message; return; }
        await this.afterAuth();
      } else {
        const { error } = await this.authService.signUpWithEmail(this.email.trim(), this.password);
        if (error) { this.error = error.message; return; }
        this.message = 'Cuenta creada. Revisa tu email para confirmarla.';
      }
    } finally {
      this.loading = false;
    }
  }

  private async afterAuth(): Promise<void> {
    const profile = await this.authService.getProfile();
    if (profile) {
      localStorage.setItem('wh_name', profile.display_name);
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/setup-profile']);
    }
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.error = '';
    this.message = '';
    this.magicLinkMode = false;
  }
}
