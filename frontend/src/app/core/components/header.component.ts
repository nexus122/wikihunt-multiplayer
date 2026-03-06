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
        @if (backLabel) {
          <button class="btn-back" (click)="back.emit()">{{ backLabel }}</button>
        }
        <button class="avatar-btn" [class.logged-in]="!!currentUser" (click)="panelOpen = true">
          @if (currentUser) {
            <span class="avatar-initial">{{ (profileName[0] || '?').toUpperCase() }}</span>
          } @else {
            <span class="avatar-menu-icon">&#9776;</span>
          }
        </button>
      </div>
    </header>

    @if (panelOpen) {
      <div class="panel-backdrop" (click)="panelOpen = false"></div>
    }

    <aside class="user-panel" [class.open]="panelOpen">
      <div class="panel-header">
        <span class="panel-title">{{ t('panel_title') }}</span>
        <button class="panel-close" (click)="panelOpen = false">✕</button>
      </div>

      <div class="panel-section">
        @if (currentUser) {
          <div class="panel-profile">
            <div class="panel-avatar">{{ (profileName[0] || '?').toUpperCase() }}</div>
            <div class="panel-profile-info">
              <span class="panel-profile-name">{{ profileName }}</span>
              <span class="panel-profile-sub">{{ currentUser.email }}</span>
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
        <span class="panel-section-label">{{ t('panel_language') }}</span>
        <div class="lang-toggle">
          <button class="lang-opt" [class.active]="langService.current === 'es'" (click)="setLang('es')">{{ t('lang_opt_es') }}</button>
          <button class="lang-opt" [class.active]="langService.current === 'en'" (click)="setLang('en')">{{ t('lang_opt_en') }}</button>
        </div>
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
      z-index: 300;
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
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: border-color .15s, color .15s;
      &:hover { border-color: var(--accent); color: var(--accent); }
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
      background: rgba(0,0,0,.6);
      z-index: 400;
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
      z-index: 500;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform .25s cubic-bezier(.4,0,.2,1);
      box-shadow: -4px 0 24px rgba(0,0,0,.4);

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
      background: rgba(255,149,0,.08);
      border: 1px solid rgba(255,149,0,.25);
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
      .header { padding: 10px 14px; }
      .logo { font-size: 18px; }
      .btn-back { padding: 5px 8px; font-size: 11px; }
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
        this.streak = await this.authService.getStreak();
      } else {
        this.profileName = '';
        this.streak = 0;
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

  setLang(lang: 'es' | 'en'): void {
    if (this.langService.current !== lang) this.langService.toggle();
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    localStorage.removeItem('wh_name');
  }
}
