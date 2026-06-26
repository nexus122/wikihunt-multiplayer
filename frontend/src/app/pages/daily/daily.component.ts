import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { SupabaseService, DailyChallenge } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { HeaderComponent } from '../../core/components/header.component';
import { TranslationKey } from '../../core/i18n/translations';
import { formatTime } from '../../core/utils/time.utils';

interface StreakCell { letter: string; on: boolean; today: boolean; }
interface DailyStats {
  solvedBy: number;
  avgSteps: number | null;
  avgTimeMs: number | null;
  bestSteps: number | null;
  bestTimeMs: number | null;
  bestBy: string | null;
  bestEmoji: string | null;
}

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './daily.component.html',
  styleUrl: './daily.component.scss',
})
export class DailyComponent implements OnInit, OnDestroy {
  guestName = '';
  profileName = '';
  loading = false;
  loadingChallenge = true;
  error = '';
  challenge: DailyChallenge | null = null;
  streak = 0;
  isLoggedIn = false;

  stats: DailyStats | null = null;
  streakCells: StreakCell[] = [];
  resetsIn = '';
  formatTime = formatTime;

  private langSub?: Subscription;
  private authSub?: Subscription;
  private resetTimer?: ReturnType<typeof setInterval>;

  get activeName(): string {
    return this.profileName || this.guestName;
  }

  get daysPlayedText(): string {
    return `${Math.min(this.streak, 14)} ${this.t('daily_days_played_suffix')}`;
  }

  constructor(
    private socketService: SocketService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    public lang: LanguageService,
    private router: Router,
    private http: HttpClient,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  async ngOnInit(): Promise<void> {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.guestName = saved;

    this.buildStreakCells();
    this.updateResetsIn();
    this.resetTimer = setInterval(() => this.updateResetsIn(), 1000);

    this.authSub = this.authService.user$.subscribe(async user => {
      if (user) {
        this.isLoggedIn = true;
        const profile = await this.authService.getProfile();
        if (profile) {
          this.profileName = profile.display_name;
          localStorage.setItem('wh_name', profile.display_name);
        }
        this.streak = await this.authService.getStreak();
        this.buildStreakCells();
      } else if (user === null) {
        this.isLoggedIn = false;
        this.profileName = '';
        this.streak = 0;
        this.buildStreakCells();
      }
    });

    this.langSub = this.lang.lang$.subscribe(() => {
      this.buildStreakCells();
      this.loadChallenge();
    });

    await this.loadChallenge();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.authSub?.unsubscribe();
    if (this.resetTimer) clearInterval(this.resetTimer);
  }

  private async loadChallenge(): Promise<void> {
    this.loadingChallenge = true;
    try {
      // Call backend — it auto-creates today's challenge if not yet in DB
      this.challenge = await firstValueFrom(
        this.http.get<DailyChallenge>(`/api/daily?lang=${this.lang.current}`)
      );
    } catch {
      this.challenge = null;
    } finally {
      this.loadingChallenge = false;
    }
    this.supabaseService.getDailyStats(undefined, this.lang.current)
      .then(s => (this.stats = s))
      .catch(() => (this.stats = null));
  }

  private buildStreakCells(): void {
    const today = new Date();
    const lettersEs = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const lettersEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const letters = this.lang.current === 'es' ? lettersEs : lettersEn;
    const filled = Math.min(this.streak, 14);
    this.streakCells = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      return { letter: letters[d.getDay()], on: i >= 14 - filled, today: i === 13 };
    });
  }

  private updateResetsIn(): void {
    const now = new Date();
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    let diff = Math.max(0, next - now.getTime());
    const h = Math.floor(diff / 3_600_000); diff -= h * 3_600_000;
    const m = Math.floor(diff / 60_000); diff -= m * 60_000;
    const s = Math.floor(diff / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.resetsIn = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  start(): void {
    if (!this.activeName.trim()) { this.error = this.t('daily_name_required'); return; }
    this.loading = true;
    this.error = '';
    if (!this.profileName) localStorage.setItem('wh_name', this.guestName.trim());

    this.socketService.joinDaily(this.activeName.trim()).subscribe({
      next: (data) => {
        if (!data.success || !data.startPage) {
          this.error = data.error || this.t('daily_load_error');
          this.loading = false;
          return;
        }
        this.router.navigate(['/game', data.roomCode], {
          state: {
            startPage: data.startPage,
            targetPage: data.targetPage,
            startTime: data.startTime,
            lang: data.lang || this.lang.current,
            isHost: true,
            isDaily: true,
          },
        });
      },
      error: () => { this.error = this.t('daily_server_error'); this.loading = false; },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
