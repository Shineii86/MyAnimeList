const fs = require('fs');
const path = require('path');
const https = require('https');

const IS_VERCEL = !!process.env.VERCEL;
const LOCAL_DATA_FILE = IS_VERCEL
  ? path.join('/tmp', 'anime.json')
  : path.join(__dirname, '..', 'data', 'anime.json');
const BUNDLED_DATA_FILE = path.join(__dirname, '..', 'data', 'anime.json');
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const REPO_PATH = 'admin-panel/data/anime.json';

const VALID_STATUSES = ['Completed', 'Watching', 'Plan to Watch', 'Dropped', 'On Hold'];

// Helper: fetch from URL (no external deps)
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'MyAnimeList-Admin' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// GitHub API call (native https only — no external deps)
function githubApi(method, token, owner, repo, filePath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/contents/${filePath}`,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'MyAnimeList-Admin',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({ error: body }); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('GitHub API timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

// Read data with GitHub as primary source when credentials available
async function readData(gh = null) {
  // 1. If GitHub credentials provided, read from GitHub (most up-to-date)
  if (gh && gh.token && gh.owner && gh.repo) {
    try {
      const url = `${GITHUB_RAW_BASE}/${gh.owner}/${gh.repo}/main/${REPO_PATH}`;
      const raw = await fetchUrl(url);
      const data = JSON.parse(raw);
      // Cache locally for faster subsequent reads
      try { fs.writeFileSync(LOCAL_DATA_FILE, raw, 'utf-8'); } catch {}
      return data;
    } catch {
      // Fall through to local
    }
  }

  // 2. Try local cache (/tmp on Vercel, data/ locally)
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {}

  // 3. Fall back to bundled data (read-only, from deploy)
  try {
    const raw = fs.readFileSync(BUNDLED_DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    try { fs.writeFileSync(LOCAL_DATA_FILE, raw, 'utf-8'); } catch {}
    return data;
  } catch {}

  // 4. Empty state
  return { metadata: {}, recommendations: [], anime: [] };
}

// Sync readData for legacy callers (returns cached/bundled, never fetches)
function readDataSync() {
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {}
  try {
    const raw = fs.readFileSync(BUNDLED_DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    try { fs.writeFileSync(LOCAL_DATA_FILE, raw, 'utf-8'); } catch {}
    return data;
  } catch {}
  return { metadata: {}, recommendations: [], anime: [] };
}

// Write data: local cache + push to GitHub if credentials provided
async function writeData(data, gh = null) {
  const json = JSON.stringify(data, null, 2);

  // Always write to local cache
  try { fs.writeFileSync(LOCAL_DATA_FILE, json, 'utf-8'); } catch {}

  // Push to GitHub if credentials provided
  if (gh && gh.token && gh.owner && gh.repo) {
    try {
      // Get current file SHA from GitHub
      const existing = await githubApi('GET', gh.token, gh.owner, gh.repo, REPO_PATH);
      const sha = existing.sha || null;

      await githubApi('PUT', gh.token, gh.owner, gh.repo, REPO_PATH, {
        message: `📊 Update anime data via Admin Panel [${new Date().toISOString().split('T')[0]}]`,
        content: Buffer.from(json).toString('base64'),
        ...(sha ? { sha } : {})
      });
    } catch (err) {
      console.error('[data] GitHub push failed:', err.message);
    }
  }
}

// Extract GitHub credentials from request
function getGhFromReq(req) {
  const token = req.headers['x-github-token'] || req.body?.github_token;
  const owner = req.headers['x-github-owner'] || req.body?.github_owner;
  const repo = req.headers['x-github-repo'] || req.body?.github_repo;
  if (token && owner && repo) return { token, owner, repo };
  return null;
}

// --- CRUD operations (now async, accept gh param) ---

async function getAllAnime(gh = null) {
  const data = await readData(gh);
  return data.anime || [];
}

async function getAnimeById(id, gh = null) {
  const anime = await getAllAnime(gh);
  return anime.find(a => a.id === parseInt(id));
}

async function addAnime(entry, gh = null) {
  const data = await readData(gh);
  const newEntry = {
    id: entry.anilistId || Date.now(),
    title: entry.title,
    anilistUrl: entry.anilistUrl || `https://anilist.co/anime/${entry.anilistId}`,
    anilistId: entry.anilistId || null,
    type: entry.type || 'TV',
    score: parseFloat(entry.score) || 0,
    genres: entry.genres || [],
    episodes: parseInt(entry.episodes) || 0,
    status: entry.status || 'Completed',
    notes: entry.notes || '',
    tags: entry.tags || [],
    letter: entry.title.charAt(0).toUpperCase(),
    coverImage: entry.coverImage || null,
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.anime.push(newEntry);
  data.anime.sort((a, b) => a.title.localeCompare(b.title));
  data.anime.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });
  updateStatsSync(data);
  await writeData(data, gh);
  return newEntry;
}

