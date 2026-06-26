# Handoff: WikiHunt — visual redesign

## Overview

This is a complete visual redesign of WikiHunt — the multiplayer Wikipedia hunt game. The redesign addresses the 10 UX/UI problems documented in the original brief: weak hero, generic mode cards, flat hierarchy, non-immersive game HUD, unused cosmetics, dry leaderboard, inconsistent spacing, weak mobile HUD, and the lack of personality from copying GitHub Dark.

**Direction:** *"Encyclopedic but electric."* The visual DNA borrows from Wikipedia (serif voice, paper feel, knowledge-blue links, reference-style typography) and collides it with one bold "hunt" color (coral) — the opposite of wiki blue. The result reads as both scholarly and gamey, without copying any other product.

## About the design files

The files in this bundle are **design references created in HTML/React for visual exploration**. They are NOT production code to copy directly into the Angular codebase.

The task is to **port these designs into the existing Angular 17 codebase** following the project's constraints (already documented in the original brief):

- Angular 17, standalone components, SCSS with BEM-light
- All tokens in `styles.scss` via CSS custom properties — components only consume `var(--…)`
- Tailwind available with `preflight: false`, utilities only (no base CSS)
- Material Symbols Outlined for icons
- No external UI frameworks (no PrimeNG, Material, Bootstrap)
- Both dark and light themes must be supported
- DO NOT touch routing or socket logic — only templates, styleUrls, and `styles.scss`

## Fidelity

**Mid-fidelity.** Layouts, typography, color, spacing and component hierarchy are final. Use the exact tokens in `tokens-light.scss` / `tokens-dark.scss`. Copy text in the mocks is illustrative — translate to your existing copy where applicable.

Microcopy details (timer formatting, plural/singular, exact CTA labels) follow your existing logic. The mocks show *layout, hierarchy and visual language*; not exact final copy.

## What changed at the system level

