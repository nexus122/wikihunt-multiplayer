import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { WikipediaService } from '../../core/services/wikipedia.service';
import { RoomInfo, PlayerPublicInfo, LeaderboardEntry, WikiPage } from '../../core/models/types';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('wikiContent') wikiContentEl!: ElementRef<HTMLDivElement>;

  // Game state
  room: RoomInfo | null = null;
  isHost = false;
  mySocketId = '';
  startPage = '';
  targetPage = '';
  startTime = 0;

  // Player state
  mySteps = 0;
  myPath: string[] = [];
  currentPage = '';
  pageTitle = '';
  pageContent: SafeHtml = '';
  loading = false;
  loadError = '';

  // Timer
  elapsed = '00:00';
  private timerSub?: Subscription;

  // Target info
  targetSummary: WikiPage | null = null;

  // Multiplayer
  players: PlayerPublicInfo[] = [];
  winner: { name: string; steps: number; time: number } | null = null;
  leaderboard: LeaderboardEntry[] = [];
  showLeaderboard = false;
  iWon = false;

  // Countdown
  countdownSeconds = 0;
  countdownActive = false;
  private countdownInterval?: ReturnType<typeof setInterval>;

  // Path history modal
  showPath = false;

  // Give up / spectator
  showGiveUpConfirm = false;
  isSpectating = false;

  // Mobile drawer
  mobileMenuOpen = false;

  private subs: Subscription[] = [];

  // Intercept browser back button: navigate within the game instead of leaving it
  private readonly onPopState = (): void => {
    history.pushState(null, '', window.location.href);
    if (this.showLeaderboard) {
      this.router.navigate(['/']);
      return;
    }
    if (this.myPath.length > 1) {
      this.goBack();
    } else {
      this.router.navigate(['/']);
    }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private wikiService: WikipediaService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.mySocketId = this.socketService.getSocketId();
    const state = history.state as {
      room: RoomInfo; isHost: boolean; startPage: string; targetPage: string; startTime: number;
      rejoinSteps?: number; rejoinCurrentPage?: string; rejoinPath?: string[];
    } | undefined;

    if (!state?.startPage) {
      this.router.navigate(['/']);
      return;
    }

    this.room = state.room;
    this.isHost = state.isHost;
    this.startPage = state.startPage;
    this.targetPage = state.targetPage;
    this.startTime = state.startTime || Date.now();
    this.players = state.room?.players || [];

    // Restore progress if rejoining mid-game
    if (state.rejoinCurrentPage) {
      this.mySteps = state.rejoinSteps || 0;
      this.currentPage = state.rejoinCurrentPage;
      this.myPath = state.rejoinPath?.length ? state.rejoinPath : [this.startPage];
    } else {
      this.myPath = [this.startPage];
      this.currentPage = this.startPage;
    }

    this.startTimer();
    this.loadPage(this.currentPage);
    this.setupSocketListeners();

    // Fetch brief description of the target page
    this.wikiService.getPageSummary(this.targetPage).subscribe({
      next: (s) => { this.targetSummary = s; },
      error: () => {},
    });

    // Save game state so the player can rejoin if they accidentally leave.
    // Steps/currentPage/path are updated on every navigation via saveProgress().
    localStorage.setItem('wh_game', JSON.stringify({
      roomCode: this.room?.code || '',
      playerName: localStorage.getItem('wh_name') || '',
      isHost: this.isHost,
      startPage: this.startPage,
      targetPage: this.targetPage,
      steps: this.mySteps,
      currentPage: this.currentPage,
      path: this.myPath,
    }));

    // Trap browser back button inside the game
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', this.onPopState);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.timerSub?.unsubscribe();
    clearInterval(this.countdownInterval);
    window.removeEventListener('popstate', this.onPopState);
  }

  private startCountdown(seconds: number): void {
    this.countdownSeconds = seconds;
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownActive = false;
      }
    }, 1000);
  }

  private startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      const ms = Date.now() - this.startTime;
      const m = Math.floor(ms / 60000).toString().padStart(2, '0');
      const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
      this.elapsed = `${m}:${s}`;
    });
  }

  private setupSocketListeners(): void {
    this.subs.push(
      this.socketService.onPlayerMoved().subscribe(ev => {
        this.players = this.players.map(p =>
          p.socketId === ev.playerId
            ? { ...p, currentPage: ev.page, steps: ev.steps }
            : p
        );
      })
    );

    this.subs.push(
      this.socketService.onPlayerWon().subscribe(ev => {
        if (!this.winner) {
          this.winner = { name: ev.name, steps: ev.steps, time: ev.time };
        }
        if (ev.playerId === this.mySocketId) {
          this.iWon = true;
          this.timerSub?.unsubscribe();
        }
        this.players = this.players.map(p =>
          p.socketId === ev.playerId ? { ...p, finished: true, finishTime: ev.time } : p
        );
      })
    );

    this.subs.push(
      this.socketService.onCountdownStarted().subscribe(ev => {
        this.winner = ev.winner;
        this.countdownSeconds = ev.seconds;
        this.countdownActive = true;
        if (!this.iWon) this.timerSub?.unsubscribe(); // parar el timer propio
        this.startCountdown(ev.seconds);
      })
    );

    this.subs.push(
      this.socketService.onGameFinished().subscribe(ev => {
        this.leaderboard = ev.leaderboard;
        this.showLeaderboard = true;
        this.countdownActive = false;
        clearInterval(this.countdownInterval);
        this.timerSub?.unsubscribe();
        localStorage.removeItem('wh_game'); // game over, no need to rejoin
      })
    );

    this.subs.push(
      this.socketService.onRoomUpdated().subscribe(room => {
        this.room = room;
        this.players = room.players;
      })
    );

    this.subs.push(
      this.socketService.onPlayerGaveUp().subscribe(ev => {
        this.players = this.players.map(p =>
          p.socketId === ev.playerId ? { ...p, gaveUp: true } : p
        );
      })
    );
  }

  // Carga la página inicial (sin contar pasos)
  loadPage(title: string): void {
    this.loading = true;
    this.loadError = '';
    this.wikiService.getPageContent(title).subscribe({
      next: (data) => {
        // Use canonical title returned by API (follows Wikipedia redirects)
        this.pageTitle = data.title;
        this.currentPage = data.title;
        if (this.myPath.length > 0) {
          this.myPath[this.myPath.length - 1] = data.title;
        }
        this.pageContent = this.sanitizer.bypassSecurityTrustHtml(this.processHtml(data.html));
        this.loading = false;
        setTimeout(() => this.scrollToTop(), 50);
      },
      error: () => {
        this.loadError = `No se pudo cargar "${title}". Prueba otro enlace.`;
        this.loading = false;
      },
    });
  }

  private processHtml(html: string): string {
    // Strip <head>, keep only body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let content = bodyMatch ? bodyMatch[1] : html;

    // Remove edit sections, references section, navboxes, infobox images for performance
    content = content
      .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<div[^>]*class="[^"]*reflist[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

    return content;
  }

  giveUp(): void {
    this.showGiveUpConfirm = false;
    this.isSpectating = true;
    this.timerSub?.unsubscribe();
    this.socketService.giveUp().subscribe();
  }

  onContentClick(event: MouseEvent): void {
    if (this.isSpectating) return;
    if (this.winner && !this.iWon) return; // Game over, don't navigate

    let target = event.target as HTMLElement | null;
    // Walk up to find anchor tag
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    if (!target || target.tagName !== 'A') return;

    event.preventDefault();
    const href = (target as HTMLAnchorElement).getAttribute('href') || '';

    // Skip external links, hash-only links, special pages
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) return;
    if (href.includes('Special:') || href.includes('Wikipedia:') ||
        href.includes('Help:') || href.includes('File:') ||
        href.includes('Talk:') || href.includes('User:') ||
        href.includes('Portal:') || href.includes('Template:')) return;

    // Extract title: handles ./Title, /wiki/Title, ./Title#section
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
    if (this.loading) return;

    const prevPage = this.currentPage;
    const prevPath = [...this.myPath];

    this.currentPage = title;
    this.myPath.push(title);
    this.loading = true;
    this.loadError = '';

    this.wikiService.getPageContent(title).subscribe({
      next: (data) => {
        // Solo contamos el paso si la página existe
        this.mySteps++;
        // Use canonical title from API — Wikipedia may redirect e.g. "Highland City" → "Highland City (Florida)"
        this.pageTitle = data.title;
        this.currentPage = data.title;
        this.myPath[this.myPath.length - 1] = data.title;
        this.pageContent = this.sanitizer.bypassSecurityTrustHtml(this.processHtml(data.html));
        this.loading = false;
        this.saveProgress();
        setTimeout(() => this.scrollToTop(), 50);

        // Send canonical title to server for win detection
        this.socketService.navigate(data.title).subscribe({
          next: (res) => {
            if (res.won) {
              this.iWon = true;
              this.timerSub?.unsubscribe();
            }
          },
        });
      },
      error: () => {
        // Revertir navegación — el paso no se cuenta
        this.currentPage = prevPage;
        this.myPath = prevPath;
        this.loading = false;
        this.loadError = `"${title}" no existe en Wikipedia en español. Elige otro enlace.`;
        setTimeout(() => { this.loadError = ''; }, 4000);
      },
    });
  }

  private saveProgress(): void {
    const saved = localStorage.getItem('wh_game');
    if (!saved) return;
    try {
      localStorage.setItem('wh_game', JSON.stringify({
        ...JSON.parse(saved),
        steps: this.mySteps,
        currentPage: this.currentPage,
        path: this.myPath,
      }));
    } catch { /* ignore */ }
  }

  private scrollToTop(): void {
    if (this.wikiContentEl?.nativeElement) {
      this.wikiContentEl.nativeElement.scrollTop = 0;
    }
  }

  goBack(): void {
    if (this.myPath.length <= 1) return;
    this.myPath.pop();
    const prev = this.myPath[this.myPath.length - 1];
    this.currentPage = prev;
    this.saveProgress();
    this.loadPage(prev);
    // Note: going back doesn't count as a step (no navigate emit)
  }

  getAvatarColor(id: string): string {
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39d353', '#ff9500'];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  formatTime(ms?: number): string {
    if (!ms) return '--';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  getRankEmoji(i: number): string {
    return ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
  }

  playAgain(): void {
    localStorage.removeItem('wh_game');
    this.router.navigate(['/lobby', this.room?.code], {
      state: { room: this.room, isHost: this.isHost },
    });
  }

  goHome(): void {
    localStorage.removeItem('wh_game');
    this.router.navigate(['/']);
  }
}
