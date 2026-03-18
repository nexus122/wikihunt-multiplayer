import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { WikipediaService } from '../../core/services/wikipedia.service';
import { HeaderComponent } from '../../core/components/header.component';
import { TranslationKey } from '../../core/i18n/translations';
import { WikiPage } from '../../core/models/types';

@Component({
  selector: 'app-solo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './solo.component.html',
  styleUrl: './solo.component.scss',
})
export class SoloComponent implements OnInit, OnDestroy {
  playerName = '';
  profileName = '';
  error = '';
  starting = false;

  // Per-page mode (mirrors lobby pattern)
  customStart = false;
  customTarget = false;
  selectedStart: WikiPage | null = null;
  selectedTarget: WikiPage | null = null;
  searchStartQuery = '';
  searchTargetQuery = '';
  startResults: WikiPage[] = [];
  targetResults: WikiPage[] = [];

  private subs: Subscription[] = [];
  private startSearch$ = new Subject<string>();
  private targetSearch$ = new Subject<string>();

  constructor(
    private router: Router,
    private authService: AuthService,
    public lang: LanguageService,
    private wikiService: WikipediaService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  get activeName(): string {
    return this.profileName || this.playerName;
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.playerName = saved;

    this.subs.push(
      this.authService.user$.subscribe(async user => {
        if (user) {
          const profile = await this.authService.getProfile();
          if (profile) this.profileName = profile.display_name;
        } else if (user === null) {
          this.profileName = '';
        }
      })
    );

    this.subs.push(this.lang.lang$.subscribe(() => {}));

    // Debounced search — same pattern as lobby
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

  setStartMode(custom: boolean): void {
    this.customStart = custom;
    if (!custom) { this.selectedStart = null; this.searchStartQuery = ''; this.startResults = []; }
  }

  setTargetMode(custom: boolean): void {
    this.customTarget = custom;
    if (!custom) { this.selectedTarget = null; this.searchTargetQuery = ''; this.targetResults = []; }
  }

  searchStart(): void { this.startSearch$.next(this.searchStartQuery); }
  searchTarget(): void { this.targetSearch$.next(this.searchTargetQuery); }

  selectStart(p: WikiPage): void {
    this.selectedStart = p;
    this.searchStartQuery = '';
    this.startResults = [];
  }

  selectTarget(p: WikiPage): void {
    this.selectedTarget = p;
    this.searchTargetQuery = '';
    this.targetResults = [];
  }

  clearStart(): void { this.selectedStart = null; this.searchStartQuery = ''; this.startResults = []; }
  clearTarget(): void { this.selectedTarget = null; this.searchTargetQuery = ''; this.targetResults = []; }

  start(): void {
    this.error = '';

    if (!this.activeName.trim()) {
      this.error = this.t('solo_name_required');
      return;
    }
    if (this.customStart && !this.selectedStart) {
      this.error = this.t('solo_select_page');
      return;
    }
    if (this.customTarget && !this.selectedTarget) {
      this.error = this.t('solo_select_page');
      return;
    }

    if (!this.profileName) {
      localStorage.setItem('wh_name', this.playerName.trim());
    }

    this.router.navigate(['/solo/game'], {
      state: {
        playerName: this.activeName.trim(),
        startPage: this.selectedStart?.title ?? null,
        targetPage: this.selectedTarget?.title ?? null,
        lang: this.lang.current,
      },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
