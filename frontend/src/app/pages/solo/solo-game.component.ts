import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { WikipediaService } from '../../core/services/wikipedia.service';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { TranslationKey } from '../../core/i18n/translations';
import { formatTime } from '../../core/utils/time.utils';

type GameState = 'loading' | 'playing' | 'won' | 'gave_up';

@Component({
  selector: 'app-solo-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solo-game.component.html',
  styleUrl: './solo-game.component.scss',
})
export class SoloGameComponent implements OnInit, OnDestroy {
  @ViewChild('wikiContent') wikiContentEl!: ElementRef<HTMLDivElement>;
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

  // Game identity
  playerName = '';
  gameLang = 'es';

  // Pages
  startPage = '';
  targetPage = '';
  currentPage = '';
  pageTitle = '';

  // Progress
  steps = 0;
  path: string[] = [];

  // Timing
  startTime = 0;
  elapsedMs = 0;
  elapsedDisplay = '00:00';
  private timerInterval?: ReturnType<typeof setInterval>;

  // State
  gameState: GameState = 'loading';
  isNavigating = false;
  loadError = '';
  initialLoadFailed = false;

  // Content
  pageContent: SafeHtml = '';
  private rawHtml = '';

  // Target summary
  targetExtract = '';

  // UI
  showPath = false;
  showGiveUpConfirm = false;
  showLeaveConfirm = false;
  mobileMenuOpen = false;

  // In-page search
  searchOpen = false;
  searchQuery = '';
  matchCount = 0;
  currentMatch = 0;
  private searchInput$ = new Subject<string>();

  // Share
  shareCopied = false;

  // Confetti
  confettiActive = false;
  confettiPieces: { x: number; color: string; delay: number; size: number; duration: number }[] = [];

  // Result save state
  resultSaved = false;

  private subs: Subscription[] = [];

  formatTime = formatTime;

