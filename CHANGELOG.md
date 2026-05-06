# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-07] - Fix: GitHub Push 409 SHA Conflict

### Fixed
- **409 conflict on push** — `pushFile()` now retries up to 3 times on SHA mismatch, re-fetching the file's current SHA before each retry
- **Race condition** — Sequential pushes (README → anime.json) no longer fail when concurrent commits change the file SHA between GET and PUT

## [2026-05-07] - Diagnostic Sweep: Critical Fixes

### Fixed
- **Double push on edit** — `anime/[id].js` no longer fires redundant client-side push after `writeData()` already pushes
- **Double push on add** — `anime/add.js` modal push now uses `apiPost()` with proper headers
- **Missing GitHub headers on push** — All `fetch('/api/push')` calls replaced with `apiPost('/api/push')` which sends GitHub credentials from localStorage settings
- **Bulk delete O(n) API calls** — Now batches all deletes locally, single `writeData()` call (2 API calls instead of 2n)
- **No input validation** — Add/edit routes now validate: title non-empty, score clamped 0-10, episodes ≥ 0, type/status whitelisted
- **Push page missing auth headers** — `push.js` now uses `apiPost()` instead of raw `fetch()`

### Removed
- Dead auto-push code from `anime/[id].js` (lines 58-66)
- Redundant client-side push logic (server-side `writeData()` handles it)

### Technical
- `pages/anime/[id].js` — removed auto-push block, added input sanitization
- `pages/anime/add.js` — `handlePushNow()` uses `apiPost()`
- `pages/anime/index.js` — `handlePushNow()` uses `apiPost()`
- `pages/push.js` — all fetch calls use `apiPost()`
- `pages/api/anime/bulk-delete.js` — rewritten to batch deletes with single `writeData()`
- `pages/api/anime/index.js` — input validation on POST
- `pages/api/anime/[id].js` — input sanitization on PUT/PATCH

## [2026-05-07] - Added: The Beginning After the End

### Added
- **The Beginning After the End** — TV • AniList ID: 144176
- **The Beginning After the End Season 2** — TV • AniList ID: 169822

## [2026-05-07] - Auto-Regenerate README on Every Data Change

### Fixed
- **README.md now auto-updates on every add/edit/delete/import** — `writeData()` in `lib/data.js` now regenerates and pushes `README.md` alongside `anime.json` automatically
- No more manual "Generate README" step — every data mutation keeps README in sync

### Changed
- `writeData()` pushes two commits to GitHub: `anime.json` + `README.md`
- README generation errors are non-blocking (data push still succeeds even if README fails)

## [2026-05-07] - Activity Log: GitHub Persistence & Bulk Delete Logging

### Added
- **Activity log persists to GitHub** — `addEntry()` now pushes log to GitHub repo alongside local write, surviving Vercel cold starts
- **Bulk delete API endpoint** — `POST /api/anime/bulk-delete` accepts array of IDs, logs as single "Bulk: Title1, Title2 +N more" entry
- **Activity log loads from GitHub on cold start** — API route fetches from GitHub when local `/tmp` is empty (Vercel)
- **New action types** — `export` action color/icon added to activity page filters

### Changed
- All API routes now pass GitHub credentials to `addEntry()` for persistent logging
- Bulk delete on anime list page uses new dedicated endpoint instead of N individual deletes
- Activity log filter dropdown includes all action types: add, edit, delete, push, import, generate, login, settings, export

### Technical
- `activity-log.js` — `addEntry()` accepts optional `gh` param, fire-and-forget push to GitHub
- `api/activity.js` — async handler, falls back to GitHub fetch when local log is empty
- `api/anime/bulk-delete.js` — new endpoint for batch deletion with logging

## [2026-05-07] - Anime List: Covers, Bulk Actions, Stats & More

### Added
- **Cover images for 244/258 anime** — batch-fetched from AniList API; missing covers show a styled gradient placeholder with title initial letter
- **Quick stats bar** — top of anime list shows Total, Completed, Watching, Plan to Watch, and Average Score at a glance
- **Bulk select & batch delete** — checkboxes on each row/card + select-all in table view; bulk delete with confirmation modal showing all selected titles
- **Export CSV** — download current filtered list as a CSV file (Title, Type, Score, Episodes, Status, Genres, URL)
- **Quick Push button** — push to GitHub directly from the anime list page (top toolbar)
- **Random Pick button** — jump to random picker from the list toolbar
- **Grid view selection** — click any card to select it (visual checkbox overlay); selected cards get accent border

