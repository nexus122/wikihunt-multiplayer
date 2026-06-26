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
npm test         # Karma/Jasmine unit tests
npm test -- --include="**/foo.spec.ts"  # run a single spec file
```

## Architecture

**Monorepo** with two independent services: an Angular 17 SPA (frontend) deployed on Vercel, and a Node.js/Express/Socket.io server (backend) deployed on Render.

### Backend (`backend/src/`)

- **`index.ts`** — Express server + all Socket.io event handlers. Game flow (start, navigate, win detection, grace countdown, give-up) lives here. A Socket.io middleware verifies Supabase JWTs and attaches `socket.data.userId` if valid.
- **`room.manager.ts`** — Singleton `RoomManager`. All room state is in-memory (`Map<string, Room>`); rooms vanish on restart. Handles create/join/rejoin/start/navigate/give-up/leaderboard.
- **`types.ts`** — Shared interfaces: `Player`, `Room`, `RoomInfo`, `PlayerPublicInfo`, `LeaderboardEntry`.
- **`wiki.helpers.ts`** — `getCanonicalTitle(title, lang)` and `getValidRandomPage(n, exclude, lang)`. Both accept a `lang` param (`'es'` | `'en'`) and hit the corresponding Wikipedia REST API subdomain.
- **`wikipedia.ts`** — Express router at `/api/wikipedia`. Proxies to `${lang}.wikipedia.org/api/rest_v1`. All routes accept `?lang=` query param. Includes a 5-min in-memory HTML cache keyed by `lang:title`.
- **`supabase.ts`** — Supabase service-role client. `getDailyChallenge(lang)` creates today's challenge per language if it doesn't exist. `verifyUserToken(token)` uses `supabase.auth.getUser()` (not jsonwebtoken). `getPlayerCosmetics(userId)` is called at socket connect and attaches `avatarEmoji`/`accentColor` to `socket.data`. `isNameTakenByRegisteredUser(name)` prevents guests from impersonating registered display names. `markSupporter(email)` is called from the Ko-fi webhook to set `is_supporter=true`. `updateUserStreak(userId, date)` increments or resets the daily streak after each finished daily result. Only registered users have their results saved; guests are skipped.

Backend env vars required: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ALLOWED_ORIGIN` (CORS — defaults to `*`), `KOFI_VERIFICATION_TOKEN` (optional, validates Ko-fi webhook payloads).

Additional HTTP endpoints in `index.ts`:
- `POST /api/kofi/webhook` — Ko-fi donation webhook; calls `markSupporter(email)` on verified payment.
- `GET /api/daily?lang=` — returns today's daily challenge JSON (used by the frontend daily page).

Navigate events are rate-limited to 1 per 200ms per socket via an in-memory `Map<socketId, timestamp>` in `index.ts`.

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

**Pages (all lazy-loaded):** `home`, `lobby`, `game`, `solo`, `solo/game`, `challenge`, `daily`, `leaderboard`, `auth`, `setup-profile`, `join/:code`, `not-found`.

- **`solo/`** — Two-component flow: `solo.component` (page picker, mirrors lobby host controls) → navigates to `solo/game` passing state via router. `solo-game.component` runs a fully client-side game (no Socket.io); saves results to `hall_of_fame` on win. Uses `formatTime` from `core/utils/time.utils.ts`.
- **`challenge/`** — Challenge creator: user picks start/target pages and copies a shareable URL (`?start=X&target=Y&lang=`). Home detects these query params and routes directly to `solo/game`.
- **`join/:code`** — Deep-link entry: shows a branded "redirecting" card, then navigates to `/lobby/:code` (or back to home if the room is full).

**Shared components:**
- `core/components/header.component.ts` — used on home, daily, leaderboard, solo. Shows logo, language toggle (ES↔EN), and session indicator.
- `core/components/cosmetics.component.ts` — avatar emoji + accent color picker. Visible only to `is_supporter` users (Ko-fi backers); others see a Ko-fi CTA link. Saves via `AuthService.updateCosmetics()`, which also mirrors the values to `localStorage('wh_avatar_emoji'/'wh_accent_color')`.

### Key data flows

1. **Game start**: Host emits `start-game` (with `lang`) → server resolves random or custom Wikipedia pages via `getValidRandomPage`/`getCanonicalTitle` for that lang → broadcasts `game-started` (includes `lang`) to room → lobby navigates all players to `/game/:code` passing `lang` in router state.

