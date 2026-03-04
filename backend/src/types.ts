export interface Player {
  socketId: string;
  name: string;
  currentPage: string | null;
  steps: number;
  path: string[];
  finished: boolean;
  finishTime?: number;
  gaveUp?: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  startPage: string | null;
  targetPage: string | null;
  players: Map<string, Player>;
  startTime?: number;
  graceTime: number;          // segundos de gracia tras el primer ganador
  firstWinnerId?: string;     // socket id del primer ganador
  graceTimeoutId?: ReturnType<typeof setTimeout>;
  cleanupTimeoutId?: ReturnType<typeof setTimeout>; // delay antes de borrar sala vacía
  gaveUpNames?: Set<string>;  // nombres que se rindieron en la partida actual
}

export interface RoomInfo {
  code: string;
  hostId: string;
  status: string;
  startPage: string | null;
  targetPage: string | null;
  startTime?: number;
  players: PlayerPublicInfo[];
}

export interface PlayerPublicInfo {
  socketId: string;
  name: string;
  currentPage: string | null;
  steps: number;
  path: string[];
  finished: boolean;
  finishTime?: number;
  gaveUp?: boolean;
}

export interface LeaderboardEntry {
  socketId: string;
  name: string;
  steps: number;
  time?: number;
  finished: boolean;
  gaveUp?: boolean;
  path: string[];
}
