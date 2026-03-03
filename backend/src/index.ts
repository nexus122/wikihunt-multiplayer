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

// Returns the canonical Wikipedia title (after redirects) via Content-Location header, or null if invalid
async function getCanonicalTitle(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`,
      { method: 'HEAD' }
    );
    if (!res.ok) return null;
    const cl = res.headers.get('content-location');
    const encoded = cl?.split('/page/html/')[1]?.split('/')[0];
    return encoded ? decodeURIComponent(encoded).replace(/_/g, ' ') : title;
  } catch {
    return null;
  }
}

async function getValidRandomPage(maxAttempts = 10): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch('https://es.wikipedia.org/api/rest_v1/page/random/summary');
      if (!res.ok) continue;

      const data = await res.json() as { title: string; extract?: string; type?: string };

      // Descartar páginas de desambiguación y artículos muy cortos (stubs)
      if (data.type === 'disambiguation') continue;
      if (!data.extract || data.extract.length < 150) continue;

      // Obtener el título canónico real (el que Wikipedia usa en sus propios links)
      const canonical = await getCanonicalTitle(data.title);
      if (!canonical) continue;

      console.log(`[Page] Valid page found: "${canonical}" (attempt ${i + 1})`);
      return canonical;
    } catch {
      continue;
    }
  }

  console.warn('[Page] Could not find valid page after max attempts, using fallback');
  return 'España';
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

        const start = startPage || (await getValidRandomPage());
        let target = targetPage || (await getValidRandomPage());

        let attempts = 0;
        while (normalizePage(target) === normalizePage(start) && attempts < 5) {
          target = await getValidRandomPage();
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
