import { Room, Player, RoomInfo, PlayerPublicInfo, LeaderboardEntry } from './types';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function normalizePage(page: string): string {
  return page.toLowerCase().replace(/_/g, ' ').trim();
}

class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  createRoom(hostSocketId: string, hostName: string): Room {
    let code = generateCode();
    while (this.rooms.has(code)) {
      code = generateCode();
    }

    const host: Player = {
      socketId: hostSocketId,
      name: hostName,
      currentPage: null,
      steps: 0,
      path: [],
      finished: false,
    };

    const room: Room = {
      code,
      hostId: hostSocketId,
      status: 'waiting',
      startPage: null,
      targetPage: null,
      players: new Map([[hostSocketId, host]]),
      graceTime: 60,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(hostSocketId, code);
    return room;
  }

  joinRoom(code: string, socketId: string, name: string): Room | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'waiting') return null;

    const player: Player = {
      socketId,
      name,
      currentPage: null,
      steps: 0,
      path: [],
      finished: false,
    };

    room.players.set(socketId, player);
    this.socketToRoom.set(socketId, code);
    return room;
  }

  getRoomByCode(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomBySocketId(socketId: string): Room | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  removePlayer(socketId: string): { room: Room | null; wasHost: boolean } {
    const code = this.socketToRoom.get(socketId);
    if (!code) return { room: null, wasHost: false };

    const room = this.rooms.get(code);
    if (!room) return { room: null, wasHost: false };

    const wasHost = room.hostId === socketId;
    room.players.delete(socketId);
    this.socketToRoom.delete(socketId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return { room: null, wasHost };
    }

    if (wasHost) {
      this.transferHost(room);
    }

    return { room, wasHost };
  }

  transferHost(room: Room): void {
    const firstPlayer = room.players.values().next().value;
    if (firstPlayer) {
      room.hostId = (firstPlayer as Player).socketId;
    }
  }

  startGame(code: string, startPage: string, targetPage: string, graceTime: number = 60): boolean {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'waiting') return false;

    room.status = 'playing';
    room.startPage = startPage;
    room.targetPage = targetPage;
    room.startTime = Date.now();
    room.graceTime = graceTime;
    room.firstWinnerId = undefined;
    room.graceTimeoutId = undefined;

    for (const player of room.players.values()) {
      player.currentPage = startPage;
      player.path = [startPage];
      player.steps = 0;
      player.finished = false;
    }

    return true;
  }

  navigate(socketId: string, page: string): { player: Player; room: Room; won: boolean } | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room || room.status !== 'playing') return null;

    const player = room.players.get(socketId);
    if (!player || player.finished) return null;

    player.steps += 1;
    player.currentPage = page;
    player.path.push(page);

    const won = normalizePage(page) === normalizePage(room.targetPage || '');
    if (won) {
      player.finished = true;
      player.finishTime = Date.now();
    }

    return { player, room, won };
  }

  getRoomInfo(room: Room): RoomInfo {
    const players: PlayerPublicInfo[] = Array.from(room.players.values()).map(p => ({
      socketId: p.socketId,
      name: p.name,
      currentPage: p.currentPage,
      steps: p.steps,
      path: p.path,
      finished: p.finished,
      finishTime: p.finishTime,
    }));

    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      startPage: room.startPage,
      targetPage: room.targetPage,
      startTime: room.startTime,
      players,
    };
  }

  getLeaderboard(room: Room): LeaderboardEntry[] {
    const players = Array.from(room.players.values());

    const finished = players
      .filter(p => p.finished)
      .sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0))
      .map(p => ({
        socketId: p.socketId,
        name: p.name,
        steps: p.steps,
        time: p.finishTime && room.startTime ? p.finishTime - room.startTime : undefined,
        finished: true,
        path: p.path,
      }));

    const unfinished = players
      .filter(p => !p.finished)
      .sort((a, b) => b.steps - a.steps)
      .map(p => ({
        socketId: p.socketId,
        name: p.name,
        steps: p.steps,
        finished: false,
        path: p.path,
      }));

    return [...finished, ...unfinished];
  }
}

export const roomManager = new RoomManager();
