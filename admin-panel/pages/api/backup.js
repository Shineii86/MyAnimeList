const { readData, getGhFromReq } = require('../../lib/data');
const { requireAuth } = require('../../lib/auth');
const https = require('https');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;
  const gh = getGhFromReq(req);

  if (action === 'backup') {
    return handleBackup(req, res, gh);
  }

  if (action === 'schedule') {
    return handleSchedule(req, res, gh);
  }

  return res.status(400).json({ error: 'Invalid action' });
}

async function handleBackup(req, res, gh) {
  const token = gh?.token || process.env.GITHUB_TOKEN;
  const owner = gh?.owner || process.env.GITHUB_OWNER || 'Shineii86';
  const repo = gh?.repo || process.env.GITHUB_REPO || 'MyAnimeList';

  if (!token) return res.status(400).json({ error: 'GitHub token required for backup' });

  try {
    const data = await readData(gh);
    const backupData = JSON.stringify(data, null, 2);
    const date = new Date().toISOString().split('T')[0];
    const backupPath = `backups/anime-backup-${date}.json`;

    // Check if backup already exists today
    let existingSha = null;
    try {
      const checkRes = await githubGet(`/repos/${owner}/${repo}/contents/${backupPath}`, token);
      existingSha = checkRes.sha;
    } catch {}

    // Create or update backup
    const putData = JSON.stringify({
      message: `📦 Daily backup [${date}]`,
      content: Buffer.from(backupData).toString('base64'),
      ...(existingSha ? { sha: existingSha } : {})
    });

    await githubPut(`/repos/${owner}/${repo}/contents/${backupPath}`, token, putData);

    return res.status(200).json({ success: true, path: backupPath, date });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function handleSchedule(req, res, gh) {
  const { enabled, interval } = req.body; // interval: 'daily' | 'weekly'
  const data = await readData(gh);

  if (!data.settings) data.settings = {};
  data.settings.autoBackup = {
    enabled: !!enabled,
    interval: interval || 'daily',
    lastBackup: null
  };

  const { writeData } = require('../../lib/data');
  await writeData(data, gh);

  return res.status(200).json({ success: true, autoBackup: data.settings.autoBackup });
}

function githubGet(path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MyAnimeList-Admin'
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const data = JSON.parse(body);
        if (res.statusCode >= 400) reject(new Error(data.message));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function githubPut(path, token, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path,
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'MyAnimeList-Admin',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (res.statusCode >= 400) reject(new Error(parsed.message));
        else resolve(parsed);
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}
