import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { TranslationKey } from '../i18n/translations';

@Component({
  selector: 'app-cosmetics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="cosmetics-panel">
      <h3 class="cosmetics-title">{{ t('cosmetics_title') }}</h3>

      @if (isSupporter) {
        <p class="cosmetics-sub">{{ t('cosmetics_subtitle') }}</p>

        <!-- Avatar picker -->
        <div class="cosmetics-section">
          <label class="form-label">{{ t('cosmetics_avatar_label') }}</label>
          <div class="emoji-grid">
            @for (emoji of EMOJIS; track emoji) {
              <button class="emoji-btn" [class.selected]="selectedEmoji === emoji"
                (click)="selectedEmoji = emoji" [attr.aria-label]="emoji" [attr.aria-pressed]="selectedEmoji === emoji">
                {{ emoji }}
              </button>
            }
          </div>
        </div>

        <!-- Color picker -->
        <div class="cosmetics-section">
          <label class="form-label">{{ t('cosmetics_color_label') }}</label>
          <div class="color-grid">
            @for (color of COLORS; track color) {
              <button class="color-btn" [class.selected]="selectedColor === color"
                [style.background]="color" (click)="selectedColor = color"
                [attr.aria-label]="color" [attr.aria-pressed]="selectedColor === color">
              </button>
            }
          </div>
        </div>

        <button class="btn-primary save-btn" (click)="save()" [disabled]="saving">
          {{ saved ? t('cosmetics_saved') : t('cosmetics_save') }}
        </button>

      } @else {
        <p class="cosmetics-locked-hint">{{ t('cosmetics_locked_hint') }}</p>
        <a class="kofi-btn" href="https://ko-fi.com/jpdev" target="_blank" rel="noopener noreferrer">
          {{ t('cosmetics_kofi_btn') }}
        </a>
      }
    </div>
  `,
  styles: [`
    .cosmetics-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .cosmetics-title {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin: 0;
    }
    .cosmetics-sub {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }
    .cosmetics-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .emoji-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .emoji-btn {
      width: 38px;
      height: 38px;
      font-size: 20px;
      background: var(--bg-secondary);
      border: 2px solid transparent;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color .12s, background .12s;
      &.selected { border-color: var(--accent); background: var(--accent-soft); }
      &:hover:not(.selected) { border-color: var(--border-strong); }
    }
    .color-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .color-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid transparent;
      cursor: pointer;
      transition: transform .12s, box-shadow .12s;
      &.selected { box-shadow: 0 0 0 3px var(--text-primary), inset 0 0 0 3px var(--surface); }
      &:hover:not(.selected) { transform: scale(1.08); }
    }
    .save-btn { align-self: flex-start; padding: 9px 22px; }
    .cosmetics-locked-hint {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }
    .kofi-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      background: #ff5e5b;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      align-self: flex-start;
      transition: opacity .15s;
      &:hover { opacity: .85; text-decoration: none; }
    }
  `]
})
export class CosmeticsComponent implements OnInit {
  readonly EMOJIS = ['🎮', '🦊', '🐺', '🦁', '🐯', '🦅', '🦋', '🌟', '🔥', '💫', '🎯', '🗺️', '⚡', '🏆', '🧭', '🎲'];
  readonly COLORS = ['#ff5a3c', '#1a3a8c', '#ffd84a', '#7ec27a', '#a78bfa', '#fb7185', '#22d3ee', '#f97316'];

  isSupporter = false;
  selectedEmoji = '🎮';
  selectedColor = '#ff5a3c';
  saving = false;
  saved = false;

  constructor(private auth: AuthService, private lang: LanguageService) {}

  t(key: TranslationKey): string { return this.lang.t(key); }

  async ngOnInit(): Promise<void> {
    const profile = await this.auth.getProfile();
    if (profile) {
      this.isSupporter = profile.is_supporter ?? false;
      this.selectedEmoji = profile.avatar_emoji ?? '🎮';
      this.selectedColor = profile.accent_color ?? '#ff5a3c';
    }
  }

  async save(): Promise<void> {
    this.saving = true;
    const ok = await this.auth.updateCosmetics(this.selectedEmoji, this.selectedColor);
    this.saving = false;
    if (ok) {
      this.saved = true;
      setTimeout(() => (this.saved = false), 2500);
    }
  }
}
