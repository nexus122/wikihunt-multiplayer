import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslationKey } from '../../core/i18n/translations';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent implements OnInit, OnDestroy {
  activeTab: 'login' | 'register' = 'login';
  email = '';
  password = '';
  magicLinkMode = false;
  loading = false;
  message = '';
  error = '';
  private langSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public lang: LanguageService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  get submitLabel(): string {
    if (this.loading) return this.t('daily_loading_btn');
    if (this.magicLinkMode) return this.t('auth_magic_link_btn');
    return this.activeTab === 'login' ? this.t('auth_sign_in_btn') : this.t('auth_sign_up_btn');
  }

  ngOnInit(): void {
    this.langSub = this.lang.lang$.subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  async signInWithGoogle(): Promise<void> {
    this.error = '';
    const redirectTo = `${window.location.origin}/setup-profile`;
    const { error } = await this.authService.signInWithGoogle(redirectTo);
    if (error) this.error = error.message;
  }

  async submitForm(): Promise<void> {
    if (!this.email.trim()) { this.error = this.t('auth_email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.error = this.t('auth_invalid_email') || 'Invalid email format';
      return;
    }
    this.loading = true;
    this.error = '';
    this.message = '';

    try {
      if (this.magicLinkMode) {
        const { error } = await this.authService.signInWithMagicLink(this.email.trim());
        if (error) { this.error = error.message; return; }
        this.message = this.t('auth_magic_sent');
        return;
      }

      if (!this.password) { this.error = this.t('auth_password'); return; }

      if (this.activeTab === 'login') {
        const { error } = await this.authService.signInWithEmail(this.email.trim(), this.password);
        if (error) { this.error = error.message; return; }
        await this.afterAuth();
      } else {
        const { error } = await this.authService.signUpWithEmail(this.email.trim(), this.password);
        if (error) { this.error = error.message; return; }
        this.message = this.t('auth_check_email');
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
