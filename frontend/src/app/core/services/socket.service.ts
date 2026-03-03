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

  rejoinGame(code: string, name: string): Observable<{ success: boolean; startPage?: string; targetPage?: string; startTime?: number; room?: RoomInfo; error?: string }> {
    return new Observable(obs => {
      this.socket.emit('rejoin-game', { code, name }, (data: any) => {
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

  onRoomUpdated(): Observable<RoomInfo> {
    return new Observable(obs => {
      this.socket.on('room-updated', (data: RoomInfo) => obs.next(data));
      return () => this.socket.off('room-updated');
    });
  }

  onGameStarted(): Observable<GameStartedEvent> {
    return new Observable(obs => {
      this.socket.on('game-started', (data: GameStartedEvent) => obs.next(data));
      return () => this.socket.off('game-started');
    });
  }

  onPlayerMoved(): Observable<PlayerMovedEvent> {
    return new Observable(obs => {
      this.socket.on('player-moved', (data: PlayerMovedEvent) => obs.next(data));
      return () => this.socket.off('player-moved');
    });
  }

  onPlayerWon(): Observable<PlayerWonEvent> {
    return new Observable(obs => {
      this.socket.on('player-won', (data: PlayerWonEvent) => obs.next(data));
      return () => this.socket.off('player-won');
    });
  }

  onGameFinished(): Observable<GameFinishedEvent> {
    return new Observable(obs => {
      this.socket.on('game-finished', (data: GameFinishedEvent) => obs.next(data));
      return () => this.socket.off('game-finished');
    });
  }

  onCountdownStarted(): Observable<CountdownStartedEvent> {
    return new Observable(obs => {
      this.socket.on('countdown-started', (data: CountdownStartedEvent) => obs.next(data));
      return () => this.socket.off('countdown-started');
    });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
