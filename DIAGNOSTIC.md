# 🔍 Full Diagnostic Report — MyAnimeList Admin Panel

**Scan Date:** 2026-05-07 02:33 GMT+8
**Files Scanned:** 35 JS files (10 lib + 15 pages + 10 API routes)

---

## 🔴 CRITICAL ISSUES (5)

### 1. Double Push — `anime/[id].js` pushes twice
**File:** `pages/anime/[id].js:58-66`
**Problem:** After edit, `apiPut()` calls `updateAnime()` → `writeData()` which pushes anime.json + README.md. Then the client-side code does ANOTHER `fetch('/api/push')`. Two identical pushes = 4 GitHub API calls per edit.
**Fix:** Remove the client-side auto-push block (lines 58-66).

### 2. Double Push — `anime/add.js` pushes twice
**File:** `pages/anime/add.js:140-148`
**Problem:** `handlePushNow()` does `fetch('/api/push')` but `apiPost('/api/anime')` already triggers `writeData()` which pushes both files. The modal's "Push to GitHub" button creates a redundant push.
**Fix:** The modal push button should show "Already pushed!" or the `writeData` push should be the only one.

### 3. Missing GitHub Headers — `fetch('/api/push')` without credentials
**Files:** `pages/anime/add.js:140`, `pages/anime/index.js:123`, `pages/anime/[id].js:61`, `pages/push.js:26,53`
**Problem:** Uses raw `fetch()` instead of `apiFetch()`. GitHub credentials from localStorage settings are NOT sent as `x-github-*` headers. If Vercel env vars aren't set, push silently fails.
**Fix:** Use `apiPost('/api/push', body)` instead of `fetch('/api/push', ...)`.

### 4. Activity Log — GitHub Fallback Only When Empty
**File:** `lib/activity-log.js` + `pages/api/activity.js`
**Problem:** `readLog()` returns `[]` only when file is empty/missing. On Vercel cold start, if ANY entry exists locally, the GitHub fallback is skipped. Partial log shown instead of full log.
**Fix:** Always try GitHub on Vercel when local log has fewer entries than expected, or use a version counter.

### 5. Non-Atomic Double Push in `writeData()`
**File:** `lib/data.js:writeData()`
**Problem:** Pushes anime.json first, then README.md. If README push fails, data is inconsistent — anime.json has new data but README is stale. No rollback mechanism.
**Fix:** Acceptable for now (README generation rarely fails), but should be documented. Consider retry logic.

---

## 🟡 MODERATE ISSUES (6)

### 6. Bulk Delete — O(n+1) GitHub API Calls
**File:** `pages/api/anime/bulk-delete.js`
**Problem:** Each `deleteAnime()` calls `writeData()` which pushes to GitHub. Deleting 10 anime = 20 GitHub API calls (10× anime.json + 10× README.md). May hit rate limits.
**Fix:** Batch deletes locally, then single `writeData()` call at the end.

### 7. Dead Code — `lib/auto-push.js`
**File:** `lib/auto-push.js`
**Problem:** `autoPushIfEnabled()` and `apiWithAutoPush()` are never imported by any page. All pages use `api.js` helpers instead. Dead code adds confusion.
**Fix:** Remove or deprecate `auto-push.js`.

### 8. Misleading Auto-Push Toggle in Settings
**File:** `pages/settings.js`
**Problem:** The "Auto-Push" toggle stores settings in localStorage, but `writeData()` now ALWAYS pushes to GitHub when credentials are available. The toggle gives false impression that push is optional.
**Fix:** Update UI to explain that push is automatic when GitHub credentials are configured. The toggle should control whether to ALSO do a client-side push (for redundancy).

### 9. No Login Rate Limiting
**File:** `pages/api/auth.js`
**Problem:** No rate limit on failed login attempts. Attacker can brute-force the password.
**Fix:** Add rate limiting (e.g., 5 attempts per minute per IP). Simple in-memory counter works for serverless.

### 10. No Input Validation on Add/Edit
**Files:** `pages/api/anime/index.js`, `pages/api/anime/[id].js`
**Problem:** `score` accepts any number (not clamped to 0-10). `episodes` accepts negative numbers. `title` can be empty string (passes `if (!title)` check). No XSS sanitization on `notes` field.
**Fix:** Validate and clamp inputs: `score = Math.min(10, Math.max(0, score))`, `episodes = Math.max(0, episodes)`, trim title.

### 11. Inconsistent Fetch Usage Across Pages
**Files:** Multiple pages use raw `fetch()` for AniList search (acceptable) but also for push operations (not acceptable).
**Pattern:**
- `fetch('/api/anilist/search')` — ✅ OK (no auth needed)
- `fetch('/api/push')` — ❌ Should use `apiPost()` (needs GitHub headers)
- `apiPost('/api/anime')` — ✅ Correct

---

## 🟢 MINOR ISSUES (4)

### 12. No Error Boundaries in React Pages
**Files:** All page components
**Problem:** Unhandled errors crash the entire page with a white screen.
**Fix:** Add error boundary component in `_app.js`.

### 13. No Loading Skeleton
**Files:** `pages/index.js`, `pages/analytics.js`
**Problem:** Shows spinner instead of skeleton UI during data fetch.
**Fix:** Low priority, but improves perceived performance.

### 14. Keyboard Shortcuts Conflict with Input Fields
**File:** `lib/keyboard-shortcuts.js`
**Problem:** Shortcuts like `N` (new anime) may fire when typing in search fields.
**Fix:** Already handled (checks `document.activeElement`), but verify edge cases.

### 15. CHANGELOG.md Not Auto-Pushed
**File:** `lib/data.js:writeData()`
**Problem:** anime.json and README.md are auto-pushed, but CHANGELOG.md is not updated automatically.
**Fix:** Low priority — changelog is a manual documentation step.

---

## ✅ WHAT'S WORKING WELL

- All 35 JS files pass syntax validation
- Auth system is solid (HMAC-SHA256, HttpOnly cookies, Secure flag)
- AniList integration is robust with proper error handling
- Activity log has good audit trail with 9 action types
- Cover image fallback (gradient + title initial) looks clean
- Stats computation is accurate
- CSV export works correctly
- Bulk select/delete UX is smooth

---

## 📊 SUMMARY

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 5 | Fix immediately |
| 🟡 Moderate | 6 | Fix soon |
| 🟢 Minor | 4 | Fix when convenient |
| ✅ Working | 8 | No action needed |

**Priority Fix Order:**
1. Remove duplicate auto-push from `anime/[id].js` and `anime/add.js`
2. Replace `fetch('/api/push')` with `apiPost('/api/push')` everywhere
3. Fix bulk delete to batch operations
4. Remove dead `auto-push.js`
5. Add input validation
