import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';
import { SupabaseService, DailyChallenge } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../core/components/header.component';

@Component({
  selector: 'app-daily',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './daily.component.html',
  styleUrl: './daily.component.scss',
})
export class DailyComponent implements OnInit {
  guestName = '';
  profileName = '';
  loading = false;
  loadingChallenge = true;
  error = '';
  challenge: DailyChallenge | null = null;

  get activeName(): string {
    return this.profileName || this.guestName;
  }

  constructor(
    private socketService: SocketService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.guestName = saved;

    const user = this.authService.currentUser;
    if (user) {
      const profile = await this.authService.getProfile();
      if (profile) this.profileName = profile.display_name;
    }

    try {
      this.challenge = await this.supabaseService.getDailyChallenge();
    } catch {
      // challenge will be created on the backend when joining
    } finally {
      this.loadingChallenge = false;
    }
  }

  start(): void {
    if (!this.activeName.trim()) { this.error = 'Introduce tu nombre'; return; }
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
