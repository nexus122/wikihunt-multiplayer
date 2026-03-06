import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { SupabaseService, DailyChallenge } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { HeaderComponent } from '../../core/components/header.component';
import { TranslationKey } from '../../core/i18n/translations';

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
  private langSub?: Subscription;
  private authSub?: Subscription;

  get activeName(): string {
    return this.profileName || this.guestName;
  }

  constructor(
    private socketService: SocketService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    public lang: LanguageService,
    private router: Router,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  async ngOnInit(): Promise<void> {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.guestName = saved;

    this.authSub = this.authService.user$.subscribe(async user => {
      if (user) {
        const profile = await this.authService.getProfile();
        if (profile) {
          this.profileName = profile.display_name;
          localStorage.setItem('wh_name', profile.display_name);
        }
        this.streak = await this.authService.getStreak();
      } else if (user === null) {
        this.profileName = '';
        this.streak = 0;
      }
    });

    this.langSub = this.lang.lang$.subscribe(async () => {
      // Reload challenge when language changes
      this.loadingChallenge = true;
      try {
        this.challenge = await this.supabaseService.getDailyChallenge(this.lang.current);
      } catch {
        this.challenge = null;
      } finally {
        this.loadingChallenge = false;
      }
    });

    try {
      this.challenge = await this.supabaseService.getDailyChallenge(this.lang.current);
    } catch {
      // challenge will be created on the backend when joining
    } finally {
      this.loadingChallenge = false;
    }
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  start(): void {
    if (!this.activeName.trim()) { this.error = this.t('daily_name_required'); return; }
    this.loading = true;
    this.error = '';
    if (!this.profileName) localStorage.setItem('wh_name', this.guestName.trim());

    this.socketService.joinDaily(this.activeName.trim()).subscribe({
      next: (data) => {
        if (!data.success || !data.startPage) {
          this.error = data.error || 'No se pudo cargar el reto';
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
      error: () => { this.error = 'Error al conectar con el servidor'; this.loading = false; },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
