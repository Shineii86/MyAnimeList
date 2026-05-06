const { getLog, clearLog, readLog } = require('../../lib/activity-log');
const { requireAuth } = require('../../lib/auth');
const https = require('https');

const IS_VERCEL = !!process.env.VERCEL;
const LOG_PATH = 'admin-panel/data/activity-log.json';

// Try to fetch activity log from GitHub (for Vercel cold starts)
function fetchFromGitHub() {
  return new Promise((resolve) => {
    if (!IS_VERCEL || !process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      return resolve(null);
    }

    const opts = {
      hostname: 'api.github.com',
      path: `/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${LOG_PATH}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MyAnimeList-Admin'
      }
    };

    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.content) {
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            resolve(JSON.parse(content));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

export default async function handler(req, res) {
  try {
    if (!requireAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET': {
        const { limit, offset, action, search } = req.query;

        // Try local first, fall back to GitHub
        let result = getLog({
          limit: limit ? parseInt(limit) : 50,
          offset: offset ? parseInt(offset) : 0,
          action: action || undefined,
          search: search || undefined
        });

        // If local is empty on Vercel, try GitHub
        if (result.total === 0 && IS_VERCEL) {
          const ghLog = await fetchFromGitHub();
          if (ghLog && ghLog.length > 0) {
            // Apply same filters
            let entries = ghLog.reverse();
            if (action) entries = entries.filter(e => e.action === action);
            if (search) {
              const q = search.toLowerCase();
              entries = entries.filter(e =>
                (e.target && e.target.toLowerCase().includes(q)) ||
                (e.details && e.details.toLowerCase().includes(q))
              );
            }
            const lim = limit ? parseInt(limit) : 50;
            const off = offset ? parseInt(offset) : 0;
            result = { total: entries.length, entries: entries.slice(off, off + lim) };
          }
        }

        return res.status(200).json(result);
      }
      case 'DELETE': {
        clearLog();
        return res.status(200).json({ success: true, message: 'Activity log cleared' });
      }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