| Aspect | Before (GitHub Dark clone) | After (this design) |
|---|---|---|
| **Accent** | `#58a6ff` (GitHub blue) | `#ff5a3c` Coral — the "hunt" color, opposite to wiki blue |
| **Knowledge blue** | — | `#1a3a8c` — preserved for wiki links / start page only |
| **Streak** | `#ff9500` orange | `#ffd84a` Butter (gentler, used for highlight + champion) |
| **Background** | `#0d1117` GitHub gray | `#0f1220` dark / `#f6f1e6` paper-cream light |
| **Typography** | Inter only | Instrument Serif (display) + Inter (UI) + JetBrains Mono (stats) |
| **Hero** | 26px H1 | 80px serif H1 with italic break |
| **Modes** | 3 equal rectangles | Asymmetric grid; Daily wide+butter, Solo + Challenge equal |
| **Leaderboard** | Flat HTML table | Champion card (butter, big serif #1) + ranked table with podium emoji |
| **Avatars** | Initial in circle | Emoji + accent color from user cosmetics — surfaced everywhere |
| **Logo** | "Wiki" gray + "Hunt" blue | `[[Wiki`*`Hunt`*`]]` — coral brackets reference wiki-link syntax, italic "Hunt" is the action |

## Screens

All 8 screens are in `mocks/` as HTML + JSX. Each has both light and dark variants. Read them inline alongside this README.

### 1. Home
**File:** `mocks/mf-home.jsx`
**Purpose:** Primary entry — convert visitor to multiplayer round in ≤3 seconds.

Layout (desktop, max-width 1280, padded 64px sides):
- **Header bar** (~62px, sticky): logo · spacer · EN toggle · theme toggle · avatar pill (emoji + name)
- **Hero grid** (1.4fr / 1fr), 56px gap, 56px top padding:
  - Left column: live games pill ("142 games · right now") + H1 80px serif (`Race friends / *through* / **Wikipedia.**` — last line in coral) + 18px Newsreader subtitle
  - Right column: **multiplayer card** — `.card` with eyebrow "MULTIPLAYER" + "2-8 players" mono + h3 "Play live" + segmented Create/Join toggle inside `bg-2` track + nickname input + 3 overlapping avatars + "312 playing now" mono + primary CTA "▸ Start room" full-width 50px
- **Mode grid** below, padding 20px top: h3 "Or play alone." + "How to play →" mono link right · 3-column grid `1.4fr 1fr 1fr` gap 16:
  - **Daily** (wider, butter background, 🔥 icon, eyebrow "daily · #142", h3 "Today's hunt", news copy with embedded bold "12-day streak", mono route preview at bottom)
  - **Solo** (⏱ icon, mode card, eyebrow + h3 + news)
  - **Challenge** (🎯 icon, same shape as Solo)
- **Footer band** (18px padded, top border, auto-margin to push to bottom): mono links left (Leaderboard, How to play, EN·ES) + "made by jpdev · ko-fi ☕" italic right

### 2. Header
**Used across all screens** — see any mock. The `<AppHeader>` component receives optional `context` (mono breadcrumb like "game · ABCD-42") and `back` (renders ← button). User dropdown is implicit (avatar pill is the trigger).

### 3. Game (desktop)
**File:** `mocks/mf-game.jsx`
**Purpose:** Wikipedia article reading + tight HUD that doesn't compete with the article.

Grid `280px / 1fr` gap 20, padding 20:
- **Left sidebar** (`<aside>`):
  - **Target card** — `.card.coral` (coral background, white text), eyebrow "🎯 your target", H3-style "Pliny / *the Elder*" at 32px (italic line 2), italic news caption underneath ("roman author · naturalist · 23–79 AD")
  - **Stats grid** (2 cols): two cards each with label "STEPS" / "TIME" + huge mono number (40px) center-aligned
  - **Current location chip** (flat card, bg-2, label "CURRENTLY AT" + Newsreader article name)
  - **Players card** — label "PLAYERS · LIVE" + list of rows. Each row: avatar (coral if me) · name (bold if me) + "· you" mono badge / italic location underneath · mono step count right-aligned. Rows separated by 1px dashed `--rule`.
  - **Action buttons** (2 cols): "↩ leave" ghost + "give up" with coral text+border
- **Article** (right, full height): `.article` class — serif (`Newsreader`), 15px, line-height 1.55. Links use `--bluek`. Target name wrapped in `<mark>` with butter background. H2 has bottom rule.

### 4. Game (mobile)
**File:** `mocks/mf-extras.jsx` → `MobileGame`
**Purpose:** Fix the cramped mobile HUD in the brief.

Phone-shaped column, border-radius 28 (clipped to frame):
1. Status bar (faux, 8px y-pad, mono fontsize 11)
2. **Coral sticky target band** (10px y-pad, full coral bg, white text): eyebrow "🎯 TARGET" 9px + serif 22px name + "leave" button right (rgba white background, 6px y-pad)
3. **Stats strip** (3-column grid, surface bg, bottom rule): each cell has label + mono 22px number. Vertical 1px rules between cells.
4. **Article** (article class, smaller padding 14, fontsize 13)
5. **Bottom dock** (10px y-pad, top rule): back icon-button (with rule border) · overlapping avatar stack (negative margin -8) · "give up" pill in coral

### 5. End-of-hunt modal
**File:** `mocks/mf-extras.jsx` → `EndGameModal`
**Purpose:** Overlays the game when someone finishes.

Backdrop: `rgba(15,18,32,.85)` dark / `rgba(26,30,46,.4)` light over the active game.
Modal: 540px wide, padding 28, border-radius 16, drop-shadow `0 30px 80px -20px rgba(0,0,0,.55)`.
- Header centered: 🏁 emoji 48px · eyebrow "HUNT COMPLETE" · h2 "*You* got there first." (italic word emphasized) · news subtitle "4 steps · 0:42 · 3 others still hunting"
- **Path taken** flat card (bg-2): label + horizontal chain of page chips separated by mono "→". Last chip uses coral text + italic + bold.
- **Results table**: 4 rows, grid `28px 32px 1fr auto auto`. First column = medal/dot. Row "me" has coral-soft background. Hunting players show "—" for stats with italic "hunting · at <article>" caption.
- Footer: 2 buttons (ghost "🔁 Play again" + primary "📤 Share result") + ghost "← back to home" full-width small

### 6. Leaderboard
**File:** `mocks/mf-leaderboard.jsx`
**Purpose:** Social proof + retention via daily comparison.

Centered column max-width 980, padding 40px y / 32px x:
- **Header row** (flex, space-between, baseline aligned): left = eyebrow "leaderboard · day #142" + h2 "Today's hunt" + route as inline knowledge+coral pills separated by mono "→". Right = label "resets in" + mono 22px countdown.
- **Champion card** — `.card.butter` (butter bg, ink text), padding 26, grid 1fr/auto. Left = avatar 96×96 with 3px ink border (cream inside!) + eyebrow "👑 day's champion" + h2 name + 3 stats inline (steps / time / finished-ago in italic news). Right = ghost serif "1" at 80px with 35% opacity.
- **Tabs bar**: 4 tabs (Today / All-time / My results / Challenge) — flat buttons with active = coral bottom border 2px. Bottom rule.
- **Ranked table**: header row in bg-2 (column labels in mono), then 8 data rows. Grid `40px 1fr 80px 80px 100px`. Rank column = serif 22px (coral for top 3, ink-3 otherwise). Player column = avatar + name. Steps + time = mono right-aligned. "When" = italic news right-aligned. Me row has coral-soft bg.

### 7. Lobby
**File:** `mocks/mf-lobby.jsx`
**Purpose:** Pre-game setup + room sharing.

Centered column max-width 880, padding 40 y / 32 x:
- Grid 1.2fr/1fr gap 24:
  - **Code+route card**: eyebrow "YOUR ROOM" + 4 large code tiles (56×68, mono 36px bold, bg-2, 1.5px ink border) + Copy button · italic news caption · 1px rule · label "TODAY'S ROUTE" + RouteDisplay + chips row (random/custom/reroll)
  - **Players card**: eyebrow + count "4 / 8" · list of joined rows (avatar + name + tag: butter "host" pill for host, italic "ready" or italic "just joined" notes) · empty slots in dashed avatar with italic "waiting…" at 50% opacity
- **Host settings card** (full width below): eyebrow + italic "only the host sees this" · grid 3 cols (grace time / wiki search / language) each with label + small segmented button group. Active = ink-filled button with reverse fg.
- **Start CTA** (centered, primary xl, min-width 280): "▸ Start the hunt"

### 8. Daily
**File:** `mocks/mf-daily.jsx`
**Purpose:** Daily challenge entry point with streak motivation.

Centered column max-width 720:
- Header row: left = eyebrow "daily · day #142 · 12 may 2026" + h1 60px "Today's / *hunt.*" / right = butter card with "🔥 streak" + mono 44px count + italic caption
- **Route card** (padding 30): eyebrow "everyone gets the same route" · 3-col grid (start/arrow/target) each with label + serif 32px name (start in blue, target in coral italic) + italic news description
- **Streak grid card**: eyebrow + italic "12 of 14 days" right · 2 rows × 7 day-cells. Played = filled coral square 22×22 with day-letter underneath in mono. Today = coral with 🔥 inside and ring-shadow.
- **Community stats** — 4 cards in a row: solved by / avg steps / best ever / resets in. Each: label + mono 26px number + italic news subtitle.
- **CTA** (centered xl primary, min-width 320): "▸ Hunt the day" + italic caption "one attempt per day · saves to your streak"

### 9. Challenge creator
**File:** `mocks/mf-challenge.jsx`
**Purpose:** Build a custom hunt to share.

Two states:
- **Form state**: header eyebrow + h2 "Pick two pages." + news subtitle · start card (label + input with 🔍 + selected page chip in knowledge-soft) · target card (same shape, chip in coral-soft) · **preview card** (`.card.tint` coral-soft bg) showing RouteDisplay + italic difficulty + "friends solved similar in 5-7 steps" · primary xl "⚡ Generate link"
- **Shared state** (after generate): same header but italic "live" word emphasis · **share card** with 2px ink border — header row with logo + mono challenge ID, eyebrow "a hunt from" + avatar+name, vertical route display (start blue / mono ↓ / target coral italic), rule, italic quote "I did it in 4 steps. Beat me." · link card with monospace URL + primary "📋 Copy link" · 3 share buttons row (Tweet / WhatsApp / Email)

### 10. Auth (sign in)
**File:** `mocks/mf-auth.jsx` → `AuthScreen`
**Purpose:** Magic-link first sign-in.

2-column split, 1fr/1fr, full height:
- **Left column** (bg-2, padding 60 y / 56 x, vertical-centered, right border): eyebrow "welcome back" + h1 64px "Sign in / *to keep* / your streak." (last line ink) + news subtitle · "last login" row at bottom = butter avatar 56×56 with 🔥 + mono "12-day streak" + italic caption
- **Right column** (same padding, vertical-centered): max-width 360 form column —
  - Segmented Sign in / Create account tabs (in bg-2 track, lifted active)
  - Google button (large, left-justified with 18px 🇬 + label + arrow ›)
  - Divider with italic "or with email" caption
  - Email label + input large + primary "✉ Send magic link" full-width large
  - Italic caption "we'll email you a one-tap link. no passwords here."
  - Dashed-border box with "or" + "play as guest →" link

### 11. Setup profile (cosmetics)
**File:** `mocks/mf-auth.jsx` → `SetupScreen`
**Purpose:** Pick avatar emoji + accent color after sign-up. This is where cosmetics live.

Centered column max-width 760:
- Centered header: eyebrow "welcome · pick your look" + h2 "How should we *show you*?" + news subtitle
- **Live preview card**: grid auto/1fr — coral 96×96 avatar showing chosen emoji · label "LIVE PREVIEW" + h3 nickname + italic caption + row of mock pills ("you" coral + "just joined" knowledge)
- **Nickname card**: label + large input with italic "3-16 chars" right
- **Emoji picker card**: label + 8-column grid of 16 emoji buttons. Active = coral-soft bg + 2px coral border, others = bg-2 transparent border. Each cell `aspect-ratio: 1`.
- **Color picker card**: label + 8 circular swatches 56×56. Active = 3px ink border with 4px inset surface (creates ring effect).
- Footer 2 buttons: "← back" ghost large flex:1 + "▸ Start hunting" primary xl flex:2

## Design tokens

Drop `tokens-light.scss` + `tokens-dark.scss` into your `styles.scss` (or import them). These replace the current `--bg-primary`, `--accent` etc. **Old token names are deliberately kept where possible** — e.g. `--success`, `--danger`, `--streak-color` — so existing component CSS keeps working. New tokens are additive.

See `tokens-light.scss` and `tokens-dark.scss` for the full list. Highlights:

```scss
// Light (paper/ink)
--bg-primary:    #f6f1e6;   // paper cream
--bg-secondary:  #efe7d4;   // bg-2 / track
--bg-tertiary:   #e7dcc1;   // hover/active
--surface:       #fbf7ec;   // cards
--border-color:  #d8cfb8;   // rules
--text-primary:  #1a1e2e;   // ink
--text-secondary:#3d4256;
--text-muted:    #7a7e8f;
--accent:        #ff5a3c;   // coral / hunt
--knowledge:     #1a3a8c;   // wiki link blue (NEW)
--success:       #7ec27a;   // softer mint
--danger:        #e64a2d;   // close to coral
--streak-color:  #ffd84a;   // butter

// Dark (ink)
--bg-primary:    #0f1220;
--bg-secondary:  #161a30;
--bg-tertiary:   #1f243f;
--surface:       #181c33;
--border-color:  #2a2f4a;
--text-primary:  #f0ebde;
--text-secondary:#b9b4a5;
--text-muted:    #7a7e8f;
--accent:        #ff6b50;   // lifted in dark for contrast
--knowledge:     #6f8eff;
--success:       #7ec27a;
--danger:        #ff6b50;
--streak-color:  #ffd84a;
```

### Spacing & sizing scale

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4px | hair gap |
| `--space-2` | 8px | tight group |
| `--space-3` | 12px | inside card padding |
| `--space-4` | 16px | section gap |
| `--space-5` | 20px | card spacing |
| `--space-6` | 24px | between sections |
| `--space-7` | 32px | page padding (mobile) |
| `--space-8` | 40px | page padding (desktop y) |
| `--space-9` | 56px | hero gap |
| `--space-10` | 64px | page padding (desktop x) |
| `--radius-sm` | 6px | inputs, pills, small btns |
| `--radius-md` | 8px | btns, inputs lg |
| `--radius-lg` | 12px | cards |
| `--radius-xl` | 16px | hero / modal |
| `--radius-pill` | 999px | pills |

### Typography

Load these fonts (Inter is already loaded — add the other two via Google Fonts link):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

| Class | Family | Use |
|---|---|---|
| `--font-display` | `'Instrument Serif', Georgia, serif` | h1, h2, h3, logo |
| `--font-body` | `'Inter', system-ui, sans-serif` | UI, body, buttons, labels |
| `--font-prose` | `'Newsreader', Georgia, serif` | wiki article, italic captions |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | numbers, codes, labels |

Scale:
- H1 hero: `font-display` 80px / `line-height: 0.92` / `letter-spacing: -0.02em`
- H1: 60px / 0.95 / -0.02em
- H2: 44px / 1 / -0.015em
- H3: 28px / 1.05
- Eyebrow: `font-mono` 11px / `letter-spacing: 0.14em` / uppercase / `color: var(--accent)` / weight 500
- Label: `font-mono` 10px / `letter-spacing: 0.12em` / uppercase / `color: var(--text-muted)` / weight 500
- Body: `font-body` 14px / 1.45
- Newsreader caption: `font-prose` italic 13px / `color: var(--text-muted)`
- Num display: `font-mono` weight 500 / `font-variant-numeric: tabular-nums`

## Components to update

Map each existing class in `styles.scss` to the new design. Priorities follow the original brief's impact ranking.

### 🔴 High priority

**`.btn-primary` / `.btn-secondary`** — see `.btn` / `.btn.primary` / `.btn.ghost` in `mocks/mf-kit.jsx`. Three sizes: default, `lg`, `xl`. Border-radius 8 / 10 / 10. Hover: `translateY(-1px)` + box-shadow ring `0 0 0 3px rgba(255,90,60,.22)` on primary.

**`.card`** — `background: var(--surface)`, `border: 1px solid var(--border-color)`, `border-radius: var(--radius-lg)`, `padding: 20px`, `box-shadow: 0 1px 0 rgba(26,30,46,.04), 0 6px 24px -10px rgba(26,30,46,.18)`. Variants: `.card--coral` (full coral bg, white text), `.card--tint` (coral-soft bg), `.card--knowledge` (blue-soft bg), `.card--butter` (butter bg, ink text), `.card--flat` (no shadow).

**`.avatar-circle`** — needs to consume cosmetics. The user record has `emoji` + `accent` (hex or token name). Render:
```html
<span class="av" [class.av--coral]="user.accent === 'coral'" [style.background]="user.accentHex">
  {{ user.emoji || initials(user.name) }}
</span>
```
Three sizes: `.av.sm` (24×24, 13px), default (32×32, 16px), `.av.lg` (48×48, 24px), `.av.xl` (72×72, 36px). Border 1.5px `var(--border-color)`. The brief explicitly calls this out as a priority — emoji avatars must appear in **header**, **player lists**, **leaderboard**, **end-game modal**.

**`.page-chip`** — replaces existing `.page-chip` start/target. Now uses softer backgrounds: knowledge-soft for start, coral-soft for target. See `.pill.knowledge` / coral variant in mf-kit.

**`.route-display`** — see `.route` in mf-kit. Two `.pg` boxes (start + target) joined by mono "→". 10px padding, weight 500.

**`.mode-pills`** — existing toggle. Replace with the segmented track pattern: `bg-2` background container with 4px padding + 10px radius, inner buttons with `transparent` border when inactive, `surface` bg + shadow when active.

**Header (existing component)** — port `<AppHeader>` from `mocks/mf-kit.jsx`. Three optional zones: logo · breadcrumb context (mono) · right cluster (EN toggle / theme toggle / avatar pill). Avatar pill = pill with avatar+name inside, opens dropdown.

### 🟡 Medium priority

**`.streak-row`** — keep the row but switch to the 2×7 grid pattern seen in Daily mock when shown on Daily page. Header dropdown can stay as single row.

**`.tabs`** — existing tabs become the leaderboard pattern: flat buttons with `borderBottom: 2px solid var(--accent)` on active, ink-3 on inactive.

**`.error-message` / `.success-message`** — repaint backgrounds to use `--coral-soft` / mint variants. Keep BEM structure.

**`.form-label`** — already uppercase 12px. Keep, but switch font to `var(--font-mono)` and `letter-spacing: 0.12em`.

### 🟢 Lower priority

**`.field`**, search dropdown, name-locked badge — apply new tokens. No structural changes needed.

## Interactions & behavior

These are visual+motion notes only. All routing, socket events, and game logic stay untouched.

| Surface | Behavior |
|---|---|
| Button hover | `transform: translateY(-1px)` (120ms ease). Primary also gets `0 0 0 3px rgba(255,90,60,.22)` ring. |
| Card hover (mode cards) | `translateY(-2px)`, slightly stronger shadow, border-color shifts to `--rule-2`. |
| Live pill | `.pill.live::before` 6px dot with `0 0 0 3px rgba(255,90,60,.25)` pulsing every 2s (`@keyframes mfpulse`). |
| Input focus | `border-color: var(--accent)` + same ring. |
| Lobby code tile | No interaction by default; "Copy" button is the affordance. |
| End-game modal entry | Fade-in backdrop 150ms, modal `scale(0.98 → 1)` + fade-in 200ms cubic-bezier(0.2, 0.7, 0.3, 1). |
| Streak day cells | Today cell has the 3px coral-soft shadow + fire emoji to draw the eye. Animate when crossing midnight: scale pulse 1 → 1.2 → 1. |
| Theme toggle | Add `[data-theme="dark"]` (or `.dark`) on `<html>`. CSS handles the rest via the token redefinitions. |

## State & data — what's new

The cosmetics system (`avatar.emoji`, `avatar.accent`) **already exists in the DB** per the brief but is unused. The header avatar component must read these fields. Same for player lists and leaderboard rows. Add a fallback to first-letter when emoji is missing.

No new state shapes required.

## Responsive

Desktop mocks are 1280px. Below 960px, switch home hero from 2-col to stacked, mode grid from 3-col to single column. Game page: below 900px, sidebar collapses behind a slide-in panel triggered from the mobile top HUD (already in `MobileGame` mock).

Mobile Game shown at 380×760 — replicate the layout there for breakpoint ≤640px.

## Files in this bundle

- **`README.md`** — this file
- **`tokens-light.scss`** — paste into `styles.scss` `:root` block
- **`tokens-dark.scss`** — paste into `[data-theme="dark"]` / `body.dark` block
- **`mocks/`** — all 22 mid-fi screens, both themes:
  - `WikiHunt Mid-Fi.html` — open this to see everything on the design canvas
  - `mf-kit.jsx` — shared primitives (logo, header, buttons, cards, route)
  - `mf-home.jsx`, `mf-game.jsx`, `mf-leaderboard.jsx`, `mf-lobby.jsx`, `mf-daily.jsx`, `mf-challenge.jsx`, `mf-auth.jsx`, `mf-extras.jsx`
  - `design-canvas.jsx` — the canvas runner (not part of the design)
- **`brand-direction/`** — earlier exploration of logo concepts + palette
- **`wireframes/`** — earlier low-fi exploration if you want to see alternative directions

## Implementation order suggested

1. Add fonts to `index.html` + define new tokens in `styles.scss` (both themes)
2. Update Logo, Header, Avatar, Button, Card, Pill, Input — these unblock everything else
3. Home (highest impact)
4. Game sidebar + Mobile Game HUD
5. Leaderboard (champion card is the easy win)
6. Lobby (code spectacle + host settings)
7. Daily + Challenge creator + Setup profile (cosmetics finally visible)
8. Auth split layout (lowest priority — current flow already works)

Good luck — and a request: if anything in the mocks looks ambiguous, ask before improvising. The system is tight on purpose.
