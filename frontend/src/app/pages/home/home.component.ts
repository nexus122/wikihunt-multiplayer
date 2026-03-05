import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  activeTab: 'create' | 'join' = 'create';
  createName = '';
  joinName = '';
  joinCode = '';
  creating = false;
  joining = false;
  rejoining = false;
  error = '';

  savedGame: { roomCode: string; playerName: string; isHost: boolean; startPage: string; targetPage: string; steps?: number; currentPage?: string; path?: string[] } | null = null;

  steps = [
    { n: 1, text: 'Create a room and share the code with friends' },
    { n: 2, text: 'Everyone starts on the same Wikipedia page' },
    { n: 3, text: 'Navigate by clicking links — race to the target' },
    { n: 4, text: 'First to reach the target page wins!' },
  ];

  constructor(private socketService: SocketService, private router: Router) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('wh_name');
    if (saved) { this.createName = saved; this.joinName = saved; }

    const savedGame = localStorage.getItem('wh_game');
    if (savedGame) {
      try {
        this.savedGame = JSON.parse(savedGame);
      } catch {
        localStorage.removeItem('wh_game');
      }
    }
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
    if (!this.createName.trim()) { this.error = 'Enter your name'; return; }
    this.creating = true;
    this.error = '';
    localStorage.setItem('wh_name', this.createName.trim());

    this.socketService.createRoom(this.createName.trim()).subscribe({
      next: (data) => {
        this.router.navigate(['/lobby', data.code], {
          state: { room: data.room, isHost: true },
        });
      },
      error: () => { this.error = 'Failed to create room. Is the server running?'; this.creating = false; },
    });
  }

  joinRoom(): void {
    if (!this.joinName.trim()) { this.error = 'Enter your name'; return; }
    if (!this.joinCode.trim()) { this.error = 'Enter a room code'; return; }
    this.joining = true;
    this.error = '';
    localStorage.setItem('wh_name', this.joinName.trim());

    this.socketService.joinRoom(this.joinCode.trim().toUpperCase(), this.joinName.trim()).subscribe({
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
