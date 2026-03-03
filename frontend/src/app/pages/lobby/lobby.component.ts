import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SocketService } from '../../core/services/socket.service';
import { WikipediaService } from '../../core/services/wikipedia.service';
import { RoomInfo, WikiPage } from '../../core/models/types';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit, OnDestroy {
  room: RoomInfo | null = null;
  isHost = false;
  mySocketId = '';
  codeCopied = false;

  customStart = false;
  customTarget = false;
  searchStartQuery = '';
  searchTargetQuery = '';
  startResults: WikiPage[] = [];
  targetResults: WikiPage[] = [];
  selectedStart: WikiPage | null = null;
  selectedTarget: WikiPage | null = null;

  graceTime = 60;
  graceOptions = [
    { label: '30 segundos', value: 30 },
    { label: '1 minuto', value: 60 },
    { label: '2 minutos', value: 120 },
    { label: '3 minutos', value: 180 },
    { label: '5 minutos', value: 300 },
  ];

  starting = false;
  error = '';

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService,
    private wikipediaService: WikipediaService
  ) {}

  ngOnInit(): void {
    this.mySocketId = this.socketService.getSocketId();

    const state = history.state as { room: RoomInfo; isHost: boolean } | undefined;
    if (state?.room) {
      this.room = state.room;
      this.isHost = state.isHost;
    } else {
      this.router.navigate(['/']);
      return;
    }

    this.subs.push(
      this.socketService.onRoomUpdated().subscribe(room => { this.room = room; })
    );

    this.subs.push(
      this.socketService.onGameStarted().subscribe(event => {
        this.router.navigate(['/game', this.room?.code], {
          state: {
            room: this.room,
            isHost: this.isHost,
            startPage: event.startPage,
            targetPage: event.targetPage,
            startTime: event.startTime,
          },
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get roomCode(): string {
    return this.route.snapshot.paramMap.get('code') || '';
  }

  getAvatarColor(id: string): string {
    const colors = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39d353', '#ff9500'];
    let h = 0;
    for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  copyCode(): void {
    navigator.clipboard.writeText(this.roomCode).then(() => {
      this.codeCopied = true;
      setTimeout(() => (this.codeCopied = false), 2000);
    });
  }

  searchStart(): void {
    if (this.searchStartQuery.length < 2) { this.startResults = []; return; }
    this.wikipediaService.searchPages(this.searchStartQuery).subscribe(r => (this.startResults = r));
  }

  searchTarget(): void {
    if (this.searchTargetQuery.length < 2) { this.targetResults = []; return; }
    this.wikipediaService.searchPages(this.searchTargetQuery).subscribe(r => (this.targetResults = r));
  }

  setStartMode(custom: boolean): void {
    this.customStart = custom;
    if (!custom) { this.selectedStart = null; this.searchStartQuery = ''; this.startResults = []; }
  }

  setTargetMode(custom: boolean): void {
    this.customTarget = custom;
    if (!custom) { this.selectedTarget = null; this.searchTargetQuery = ''; this.targetResults = []; }
  }

  selectStart(p: WikiPage): void {
    this.selectedStart = p;
    this.searchStartQuery = '';
    this.startResults = [];
  }

  selectTarget(p: WikiPage): void {
    this.selectedTarget = p;
    this.searchTargetQuery = '';
    this.targetResults = [];
  }

  clearStart(): void {
    this.selectedStart = null;
    this.searchStartQuery = '';
    this.startResults = [];
  }

  clearTarget(): void {
    this.selectedTarget = null;
    this.searchTargetQuery = '';
    this.targetResults = [];
  }

  startGame(): void {
    if (this.starting) return;
    this.starting = true;
    this.error = '';

    const opts: { graceTime: number; startPage?: string; targetPage?: string } = {
      graceTime: this.graceTime,
    };
    if (this.selectedStart) opts.startPage = this.selectedStart.title;
    if (this.selectedTarget) opts.targetPage = this.selectedTarget.title;

    this.socketService.startGame(opts).subscribe({
      next: (d) => {
        if (!d.success) { this.error = d.error || 'Failed to start'; this.starting = false; }
      },
      error: () => { this.error = 'Failed to start game'; this.starting = false; },
    });
  }

  leaveRoom(): void {
    this.router.navigate(['/']);
  }
}