  // Intercept browser back to navigate within the game
  private readonly onPopState = (): void => {
    history.pushState(null, '', window.location.href);
    if (this.gameState === 'won' || this.gameState === 'gave_up') {
      this.router.navigate(['/']);
      return;
    }
    if (this.path.length > 1) {
      this.goBack();
    } else {
      this.router.navigate(['/solo']);
    }
  };

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      this.openSearch();
    }
    if (e.key === 'Escape' && this.searchOpen) {
      this.closeSearch();
    }
    if (e.key === 'Enter' && this.searchOpen) {
      e.shiftKey ? this.prevMatch() : this.nextMatch();
    }
  }

  constructor(
    private router: Router,
    private wikiService: WikipediaService,
    private sanitizer: DomSanitizer,
    public langService: LanguageService,
    private authService: AuthService,
    private supabaseService: SupabaseService,
  ) {}

  t(key: TranslationKey): string {
    return this.langService.t(key);
  }

  get wikiBaseUrl(): string {
    return `https://${this.gameLang}.wikipedia.org/wiki/`;
  }

  ngOnInit(): void {
    const state = history.state as {
      playerName?: string;
      startPage?: string;
      targetPage?: string;
      lang?: string;
    } | undefined;

    // If no player name in state, redirect back to /solo setup
    if (!state?.playerName) {
      this.router.navigate(['/solo']);
      return;
    }

    this.playerName = state.playerName;
    this.gameLang = state.lang || this.langService.current;

    if (state.startPage) this.startPage = state.startPage;
    if (state.targetPage) this.targetPage = state.targetPage;

    this.fetchMissingPagesAndStart();

    // Debounced in-page search
    this.subs.push(
      this.searchInput$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
        this.applyHighlights();
        this.scrollToMatch(1);
      })
    );

    // Trap back button inside the game
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', this.onPopState);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.stopTimer();
    window.removeEventListener('popstate', this.onPopState);
  }

  private fetchMissingPagesAndStart(): void {
    this.gameState = 'loading';

    const fetchStart$ = this.startPage
      ? null
      : this.wikiService.getRandomPage();
    const fetchTarget$ = this.targetPage
      ? null
      : this.wikiService.getRandomPage();

    const resolveTarget = (startTitle: string) => {
      if (!fetchTarget$) {
        this.currentPage = startTitle;
        this.path = [startTitle];
        this.startGame();
        return;
      }
      fetchTarget$.subscribe({
        next: (t) => {
          this.targetPage = t.title;
          this.targetExtract = t.extract || '';
          this.currentPage = startTitle;
          this.path = [startTitle];
          this.startGame();
        },
        error: () => {
          this.loadError = this.t('solo_load_error');
          this.gameState = 'playing';
        },
      });
    };

    if (!fetchStart$) {
      resolveTarget(this.startPage);
    } else {
      fetchStart$.subscribe({
        next: (s) => {
          this.startPage = s.title;
          resolveTarget(this.startPage);
        },
        error: () => {
          this.loadError = this.t('solo_load_error');
          this.gameState = 'playing';
        },
      });
    }
  }

  private startGame(): void {
    this.startTime = Date.now();
    this.loadStartPage();

    // Fetch target summary for the sidebar description
    this.wikiService.getPageSummary(this.targetPage, this.gameLang).subscribe({
      next: (s) => { this.targetExtract = s.extract || ''; },
      error: () => {},
    });
  }

  private loadStartPage(attempt = 1): void {
    this.gameState = 'loading';
    this.loadError = '';
    this.initialLoadFailed = false;

    this.wikiService.getPageContent(this.startPage, this.gameLang).subscribe({
      next: (data) => {
        this.pageTitle = data.title;
        this.currentPage = data.title;
        this.startPage = data.title; // canonical
        if (this.path.length > 0) this.path[0] = data.title;
        this.setPageContent(data.html);
        this.gameState = 'playing';
        this.startTimer();
        setTimeout(() => this.scrollToTop(), 50);
      },
      error: () => {
        if (attempt <= 3) {
          setTimeout(() => this.loadStartPage(attempt + 1), 2000 * attempt);
          return;
        }
        this.loadError = this.t('solo_initial_failed');
        this.initialLoadFailed = true;
        this.gameState = 'playing';
      },
    });
  }

  retryInitialLoad(): void {
    this.loadStartPage();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedMs = Date.now() - this.startTime;
      const m = Math.floor(this.elapsedMs / 60000).toString().padStart(2, '0');
      const s = Math.floor((this.elapsedMs % 60000) / 1000).toString().padStart(2, '0');
      this.elapsedDisplay = `${m}:${s}`;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval !== undefined) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  // ── Content click → navigation ────────────────────────────

  onContentClick(event: MouseEvent): void {
    if (this.gameState !== 'playing' || this.isNavigating) return;

    let target = event.target as HTMLElement | null;
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (!target || target.tagName !== 'A') return;

    event.preventDefault();
    const href = (target as HTMLAnchorElement).getAttribute('href') || '';

    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;
    if (
      href.includes('Special:') || href.includes('Wikipedia:') ||
      href.includes('Help:') || href.includes('File:') ||
      href.includes('Talk:') || href.includes('User:') ||
      href.includes('Portal:') || href.includes('Template:')
    ) return;

    let title = '';
    const relMatch = href.match(/^\.\/([^#?]+)/);
    const wikiMatch = href.match(/^\/wiki\/([^#?]+)/);
    if (relMatch) title = decodeURIComponent(relMatch[1]);
    else if (wikiMatch) title = decodeURIComponent(wikiMatch[1]);
    else return;

    title = title.replace(/_/g, ' ');
    this.navigateTo(title);
  }

  private navigateTo(title: string): void {
    if (this.isNavigating) return;

    const prevPage = this.currentPage;
    const prevPath = [...this.path];

    this.currentPage = title;
    this.path.push(title);
    this.isNavigating = true;
    this.loadError = '';

    this.wikiService.getPageContent(title, this.gameLang).subscribe({
      next: (data) => {
        this.steps++;
        this.pageTitle = data.title;
        this.currentPage = data.title;
        this.path[this.path.length - 1] = data.title;
        this.setPageContent(data.html);
        this.isNavigating = false;
        setTimeout(() => this.scrollToTop(), 50);

        // Win check
        if (this.normalizePage(data.title) === this.normalizePage(this.targetPage)) {
          this.onWin();
        }
      },
      error: () => {
        // Revert navigation — step not counted
        this.currentPage = prevPage;
        this.path = prevPath;
        this.isNavigating = false;
        this.loadError = this.gameLang === 'en'
          ? `"${title}" does not exist on English Wikipedia. Try another link.`
          : `"${title}" no existe en Wikipedia en español. Elige otro enlace.`;
        setTimeout(() => { this.loadError = ''; }, 4000);
      },
    });
  }

  normalizePage(title: string): string {
    return title.toLowerCase().replace(/_/g, ' ').trim();
  }

  private onWin(): void {
    this.stopTimer();
    this.elapsedMs = Date.now() - this.startTime;
    this.gameState = 'won';
    this.launchConfetti();
    this.trySaveResult(true);
  }

  goBack(): void {
    if (this.isNavigating || this.path.length <= 1 || this.gameState !== 'playing') return;
    this.path.pop();
    const prev = this.path[this.path.length - 1];
    this.currentPage = prev;

    this.isNavigating = true;
    this.wikiService.getPageContent(prev, this.gameLang).subscribe({
      next: (data) => {
        this.pageTitle = data.title;
        this.currentPage = data.title;
        this.path[this.path.length - 1] = data.title;
        this.setPageContent(data.html);
        this.isNavigating = false;
        setTimeout(() => this.scrollToTop(), 50);
      },
      error: () => { this.isNavigating = false; },
    });
  }

  giveUp(): void {
    this.showGiveUpConfirm = false;
    this.stopTimer();
    this.elapsedMs = Date.now() - this.startTime;
    this.gameState = 'gave_up';
    this.trySaveResult(false);
  }

  // ── Result saving ──────────────────────────────────────────

  private async trySaveResult(won: boolean): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return; // guests — skip saving

    try {
      const profile = await this.authService.getProfile();
      if (!profile) return;

      await this.supabaseService.client
        .from('hall_of_fame')
        .insert({
          player_name: profile.display_name,
          start_page: this.startPage,
          target_page: this.targetPage,
          steps: this.steps,
          time_ms: won ? this.elapsedMs : null,
          path: this.path,
          is_daily: false,
          language: this.gameLang,
          game_type: 'solo',
        });
      this.resultSaved = true;
    } catch {
      // Saving is non-critical — ignore errors
    }
  }

  // ── In-page search ─────────────────────────────────────────

  openSearch(): void {
    this.searchOpen = true;
    setTimeout(() => this.searchInputRef?.nativeElement.focus(), 50);
  }

  closeSearch(): void {
    this.searchOpen = false;
    this.searchQuery = '';
    this.matchCount = 0;
    this.currentMatch = 0;
    this.pageContent = this.sanitizer.bypassSecurityTrustHtml(this.rawHtml);
  }

  onSearchInput(): void {
    this.searchInput$.next(this.searchQuery);
  }

  nextMatch(): void {
    if (this.matchCount === 0) return;
    this.currentMatch = this.currentMatch >= this.matchCount ? 1 : this.currentMatch + 1;
    this.scrollToMatch(this.currentMatch);
  }

  prevMatch(): void {
    if (this.matchCount === 0) return;
    this.currentMatch = this.currentMatch <= 1 ? this.matchCount : this.currentMatch - 1;
    this.scrollToMatch(this.currentMatch);
  }

  private applyHighlights(): void {
    const q = this.searchQuery.trim();
    if (!q) {
      this.matchCount = 0;
      this.currentMatch = 0;
      this.pageContent = this.sanitizer.bypassSecurityTrustHtml(this.rawHtml);
      return;
    }
    const { html, count } = this.highlightMatches(this.rawHtml, q);
    this.matchCount = count;
    this.currentMatch = count > 0 ? 1 : 0;
    this.pageContent = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private highlightMatches(html: string, query: string): { html: string; count: number } {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let count = 0;
    const result = html.replace(/>([^<]+)</g, (_full, text: string) => {
      const replaced = text.replace(regex, (m: string) => {
        count++;
        return `<mark class="sh" id="sh-${count}">${m}</mark>`;
      });
      return `>${replaced}<`;
    });
    return { html: result, count };
  }

  private scrollToMatch(index: number): void {
    setTimeout(() => {
      const el = this.wikiContentEl?.nativeElement?.querySelector(`#sh-${index}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }

  // ── HTML processing ────────────────────────────────────────

  private setPageContent(html: string): void {
    this.rawHtml = this.processHtml(html);
    this.searchOpen = false;
    this.searchQuery = '';
    this.matchCount = 0;
    this.pageContent = this.sanitizer.bypassSecurityTrustHtml(this.rawHtml);
  }

  private processHtml(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = bodyMatch ? bodyMatch[1] : html;

    content = content
      .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<div[^>]*class="[^"]*reflist[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\s+on\w+="[^"]*"/gi, '')
      .replace(/\s+on\w+='[^']*'/gi, '')
      .replace(/href="javascript:[^"]*"/gi, 'href="#"')
      .replace(/href='javascript:[^']*'/gi, "href='#'");

    return content;
  }

  private scrollToTop(): void {
    if (this.wikiContentEl?.nativeElement) {
      this.wikiContentEl.nativeElement.scrollTop = 0;
    }
  }

  // ── Confetti ───────────────────────────────────────────────

  private launchConfetti(): void {
    const colors = ['#58a6ff', '#3fb950', '#ffd700', '#ff9500', '#bc8cff', '#f85149', '#39d353'];
    this.confettiPieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: 6 + Math.random() * 8,
      duration: 2.5 + Math.random() * 2,
    }));
    this.confettiActive = true;
    setTimeout(() => { this.confettiActive = false; }, 5500);
  }

  // ── Leave confirmation ─────────────────────────────────────

  confirmLeave(): void {
    this.showLeaveConfirm = true;
  }

  cancelLeave(): void {
    this.showLeaveConfirm = false;
  }

  doLeave(): void {
    this.showLeaveConfirm = false;
    this.router.navigate(['/solo']);
  }

  // ── Share result ───────────────────────────────────────────

  shareResult(): void {
    const steps = this.steps;
    const time = formatTime(this.elapsedMs);
    const start = this.startPage;
    const target = this.targetPage;
    const won = this.gameState === 'won';

    const template = won
      ? this.t('share_text_won')
      : this.t('share_text_giveup');

    const text = template
      .replace('{{start}}', start)
      .replace('{{target}}', target)
      .replace('{{steps}}', String(steps))
      .replace('{{time}}', time);

    const url = window.location.origin;

    if (navigator.share) {
      navigator.share({ title: 'WikiHunt', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text + '\n' + url).then(() => {
        this.shareCopied = true;
        setTimeout(() => { this.shareCopied = false; }, 2000);
      });
    }
  }

  // ── Navigation buttons ─────────────────────────────────────

  playAgain(): void {
    this.router.navigate(['/solo']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
