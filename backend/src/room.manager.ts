import { Room, Player, RoomInfo, PlayerPublicInfo, LeaderboardEntry } from './types';
import { normalizePage } from './wiki.helpers';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  createRoom(hostSocketId: string, hostName: string, isDaily = false): Room {
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
      isDaily,
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
    this.socketToRoom.delete(socketId);

    if (room.status === 'playing') {
      // During a game: mark as disconnected instead of deleting so state is preserved
      const player = room.players.get(socketId);
      if (player) player.disconnected = true;

      // If every player is now offline/done, schedule room cleanup
      const allGone = Array.from(room.players.values()).every(
        p => p.disconnected || p.finished || p.gaveUp,
      );
      if (allGone) {
        if (room.cleanupTimeoutId) clearTimeout(room.cleanupTimeoutId);
        room.cleanupTimeoutId = setTimeout(() => this.rooms.delete(code), 60_000);
        return { room: null, wasHost };
      }

      // Cancel any pending cleanup — there are still active players
      if (room.cleanupTimeoutId) {
        clearTimeout(room.cleanupTimeoutId);
        room.cleanupTimeoutId = undefined;
      }

      // Transfer host to a still-connected player if needed
      if (wasHost) {
        const active = Array.from(room.players.values()).find(p => !p.disconnected);
        if (active) room.hostId = active.socketId;
      }

      return { room, wasHost };
    }

    // Waiting / finished: remove the player entirely
    room.players.delete(socketId);

    if (room.players.size === 0) {
      this.rooms.delete(code);
      return { room: null, wasHost };
    }

    if (room.cleanupTimeoutId) {
      clearTimeout(room.cleanupTimeoutId);
      room.cleanupTimeoutId = undefined;
    }

    if (wasHost) this.transferHost(room);

    return { room, wasHost };
  }

  transferHost(room: Room): void {
    const firstPlayer = room.players.values().next().value;
    if (firstPlayer) {
      room.hostId = (firstPlayer as Player).socketId;
    }
  }

  rejoinRoom(
    code: string,
    socketId: string,
    name: string,
    steps = 0,
    currentPage?: string | null,
    path?: string[],
  ): Room | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== 'playing') return null;

    // Cancel pending room deletion now that someone is reconnecting
    if (room.cleanupTimeoutId) {
      clearTimeout(room.cleanupTimeoutId);
      room.cleanupTimeoutId = undefined;
    }

    // Look for the player's existing entry (keyed by old socketId)
    let oldSocketId: string | undefined;
    let existingPlayer: Player | undefined;
    for (const [sid, p] of room.players.entries()) {
      if (p.name === name && p.disconnected) {
        oldSocketId = sid;
        existingPlayer = p;
        break;
      }
    }

    if (existingPlayer && oldSocketId) {
      // Reactivate: remap to new socketId, restore online state
      room.players.delete(oldSocketId);
      existingPlayer.socketId = socketId;
      existingPlayer.disconnected = false;
      room.players.set(socketId, existingPlayer);
      this.socketToRoom.set(socketId, code);
      if (room.hostId === oldSocketId) room.hostId = socketId;
      return room;
    }

    // No existing disconnected slot — create fresh (gave-up state is preserved)
    const previouslyGaveUp = room.gaveUpNames?.has(name) ?? false;
    const player: Player = {
      socketId,
      name,
      currentPage: currentPage || room.startPage,
      steps,
      path: path?.length ? path : (room.startPage ? [room.startPage] : []),
      finished: false,
      gaveUp: previouslyGaveUp || undefined,
    };

    room.players.set(socketId, player);
    this.socketToRoom.set(socketId, code);

    // If no one else is connected, this player becomes host
    const hasOtherActive = Array.from(room.players.values()).some(
      p => p.socketId !== socketId && !p.disconnected,
    );
    if (!hasOtherActive) room.hostId = socketId;

    return room;
  }

  startGame(code: string, startPage: string, targetPage: string, graceTime: number = 60): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;

    // Clear any leftover grace-period timer from a previous game
    if (room.graceTimeoutId) {
      clearTimeout(room.graceTimeoutId);
      room.graceTimeoutId = undefined;
    }

    room.status = 'playing';
    room.startPage = startPage;
    room.targetPage = targetPage;
    room.startTime = Date.now();
    room.graceTime = graceTime;
    room.firstWinnerId = undefined;
    room.gaveUpNames = new Set<string>();

    for (const player of room.players.values()) {
      player.currentPage = startPage;
      player.path = [startPage];
      player.steps = 0;
      player.finished = false;
      player.gaveUp = undefined;
      player.finishTime = undefined;
    }

    return true;
  }

  // Marks the game as finished so late navigate/give-up events are ignored
  finishGame(code: string): void {
    const room = this.rooms.get(code);
    if (room) room.status = 'finished';
  }

  navigate(socketId: string, page: string): { player: Player; room: Room; won: boolean } | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room || room.status !== 'playing') return null;

    const player = room.players.get(socketId);
    if (!player || player.finished || player.gaveUp) return null;

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

  giveUp(socketId: string): { player: Player; room: Room } | null {
    const room = this.getRoomBySocketId(socketId);
    if (!room || room.status !== 'playing') return null;

    const player = room.players.get(socketId);
    if (!player || player.finished || player.gaveUp) return null;

    player.gaveUp = true;
    // Track the name so a reconnect doesn't revive the player in the same game
    (room.gaveUpNames ??= new Set()).add(player.name);

    return { player, room };
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
      gaveUp: p.gaveUp,
      disconnected: p.disconnected,
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
        gaveUp: p.gaveUp || false,
        path: p.path,
      }));

    return [...finished, ...unfinished];
  }
}

export const roomManager = new RoomManager();
