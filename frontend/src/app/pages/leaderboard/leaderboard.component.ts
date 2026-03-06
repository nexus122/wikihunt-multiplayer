import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService, DailyResult, HallOfFameEntry, DailyChallenge } from '../../core/services/supabase.service';
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
  activeTab: 'today' | 'alltime' | 'mine' = 'today';
  loading = true;

  todayChallenge: DailyChallenge | null = null;
  todayPodio: DailyResult[] = [];
  hallOfFame: HallOfFameEntry[] = [];
  myHistory: HallOfFameEntry[] = [];
  myName = '';

  private langSub?: Subscription;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    public lang: LanguageService,
  ) {}

  t(key: TranslationKey): string {
    return this.lang.t(key);
  }

  async ngOnInit(): Promise<void> {
    this.myName = localStorage.getItem('wh_name') || '';
    await this.loadTab('today');
    this.langSub = this.lang.lang$.subscribe(async () => {
      await this.loadTab(this.activeTab);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  async loadTab(tab: 'today' | 'alltime' | 'mine'): Promise<void> {
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
      }
    } catch {
      // keep empty arrays
    } finally {
      this.loading = false;
    }
  }

  formatTime(ms: number | null): string {
    if (!ms) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  }

  rankEmoji(i: number): string {
    return ['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
