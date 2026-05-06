# Activity Log

Server-side audit trail for all admin panel actions. Persists to GitHub to survive Vercel cold starts.

## Overview

The activity log records every mutation in the admin panel — adds, edits, deletes, pushes, imports, logins, and more. Each entry includes a timestamp, action type, target, and optional details.

## Architecture

```
Client → API Route → addEntry({ action, target, details, gh })
                          ↓
                    writeLog()  →  /tmp/activity-log.json  (local)
                          ↓
                    pushToGitHub()  →  admin-panel/data/activity-log.json  (persistent)
```

On Vercel cold starts, the API route falls back to fetching the log from GitHub when local `/tmp` is empty.

## API

### `addEntry({ action, target, details, user, gh })`

Creates a new log entry and persists it.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | ✅ | Action type (see below) |
| `target` | string | ✅ | What was acted on (anime title, "README.md", etc.) |
| `details` | string | ❌ | Extra context ("score 7→9", "258 entries", etc.) |
| `user` | string | ❌ | Defaults to `"admin"` |
| `gh` | object | ❌ | `{ token, owner, repo }` — if provided, pushes to GitHub |

Returns the created entry object.

### `getLog({ limit, offset, action, search })`

Reads log entries (newest first). Used by `GET /api/activity`.

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 50 | Max entries to return |
| `offset` | 0 | Pagination offset |
| `action` | — | Filter by action type |
| `search` | — | Search target + details text |

Returns `{ total, entries }`.

### `clearLog()`

Empties the log. Used by `DELETE /api/activity`.

### `readLog()`

Raw read of all entries (oldest first). Internal use.

## Action Types

| Action | Icon | Color | When |
|--------|------|-------|------|
| `add` | Plus | Green | New anime added |
| `edit` | Edit | Blue | Anime details changed |
| `delete` | Trash | Red | Anime deleted (single or bulk) |
| `push` | Rocket | Purple | Pushed to GitHub |
| `import` | Download | Yellow | Bulk import from backup |
| `generate` | Refresh | Violet | README.md generated |
| `login` | Key | Pink | Login attempt (success or fail) |
| `settings` | Gear | Gray | Settings changed |
| `export` | Download | Cyan | CSV/data exported |

## Logged Actions (by file)

| API Route | Actions Logged |
|-----------|---------------|
| `POST /api/anime` | `add` |
| `PUT /api/anime/[id]` | `edit` (with score/status/title diff) |
| `DELETE /api/anime/[id]` | `delete` |
| `POST /api/anime/bulk-delete` | `delete` (bulk summary) |
| `POST /api/anime/import` | `import` |
| `POST /api/push` (generate) | `generate` |
| `POST /api/push` (push) | `push` |
| `POST /api/auth` | `login` |

## Storage

- **Local:** `/tmp/activity-log.json` on Vercel, `data/activity-log.json` locally
- **GitHub:** `admin-panel/data/activity-log.json` (max 500 entries, auto-trimmed)
- **Max entries:** 500 (oldest auto-removed on write)

## GitHub Persistence

When `gh = { token, owner, repo }` is passed to `addEntry()`:

1. Writes locally (fast, synchronous)
2. Fire-and-forget push to GitHub (async, non-blocking)
   - GETs current file SHA
   - PUTs updated content with commit message

On Vercel cold start, `GET /api/activity` detects empty local log and fetches from GitHub as fallback.

## Environment Variables

| Var | Required | Description |
|-----|----------|-------------|
| `GITHUB_TOKEN` | For persistence | GitHub PAT with repo scope |
| `GITHUB_OWNER` | For persistence | Repo owner (e.g. `Shineii86`) |
| `GITHUB_REPO` | For persistence | Repo name (e.g. `MyAnimeList`) |

Without these, the log works locally but doesn't persist across Vercel cold starts.
