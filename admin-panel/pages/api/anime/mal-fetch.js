const https = require('https');

// Server-side proxy for MyAnimeList username lookup
// MAL's /load.json API doesn't support CORS, so we proxy through our server

function fetchMalPage(username, offset = 0) {
  return new Promise((resolve, reject) => {
    const url = `https://myanimelist.net/animelist/${encodeURIComponent(username)}/load.json?status=7&offset=${offset}`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://myanimelist.net/animelist/${username}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) {
          reject(new Error(`User "${username}" not found on MyAnimeList`));
          return;
        }
        if (res.statusCode === 403) {
          reject(new Error(`User "${username}" has a private profile`));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`MAL returned HTTP ${res.statusCode}. Check if the username is correct and the profile is public.`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid response from MyAnimeList'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request to MyAnimeList timed out')); });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const cleanUsername = username.trim();
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }

  try {
    const allAnime = [];
    let offset = 0;
    const limit = 300;
    let hasMore = true;
    let attempts = 0;
    const maxAttempts = 20; // Safety limit: 20 pages × 300 = 6000 anime max

    while (hasMore && attempts < maxAttempts) {
      const data = await fetchMalPage(cleanUsername, offset);
      
      if (!Array.isArray(data) || data.length === 0) break;
      
      allAnime.push(...data);
      offset += data.length;
      hasMore = data.length >= limit;
      attempts++;
      
      // Rate limit: small delay between pages
      if (hasMore) await new Promise(r => setTimeout(r, 1500));
    }

    if (allAnime.length === 0) {
      return res.status(404).json({ error: `No completed anime found for "${cleanUsername}". The profile may be empty or private.` });
    }

    // Filter to completed (status=2) and format
    const parsed = allAnime
      .filter(e => e.status === 2) // Completed
      .map(e => ({
        title: e.anime_title_eng || e.anime_title,
        episodes: e.anime_num_episodes || e.num_watched_episodes || 0,
        score: e.score || 0,
        status: 'Completed',
        malId: e.anime_id,
        type: e.anime_airing_status === 3 ? 'Movie' : 'TV',
        genres: (e.genres || []).map(g => g.name),
        source: 'MAL'
      }))
      .filter(a => a.title);

    if (parsed.length === 0) {
      return res.status(404).json({ error: `No completed anime found for "${cleanUsername}". User may only have watching/plan-to-watch entries.` });
    }

    return res.status(200).json({ success: true, count: parsed.length, anime: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch MAL data' });
  }
}
