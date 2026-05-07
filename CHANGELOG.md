# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-07] - Admin Panel Dashboard

### Added
- Basic authentication system with username/password login via .env configuration
- Login page with iOS-style UI and cookie-based session management
- Middleware-based route protection (pages redirect to login, API returns 401)
- Logout functionality from sidebar, header, and settings page
- GitHub sync integration — auto-push anime.json changes to repo on every add/edit/delete/import
- GitHub status API endpoint for frontend sync status display
- GitHub status indicator in sidebar (green dot when configured)
- GitHub sync banner in Import/Export page
- .env.example with all configuration variables documented
- README.md updated with Admin Panel section, setup instructions, and environment variables table

### Changed
- All write API routes (add, update, delete, bulk add, import) now sync to GitHub after changes
- Header component now includes logout button
- Sidebar now shows GitHub connection status and sign-out button
- Settings page enhanced with GitHub sync status, export buttons, and account section
- .gitignore updated to exclude .env files

- Full Next.js 14 Admin Panel Dashboard with App Router and TypeScript
- Dashboard page with stats cards (total anime, TV shows, movies, OVAs, avg score, episodes, completed, top picks)
- Anime List page with search, filter by letter, sort, pagination (50/page), grid/list view toggle
- Add Anime page with full form (title, AniList URL, score, type, episodes, status, genres, cover image, description)
- Edit/Delete anime with detail page view and inline editing
- Bulk Add page for adding multiple anime at once (CSV format with preview)
- AniList Search integration - search and auto-add anime from AniList API with cover images, genres, episodes
- Import from AniList username - import completed anime list from any AniList user
- Export collection as JSON or CSV with full metadata
- JSON paste import for bulk data import
- Settings page with theme toggle, sound effects toggle, keyboard shortcuts, about section
- iOS-style UI design with SF Pro font system, rounded corners, glassmorphism effects
- Light/Dark mode with system preference detection and manual toggle
- Mobile-responsive with bottom tab navigation and desktop sidebar navigation
- Sound effects system using Web Audio API (click, success, delete, error sounds)
- Toast notification system for action feedback
- Confirm dialog for destructive actions (delete)
- Loading spinners and skeleton states
- Full CRUD API routes (GET/POST/PUT/DELETE) for anime management
- AniList GraphQL API integration for search, detail fetch, and user import
- Dashboard statistics API endpoint
- TypeScript interfaces for all data types (Anime, AnimeStats, AniListMedia)
- Utility functions for search, filter, sort, CSV export, date formatting
- Custom hooks (useAnime, useTheme, useSound)
- .gitignore for Next.js project (node_modules, .next, build)

### Changed
- Enhanced anime data structure with new fields: score, type, genres, episodes, status, coverImage, description, startDate, endDate, addedAt, updatedAt
- All 515 existing anime entries preserved with new fields defaulting to null/empty

## [2026-05-07]

### Changed
- Exported all 512 completed anime from MyAnimeList (user: ikx7a)
- Converted all MyAnimeList URLs to AniList URLs (511/512 mapped, 1 unavailable on AniList)
- Removed metadata (type, score, genres) from all anime entries for a clean format
- Updated statistics with exact data: 511 anime, 74 movies, 69 OVAs/Specials, 99% completion rate
- Replaced old anime list with comprehensive A-Z list sourced directly from MAL export
- Deduplicated anime entries (no duplicates found)
- Set git author to Sʜɪɴᴇɪ Nᴏᴜᴢᴇɴ

### Fixed
- Removed "+" from all statistics — now showing exact numbers
- Corrected Total Episodes from 1,240 to 7,183 (real count from 511 completed anime)
- Corrected Days Watched from 3.5 to 120 (7,183 episodes × ~24 min each)
