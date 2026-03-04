# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
cd backend
npm install
npm run dev      # dev server with nodemon+ts-node on port 3001
npm run build    # compile TypeScript → dist/
npm start        # run compiled dist/index.js
```

### Frontend
```bash
cd frontend
npm install
npm start        # ng serve on port 4200 (proxies /api → localhost:3001)
npm run build    # production build → dist/frontend/browser/
npm test         # Karma/Jasmine unit tests
```

## Architecture

**Monorepo** with two independent services: an Angular 17 SPA (frontend) and a Node.js/Express/Socket.io server (backend). Both are deployed separately (Vercel + Render).

### Backend (`backend/src/`)

- **`index.ts`** — Express server + Socket.io event handlers. All game flow logic (start, navigate, win detection, grace countdown, give-up) lives here. Also contains `getCanonicalTitle()` (resolves Wikipedia redirects via the REST API `HEAD` request) and `getValidRandomPage()` (picks non-stub, non-disambiguation articles).
- **`room.manager.ts`** — Singleton `RoomManager` class. Holds all in-memory room state (a `Map<string, Room>`). Handles create/join/rejoin/start/navigate/give-up/leaderboard. No persistence — rooms vanish on server restart.
- **`types.ts`** — Shared TypeScript interfaces (`Player`, `Room`, `RoomInfo`, `PlayerPublicInfo`, `LeaderboardEntry`).
- **`wikipedia.ts`** — Express router at `/api/wikipedia` that proxies calls to the Spanish Wikipedia REST API (`es.wikipedia.org/api/rest_v1`).

### Frontend (`frontend/src/app/`)

**Angular 17 standalone components.** No NgModules — each component declares its own `imports`.

- **`core/services/socket.service.ts`** — Wraps `socket.io-client`. All `socket.emit` calls return `Observable` (one-shot via callback). All `socket.on` listeners are exposed as `on*()` Observables. The backend URL is resolved from `environment.backendUrl`; empty string means dev proxy mode.
- **`core/services/wikipedia.service.ts`** — HTTP client wrapping the backend's `/api/wikipedia` proxy.
- **`core/models/types.ts`** — Frontend-side TypeScript interfaces mirroring the backend types plus Socket.io event payload types.
- **`pages/home/`** — Create room / join room / reconnect (reads `wh_game` from localStorage).
- **`pages/lobby/`** — Waiting room; host can configure start page, target page, and grace time before starting.
- **`pages/game/`** — The main game view. Renders Wikipedia HTML via `bypassSecurityTrustHtml` after `processHtml()` strips editsection links, reflist, and navboxes. Intercepts link clicks to navigate within the game. Saves progress to `localStorage` (`wh_game`) on every step for reconnection.

### Key data flows

1. **Game start**: Host emits `start-game` → server picks random pages (or validates custom ones via Wikipedia HEAD) → broadcasts `game-started` to the room.
2. **Navigation**: Client clicks a link → `WikipediaService.getPageContent()` fetches HTML → on success, increments local step count, emits `navigate` to server → server calls `RoomManager.navigate()` and checks win condition (`normalizePage` comparison).
3. **Win/countdown**: First `player-won` triggers a grace period countdown; a `setTimeout` fires `game-finished` after the grace period (or immediately if all players finish).
4. **Reconnection**: Game state (room code, name, steps, currentPage, path) is saved in `localStorage` under `wh_game`. Home page detects this and offers a rejoin prompt that emits `rejoin-game`.

### Wikipedia API notes

- Uses **Spanish Wikipedia** (`es.wikipedia.org`) exclusively.
- Canonical title resolution: after fetching an article, the API returns the canonical title via `Content-Location` header — this is used for correct win detection across redirects.
- Win comparison: `normalizePage()` lowercases and replaces underscores with spaces before comparing.

### Environment config

- Dev: `environment.backendUrl = ''` → Angular dev server proxy handles `/api` requests to `localhost:3001`. Socket connects to `window.location.hostname:3001`.
- Prod: Set `environment.prod.ts → backendUrl` to the Render backend URL.