### Fixed
- **Grid view missing covers** — 244 out of 258 anime now display AniList cover art; remaining 14 show deterministic color gradient with title initial
- **Table view missing covers** — same fallback with mini colored placeholder

### Technical
- Cover fetch script at `scripts/fetch-covers.py` — batch AniList GraphQL queries with rate limiting
- `titleColor()` function generates deterministic HSL color from title string for consistent placeholders

## [2026-05-07] - Add Anime: Post-Add Confirmation Modal

### Added
- **Success modal after adding anime** — instead of auto-redirecting, a modal appears with three options:
  - **Add Another Anime** — resets the form and stays on the page for batch adding
  - **Push to GitHub** — one-click push without leaving the page (shows loading/success state)
  - **View All Anime** — navigate to the anime list (old behavior)
- Modal shows the added anime title for confirmation
- Push button disables after successful push to prevent double-pushing

## [2026-05-07] - Fix: Push Page Now Uses Environment Variables as Fallback

### Fixed
- **Push page no longer requires manual token entry** — `api/push.js` now falls back to `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` environment variables when credentials aren't provided in the form
- **Push page pre-populates from saved settings** — Token, owner, and repo fields auto-fill from localStorage (set via Settings page) on page load
- **Better error message** — Clear message when no token is available (form or env var)

### Changed
- Token field on Push page is now optional when `GITHUB_TOKEN` env var is set
- Added hint text explaining the env var fallback

## [2026-05-07] - Favicon & Open Graph Meta Tags

### Added
- **`pages/_document.js`** — Custom document with favicon, Open Graph, and Twitter Card meta tags
- **Favicon** — `public/favicon.png` (32x32 PNG, served at `/favicon.png`)
- **Open Graph tags** — title, description, image (uses repo logo), site name, dimensions
- **Twitter Card** — `summary_large_image` with title, description, and image
- **Theme color** — `#7c3aed` (purple accent matching the UI)
- **Meta description** — SEO-friendly description for the admin panel

### Technical
- OG image uses the repo's `assets/logo.png` via raw.githubusercontent.com (no extra hosting needed)
- Favicon is a resized 32x32 version of the logo
- All pages inherit the OG tags from `_document.js`

## [2026-05-07] - Simplified: Auto-Push via Environment Variables

### Changed
- **GitHub credentials now read from environment variables** — `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` env vars are used automatically as fallback when client doesn't send credentials
- **No manual Settings configuration needed** — set 3 env vars on Vercel once and data persistence works automatically
- Updated `.env.example` with all required variables

