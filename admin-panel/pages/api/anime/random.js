const { getRandomAnime, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { status, type, minScore, genre } = req.query;
    const gh = getGhFromReq(req);
    const anime = await getRandomAnime({ status, type, minScore, genre }, gh);

    if (!anime) return res.status(404).json({ error: 'No anime found matching filters' });
    return res.status(200).json(anime);
  } catch (err) {
    return res.status(500).json({ error: `Failed to get random anime: ${err.message}` });
  }
}
