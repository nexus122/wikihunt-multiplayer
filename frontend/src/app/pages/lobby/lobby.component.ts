import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { WikipediaService } from '../../core/services/wikipedia.service';
import { LanguageService } from '../../core/services/language.service';
import { RoomInfo, WikiPage } from '../../core/models/types';
import { TranslationKey } from '../../core/i18n/translations';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit, OnDestroy {
  room: RoomInfo | null = null;
  get isHost(): boolean { return !!this.room && this.room.hostId === this.mySocketId; }
  mySocketId = '';
  codeCopied = false;
  linkCopied = false;
  showQr = false;

  customStart = false;
  customTarget = false;
  searchStartQuery = '';
  searchTargetQuery = '';
  startResults: WikiPage[] = [];
  targetResults: WikiPage[] = [];
  selectedStart: WikiPage | null = null;
  selectedTarget: WikiPage | null = null;

  graceTime = 60;
  searchAllowed = true;

  get graceOptions() {
    return [
      { label: this.t('lobby_grace_30s'), value: 30 },
      { label: this.t('lobby_grace_1m'),  value: 60 },
      { label: this.t('lobby_grace_2m'),  value: 120 },
      { label: this.t('lobby_grace_3m'),  value: 180 },
      { label: this.t('lobby_grace_5m'),  value: 300 },
    ];
  }

  starting = false;
  error = '';

  private subs: Subscription[] = [];
  private startSearch$ = new Subject<string>();
  private targetSearch$ = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private wikipediaService: WikipediaService,
    public langService: LanguageService,
  ) {}

  t(key: TranslationKey): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.mySocketId = this.socketService.getSocketId();

    const state = history.state as { room: RoomInfo; challengeStart?: string; challengeTarget?: string; challengeLang?: string } | undefined;
    if (state?.room) {
      this.room = state.room;
    } else {
      this.router.navigate(['/']);
      return;
    }

    if (state?.challengeStart) {
      this.customStart = true;
      this.selectedStart = { title: state.challengeStart, extract: '' };
    }
    if (state?.challengeTarget) {
      this.customTarget = true;
      this.selectedTarget = { title: state.challengeTarget, extract: '' };
    }

    // Refresh room state from server (handles stale state after play-again)
    this.socketService.getRoom().subscribe(data => {
      if (data.success && data.room) this.room = data.room;
    });

    this.subs.push(
      this.socketService.onRoomUpdated().subscribe(room => { this.room = room; })
    );

    this.subs.push(
      this.socketService.onGameStarted().subscribe(event => {
        this.router.navigate(['/game', this.room?.code], {
          state: {
            room: this.room,
            isHost: this.isHost,
            startPage: event.startPage,
            targetPage: event.targetPage,
            startTime: event.startTime,
            lang: event.lang,
            searchAllowed: typeof event.searchAllowed === 'boolean' ? event.searchAllowed : true,
          },
        });
      })
    );

    // Triggers Angular change detection so t() re-evaluates on language change (graceOptions, etc.)
    this.subs.push(this.langService.lang$.subscribe(() => {}));

    // Debounced Wikipedia search
    this.subs.push(
      this.startSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
        if (q.length < 2) { this.startResults = []; return; }
        this.wikipediaService.searchPages(q).subscribe(r => (this.startResults = r));
      })
    );
    this.subs.push(
      this.targetSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(q => {
        if (q.length < 2) { this.targetResults = []; return; }
        this.wikipediaService.searchPages(q).subscribe(r => (this.targetResults = r));
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

  get roomCode(): string {
    return this.route.snapshot.paramMap.get('code') || '';
  }

  getAvatarColor(id: string): string {
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39d353', '#ff9500'];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  get joinUrl(): string {
    return `${window.location.origin}/join/${this.roomCode}`;
  }

  get qrUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(this.joinUrl)}`;
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.roomCode).then(() => {
      this.codeCopied = true;
      setTimeout(() => (this.codeCopied = false), 2000);
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.joinUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 2000);
    });
  }

  searchStart(): void {
    this.startSearch$.next(this.searchStartQuery);
  }

  searchTarget(): void {
    this.targetSearch$.next(this.searchTargetQuery);
  }

  setStartMode(custom: boolean): void {
    this.customStart = custom;
    if (!custom) { this.selectedStart = null; this.searchStartQuery = ''; this.startResults = []; }
  }

  setTargetMode(custom: boolean): void {
    this.customTarget = custom;
    if (!custom) { this.selectedTarget = null; this.searchTargetQuery = ''; this.targetResults = []; }
  }

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

  clearStart(): void {
    this.selectedStart = null;
    this.searchStartQuery = '';
    this.startResults = [];
  }

  clearTarget(): void {
    this.selectedTarget = null;
    this.searchTargetQuery = '';
    this.targetResults = [];
  }

  startGame(): void {
    if (this.starting) return;
    this.starting = true;
    this.error = '';

    const opts: { graceTime: number; startPage?: string; targetPage?: string; searchAllowed: boolean } = {
      graceTime: this.graceTime,
      searchAllowed: this.searchAllowed,
    };
    if (this.selectedStart) opts.startPage = this.selectedStart.title;
    if (this.selectedTarget) opts.targetPage = this.selectedTarget.title;

    this.socketService.startGame(opts).subscribe({
      next: (d) => {
        if (!d.success) { this.error = d.error || 'Failed to start'; this.starting = false; }
      },
      error: () => { this.error = 'Failed to start game'; this.starting = false; },
    });
  }

  leaveRoom(): void {
    this.router.navigate(['/']);
  }
}
