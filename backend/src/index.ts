import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import wikipediaRouter, { preWarmCache } from './wikipedia';
import { roomManager } from './room.manager';
import { getCanonicalTitle, getValidRandomPage, normalizePage } from './wiki.helpers';
import { getDailyChallenge, saveDailyResult, saveHallOfFame, updateUserStreak, verifyUserToken } from './supabase';

const app = express();
const httpServer = createServer(app);
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const io = new Server(httpServer, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());
app.use('/api/wikipedia', wikipediaRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/daily', async (req, res) => {
  const lang = (req.query.lang as string) || 'es';
  try {
    const challenge = await getDailyChallenge(lang);
    res.json(challenge);
  } catch {
    res.status(500).json({ error: 'Failed to get daily challenge' });
  }
});

// JWT middleware — verify Supabase token if present
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    const userId = await verifyUserToken(token);
    if (userId) socket.data.userId = userId;
  }
  next();
});

// Rate limiting for navigate events: max 1 per 200ms per socket
const navigateLastTs = new Map<string, number>();

function validateName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().slice(0, 30);
  return trimmed.length >= 1 ? trimmed : null;
}

const ALLOWED_LANGS = new Set(['es', 'en']);
function validateLang(lang: unknown): string {
  return typeof lang === 'string' && ALLOWED_LANGS.has(lang) ? lang : 'es';
}

