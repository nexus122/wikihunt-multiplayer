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

export interface RoomInfo {
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  startPage: string | null;
  targetPage: string | null;
  startTime?: number;
  players: PlayerPublicInfo[];
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

export interface PlayerGaveUpEvent {
  playerId: string;
  name: string;
}

export interface WikiPage {
  title: string;
  extract: string;
  thumbnail?: { source: string };
}

export interface GameStartedEvent {
  startPage: string;
  targetPage: string;
  startTime: number;
}

export interface PlayerMovedEvent {
  playerId: string;
  name: string;
  page: string;
  steps: number;
}

export interface PlayerWonEvent {
  playerId: string;
  name: string;
  steps: number;
  time: number;
}

export interface GameFinishedEvent {
  leaderboard: LeaderboardEntry[];
}

export interface CountdownStartedEvent {
  seconds: number;
  winner: { name: string; steps: number; time: number };
}