2. **Navigation**: Client clicks a Wikipedia link → `WikipediaService.getPageContent(title)` (with current `lang`) → on success, increments local step count, emits `navigate` to server → server calls `RoomManager.navigate()` and compares via `normalizePage()` for win detection.

3. **Win/countdown**: First `player-won` triggers a grace countdown; `setTimeout` fires `game-finished` after grace period (or immediately if all players finish/give-up). Results are saved to `hall_of_fame` and `daily_results` (only for registered users, filtered by `language`). For daily results, `updateUserStreak()` is also called.

4. **Reconnection**: On every navigation step, game state (roomCode, name, steps, currentPage, path) is saved to `localStorage('wh_game')`. Home detects this and offers a rejoin prompt emitting `rejoin-game`.

5. **Daily challenge**: `getDailyChallenge(lang)` queries `daily_challenges` by `(date, language)` — ES and EN have separate challenges per day. Created on first join if missing.

6. **Auth redirect flow**: Google OAuth / magic link → Supabase redirects to `/setup-profile` → `noProfileGuard` checks profile existence → if no profile, stays on setup; if profile exists, redirects to `/`.

### Wikipedia API

- `Content-Location` response header provides the canonical title after redirects — used for win detection.
- `normalizePage()` lowercases and replaces underscores with spaces before comparing titles.
- `preWarmCache(title, lang)` is called after game start for both start and target pages to make the first navigation instant.

### Design system & styles

**`frontend/src/styles.scss`** is the single source of truth for the design system. All component SCSS files must use these tokens — never hardcode colors.

CSS variable categories defined in `:root`:
- Colors: `--bg-primary/secondary/tertiary`, `--border-color`, `--text-primary/secondary`, `--accent`, `--accent-hover`, `--success`, `--warning`, `--danger`, `--streak-color`
- Spacing: `--space-xs` through `--space-2xl`
- Radius: `--radius-xs` through `--radius-full`
- Shadows: `--shadow-sm/md/lg`
- Z-index: `--z-header(300)`, `--z-backdrop(400)`, `--z-modal(500)`, `--z-toast(600)`
- Font sizes: `--font-xs(12px)` through `--font-xl(16px)`

Global shared classes in `styles.scss` (use these instead of duplicating):
- `.route-display` — unified start→target route layout with `.route-start`, `.route-target`, `.route-label`, `.route-title`, `.route-arrow`
- `.name-locked` + `.name-locked-badge` — authenticated user name display
- `.badge`, `.badge-accent`, `.badge-success` — pill badges
- `.form-label` — uppercase 12px label (use instead of ad-hoc label styles)
- `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger` — button variants
- `.card` — standard card container
- `.error-message` — red error box
- `.sr-only` — screen-reader-only visually hidden content

**Tailwind CSS** is configured with `preflight: false` (no reset, no conflict with existing SCSS). Only utility classes are available — use for one-off spacing/layout tweaks. Color/radius/spacing tokens from the CSS variables are mapped in `frontend/tailwind.config.js`.

### Environment config

- **Dev**: `environment.backendUrl = ''` → Angular dev proxy forwards `/api` to `localhost:3001`. Socket connects to `window.location.hostname:3001`.
- **Prod**: `environment.prod.ts → backendUrl` must be set to the Render backend URL. Supabase `supabaseUrl` and `supabaseAnonKey` are baked into the environment files (anon key is safe to expose).
- **Supabase Auth redirect URLs**: The production frontend URL must be added to the allowed redirect URLs in the Supabase dashboard (Authentication → URL Configuration). Magic link and OAuth both use `window.location.origin` as the redirect base.

### Supabase schema

Tables:
- `user_profiles` — `user_id`, `display_name` (unique), `avatar_emoji`, `accent_color`, `is_supporter` (bool, set by Ko-fi webhook), `streak` (int), `last_daily_date` (text YYYY-MM-DD).
- `daily_challenges` — `date` + `language` unique pair; `start_page`, `target_page`.
- `daily_results` — `date`, `language`, `user_id`, `player_name`, `steps`, `time_ms`, `finished`, `path`.
- `hall_of_fame` — `language`, `user_id`, `player_name`, `start_page`, `target_page`, `steps`, `time_ms`, `is_daily`, `path`.

All results tables have a `language` column defaulting to `'es'`.
