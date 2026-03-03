# 🎯 Wikihunt

> Race through Wikipedia. First to the target wins.

**Wikihunt** is a real-time multiplayer game where everyone starts on the same random Wikipedia article and races to reach a target page — clicking only links within the articles. No search bar. No shortcuts. Just Wikipedia and your wits.

---

## 🕹️ How to play

1. **Create a room** and share the code with friends
2. Everyone lands on the **same random Wikipedia article**
3. Navigate by **clicking links** inside the articles — no searching allowed
4. **First to reach the target page wins** 🏆
5. After the first winner, a countdown gives others a chance to finish

---

## ✨ Features

- **Real-time multiplayer** — see where everyone is as they navigate
- **Random or custom pages** — host can pick the start and target, or let the game choose
- **Configurable grace period** — 30s, 1m, 2m, 3m or 5m after the first winner
- **Reconnection** — left the game by accident? Rejoin from the home screen and resume from exactly where you were
- **Mobile-friendly** — slide-in sidebar, compact HUD, bottom nav bar
- **Smart page validation** — only valid, non-stub Wikipedia articles are used as start/target pages
- **Canonical title matching** — win detection follows Wikipedia redirects correctly (e.g. a link labelled "Highland City" that resolves to "Highland City (Florida)" still counts)
- **Browser back button** — intercepted in-game: goes to the previous article instead of leaving the game

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (standalone components) |
| Backend | Node.js + Express + TypeScript |
| Real-time | Socket.io 4 |
| Wikipedia | [REST API v1](https://es.wikipedia.org/api/rest_v1/) — Spanish edition |
| Hosting (frontend) | [Vercel](https://vercel.com) |
| Hosting (backend) | [Render](https://render.com) |

---

## 🗂️ Project structure

```
wikihunt/
├── backend/              # Node.js + Express + Socket.io
│   └── src/
│       ├── index.ts      # Socket events, game logic
│       ├── room.manager.ts
│       ├── wikipedia.ts  # Wikipedia API proxy
│       └── types.ts
│
├── frontend/             # Angular 17 SPA
│   └── src/app/
│       ├── pages/
│       │   ├── home/     # Create / join room
│       │   ├── lobby/    # Room waiting screen
│       │   └── game/     # The actual game
│       └── core/
│           ├── services/
│           │   ├── socket.service.ts
│           │   └── wikipedia.service.ts
│           └── models/types.ts
│
├── render.yaml           # Render deployment config
└── README.md
```

---

## 🚀 Running locally

### Prerequisites

- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm start          # starts on http://localhost:4200
```

The frontend dev server proxies `/api` requests to `localhost:3001` automatically via `proxy.conf.json`.

### Play on your local network

Other devices on the same WiFi can connect using your machine's local IP (e.g. `http://192.168.1.x:4200`). The socket URL is resolved dynamically from `window.location.hostname`.

---

## ☁️ Deployment

The project is a monorepo with each service deployed independently.

### Backend → Render

Configured via `render.yaml` at the repo root. Render picks up `rootDir: backend`, builds with `npm run build` and starts with `npm start`.

Set the environment variable if needed:
```
PORT=3001  (Render sets this automatically)
```

### Frontend → Vercel

Point Vercel to the `frontend/` folder as the **Root Directory**. The `frontend/vercel.json` handles the build and SPA rewrites:

```json
{
  "buildCommand": "npx ng build",
  "outputDirectory": "dist/frontend/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Update `frontend/src/environments/environment.prod.ts` with your Render URL:

```typescript
export const environment = {
  production: true,
  backendUrl: 'https://your-backend.onrender.com',
};
```

---

## 🔌 Socket events

| Event | Direction | Description |
|---|---|---|
| `create-room` | client → server | Create a new room |
| `join-room` | client → server | Join an existing room by code |
| `rejoin-game` | client → server | Reconnect to an active game with saved progress |
| `start-game` | client → server | Host starts the game (with optional custom pages and grace time) |
| `navigate` | client → server | Player navigates to a new Wikipedia page |
| `room-updated` | server → clients | Room state changed (player joined/left) |
| `game-started` | server → clients | Game has started; carries start/target pages and start time |
| `player-moved` | server → clients | A player navigated to a new page |
| `player-won` | server → clients | A player reached the target |
| `countdown-started` | server → clients | Grace period countdown started after first winner |
| `game-finished` | server → clients | Game over; carries the final leaderboard |

---

## 📄 License

MIT — do whatever you want with it.
