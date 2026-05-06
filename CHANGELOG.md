# Changelog

All notable changes to this project will be documented in this file.

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
