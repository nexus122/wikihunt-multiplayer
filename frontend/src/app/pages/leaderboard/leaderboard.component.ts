import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService, DailyResult, HallOfFameEntry, DailyChallenge } from '../../core/services/supabase.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  activeTab: 'today' | 'alltime' | 'mine' = 'today';
  loading = true;

  todayChallenge: DailyChallenge | null = null;
  todayPodio: DailyResult[] = [];
  hallOfFame: HallOfFameEntry[] = [];
  myHistory: HallOfFameEntry[] = [];
  myName = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.myName = localStorage.getItem('wh_name') || '';
    await this.loadTab('today');
  }

  async loadTab(tab: 'today' | 'alltime' | 'mine'): Promise<void> {
    this.activeTab = tab;
    this.loading = true;
    try {
      if (tab === 'today') {
        [this.todayChallenge, this.todayPodio] = await Promise.all([
          this.supabaseService.getDailyChallenge(),
          this.supabaseService.getDailyPodio(),
        ]);
      } else if (tab === 'alltime') {
        this.hallOfFame = await this.supabaseService.getHallOfFame();
      } else if (tab === 'mine') {
        this.myHistory = this.myName
          ? await this.supabaseService.getPlayerHistory(this.myName)
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
