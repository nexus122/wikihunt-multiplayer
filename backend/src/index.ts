import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fetch from 'node-fetch';
import wikipediaRouter from './wikipedia';
import { roomManager } from './room.manager';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api/wikipedia', wikipediaRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function getRandomPageTitle(): Promise<string> {
  const res = await fetch('https://es.wikipedia.org/api/rest_v1/page/random/summary');
  const data = await res.json() as { title: string };
  return data.title;
}

function normalizePage(page: string): string {
  return page.toLowerCase().replace(/_/g, ' ').trim();
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

        const start = startPage || (await getRandomPageTitle());
        let target = targetPage || (await getRandomPageTitle());

        let attempts = 0;
        while (normalizePage(target) === normalizePage(start) && attempts < 5) {
          target = await getRandomPageTitle();
          attempts++;
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

  socket.on('navigate', ({ page }: { page: string }, callback: Function) => {
    try {
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

        const isFirstWinner = !room.firstWinnerId;

        if (isFirstWinner) {
          // Primer ganador: arrancar el countdown de gracia
          room.firstWinnerId = socket.id;
          console.log(`[Countdown] ${room.graceTime}s grace period started in ${room.code}`);

          io.to(room.code).emit('countdown-started', {
            seconds: room.graceTime,
            winner: { name: player.name, steps: player.steps, time },
          });

          room.graceTimeoutId = setTimeout(() => {
            console.log(`[Countdown] Grace period ended in ${room.code} — sending leaderboard`);
            io.to(room.code).emit('game-finished', {
              leaderboard: roomManager.getLeaderboard(room),
            });
          }, room.graceTime * 1000);
        }

        // Si ya terminaron todos, cancelar el countdown y terminar ya
        const allFinished = Array.from(room.players.values()).every(p => p.finished);
        if (allFinished && room.graceTimeoutId) {
          clearTimeout(room.graceTimeoutId);
          room.graceTimeoutId = undefined;
          console.log(`[Countdown] All finished early in ${room.code}`);
          io.to(room.code).emit('game-finished', {
            leaderboard: roomManager.getLeaderboard(room),
          });
        }
      }

      callback({ success: true, won });
    } catch {
      callback({ success: false, won: false });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
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