async function updateAnime(id, updates, gh = null) {
  const data = await readData(gh);
  const index = data.anime.findIndex(a => a.id === parseInt(id));
  if (index === -1) return null;
  
  data.anime[index] = { ...data.anime[index], ...updates, updatedAt: new Date().toISOString() };
  if (updates.title) {
    data.anime[index].letter = updates.title.charAt(0).toUpperCase();
  }
  data.anime.sort((a, b) => a.title.localeCompare(b.title));
  updateStatsSync(data);
  await writeData(data, gh);
  return data.anime[index];
}

async function deleteAnime(id, gh = null) {
  const data = await readData(gh);
  const index = data.anime.findIndex(a => a.id === parseInt(id));
  if (index === -1) return false;
  
  data.anime.splice(index, 1);
  updateStatsSync(data);
  await writeData(data, gh);
  return true;
}

async function getRandomAnime(filters = {}, gh = null) {
  let anime = await getAllAnime(gh);
  
  if (filters.status) anime = anime.filter(a => a.status === filters.status);
  if (filters.type) anime = anime.filter(a => a.type === filters.type);
  if (filters.minScore) anime = anime.filter(a => a.score >= parseFloat(filters.minScore));
  if (filters.genre) anime = anime.filter(a => a.genres && a.genres.some(g => g.toLowerCase() === filters.genre.toLowerCase()));
  
  if (anime.length === 0) return null;
  return anime[Math.floor(Math.random() * anime.length)];
}

function updateStatsSync(data) {
  const anime = data.anime || [];
  const totalAnime = anime.length;
  const totalEpisodes = anime.reduce((sum, a) => sum + (a.episodes || 0), 0);
  const moviesWatched = anime.filter(a => a.type === 'Movie').length;
  const ovasSpecials = anime.filter(a => a.type === 'OVA' || a.type === 'Special').length;
  const scores = anime.filter(a => a.score > 0).map(a => a.score);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  
  const statusCounts = {};
  VALID_STATUSES.forEach(s => { statusCounts[s] = 0; });
  anime.forEach(a => {
    const s = a.status || 'Completed';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  
  const completionRate = totalAnime > 0 ? Math.round((statusCounts['Completed'] / totalAnime) * 100) + '%' : '0%';

  data.metadata = {
    totalAnime: `${totalAnime}`,
    totalEpisodes: `${totalEpisodes.toLocaleString()}+`,
    moviesWatched: `${moviesWatched}`,
    ovasSpecials: `${ovasSpecials}`,
    averageScore: avgScore,
    completionRate: completionRate,
    statusCounts
  };
}

async function getStats(gh = null) {
  const data = await readData(gh);
  return data.metadata || {};
}

async function getRecommendations(gh = null) {
  const data = await readData(gh);
  return data.recommendations || [];
}

async function addRecommendation(rec, gh = null) {
  const data = await readData(gh);
  data.recommendations.push(rec);
  await writeData(data, gh);
  return rec;
}

async function deleteRecommendation(index, gh = null) {
  const data = await readData(gh);
  if (index >= 0 && index < data.recommendations.length) {
    data.recommendations.splice(index, 1);
    await writeData(data, gh);
    return true;
  }
  return false;
}

module.exports = {
  readData,
  readDataSync,
  writeData,
  getGhFromReq,
  getAllAnime,
  getAnimeById,
  addAnime,
  updateAnime,
  deleteAnime,
  getRandomAnime,
  getStats,
  getRecommendations,
  addRecommendation,
  deleteRecommendation,
  updateStats: updateStatsSync,
  VALID_STATUSES
};
