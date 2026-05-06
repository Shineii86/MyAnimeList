# Changelog

All notable changes to this project will be documented in this file.

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
