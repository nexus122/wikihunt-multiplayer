import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { WikipediaService } from '../../core/services/wikipedia.service';
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

  private subs: Subscription[] = [];
  private startSearch$ = new Subject<string>();
  private targetSearch$ = new Subject<string>();
  private readonly siteUrl = environment.siteUrl;

  constructor(
    private router: Router,
    public lang: LanguageService,
    private wikiService: WikipediaService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  get challengeUrl(): string | null {
    if (!this.selectedStart || !this.selectedTarget) return null;
    return `${this.siteUrl}/?start=${encodeURIComponent(this.selectedStart.title)}&target=${encodeURIComponent(this.selectedTarget.title)}&lang=${this.lang.current}`;
  }

  ngOnInit(): void {
    this.subs.push(this.lang.lang$.subscribe(() => {}));

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
  }

  selectTarget(p: WikiPage): void {
    this.selectedTarget = p;
    this.searchTargetQuery = '';
    this.targetResults = [];
    this.copied = false;
  }

  clearStart(): void { this.selectedStart = null; this.searchStartQuery = ''; this.startResults = []; this.copied = false; }
  clearTarget(): void { this.selectedTarget = null; this.searchTargetQuery = ''; this.targetResults = []; this.copied = false; }

  share(): void {
    const url = this.challengeUrl;
    if (!url) return;

    const text = this.t('challenge_share_text')
      .replace('{{start}}', this.selectedStart!.title)
      .replace('{{target}}', this.selectedTarget!.title);

    if ('ontouchstart' in window && navigator.share) {
      navigator.share({ title: 'WikiHunt', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.copied = true;
        setTimeout(() => (this.copied = false), 2500);
      }).catch(() => {});
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
