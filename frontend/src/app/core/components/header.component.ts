import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { ThemeService } from '../services/theme.service';
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

      <div class="header-controls">
        @if (backLabel) {
          <button class="btn-back" (click)="back.emit()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span class="back-text">{{ backLabel }}</span>
          </button>
        }

        <!-- Language pill — always visible -->
        <div class="lang-pill" role="group" [attr.aria-label]="t('panel_language')">
          <button class="lang-btn" [class.active]="langService.current === 'es'"
            (click)="setLang('es')" [attr.aria-pressed]="langService.current === 'es'"
            aria-label="Español">ES</button>
          <button class="lang-btn" [class.active]="langService.current === 'en'"
            (click)="setLang('en')" [attr.aria-pressed]="langService.current === 'en'"
            aria-label="English">EN</button>
        </div>

        <!-- Theme toggle — single icon button -->
        <button class="theme-btn"
          (click)="themeService.toggle()"
          [attr.aria-label]="themeService.current === 'dark' ? t('theme_opt_light') : t('theme_opt_dark')">
          @if (themeService.current === 'dark') {
            <!-- Sun: click to switch to light -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          } @else {
            <!-- Moon: click to switch to dark -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          }
        </button>

        <!-- User section -->
        @if (currentUser) {
          <div class="user-area">
            <button class="avatar-btn" [class.open]="panelOpen"
              (click)="panelOpen = !panelOpen"
              [attr.aria-label]="profileName || 'User menu'"
              [attr.aria-expanded]="panelOpen"
              aria-haspopup="true">
              <span class="avatar-initial" aria-hidden="true">{{ (profileName[0] || '?').toUpperCase() }}</span>
            </button>

            @if (panelOpen) {
              <div class="user-dropdown" role="menu" aria-label="User menu">
                <div class="dropdown-profile">
                  <div class="dropdown-avatar" aria-hidden="true">{{ (profileName[0] || '?').toUpperCase() }}</div>
                  <div class="dropdown-info">
                    <span class="dropdown-name">{{ profileName }}</span>
                    <span class="dropdown-email" [title]="currentUser.email || ''">{{ currentUser.email }}</span>
                  </div>
                </div>

                @if (streak > 0) {
                  <div class="dropdown-streak" [attr.aria-label]="streak + ' day streak'">
                    <span aria-hidden="true">🔥</span>
                    <span><strong>{{ streak }}</strong> {{ t('panel_streak') }}</span>
                  </div>
                }

                <div class="dropdown-divider" role="separator"></div>

                <a class="dropdown-link" routerLink="/daily" (click)="panelOpen = false" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ t('daily_btn') }}
                </a>
                <a class="dropdown-link" routerLink="/leaderboard" (click)="panelOpen = false" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="18 20 18 10"/>
                    <polyline points="12 20 12 4"/>
                    <polyline points="6 20 6 14"/>
                  </svg>
                  {{ t('leaderboard_btn') }}
                </a>

                <div class="dropdown-divider" role="separator"></div>

                <button class="dropdown-signout" (click)="signOut()" role="menuitem">
                  {{ t('sign_out') }}
                </button>
              </div>
            }
          </div>
        } @else if (currentUser === null) {
          <a class="sign-in-btn" routerLink="/auth">{{ t('sign_in') }}</a>
        } @else {
          <div class="user-skeleton" aria-hidden="true"></div>
        }
      </div>
    </header>

    @if (panelOpen) {
      <div class="dropdown-backdrop" (click)="panelOpen = false" aria-hidden="true"></div>
    }
  `,
  styles: [`
    :host { display: block; }

    /* ── Header bar ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 52px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
      position: relative;
      z-index: 300;
    }

    .logo {
      font-size: 20px;
      letter-spacing: -.5px;
      text-decoration: none;
      flex-shrink: 0;
      .logo-wiki { color: var(--text-primary); font-weight: 800; }
      .logo-hunt { color: var(--accent); font-weight: 800; }
    }

    /* ── Controls row ── */
    .header-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Back button */
    .btn-back {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm, 6px);
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color .15s, color .15s, background .15s;

      &:hover {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-tint-sm, rgba(88,166,255,.05));
      }
    }

    /* Language pill */
    .lang-pill {
      display: flex;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm, 6px);
      overflow: hidden;
      flex-shrink: 0;
    }

    .lang-btn {
      padding: 4px 9px;
      border: none;
      border-radius: 0;
      background: transparent;
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .04em;
      cursor: pointer;
      transition: all .15s;
      line-height: 1.5;

      &.active {
        background: var(--accent);
        color: #fff;
      }

      &:not(.active):hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      & + .lang-btn {
        border-left: 1px solid var(--border-color);
      }
    }

    /* Theme toggle */
    .theme-btn {
      width: 30px;
      height: 30px;
      padding: 0;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm, 6px);
      background: transparent;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all .15s;
      flex-shrink: 0;

      &:hover {
        border-color: var(--accent);
        color: var(--accent);
        background: var(--accent-tint-sm, rgba(88,166,255,.05));
      }
    }

    /* User area + avatar */
    .user-area {
      position: relative;
    }

    .avatar-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1px solid var(--accent-border, rgba(88,166,255,.3));
      background: var(--accent-tint, rgba(88,166,255,.10));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: all .15s;

      &:hover, &.open {
        border-color: var(--accent);
        background: var(--accent-tint-lg, rgba(88,166,255,.18));
      }
    }

    .avatar-initial {
      font-size: 12px;
      font-weight: 800;
      color: var(--accent);
      line-height: 1;
      text-transform: uppercase;
    }

    /* Sign in button */
    .sign-in-btn {
      padding: 5px 12px;
      border: 1px solid var(--accent);
      border-radius: var(--radius-sm, 6px);
      background: transparent;
      color: var(--accent);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all .15s;
      white-space: nowrap;
      cursor: pointer;

      &:hover {
        background: var(--accent-tint, rgba(88,166,255,.10));
        color: var(--accent);
        text-decoration: none;
      }
    }

    /* Loading skeleton */
    .user-skeleton {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      animation: pulse 1.4s ease infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: .5; }
      50%       { opacity: 1; }
    }

    /* ── Dropdown backdrop ── */
    .dropdown-backdrop {
      position: fixed;
      inset: 0;
      z-index: 400;
    }

    /* ── User dropdown ── */
    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 220px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg);
      z-index: 500;
      overflow: hidden;
      animation: dropdown-in .12s ease;
    }

    @keyframes dropdown-in {
      from { opacity: 0; transform: translateY(-6px) scale(.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dropdown-profile {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 12px;
    }

    .dropdown-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent-tint, rgba(88,166,255,.10));
      border: 1px solid var(--accent-border, rgba(88,166,255,.3));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
      flex-shrink: 0;
      text-transform: uppercase;
    }

    .dropdown-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .dropdown-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-email {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-streak {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px 12px;
      font-size: 12px;
      color: var(--text-secondary);

      strong { color: var(--streak-color, #ff9500); font-weight: 700; }
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
    }

    .dropdown-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: background .1s, color .1s;

      &:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        text-decoration: none;
      }
    }

    .dropdown-signout {
      display: block;
      width: 100%;
      padding: 9px 16px;
      text-align: left;
      background: none;
      border: none;
      border-radius: 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--danger);
      cursor: pointer;
      transition: background .1s;

      &:hover { background: var(--danger-tint, rgba(248,81,73,.08)); }
    }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      .header { padding: 0 16px; height: 48px; }
      .logo { font-size: 18px; }
      .back-text { display: none; }
      .btn-back { padding: 5px 7px; }
      .header-controls { gap: 6px; }
    }

    @media (max-width: 360px) {
      .lang-btn { padding: 4px 7px; }
      .sign-in-btn { padding: 4px 8px; font-size: 12px; }
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
    this.langSub  = this.langService.lang$.subscribe(() => {});
    this.themeSub = this.themeService.theme$.subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.langSub?.unsubscribe();
    this.themeSub?.unsubscribe();
  }

  setLang(lang: 'es' | 'en'): void {
    this.langService.setLang(lang);
  }

  async signOut(): Promise<void> {
    this.panelOpen = false;
    await this.authService.signOut();
    localStorage.removeItem('wh_name');
  }
}
