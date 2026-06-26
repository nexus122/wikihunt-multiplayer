import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { WikipediaService } from '../../core/services/wikipedia.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../core/components/header.component';
import { TranslationKey } from '../../core/i18n/translations';
import { WikiPage } from '../../core/models/types';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-challenge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './challenge.component.html',
  styleUrl: './challenge.component.scss',
})
export class ChallengeComponent implements OnInit, OnDestroy {
  selectedStart: WikiPage | null = null;
  selectedTarget: WikiPage | null = null;
  searchStartQuery = '';
  searchTargetQuery = '';
  startResults: WikiPage[] = [];
  targetResults: WikiPage[] = [];
  copied = false;
  generated = false;

  profileName = '';
  avatarEmoji = '';
  accentColor = '';

  private subs: Subscription[] = [];
  private startSearch$ = new Subject<string>();
  private targetSearch$ = new Subject<string>();
  private readonly siteUrl = environment.siteUrl;

  constructor(
    private router: Router,
    public lang: LanguageService,
    private wikiService: WikipediaService,
    private authService: AuthService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  get challengeUrl(): string | null {
    if (!this.selectedStart || !this.selectedTarget) return null;
    return `${this.siteUrl}/?start=${encodeURIComponent(this.selectedStart.title)}&target=${encodeURIComponent(this.selectedTarget.title)}&lang=${this.lang.current}`;
  }

  get canGenerate(): boolean {
    return !!(this.selectedStart && this.selectedTarget);
  }

  // Short readable id derived from the route (for the share card header)
  get challengeId(): string {
    const seed = `${this.selectedStart?.title || ''}→${this.selectedTarget?.title || ''}`;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h).toString(36).toUpperCase().slice(0, 4).padStart(4, '0');
  }

  ngOnInit(): void {
    this.subs.push(this.lang.lang$.subscribe(() => {}));

    this.authService.getProfile().then(p => {
      if (p) {
        this.profileName = p.display_name;
        this.avatarEmoji = p.avatar_emoji ?? '';
        this.accentColor = p.accent_color ?? '';
      }
    });

    this.subs.push(
      this.startSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
        if (q.length < 2) { this.startResults = []; return; }
        this.wikiService.searchPages(q).subscribe(r => (this.startResults = r));
      })
    );
    this.subs.push(
      this.targetSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
        if (q.length < 2) { this.targetResults = []; return; }
        this.wikiService.searchPages(q).subscribe(r => (this.targetResults = r));
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.search-wrap')) {
      this.startResults = [];
      this.targetResults = [];
    }
  }

  searchStart(): void { this.startSearch$.next(this.searchStartQuery); }
  searchTarget(): void { this.targetSearch$.next(this.searchTargetQuery); }

  selectStart(p: WikiPage): void {
    this.selectedStart = p;
    this.searchStartQuery = '';
    this.startResults = [];
    this.copied = false;
    this.generated = false;
  }

  selectTarget(p: WikiPage): void {
    this.selectedTarget = p;
    this.searchTargetQuery = '';
    this.targetResults = [];
    this.copied = false;
    this.generated = false;
  }

  clearStart(): void { this.selectedStart = null; this.searchStartQuery = ''; this.startResults = []; this.copied = false; this.generated = false; }
  clearTarget(): void { this.selectedTarget = null; this.searchTargetQuery = ''; this.targetResults = []; this.copied = false; this.generated = false; }

  generate(): void {
    if (this.canGenerate) this.generated = true;
  }

  edit(): void {
    this.generated = false;
    this.copied = false;
  }

  private shareText(): string {
    return this.t('challenge_share_text')
      .replace('{{start}}', this.selectedStart?.title || '')
      .replace('{{target}}', this.selectedTarget?.title || '');
  }

  copyLink(): void {
    const url = this.challengeUrl;
    if (!url) return;

    if ('ontouchstart' in window && navigator.share) {
      navigator.share({ title: 'WikiHunt', text: this.shareText(), url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.copied = true;
        setTimeout(() => (this.copied = false), 2500);
      }).catch(() => {});
    }
  }

  // Kept for backward compat (old template binding)
  share(): void { this.copyLink(); }

  shareTweet(): void {
    const url = this.challengeUrl; if (!url) return;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(this.shareText())}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
  }

  shareWhatsApp(): void {
    const url = this.challengeUrl; if (!url) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(this.shareText() + ' ' + url)}`, '_blank', 'noopener');
  }

  shareEmail(): void {
    const url = this.challengeUrl; if (!url) return;
    window.location.href = `mailto:?subject=${encodeURIComponent('WikiHunt')}&body=${encodeURIComponent(this.shareText() + '\n\n' + url)}`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
