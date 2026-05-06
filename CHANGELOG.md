# Changelog

All notable changes to this project will be documented in this file.

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
