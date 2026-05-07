# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-07] - Admin Panel Dashboard

### Added
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
