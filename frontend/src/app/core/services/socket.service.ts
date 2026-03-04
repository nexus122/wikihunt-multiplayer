import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import {
  RoomInfo,
  GameStartedEvent,
  PlayerMovedEvent,
  PlayerWonEvent,
  GameFinishedEvent,
  CountdownStartedEvent,
  PlayerGaveUpEvent,
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    const url = environment.backendUrl || `http://${window.location.hostname}:3001`;
    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => console.log('[Socket] Connected:', this.socket.id));
    this.socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    this.socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
  }

  getSocketId(): string {
    return this.socket.id || '';
  }

  isConnected(): boolean {
    return this.socket.connected;
  }

  // ── Emit helpers ──────────────────────────────────────────────────────────

  createRoom(name: string): Observable<{ code: string; room: RoomInfo }> {
    return new Observable(obs => {
      this.socket.emit('create-room', { name }, (data: { code: string; room: RoomInfo }) => {
        obs.next(data);
        obs.complete();
      });
    });
  }

  joinRoom(code: string, name: string): Observable<{ success: boolean; room?: RoomInfo; error?: string }> {
    return new Observable(obs => {
      this.socket.emit('join-room', { code, name }, (data: { success: boolean; room?: RoomInfo; error?: string }) => {
        obs.next(data);
        obs.complete();
      });
    });
  }

  startGame(options?: { startPage?: string; targetPage?: string; graceTime?: number }): Observable<{ success: boolean; error?: string }> {
    return new Observable(obs => {
      this.socket.emit('start-game', options || {}, (data: { success: boolean; error?: string }) => {
        obs.next(data);
        obs.complete();
      });
    });
  }

  rejoinGame(
    code: string,
    name: string,
    steps = 0,
    currentPage?: string,
    path?: string[],
  ): Observable<{ success: boolean; startPage?: string; targetPage?: string; startTime?: number; room?: RoomInfo; error?: string }> {
    return new Observable(obs => {
      this.socket.emit('rejoin-game', { code, name, steps, currentPage, path }, (data: any) => {
        obs.next(data);
        obs.complete();
      });
    });
  }

  giveUp(): Observable<{ success: boolean }> {
    return new Observable(obs => {
      this.socket.emit('give-up', {}, (data: { success: boolean }) => {
        obs.next(data);
        obs.complete();
      });
    });
  }

  navigate(page: string): Observable<{ success: boolean; won: boolean }> {
    return new Observable(obs => {
      this.socket.emit('navigate', { page }, (data: { success: boolean; won: boolean }) => {
        obs.next(data);
        obs.complete();
      });
    });
  }

  // ── Server-event listeners (named handlers so off() only removes its own) ─

  onRoomUpdated(): Observable<RoomInfo> {
    return new Observable(obs => {
      const handler = (data: RoomInfo) => obs.next(data);
      this.socket.on('room-updated', handler);
      return () => this.socket.off('room-updated', handler);
    });
  }

  onGameStarted(): Observable<GameStartedEvent> {
    return new Observable(obs => {
      const handler = (data: GameStartedEvent) => obs.next(data);
      this.socket.on('game-started', handler);
      return () => this.socket.off('game-started', handler);
    });
  }

  onPlayerMoved(): Observable<PlayerMovedEvent> {
    return new Observable(obs => {
      const handler = (data: PlayerMovedEvent) => obs.next(data);
      this.socket.on('player-moved', handler);
      return () => this.socket.off('player-moved', handler);
    });
  }

  onPlayerWon(): Observable<PlayerWonEvent> {
    return new Observable(obs => {
      const handler = (data: PlayerWonEvent) => obs.next(data);
      this.socket.on('player-won', handler);
      return () => this.socket.off('player-won', handler);
    });
  }

  onGameFinished(): Observable<GameFinishedEvent> {
    return new Observable(obs => {
      const handler = (data: GameFinishedEvent) => obs.next(data);
      this.socket.on('game-finished', handler);
      return () => this.socket.off('game-finished', handler);
    });
  }

  onCountdownStarted(): Observable<CountdownStartedEvent> {
    return new Observable(obs => {
      const handler = (data: CountdownStartedEvent) => obs.next(data);
      this.socket.on('countdown-started', handler);
      return () => this.socket.off('countdown-started', handler);
    });
  }

  onPlayerGaveUp(): Observable<PlayerGaveUpEvent> {
    return new Observable(obs => {
      const handler = (data: PlayerGaveUpEvent) => obs.next(data);
      this.socket.on('player-gave-up', handler);
      return () => this.socket.off('player-gave-up', handler);
    });
  }

  onDisconnect(): Observable<void> {
    return new Observable(obs => {
      const handler = () => obs.next();
      this.socket.on('disconnect', handler);
      return () => this.socket.off('disconnect', handler);
    });
  }

  onConnect(): Observable<void> {
    return new Observable(obs => {
      const handler = () => obs.next();
      this.socket.on('connect', handler);
      return () => this.socket.off('connect', handler);
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
