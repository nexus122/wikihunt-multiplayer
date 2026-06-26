import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../core/components/header.component';
import { LanguageService } from '../../core/services/language.service';
import { TranslationKey } from '../../core/i18n/translations';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [HeaderComponent],
  template: `
    <app-header />
    <div class="not-found">
      <div class="nf-code">404</div>
      <h1 class="nf-title">{{ t('nf_title') }}</h1>
      <p class="nf-sub">{{ t('nf_sub') }}</p>
      <button class="btn-primary" (click)="router.navigate(['/'])">{{ t('nf_home') }}</button>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: calc(100vh - 53px);
      padding: 24px;
      text-align: center;
    }

    .nf-code {
      font-family: var(--font-display);
      font-size: 140px;
      font-weight: 400;
      line-height: 1;
      color: var(--accent);
      opacity: .35;
      letter-spacing: -0.02em;
    }

    .nf-title {
      font-family: var(--font-display);
      font-size: var(--fs-h3);
      font-weight: 400;
      letter-spacing: -0.01em;
      margin: 0;
      color: var(--text-primary);
    }

    .nf-sub {
      font-family: var(--font-prose);
      font-style: italic;
      font-size: 15px;
      color: var(--text-muted);
      margin: 0 0 12px;
    }
  `],
})
export class NotFoundComponent {
  constructor(public router: Router, private lang: LanguageService) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }
}
