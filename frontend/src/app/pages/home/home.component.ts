import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { HeaderComponent } from '../../core/components/header.component';
import { TranslationKey } from '../../core/i18n/translations';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  activeTab: 'create' | 'join' = 'create';
  guestName = '';       // nombre libre para invitados
  profileName = '';     // nombre bloqueado del perfil (solo registrados)
  joinCode = '';
  creating = false;
  joining = false;
  rejoining = false;
  challengingStart = '';
  challengingTarget = '';
  challengeLang = '';
  error = '';
  private authSub?: Subscription;
  private langSub?: Subscription;

  get activeName(): string {
    return this.profileName || this.guestName;
  }

  savedGame: { roomCode: string; playerName: string; isHost: boolean; startPage: string; targetPage: string; steps?: number; currentPage?: string; path?: string[] } | null = null;
  stats: { games: number; players: number } | null = null;

  get steps() {
    const l = this.lang;
    return [
      { n: 1, text: l.t('step1') },
      { n: 2, text: l.t('step2') },
      { n: 3, text: l.t('step3') },
      { n: 4, text: l.t('step4') },
    ];
  }

  constructor(
    private socketService: SocketService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    public lang: LanguageService,
    private supabaseService: SupabaseService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.guestName = saved;

    // Pre-fill join tab when coming from a /join/:code link
    const joinCode = this.route.snapshot.queryParamMap.get('join');
    if (joinCode) {
      this.activeTab = 'join';
      this.joinCode = joinCode.toUpperCase();
    }

    // Challenge invite: ?start=X&target=Y
    const start = this.route.snapshot.queryParamMap.get('start');
    const target = this.route.snapshot.queryParamMap.get('target');
    if (start && target) {
      this.challengingStart = start;
      this.challengingTarget = target;
      this.challengeLang = this.route.snapshot.queryParamMap.get('lang') || 'es';
    }

    const savedGame = localStorage.getItem('wh_game');
    if (savedGame) {
      try {
        this.savedGame = JSON.parse(savedGame);
      } catch {
        localStorage.removeItem('wh_game');
      }
    }

    this.authSub = this.authService.user$.subscribe(async user => {
      if (user) {
        const profile = await this.authService.getProfile();
        if (profile) {
          this.profileName = profile.display_name;
          localStorage.setItem('wh_name', profile.display_name);
        }
      } else if (user === null) {
        this.profileName = '';
      }
    });

    // Triggers Angular change detection so t() re-evaluates on language change
    this.langSub = this.lang.lang$.subscribe(() => {});
    this.supabaseService.getStats().then(s => (this.stats = s));
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.langSub?.unsubscribe();
  }

  rejoinGame(): void {
    if (!this.savedGame) return;
    this.rejoining = true;
    this.error = '';

    const { roomCode, playerName, steps, currentPage, path } = this.savedGame;

    this.socketService.rejoinGame(roomCode, playerName, steps, currentPage, path).subscribe({
      next: (data) => {
        if (!data.success || !data.startPage) {
          this.error = data.error || 'La partida ya no existe.';
          localStorage.removeItem('wh_game');
          this.savedGame = null;
          this.rejoining = false;
          return;
        }
        this.router.navigate(['/game', this.savedGame!.roomCode], {
          state: {
            room: data.room,
            isHost: this.savedGame!.isHost,
            startPage: data.startPage,
            targetPage: data.targetPage,
            startTime: data.startTime,
            lang: data.lang,
            rejoinSteps: steps || 0,
            rejoinCurrentPage: currentPage,
            rejoinPath: path,
          },
        });
      },
      error: () => { this.error = 'Error al reconectar.'; this.rejoining = false; },
    });
  }

  dismissSavedGame(): void {
    localStorage.removeItem('wh_game');
    this.savedGame = null;
  }

  playChallenge(): void {
    if (!this.activeName.trim()) { this.error = this.t('name_placeholder'); return; }
    if (!this.profileName) localStorage.setItem('wh_name', this.guestName.trim());
    this.router.navigate(['/solo/game'], {
      state: {
        playerName: this.activeName.trim(),
        startPage: this.challengingStart,
        targetPage: this.challengingTarget,
        lang: this.challengeLang || this.lang.current,
      },
    });
  }

  createRoom(): void {
    if (!this.activeName.trim()) { this.error = this.t('name_placeholder'); return; }
    this.creating = true;
    this.error = '';
    if (!this.profileName) localStorage.setItem('wh_name', this.guestName.trim());

    this.socketService.createRoom(this.activeName.trim()).subscribe({
      next: (data) => {
        this.router.navigate(['/lobby', data.code], {
          state: { room: data.room, isHost: true },
        });
      },
      error: () => { this.error = 'Failed to create room. Is the server running?'; this.creating = false; },
    });
  }

  joinRoom(): void {
    if (!this.activeName.trim()) { this.error = this.t('name_placeholder'); return; }
    if (!this.joinCode.trim()) { this.error = this.t('room_code_label'); return; }
    this.joining = true;
    this.error = '';
    if (!this.profileName) localStorage.setItem('wh_name', this.guestName.trim());

    this.socketService.joinRoom(this.joinCode.trim().toUpperCase(), this.activeName.trim()).subscribe({
      next: (data) => {
        if (!data.success) { this.error = data.error || 'Failed to join room'; this.joining = false; return; }
        this.router.navigate(['/lobby', this.joinCode.trim().toUpperCase()], {
          state: { room: data.room, isHost: false },
        });
      },
      error: () => { this.error = 'Failed to join room. Is the server running?'; this.joining = false; },
    });
  }
}
