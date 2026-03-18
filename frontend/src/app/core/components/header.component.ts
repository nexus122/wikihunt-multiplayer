import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { ThemeService, Theme } from '../services/theme.service';
import { TranslationKey } from '../i18n/translations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <a class="logo wh-logo" routerLink="/" aria-label="WikiHunt - Home">
        <span class="logo-wiki" aria-hidden="true">Wiki</span><span class="logo-hunt" aria-hidden="true">Hunt</span>
      </a>

      <div class="header-right">
        @if (backLabel) {
          <button class="btn-back" (click)="back.emit()">← {{ backLabel }}</button>
        }
        <button class="avatar-btn" [class.logged-in]="!!currentUser" (click)="panelOpen = true"
          [attr.aria-label]="currentUser ? profileName || 'User menu' : 'Open menu'"
          [attr.aria-expanded]="panelOpen">
          @if (currentUser) {
            <span class="avatar-initial" aria-hidden="true">{{ (profileName[0] || '?').toUpperCase() }}</span>
          } @else {
            <span class="avatar-menu-icon" aria-hidden="true">&#9776;</span>
          }
        </button>
      </div>
    </header>

    @if (panelOpen) {
      <div class="panel-backdrop" (click)="panelOpen = false" aria-hidden="true"></div>
    }

    <aside class="user-panel" [class.open]="panelOpen" role="navigation" aria-label="User menu" [attr.aria-hidden]="!panelOpen">
      <div class="panel-header">
        <span class="panel-title">{{ t('panel_title') }}</span>
        <button class="panel-close" (click)="panelOpen = false" aria-label="Close menu">✕</button>
      </div>

      <div class="panel-section">
        @if (currentUser) {
          <div class="panel-profile">
            <div class="panel-avatar">{{ (profileName[0] || '?').toUpperCase() }}</div>
            <div class="panel-profile-info">
              <span class="panel-profile-name">{{ profileName }}</span>
              <span class="panel-profile-sub" [title]="currentUser?.email || ''">{{ currentUser.email }}</span>
            </div>
          </div>
          @if (streak > 0) {
            <div class="panel-streak">
              <span class="streak-fire">🔥</span>
              <span class="streak-text"><strong>{{ streak }}</strong> {{ t('panel_streak') }}</span>
            </div>
          }
          <button class="panel-btn panel-btn-outline" (click)="signOut()">{{ t('sign_out') }}</button>
        } @else if (currentUser === null) {
          <div class="panel-guest">
            <svg class="guest-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-5.3 0-8 2.7-8 4v1h16v-1c0-1.3-2.7-4-8-4z"/>
            </svg>
            <span class="panel-guest-label">{{ t('panel_guest') }}</span>
          </div>
          <a class="panel-btn panel-btn-primary" routerLink="/auth" (click)="panelOpen = false">{{ t('sign_in') }}</a>
        } @else {
          <div class="panel-loading">···</div>
        }
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section">
        <fieldset style="border:none;padding:0;margin:0">
          <legend class="panel-section-label">{{ t('panel_theme') }}</legend>
          <div class="theme-toggle">
            <button class="theme-opt" [class.active]="themeService.current === 'dark'" (click)="setTheme('dark')"
              [attr.aria-pressed]="themeService.current === 'dark'" [attr.aria-label]="t('theme_opt_dark')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              {{ t('theme_opt_dark') }}
            </button>
            <button class="theme-opt" [class.active]="themeService.current === 'light'" (click)="setTheme('light')"
              [attr.aria-pressed]="themeService.current === 'light'" [attr.aria-label]="t('theme_opt_light')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              {{ t('theme_opt_light') }}
            </button>
          </div>
        </fieldset>
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section">
        <fieldset style="border:none;padding:0;margin:0">
          <legend class="panel-section-label">{{ t('panel_language') }}</legend>
          <div class="lang-toggle">
            <button class="lang-opt" [class.active]="langService.current === 'es'" (click)="setLang('es')"
              [attr.aria-pressed]="langService.current === 'es'" aria-label="Español">{{ t('lang_opt_es') }}</button>
            <button class="lang-opt" [class.active]="langService.current === 'en'" (click)="setLang('en')"
              [attr.aria-pressed]="langService.current === 'en'" aria-label="English">{{ t('lang_opt_en') }}</button>
          </div>
        </fieldset>
      </div>

      <div class="panel-divider"></div>

      <div class="panel-section panel-links">
        <a class="panel-link" routerLink="/daily" (click)="panelOpen = false">📅 {{ t('daily_btn') }}</a>
        <a class="panel-link" routerLink="/leaderboard" (click)="panelOpen = false">🏆 {{ t('leaderboard_btn') }}</a>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      min-height: 52px;
      position: relative;
      z-index: 300; /* --z-header */
    }

    .logo {
      font-size: 22px;
      letter-spacing: -1px;
      text-decoration: none;
      flex-shrink: 0;
      .logo-wiki { color: var(--text-primary); font-weight: 800; }
      .logo-hunt { color: var(--accent); font-weight: 800; }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-back {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm, 6px);
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: border-color .15s, color .15s, background .15s;
      &:hover { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,.06); }
    }

    .avatar-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: none;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background .15s;

      &:hover { background: var(--border-color); }

      &.logged-in {
        background: rgba(88,166,255,.18);
        border-radius: 50%;
      }
    }

    .avatar-initial {
      font-size: 15px;
      font-weight: 800;
      color: var(--accent);
      line-height: 1;
    }

    .avatar-menu-icon {
      font-size: 17px;
      color: var(--text-primary);
      line-height: 1;
    }

    /* ── Panel backdrop ── */
    .panel-backdrop {
      position: fixed;
      inset: 0;
      background: var(--overlay-bg, rgba(0,0,0,.6));
      z-index: 400; /* --z-panel-backdrop */
      backdrop-filter: blur(2px);
      animation: fade-in .15s ease;
    }

    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    /* ── Side panel ── */
    .user-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border-color);
      z-index: 500; /* --z-panel */
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform .25s cubic-bezier(.4,0,.2,1);
      box-shadow: var(--shadow-panel, -4px 0 24px rgba(0,0,0,.4));

      &.open { transform: translateX(0); }
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .panel-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 16px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      &:hover { color: var(--text-primary); background: var(--bg-tertiary); }
    }

    .panel-section {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .panel-divider {
      height: 1px;
      background: var(--border-color);
      flex-shrink: 0;
    }

    /* Profile (logged in) */
    .panel-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .panel-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(88,166,255,.15);
      border: 2px solid rgba(88,166,255,.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: var(--accent);
      flex-shrink: 0;
    }

    .panel-profile-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .panel-profile-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .panel-profile-sub {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Guest state */
    .panel-guest {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
    }

    .guest-icon {
      width: 48px;
      height: 48px;
      color: var(--text-secondary);
      opacity: .5;
    }

    .panel-guest-label {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .panel-loading {
      text-align: center;
      color: var(--text-secondary);
      font-size: 20px;
      padding: 12px 0;
      letter-spacing: 4px;
    }

    .panel-streak {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--warning-tint, rgba(255,149,0,.08));
      border: 1px solid var(--warning-border, rgba(255,149,0,.25));
      border-radius: 8px;
    }

    .streak-fire { font-size: 18px; line-height: 1; }

    .streak-text {
      font-size: 13px;
      color: var(--text-secondary);
      strong { color: #ff9500; font-size: 16px; }
    }

    /* Buttons */
    .panel-btn {
      display: block;
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: all .15s;
    }

    .panel-btn-primary {
      background: var(--accent);
      color: #0d1117;
      border: none;
      &:hover { opacity: .85; }
    }

    .panel-btn-outline {
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      &:hover { border-color: var(--danger); color: var(--danger); }
    }

    /* Section label */
    .panel-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--text-secondary);
    }

    /* Language toggle */
    .lang-toggle {
      display: flex;
      gap: 8px;
    }

    .lang-opt {
      flex: 1;
      padding: 9px 6px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;

      &.active {
        border-color: var(--accent);
        color: var(--accent);
        background: rgba(88,166,255,.08);
      }

      &:not(.active):hover {
        border-color: var(--text-secondary);
        color: var(--text-primary);
      }
    }

    /* Theme toggle — same layout as lang-toggle */
    .theme-toggle {
      display: flex;
      gap: 8px;
    }

    .theme-opt {
      flex: 1;
      padding: 9px 6px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;

      &.active {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-tint, rgba(88,166,255,.08));
      }

      &:not(.active):hover {
        border-color: var(--text-secondary);
        color: var(--text-primary);
      }
    }

    /* Nav links */
    .panel-links { gap: 4px; }

    .panel-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all .15s;
      &:hover { background: var(--bg-tertiary); color: var(--text-primary); }
    }

    @media (max-width: 600px) {
      .header { padding: 10px 16px; }
      .logo { font-size: 20px; }
      .btn-back { padding: 6px 10px; }
      .user-panel { width: min(280px, 85vw); }
    }
  `],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() backLabel: string | null = null;
  @Output() back = new EventEmitter<void>();

  currentUser: User | null | undefined = undefined;
  profileName = '';
  streak = 0;
  panelOpen = false;
  private sub?: Subscription;
  private langSub?: Subscription;
  private themeSub?: Subscription;

  constructor(
    private authService: AuthService,
    public langService: LanguageService,
    public themeService: ThemeService
  ) {}

  t(key: TranslationKey): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.sub = this.authService.user$.subscribe(async user => {
      this.currentUser = user;
      if (user) {
        const profile = await this.authService.getProfile();
        this.profileName = profile?.display_name ?? user.email?.split('@')[0] ?? '';
        this.streak = await this.authService.getStreak();
      } else {
        this.profileName = '';
        this.streak = 0;
      }
    });
    // Force re-render on language change
    this.langSub = this.langService.lang$.subscribe(() => {});
    // Force re-render on theme change
    this.themeSub = this.themeService.theme$.subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.langSub?.unsubscribe();
    this.themeSub?.unsubscribe();
  }

  toggleLang(): void {
    this.langService.toggle();
  }

  setLang(lang: 'es' | 'en'): void {
    this.langService.setLang(lang);
  }

  setTheme(theme: 'dark' | 'light'): void {
    this.themeService.setTheme(theme);
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    localStorage.removeItem('wh_name');
  }
}
