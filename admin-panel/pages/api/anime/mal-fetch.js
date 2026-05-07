const https = require('https');

// Server-side proxy for MyAnimeList username lookup
// MAL's /load.json API doesn't support CORS, so we proxy through our server
// Also resolves MAL IDs → AniList IDs for consistency with the rest of the collection

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

// Fetch AniList data for a batch of MAL IDs using GraphQL
// AniList supports idMal filter, and we can query multiple pages
async function resolveAniListIds(malIds) {
  const malToAnilist = {};

  // AniList GraphQL: look up by idMal (one at a time, but we batch with rate limiting)
  // We use the Media query with idMal for each ID
  const batchSize = 5;
  for (let i = 0; i < malIds.length; i += batchSize) {
    const batch = malIds.slice(i, i + batchSize);
    const queries = batch.map((malId, idx) => `
      m${idx}: Media(idMal: ${malId}, type: ANIME) {
        id
        idMal
        title { romaji english }
        siteUrl
      }
    `).join('\n');

    const graphqlQuery = `{ ${queries} }`;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery })
      });

      if (res.ok) {
        const data = await res.json();
        const results = data.data || {};
        for (const key of Object.keys(results)) {
          const media = results[key];
          if (media && media.idMal) {
            malToAnilist[media.idMal] = {
              anilistId: media.id,
              anilistUrl: media.siteUrl || `https://anilist.co/anime/${media.id}`,
              title: media.title?.english || media.title?.romaji
            };
          }
        }
      }
    } catch {
      // Continue — we'll still return MAL data even if AniList resolution fails
    }

    // Rate limit between batches
    if (i + batchSize < malIds.length) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  return malToAnilist;
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
    const maxAttempts = 20;

    while (hasMore && attempts < maxAttempts) {
      const data = await fetchMalPage(cleanUsername, offset);
      if (!Array.isArray(data) || data.length === 0) break;
      allAnime.push(...data);
      offset += data.length;
      hasMore = data.length >= limit;
      attempts++;
      if (hasMore) await new Promise(r => setTimeout(r, 1500));
    }

    if (allAnime.length === 0) {
      return res.status(404).json({ error: `No completed anime found for "${cleanUsername}". The profile may be empty or private.` });
    }

    // Filter to completed (status=2)
    const completed = allAnime.filter(e => e.status === 2);
    if (completed.length === 0) {
      return res.status(404).json({ error: `No completed anime found for "${cleanUsername}". User may only have watching/plan-to-watch entries.` });
    }

    // Collect all MAL IDs for AniList resolution
    const malIds = completed.map(e => e.anime_id).filter(Boolean);

    // Resolve MAL IDs → AniList IDs
    const malToAnilist = await resolveAniListIds(malIds);

    // Format entries with AniList data when available
    const parsed = completed
      .map(e => {
        const malId = e.anime_id;
        const anilist = malToAnilist[malId];

        return {
          title: e.anime_title_eng || e.anime_title,
          episodes: e.anime_num_episodes || e.num_watched_episodes || 0,
          score: e.score || 0,
          status: 'Completed',
          malId: malId,
          anilistId: anilist?.anilistId || null,
          anilistUrl: anilist?.anilistUrl || '',
          type: e.anime_airing_status === 3 ? 'Movie' : 'TV',
          genres: (e.genres || []).map(g => g.name),
          source: 'MAL'
        };
      })
      .filter(a => a.title);

    const resolved = parsed.filter(a => a.anilistId).length;

    return res.status(200).json({
      success: true,
      count: parsed.length,
      resolved,
      anime: parsed
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch MAL data' });
  }
}