### Setup (one-time)
1. Vercel Dashboard → your project → **Settings** → **Environment Variables**
2. Add: `ADMIN_PASSWORD`, `JWT_SECRET`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`
3. Redeploy

## [2026-05-07] - Critical Fix: Persistent Data Storage & Data Recovery

### Fixed
- **Data loss on Vercel** — Root cause: `/tmp` filesystem resets on every serverless cold start, causing all add/edit/delete operations to silently lose data. Fixed by using GitHub API as persistent storage backend.
- **Recovered 257 anime entries** — Data was lost when Vercel's ephemeral `/tmp` wrote back a single-entry state. Restored from git history commit `0a57fdf`.
- **All data mutations now persist** — `addAnime`, `updateAnime`, `deleteAnime` write to GitHub repo via API, not just local filesystem
- **Reads use GitHub as source of truth** — When GitHub credentials are available, reads fetch from `raw.githubusercontent.com` (always up-to-date), falling back to bundled file

### Changed
- **`lib/data.js` completely rewritten** — All CRUD functions are now async, accept optional GitHub credentials (`{token, owner, repo}`), and persist to GitHub
- **`lib/api.js` created** — Client-side helper that auto-attaches GitHub credentials from localStorage settings to every API request via `x-github-token`, `x-github-owner`, `x-github-repo` headers
- **All 8 API routes updated** — Extract GitHub credentials from request headers/body via `getGhFromReq()` and pass to data layer
- **All 10 client pages updated** — Use `apiGet`/`apiPost`/`apiPut`/`apiDelete` instead of raw `fetch` to automatically include credentials
- **Zero external dependencies** — GitHub API calls use native Node.js `https` module only

### Technical
- Data flow: Client → `apiFetch` (adds GH headers) → API route → `getGhFromReq(req)` → `readData(gh)` / `writeData(data, gh)` → GitHub API
- Fallback chain: GitHub API → `/tmp` cache → bundled `data/anime.json` → empty state
- `readDataSync()` preserved for legacy sync callers (uses local cache only)
- GitHub credentials stored in `localStorage` as `mal_admin_settings` (client-side only, never leaked)

### Required Setup
- **Enable Settings → Auto-Push** with your GitHub token, owner, and repo name — this is now required for data persistence on Vercel

## [2026-05-07] - UI Overhaul: Professional SVG Icons Replace Emojis

### Changed
- **Replaced all emoji icons with SVG components** across 13 page files and 1 shared icon library
- Created `lib/icons.js` — 35+ reusable SVG icon components (Heroicons-style, 20x20 default, inherit currentColor)
- **Dashboard** (`pages/index.js`) — star ratings, status cards, quick action buttons, genre tags, recent table
- **Login** (`pages/login.js`) — unlock icon on sign-in button
- **Activity Log** (`pages/activity.js`) — action-specific icons (add/edit/delete/push/import/login/settings), timeline dots, empty state
- **Push to GitHub** (`pages/push.js`) — document and rocket icons for step headers and buttons
- **Settings** (`pages/settings.js`) — settings/gear, rocket, tag, save, download/upload, checkmark icons
- **Random Picker** (`pages/random.js`) — dice, target filter, star ratings, note icons
- **All Anime** (`pages/anime/index.js`) — grid/list toggle, plus, search, edit, trash, star scores, filter icons
- **Add Anime** (`pages/anime/add.js`) — search, edit, star, plus, note icons on form labels and buttons
- **Edit Anime** (`pages/anime/[id].js`) — save, note, star icons
- **Bulk Import** (`pages/bulk-import.js`) — box, link, search, clipboard, rocket icons
- **AniList Search** (`pages/anilist.js`) — search, star, plus icons
- **Analytics** (`pages/analytics.js`) — chart, star, TV, tag, list, rocket, checkmark icons

### Technical
- All icons use `stroke="currentColor"` — automatically match theme colors
- Icons scale via `size` prop (default 20px)
- Both outline (`Icon`) and solid (`IconSolid`) variants available
- Activity log action icons mapped via `ACTIVITY_ACTION_ICONS` constant
- Page bundle sizes increased ~1-3KB each (SVG paths are lightweight)
- Zero external icon library dependencies — pure inline SVG

## [2026-05-07] - Fix: Vercel Read-Only Filesystem Crash

### Fixed
- **Critical: Login crash on Vercel** — `addEntry()` in auth route threw unhandled error when writing `activity-log.json` to Vercel's read-only filesystem, causing "Internal server error" on every login attempt
- **Activity log write safety** — `lib/activity-log.js` `writeLog()` now catches filesystem errors silently instead of crashing
- **Data write safety** — `lib/data.js` `writeData()` now catches filesystem errors silently
- **Vercel /tmp support** — Both `data.js` and `activity-log.js` detect `VERCEL` env var and use `/tmp` (writable) instead of `data/` (read-only)
- **Data seeding** — On first read, if `/tmp` is empty, data is seeded from the bundled `data/anime.json` so the admin panel has content to display

### Technical
- `IS_VERCEL = !!process.env.VERCEL` — Vercel sets this automatically, no config needed
- On Vercel: reads from bundled `data/anime.json`, writes to `/tmp/anime.json`
- On local: reads/writes from `data/` as before — no behavior change for local dev
- Activity log is ephemeral on Vercel (lost on cold start) — use GitHub push for persistence

## [2026-05-07] - Security & Stability Fixes — Full Diagnostic Sweep

### Fixed
- **Critical: Hardcoded password fallback removed** — `lib/auth.js` no longer falls back to `anime-admin-2026` when `ADMIN_PASSWORD` env var is missing. Auth now fails closed (no access without env var configured)
- **Critical: JWT secret cold-start fix** — `lib/auth.js` now derives a deterministic secret from `ADMIN_PASSWORD` when `JWT_SECRET` is not set, so tokens survive serverless cold starts instead of being randomly regenerated each restart
- **Auth cookie production fix** — `pages/api/auth.js` now adds `Secure` flag on Vercel/production environments so cookies work over HTTPS
- **Error handling added** — `pages/api/auth.js` and `pages/api/activity.js` now wrap handlers in try/catch like all other API routes
- **Serverless path fix** — `lib/data.js` and `lib/activity-log.js` now use `__dirname`-relative paths instead of `process.cwd()` which is unreliable in Vercel's standalone output
- **Removed production console.log** — `lib/readme-generator.js` no longer logs to stdout in production

### Changed
- **CJS consistency** — `lib/auto-push.js` converted from ESM (`export`) to CJS (`module.exports`) to match all other `lib/` modules
- **`.env.example` updated** — Added `JWT_SECRET` generation command and marked both vars as required with notes about cold-start behavior

### Technical
- When `JWT_SECRET` is not set, secret is derived as `SHA-256(ADMIN_PASSWORD)` — deterministic across cold starts, unique per password
- When neither `ADMIN_PASSWORD` nor `JWT_SECRET` is set, auth is completely disabled with console.error warning
- All 36 JS files pass syntax check, build passes clean (14 routes, 0 errors)

## [2026-05-07] - Fix Vercel Build — Broken Import Paths

### Fixed
- **Fixed incorrect relative import paths** in 3 API route files that caused Vercel build failure
  - `pages/api/activity.js` — `../../../lib/` → `../../lib/` (2 levels up, not 3)
  - `pages/api/push.js` — `../../../lib/` → `../../lib/` for all 5 imports
  - `pages/api/stats.js` — `../../../lib/` → `../../lib/` for all 3 imports
- Root cause: `pages/api/*.js` files are 2 levels from `admin-panel/` root, but imports used `../../../` (3 levels) which resolved outside the project directory
- Files in subdirectories (`pages/api/anime/`, `pages/api/anilist/`) already had correct `../../../` paths (3 levels deep)

### Technical
- Verified all 14 API route files have correct import paths
- `pages/api/auth.js` was already correct (`../../lib/`)
- No functional changes, only path resolution fix

## [2026-05-07] - Admin Panel v1.3.1 — Live Stats

### Changed
- **README Generator now computes live stats** from actual data — no more hardcoded values
  - Total Anime: computed from array length
  - TV/Movie/OVA/ONA counts: computed from type field
  - Average Score: computed from all scores
  - Completion Rate: computed from status field
  - Stats table includes TV Shows, OVAs, ONA rows
- **Dashboard shows 6 stat cards** — Total Anime, Avg Score, TV Shows, Movies, OVAs, Completion Rate
- **Stats API returns computed stats** — score distribution, type breakdown, status counts

### Technical
- `computeStats()` function in readme-generator.js computes all stats from anime array
- Stats API uses real-time computation instead of stored metadata
- README badge dynamically shows actual anime count

## [2026-05-07] - Admin Panel v1.3.0 — Activity Log

### Added
- **Activity Log** — Full audit trail of every action in the admin panel
  - Timeline view grouped by date with colored dots and icons
  - Tracks: add, edit, delete, push, import, generate, login events
  - Shows what changed (score 7→9, status Completed→Watching, etc.)
  - Search and filter by action type
  - Pagination (30 per page)
  - Clear log button
  - Stored in `data/activity-log.json` (max 500 entries, auto-trimmed)
- **Logging integrated into all API routes**
  - `POST /api/anime` — logs "Added: Title"
  - `PUT /api/anime/[id]` — logs "Edited: Title — score 7→9"
  - `DELETE /api/anime/[id]` — logs "Deleted: Title"
  - `POST /api/push` — logs "Pushed to owner/repo"
  - `POST /api/anime/import` — logs "Imported X entries"
  - `POST /api/auth` — logs "Successful login" or "Failed login attempt"

### Technical
- New `lib/activity-log.js` module with add/get/clear functions
- Activity log API endpoint with filtering and pagination
- Auto-trim to 500 entries to prevent unbounded growth

## [2026-05-07] - Admin Panel v1.2.1 — Diagnostics & Data Cleanup

### Fixed
- **Removed unused dependencies** — `cookie` and `jsonwebtoken` removed from package.json (custom HMAC auth used instead)
- **Added try/catch** to 3 API routes (random, [id], stats) for proper error handling
- **Fixed 73 incorrect AniList IDs** — fetched correct IDs from AniList API via rate-limited batch script
- **Removed duplicate entries** — Hyouka (2x), Love is War (= Kaguya-sama)
- **Fixed Dragon Maid ID** — corrected from 21507 to 21816
- **Added missing data fields** — all 257 entries now have `status`, `notes`, `tags`, `addedAt`, `updatedAt` fields
- **4 entries with placeholder IDs** — Q Transformers, Xiaolin Showdown, Yamada-kun, Zombie Powder (not available on AniList)

### Technical
- Added `scripts/fix-duplicate-ids.js` — batch AniList ID lookup with rate limiting
- Added `scripts/fetch-correct-ids.js` — second-pass ID correction
- Zero true duplicate IDs remaining (aliases are intentional: same anime, different names)
- All 30 JS files pass syntax check, all API routes have error handling

## [2026-05-06] - Admin Panel v1.2.0 — Watchlist, Visuals & Polish

### Added
- **Watchlist / Status Tracking** — Mark anime as Completed, Watching, Plan to Watch, On Hold, or Dropped; filter by status; status breakdown on dashboard
- **Grid / Cover View** — Toggle between table and visual grid view with AniList cover art; hover animations; score & status badges on cards
- **Personal Notes & Reviews** — Add text notes to any anime; shown in edit page, table view, and random picker
- **Random Anime Picker** — Spin the wheel with filters (status, type, min score); dramatic spin animation; pick history
- **Keyboard Shortcuts** — `N` = new anime, `/` = search, `H` = dashboard, `A` = all anime, `S` = AniList search, `R` = random, `Esc` = close modal, `?` = help
- **Custom Tags** — Add custom labels beyond genres (favorite, hidden-gem, rewatch); filter by tag
- **Cover Image Support** — Auto-fetched from AniList; stored in data; shown in grid view and edit page
- **Score Color Coding** — Green (≥8), Yellow (6-7.9), Red (<6) across all views
- **Status Color Coding** — Each status has a distinct color shown as badges and indicators

### Changed
- Anime list now supports both table and grid view (persisted in localStorage)
- Search now also searches notes and genres
- Dashboard shows status breakdown (Completed, Watching, Plan to Watch, etc.)
- Add/Edit forms now include status, notes, tags, and cover image fields
- Sidebar now includes Random Picker link
- Status filter added to anime list page

### Technical
- New `status`, `notes`, `tags`, `coverImage` fields in anime data
- Random anime API endpoint with filter support
- Keyboard shortcuts hook with smart input detection
- SVG-based charts with no external dependencies

## [2026-05-06] - Admin Panel v1.1.0 — Smart Features

### Added
- **Auto-Push Toggle** — Enable in Settings to auto-commit & push every add/edit/delete to GitHub
- **AniList URL Auto-Fetch** — Paste any `anilist.co/anime/XXXX` URL and all fields auto-fill instantly
- **Visual Analytics** — Score distribution bar chart, genre breakdown, type donut chart, letter distribution, highest rated leaderboard
- **Bulk Import** — Paste multiple AniList URLs or search-and-add in batch; select all/deselect all; one-click import queue
- **Backup & Restore** — Export entire collection as JSON; import from backup file with validation
- **Settings Page** — Configure auto-push (GitHub token, owner, repo), display defaults, and manage backups
- **Sidebar Enhancements** — New nav items for Bulk Import, Analytics, Settings; live auto-push status indicator

### Changed
- Add Anime page now auto-fetches all details when an AniList URL is pasted
- Delete and Edit operations trigger auto-push when enabled in settings
- Sidebar reorganized with Main and Tools sections

### Technical
- Client-side localStorage for settings persistence
- Auto-push fires-and-forgets after mutations (non-blocking)
- Import API endpoint for bulk data replacement
- SVG-based charts (zero external dependencies)

## [2026-05-06] - Admin Panel v1.0.0

### Added
- **Admin Panel** — Full-featured web admin for managing anime collection
  - Password-protected authentication with JWT tokens
  - Dashboard with collection stats and overview
  - Add anime via manual entry or AniList API search/import
  - Edit anime details (title, score, type, genres, episodes)
  - Delete anime with confirmation modal
  - AniList GraphQL API integration for quick search and import
  - Auto-generate README.md from structured JSON data
  - Push changes directly to GitHub via API
  - Dark theme UI with purple accent design
  - Responsive layout for desktop and mobile
- **Data Layer** — Structured anime.json data store (259 entries parsed from README)
- **README Generator** — Converts JSON data back to formatted README.md
- **AniList Integration** — Search anime, get details, quick-add to collection
- **GitHub API** — Push README and data changes to repository
- **Vercel Deployment** — Ready-to-deploy Next.js configuration

### Technical
- Next.js 14 with API routes (serverless functions)
- HMAC-SHA256 signed JWT authentication
- HttpOnly cookie-based session management
- AniList GraphQL API for anime search
- GitHub Contents API for file updates
- Standalone output for Vercel deployment
