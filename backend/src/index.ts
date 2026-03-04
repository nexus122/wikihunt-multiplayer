import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import wikipediaRouter from './wikipedia';
import { roomManager } from './room.manager';
import { getCanonicalTitle, getValidRandomPage, normalizePage } from './wiki.helpers';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/wikipedia', wikipediaRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Rate limiting for navigate events: max 1 per 200ms per socket
const navigateLastTs = new Map<string, number>();

function emitGameFinished(roomCode: string, room: ReturnType<typeof roomManager.getRoomByCode>): void {
  if (!room) return;
  roomManager.finishGame(roomCode);
  io.to(roomCode).emit('game-finished', { leaderboard: roomManager.getLeaderboard(room) });
}

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on('create-room', ({ name }: { name: string }, callback: Function) => {
    try {
      const room = roomManager.createRoom(socket.id, name);
      socket.join(room.code);
      console.log(`[Room] Created: ${room.code} by ${name}`);
      callback({ code: room.code, room: roomManager.getRoomInfo(room) });
    } catch {
      callback({ error: 'Failed to create room' });
    }
  });

  socket.on('join-room', ({ code, name }: { code: string; name: string }, callback: Function) => {
    try {
      const room = roomManager.joinRoom(code.toUpperCase().trim(), socket.id, name);
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
      { startPage, targetPage, graceTime }: { startPage?: string; targetPage?: string; graceTime?: number },
      callback: Function
    ) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) { callback({ success: false, error: 'Room not found' }); return; }
        if (room.hostId !== socket.id) { callback({ success: false, error: 'Only the host can start' }); return; }

        // Resolve start page: random or canonicalize custom
        let start: string;
        if (startPage) {
          const canonical = await getCanonicalTitle(startPage);
          if (!canonical) { callback({ success: false, error: 'Start page not found on Wikipedia' }); return; }
          start = canonical;
        } else {
          start = await getValidRandomPage();
        }

        // Resolve target page: random (excluding start) or canonicalize custom
        let target: string;
        if (targetPage) {
          const canonical = await getCanonicalTitle(targetPage);
          if (!canonical) { callback({ success: false, error: 'Target page not found on Wikipedia' }); return; }
          target = canonical;
        } else {
          target = await getValidRandomPage(10, start);
        }

        const grace = typeof graceTime === 'number' && graceTime > 0 ? graceTime : 60;
        roomManager.startGame(room.code, start, target, grace);
        const updatedRoom = roomManager.getRoomByCode(room.code)!;

        console.log(`[Game] Started in ${room.code}: "${start}" → "${target}"`);

        io.to(room.code).emit('game-started', {
          startPage: start,
          targetPage: target,
          startTime: updatedRoom.startTime,
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
      const room = roomManager.rejoinRoom(code.toUpperCase().trim(), socket.id, name, steps, currentPage, path);
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
        room: roomManager.getRoomInfo(room),
      });
    } catch {
      callback({ success: false, error: 'Failed to rejoin' });
    }
  });

  // Returns current room state for the calling socket (used after play-again to sync fresh state)
  socket.on('get-room', (_: unknown, callback: Function) => {
    try {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) { callback({ success: false }); return; }
      callback({ success: true, room: roomManager.getRoomInfo(room) });
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
        const allFinished = Array.from(room.players.values()).every(p => p.finished || p.gaveUp);

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

      const allDone = Array.from(room.players.values()).every(p => p.finished || p.gaveUp);
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