async function emitGameFinished(roomCode: string, room: ReturnType<typeof roomManager.getRoomByCode>): Promise<void> {
  if (!room) return;
  roomManager.finishGame(roomCode);
  const leaderboard = roomManager.getLeaderboard(room);
  io.to(roomCode).emit('game-finished', { leaderboard });

  // Persist results to Supabase (non-blocking)
  const today = new Date().toISOString().slice(0, 10);
  const finishedPlayers = leaderboard.filter(e => e.finished && e.time != null);
  const lang = room.lang || 'es';

  for (const entry of finishedPlayers) {
    if (!entry.userId) {
      console.log(`[Supabase] Skipping guest: ${entry.name}`);
      continue;
    }

    // Hall of fame: all finished games (registered users only)
    saveHallOfFame({
      player_name: entry.name,
      start_page: room.startPage || '',
      target_page: room.targetPage || '',
      steps: entry.steps,
      time_ms: entry.time!,
      path: entry.path,
      is_daily: room.isDaily || false,
      user_id: entry.userId,
      language: lang,
    }).then(() => console.log(`[Supabase] Hall of fame saved: ${entry.name}`))
      .catch((e) => console.error('[Supabase] Hall of fame error:', e.message));

    // Daily results: only daily challenge games
    if (room.isDaily) {
      saveDailyResult({
        date: today,
        player_name: entry.name,
        steps: entry.steps,
        time_ms: entry.time!,
        finished: true,
        path: entry.path,
        user_id: entry.userId,
        language: lang,
      }).then(() => {
        console.log(`[Supabase] Daily result saved: ${entry.name}`);
        return updateUserStreak(entry.userId!, today);
      }).catch((e) => console.error('[Supabase] Daily result error:', e.message));
    }
  }
}

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on('create-room', ({ name }: { name: string }, callback: Function) => {
    const validName = validateName(name);
    if (!validName) { callback({ error: 'Invalid name' }); return; }
    try {
      const room = roomManager.createRoom(socket.id, validName, false, socket.data.userId);
      socket.join(room.code);
      console.log(`[Room] Created: ${room.code} by ${name}`);
      callback({ code: room.code, room: roomManager.getRoomInfo(room) });
    } catch {
      callback({ error: 'Failed to create room' });
    }
  });

  socket.on('join-room', ({ code, name }: { code: string; name: string }, callback: Function) => {
    const validName = validateName(name);
    if (!validName) { callback({ success: false, error: 'Invalid name' }); return; }
    try {
      const room = roomManager.joinRoom(code.toUpperCase().trim(), socket.id, validName, socket.data.userId);
      if (!room) {
        callback({ success: false, error: 'Room not found or game already started' });
        return;
      }
      socket.join(room.code);
      io.to(room.code).emit('room-updated', roomManager.getRoomInfo(room));
      console.log(`[Room] ${name} joined ${room.code}`);
      callback({ success: true, room: roomManager.getRoomInfo(room) });
    } catch {
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  socket.on(
    'start-game',
    async (
      { startPage, targetPage, graceTime, lang, searchAllowed }: { startPage?: string; targetPage?: string; graceTime?: number; lang?: string; searchAllowed?: boolean },
      callback: Function
    ) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) { callback({ success: false, error: 'Room not found' }); return; }
        if (room.hostId !== socket.id) { callback({ success: false, error: 'Only the host can start' }); return; }

        const gameLang = validateLang(lang);
        room.lang = gameLang;
        room.searchAllowed = typeof searchAllowed === 'boolean' ? searchAllowed : true;

        // Resolve start page: random or canonicalize custom
        let start: string;
        if (startPage) {
          const canonical = await getCanonicalTitle(startPage, gameLang);
          if (!canonical) { callback({ success: false, error: 'Start page not found on Wikipedia' }); return; }
          start = canonical;
        } else {
          start = await getValidRandomPage(10, undefined, gameLang);
        }

        // Resolve target page: random (excluding start) or canonicalize custom
        let target: string;
        if (targetPage) {
          const canonical = await getCanonicalTitle(targetPage, gameLang);
          if (!canonical) { callback({ success: false, error: 'Target page not found on Wikipedia' }); return; }
          target = canonical;
        } else {
          target = await getValidRandomPage(10, start, gameLang);
        }

        const grace = typeof graceTime === 'number'
          ? Math.min(Math.max(graceTime, 30), 300)
          : 60;
        roomManager.startGame(room.code, start, target, grace);
        const updatedRoom = roomManager.getRoomByCode(room.code)!;

        console.log(`[Game] Started in ${room.code} [${gameLang}]: "${start}" → "${target}"`);

        // Pre-fetch both pages into cache so client requests are instant
        preWarmCache(start, gameLang).catch(() => {});
        preWarmCache(target, gameLang).catch(() => {});

        io.to(room.code).emit('game-started', {
          startPage: start,
          targetPage: target,
          startTime: updatedRoom.startTime,
          lang: gameLang,
          searchAllowed: room.searchAllowed,
        });

        callback({ success: true });
      } catch {
        callback({ success: false, error: 'Failed to start game' });
      }
    }
  );

  socket.on('rejoin-game', (
    { code, name, steps, currentPage, path }: { code: string; name: string; steps?: number; currentPage?: string; path?: string[] },
    callback: Function
  ) => {
    try {
      navigateLastTs.delete(socket.id); // reset rate-limit for new socket ID
      const room = roomManager.rejoinRoom(code.toUpperCase().trim(), socket.id, name, steps, currentPage, path, socket.data.userId);
      if (!room) {
        callback({ success: false, error: 'La partida no existe o ya ha terminado' });
        return;
      }
      socket.join(room.code);
      io.to(room.code).emit('room-updated', roomManager.getRoomInfo(room));
      console.log(`[Room] ${name} rejoined ${room.code}`);
      callback({
        success: true,
        startPage: room.startPage,
        targetPage: room.targetPage,
        startTime: room.startTime,
        lang: room.lang || 'es',
        searchAllowed: typeof room.searchAllowed === 'boolean' ? room.searchAllowed : true,
        room: roomManager.getRoomInfo(room),
      });
    } catch {
      callback({ success: false, error: 'Failed to rejoin' });
    }
  });

  // Returns current room state for the calling socket (used after play-again to sync fresh state)
  socket.on('get-room', (_: unknown, callback: Function) => {
    try {
      const r = roomManager.getRoomBySocketId(socket.id);
      if (!r) { callback({ success: false }); return; }
      callback({ success: true, room: roomManager.getRoomInfo(r) });
    } catch {
      callback({ success: false });
    }
  });

  socket.on('navigate', ({ page }: { page: string }, callback: Function) => {
    try {
      // Rate limit: 1 navigate per 200ms
      const now = Date.now();
      const last = navigateLastTs.get(socket.id) ?? 0;
      if (now - last < 200) { callback({ success: false, won: false }); return; }
      navigateLastTs.set(socket.id, now);

      const result = roomManager.navigate(socket.id, page);
      if (!result) { callback({ success: false, won: false }); return; }

      const { player, room, won } = result;

      io.to(room.code).emit('player-moved', {
        playerId: socket.id,
        name: player.name,
        page,
        steps: player.steps,
      });

      if (won) {
        const time = player.finishTime! - (room.startTime || 0);
        console.log(`[Win] ${player.name} in ${room.code} — ${player.steps} steps, ${(time / 1000).toFixed(1)}s`);

        io.to(room.code).emit('player-won', {
          playerId: socket.id,
          name: player.name,
          steps: player.steps,
          time,
        });

        // Check if all players are done before starting countdown
        const allFinished = Array.from(room.players.values()).every(p => p.finished || p.gaveUp || p.disconnected);

        if (allFinished) {
          // Everyone done — skip countdown and end immediately
          if (room.graceTimeoutId) {
            clearTimeout(room.graceTimeoutId);
            room.graceTimeoutId = undefined;
          }
          console.log(`[Game] All finished in ${room.code} — ending immediately`);
          emitGameFinished(room.code, room);
        } else if (!room.firstWinnerId) {
          // First winner, others still playing — start grace countdown
          room.firstWinnerId = socket.id;
          console.log(`[Countdown] ${room.graceTime}s grace period started in ${room.code}`);

          io.to(room.code).emit('countdown-started', {
            seconds: room.graceTime,
            winner: { name: player.name, steps: player.steps, time },
          });

          room.graceTimeoutId = setTimeout(() => {
            console.log(`[Countdown] Grace period ended in ${room.code} — sending leaderboard`);
            emitGameFinished(room.code, room);
          }, room.graceTime * 1000);
        }
      }

      callback({ success: true, won });
    } catch {
      callback({ success: false, won: false });
    }
  });

  socket.on('give-up', (_: unknown, callback: Function) => {
    try {
      const result = roomManager.giveUp(socket.id);
      if (!result) { callback({ success: false }); return; }

      const { player, room } = result;
      console.log(`[GiveUp] ${player.name} gave up in ${room.code}`);

      io.to(room.code).emit('player-gave-up', { playerId: socket.id, name: player.name });

      const allDone = Array.from(room.players.values()).every(p => p.finished || p.gaveUp || p.disconnected);
      if (allDone) {
        if (room.graceTimeoutId) {
          clearTimeout(room.graceTimeoutId);
          room.graceTimeoutId = undefined;
        }
        emitGameFinished(room.code, room);
      }

      callback({ success: true });
    } catch {
      callback({ success: false });
    }
  });

  socket.on('join-daily', async ({ name, lang }: { name: string; lang?: string }, callback: Function) => {
    const validName = validateName(name);
    if (!validName) { callback({ success: false, error: 'Invalid name' }); return; }
    try {
      const gameLang = validateLang(lang);
      const challenge = await getDailyChallenge(gameLang);
      const room = roomManager.createRoom(socket.id, validName, true, socket.data.userId);
      room.lang = gameLang;
      socket.join(room.code);
      roomManager.startGame(room.code, challenge.start_page, challenge.target_page, 0);
      preWarmCache(challenge.start_page, gameLang).catch(() => {});
      preWarmCache(challenge.target_page, gameLang).catch(() => {});
      console.log(`[Daily] ${name} started daily [${gameLang}]: "${challenge.start_page}" → "${challenge.target_page}"`);
      callback({
        success: true,
        roomCode: room.code,
        startPage: challenge.start_page,
        targetPage: challenge.target_page,
        startTime: roomManager.getRoomByCode(room.code)?.startTime,
        date: challenge.date,
        lang: gameLang,
      });
    } catch {
      callback({ success: false, error: 'Failed to start daily challenge' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    navigateLastTs.delete(socket.id);
    const { room } = roomManager.removePlayer(socket.id);
    if (room) {
      io.to(room.code).emit('room-updated', roomManager.getRoomInfo(room));
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\nWikihunt backend → http://localhost:${PORT}\n`);
});
