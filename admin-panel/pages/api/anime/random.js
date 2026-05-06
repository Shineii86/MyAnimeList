const { getRandomAnime } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, type, minScore, genre } = req.query;
  
  const anime = getRandomAnime({ status, type, minScore, genre });
  
  if (!anime) {
    return res.status(404).json({ error: 'No anime found matching filters' });
  }

  return res.status(200).json(anime);
}
