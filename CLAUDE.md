# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
cd backend
npm install
npm run dev      # nodemon+ts-node dev server on port 3001
npm run build    # compile TypeScript → dist/
npm start        # run compiled dist/index.js
```

### Frontend
```bash
cd frontend
npm install
npm start        # ng serve on port 4200 (proxies /api → localhost:3001)
npm run build    # production build → dist/frontend/browser/
npm test         # Karma/Jasmine unit tests (run a single spec with --include)
```

## Architecture

**Monorepo** with two independent services: an Angular 17 SPA (frontend) deployed on Vercel, and a Node.js/Express/Socket.io server (backend) deployed on Render.

### Backend (`backend/src/`)

- **`index.ts`** — Express server + all Socket.io event handlers. Game flow (start, navigate, win detection, grace countdown, give-up) lives here. A Socket.io middleware verifies Supabase JWTs and attaches `socket.data.userId` if valid.
- **`room.manager.ts`** — Singleton `RoomManager`. All room state is in-memory (`Map<string, Room>`); rooms vanish on restart. Handles create/join/rejoin/start/navigate/give-up/leaderboard.
- **`types.ts`** — Shared interfaces: `Player`, `Room`, `RoomInfo`, `PlayerPublicInfo`, `LeaderboardEntry`.
- **`wiki.helpers.ts`** — `getCanonicalTitle(title, lang)` and `getValidRandomPage(n, exclude, lang)`. Both accept a `lang` param (`'es'` | `'en'`) and hit the corresponding Wikipedia REST API subdomain.
- **`wikipedia.ts`** — Express router at `/api/wikipedia`. Proxies to `${lang}.wikipedia.org/api/rest_v1`. All routes accept `?lang=` query param. Includes a 5-min in-memory HTML cache keyed by `lang:title`.
- **`supabase.ts`** — Supabase service-role client. `getDailyChallenge(lang)` creates today's challenge per language if it doesn't exist. `verifyUserToken(token)` uses `supabase.auth.getUser()` (not jsonwebtoken). Only registered users have their results saved; guests are skipped.

Backend env vars required: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.

### Frontend (`frontend/src/app/`)

**Angular 17 standalone components** — no NgModules; each component lists its own `imports`.

**Core services:**
- **`core/services/socket.service.ts`** — Wraps `socket.io-client`. All emits return one-shot `Observable`s via acknowledgement callbacks. Passes Supabase JWT in `auth` callback on connect. Sends `lang` in `start-game` and `join-daily` events.
- **`core/services/auth.service.ts`** — Wraps Supabase Auth. `user$` BehaviorSubject uses `undefined` = loading, `null` = unauthenticated, `User` = authenticated. Auth state comes from `onAuthStateChange` only (handles OAuth redirects correctly).
- **`core/services/language.service.ts`** — Manages ES/EN language preference in `localStorage('wh_lang')`. Provides `t(key)` for translations and `toggle()` / `setLang()`.
- **`core/services/supabase.service.ts`** — Supabase anon client. Leaderboard/daily queries filter by `language`.
- **`core/services/wikipedia.service.ts`** — HTTP client for `/api/wikipedia`. Automatically appends `?lang=` from `LanguageService`.
- **`core/i18n/translations.ts`** — All UI strings in `es` and `en` objects. `TranslationKey` type ensures type-safety.

**Guards (`core/guards/auth.guard.ts`):** Three functional guards — `authGuard` (requires login), `guestGuard` (redirects logged-in users away from `/auth`), `noProfileGuard` (requires login but no profile yet for `/setup-profile`). All filter `user !== undefined` to avoid acting on the loading state.

**Pages:** `home`, `lobby`, `game`, `daily`, `leaderboard`, `auth`, `setup-profile`. All lazy-loaded.

**Shared component:** `core/components/header.component.ts` — used on home, daily, leaderboard. Shows logo, language toggle (ES↔EN), and session indicator (profile name + sign-out, or sign-in link).

### Key data flows

1. **Game start**: Host emits `start-game` (with `lang`) → server resolves random or custom Wikipedia pages via `getValidRandomPage`/`getCanonicalTitle` for that lang → broadcasts `game-started` (includes `lang`) to room → lobby navigates all players to `/game/:code` passing `lang` in router state.

2. **Navigation**: Client clicks a Wikipedia link → `WikipediaService.getPageContent(title)` (with current `lang`) → on success, increments local step count, emits `navigate` to server → server calls `RoomManager.navigate()` and compares via `normalizePage()` for win detection.

3. **Win/countdown**: First `player-won` triggers a grace countdown; `setTimeout` fires `game-finished` after grace period (or immediately if all players finish/give-up). Results are saved to `hall_of_fame` and `daily_results` (only for registered users, filtered by `language`).

4. **Reconnection**: On every navigation step, game state (roomCode, name, steps, currentPage, path) is saved to `localStorage('wh_game')`. Home detects this and offers a rejoin prompt emitting `rejoin-game`.

5. **Daily challenge**: `getDailyChallenge(lang)` queries `daily_challenges` by `(date, language)` — ES and EN have separate challenges per day. Created on first join if missing.

6. **Auth redirect flow**: Google OAuth / magic link → Supabase redirects to `/setup-profile` → `noProfileGuard` checks profile existence → if no profile, stays on setup; if profile exists, redirects to `/`.

### Wikipedia API

- `Content-Location` response header provides the canonical title after redirects — used for win detection.
- `normalizePage()` lowercases and replaces underscores with spaces before comparing titles.
- `preWarmCache(title, lang)` is called after game start for both start and target pages to make the first navigation instant.

### Environment config

- **Dev**: `environment.backendUrl = ''` → Angular dev proxy forwards `/api` to `localhost:3001`. Socket connects to `window.location.hostname:3001`.
- **Prod**: `environment.prod.ts → backendUrl` must be set to the Render backend URL. Supabase `supabaseUrl` and `supabaseAnonKey` are baked into the environment files (anon key is safe to expose).
- **Supabase Auth redirect URLs**: The production frontend URL must be added to the allowed redirect URLs in the Supabase dashboard (Authentication → URL Configuration). Magic link and OAuth both use `window.location.origin` as the redirect base.

### Supabase schema

Tables: `user_profiles` (`user_id`, `display_name` unique), `daily_challenges` (`date` + `language` unique), `daily_results` (`date`, `language`, `user_id`), `hall_of_fame` (`language`, `user_id`). All results tables have a `language` column defaulting to `'es'`.
