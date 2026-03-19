import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService, DailyResult, HallOfFameEntry, DailyChallenge } from '../../core/services/supabase.service';
import { formatTime } from '../../core/utils/time.utils';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../core/components/header.component';
import { LanguageService } from '../../core/services/language.service';
import { TranslationKey } from '../../core/i18n/translations';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  activeTab: 'today' | 'alltime' | 'mine' | 'challenge' = 'today';
  loading = true;

  todayChallenge: DailyChallenge | null = null;
  todayPodio: DailyResult[] = [];
  hallOfFame: HallOfFameEntry[] = [];
  myHistory: HallOfFameEntry[] = [];
  challengeBoard: HallOfFameEntry[] = [];
  challengeStart = '';
  challengeTarget = '';
  myName = '';

  private langSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public lang: LanguageService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  async ngOnInit(): Promise<void> {
    this.myName = localStorage.getItem('wh_name') || '';

    // Override with authenticated profile name if available
    this.authSub = this.authService.user$.subscribe(async user => {
      if (user) {
        const profile = await this.authService.getProfile();
        if (profile) this.myName = profile.display_name;
      } else if (user === null) {
        this.myName = localStorage.getItem('wh_name') || '';
      }
    });

    // Challenge-specific leaderboard via query params ?start=X&target=Y
    const params = this.route.snapshot.queryParamMap;
    this.challengeStart = params.get('start') || '';
    this.challengeTarget = params.get('target') || '';

    const initialTab = this.challengeStart && this.challengeTarget ? 'challenge' : 'today';
    await this.loadTab(initialTab);

    this.langSub = this.lang.lang$.subscribe(async () => {
      await this.loadTab(this.activeTab);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  async loadTab(tab: 'today' | 'alltime' | 'mine' | 'challenge'): Promise<void> {
    this.activeTab = tab;
    this.loading = true;
    const l = this.lang.current;
    try {
      if (tab === 'today') {
        [this.todayChallenge, this.todayPodio] = await Promise.all([
          this.supabaseService.getDailyChallenge(l),
          this.supabaseService.getDailyPodio(undefined, l),
        ]);
      } else if (tab === 'alltime') {
        this.hallOfFame = await this.supabaseService.getHallOfFame(l);
      } else if (tab === 'mine') {
        this.myHistory = this.myName
          ? await this.supabaseService.getPlayerHistory(this.myName, l)
          : [];
      } else if (tab === 'challenge') {
        this.challengeBoard = this.challengeStart && this.challengeTarget
          ? await this.supabaseService.getChallengeLeaderboard(this.challengeStart, this.challengeTarget, l)
          : [];
      }
    } catch {
      // keep empty arrays
    } finally {
      this.loading = false;
    }
  }

  formatTime = formatTime;

  rankEmoji(i: number): string {
    return ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
