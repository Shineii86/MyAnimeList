const fs = require('fs');
const path = require('path');
const https = require('https');

// Use /tmp on Vercel (writable), local data/ directory otherwise
const IS_VERCEL = !!process.env.VERCEL;
const PROJECT_ROOT = process.cwd();
const LOG_FILE = IS_VERCEL
  ? path.join('/tmp', 'activity-log.json')
  : path.join(PROJECT_ROOT, 'data', 'activity-log.json');
const MAX_ENTRIES = 500;
const GITHUB_API = 'https://api.github.com';
const LOG_PATH = 'admin-panel/data/activity-log.json';

function readLog() {
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data.length > 0) return data;
  } catch {}

  // On Vercel cold start, try loading from GitHub
  if (IS_VERCEL && process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
    try {
      const url = `https://raw.githubusercontent.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/main/${LOG_PATH}`;
      // Synchronous fetch not available, return empty for now (will be populated on next write)
    } catch {}
  }

  return [];
}

function writeLog(entries) {
  const trimmed = entries.slice(-MAX_ENTRIES);
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch {
    // Silently fail on read-only filesystems
  }
}

// Push activity log to GitHub with retry on 409 SHA conflict
function pushToGitHub(entries, gh) {
  // Resolve credentials: explicit param → env vars
  const token = gh?.token || process.env.GITHUB_TOKEN;
  const owner = gh?.owner || process.env.GITHUB_OWNER || 'Shineii86';
  const repo = gh?.repo || process.env.GITHUB_REPO || 'MyAnimeList';
  if (!token || !owner || !repo) return;
  const creds = { token, owner, repo };
  const MAX_RETRIES = 3;

  const json = JSON.stringify(entries.slice(-MAX_ENTRIES), null, 2);

  function attemptPush(attempt) {
    // First get current SHA
    const getOpts = {
      hostname: 'api.github.com',
      path: `/repos/${creds.owner}/${creds.repo}/contents/${LOG_PATH}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${creds.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MyAnimeList-Admin'
      }
    };

    const getReq = https.request(getOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let sha = null;
        try { sha = JSON.parse(body).sha; } catch {}

        // Push updated file
        const putData = JSON.stringify({
          message: `📋 Update activity log [${new Date().toISOString().split('T')[0]}]`,
          content: Buffer.from(json).toString('base64'),
          ...(sha ? { sha } : {})
        });

        const putOpts = {
          hostname: 'api.github.com',
          path: `/repos/${creds.owner}/${creds.repo}/contents/${LOG_PATH}`,
          method: 'PUT',
          headers: {
            'Authorization': `token ${creds.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'MyAnimeList-Admin',
            'Content-Length': Buffer.byteLength(putData)
          }
        };

        const putReq = https.request(putOpts, (putRes) => {
          let putBody = '';
          putRes.on('data', chunk => putBody += chunk);
          putRes.on('end', () => {
            // 409 = SHA conflict — retry
            if (putRes.statusCode === 409 && attempt < MAX_RETRIES - 1) {
              attemptPush(attempt + 1);
            }
          });
        });
        putReq.on('error', () => {});
        putReq.setTimeout(10000, () => putReq.destroy());
        putReq.write(putData);
        putReq.end();
      });
    });
    getReq.on('error', () => {});
    getReq.setTimeout(10000, () => getReq.destroy());
    getReq.end();
  }

  attemptPush(0);
}

// Only log important actions: add, delete, push, import
const LOGGED_ACTIONS = ['add', 'delete', 'bulk-delete', 'push', 'import'];

function addEntry({ action, target, details, user, gh }) {
  if (!LOGGED_ACTIONS.includes(action)) return null; // Skip noisy actions

  const entries = readLog();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    action,
    target,
    details,
    user: user || 'admin'
  };
  entries.push(entry);
  writeLog(entries);

  // Persist to GitHub if credentials provided
  if (gh) pushToGitHub(entries, gh);

  return entry;
}

function getLog({ limit = 50, offset = 0, action, search } = {}) {
  let entries = readLog().reverse(); // Newest first

  if (action) {
    entries = entries.filter(e => e.action === action);
  }
  if (search) {
    const q = search.toLowerCase();
    entries = entries.filter(e =>
      (e.target && e.target.toLowerCase().includes(q)) ||
      (e.details && e.details.toLowerCase().includes(q))
    );
  }

  return {
    total: entries.length,
    entries: entries.slice(offset, offset + limit)
  };
}

function clearLog() {
  writeLog([]);
}

module.exports = { addEntry, getLog, clearLog, readLog };
