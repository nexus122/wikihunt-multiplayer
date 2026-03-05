import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';
import { SupabaseService, DailyChallenge } from '../../core/services/supabase.service';

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './daily.component.html',
  styleUrl: './daily.component.scss',
})
export class DailyComponent implements OnInit {
  name = '';
  loading = false;
  loadingChallenge = true;
  error = '';
  challenge: DailyChallenge | null = null;

  constructor(
    private socketService: SocketService,
    private supabaseService: SupabaseService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.name = saved;

    try {
      this.challenge = await this.supabaseService.getDailyChallenge();
    } catch {
      // challenge will be created on the backend when joining
    } finally {
      this.loadingChallenge = false;
    }
  }

  start(): void {
    if (!this.name.trim()) { this.error = 'Introduce tu nombre'; return; }
    this.loading = true;
    this.error = '';
    localStorage.setItem('wh_name', this.name.trim());

    this.socketService.joinDaily(this.name.trim()).subscribe({
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
