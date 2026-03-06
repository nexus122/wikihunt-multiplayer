import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { SocketService } from '../../core/services/socket.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../core/components/header.component';

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
  error = '';
  private authSub?: Subscription;

  get activeName(): string {
    return this.profileName || this.guestName;
  }

  savedGame: { roomCode: string; playerName: string; isHost: boolean; startPage: string; targetPage: string; steps?: number; currentPage?: string; path?: string[] } | null = null;

  steps = [
    { n: 1, text: 'Create a room and share the code with friends' },
    { n: 2, text: 'Everyone starts on the same Wikipedia page' },
    { n: 3, text: 'Navigate by clicking links — race to the target' },
    { n: 4, text: 'First to reach the target page wins!' },
  ];

  constructor(private socketService: SocketService, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('wh_name');
    if (saved) this.guestName = saved;

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
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  // signOut is handled by HeaderComponent; reset local state on user$ null


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
            // Restore client-side progress
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

  createRoom(): void {
    if (!this.activeName.trim()) { this.error = 'Enter your name'; return; }
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
    if (!this.activeName.trim()) { this.error = 'Enter your name'; return; }
    if (!this.joinCode.trim()) { this.error = 'Enter a room code'; return; }
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
