import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { TranslationKey } from '../i18n/translations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <a class="logo wh-logo" routerLink="/">
        <span class="logo-wiki">Wiki</span><span class="logo-hunt">Hunt</span>
      </a>

      <div class="header-right">
        <button class="btn-lang" (click)="toggleLang()" [title]="t('lang_toggle')">
          {{ t('lang_toggle') }}
        </button>

        @if (backLabel) {
          <button class="btn-secondary" (click)="back.emit()">{{ backLabel }}</button>
        }

        <div class="session">
          @if (currentUser) {
            <span class="session-name">{{ profileName }}</span>
            <button class="btn-signout" (click)="signOut()">{{ t('sign_out') }}</button>
          } @else if (currentUser === null) {
            <a class="btn-signin" routerLink="/auth">{{ t('sign_in') }}</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    .logo {
      font-size: 22px;
      letter-spacing: -1px;
      text-decoration: none;
      .logo-wiki { color: var(--text-primary); font-weight: 800; }
      .logo-hunt { color: var(--accent); font-weight: 800; }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-lang {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: border-color .15s, color .15s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    .session {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .session-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .btn-signout {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: border-color .15s;
      &:hover { border-color: var(--accent); color: var(--accent); }
    }

    .btn-signin {
      background: var(--accent);
      color: #0d1117;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: opacity .15s;
      &:hover { opacity: .85; }
    }
  `],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() backLabel: string | null = null;
  @Output() back = new EventEmitter<void>();

  currentUser: User | null | undefined = undefined;
  profileName = '';
  private sub?: Subscription;
  private langSub?: Subscription;

  constructor(private authService: AuthService, public langService: LanguageService) {}

  t(key: TranslationKey): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.sub = this.authService.user$.subscribe(async user => {
      this.currentUser = user;
      if (user) {
        const profile = await this.authService.getProfile();
        this.profileName = profile?.display_name ?? user.email?.split('@')[0] ?? '';
      } else {
        this.profileName = '';
      }
    });
    // Force re-render on language change
    this.langSub = this.langService.lang$.subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.langSub?.unsubscribe();
  }

  toggleLang(): void {
    this.langService.toggle();
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    localStorage.removeItem('wh_name');
  }
}
