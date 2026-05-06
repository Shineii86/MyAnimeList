const { searchAnime, getAnimeById } = require('../../../lib/anilist');
const { requireAuth } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, id } = req.query;

  try {
    if (id) {
      const anime = await getAnimeById(id);
      return res.status(200).json({ results: [anime] });
    }

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) or id required' });
    }

    const results = await searchAnime(q);
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: `AniList API error: ${err.message}` });
  }
}
