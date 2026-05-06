const { getStats, getRecommendations } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stats = getStats();
  const recommendations = getRecommendations();
  const anime = require('../../../lib/data').getAllAnime();

  // Count by type
  const byType = {};
  const byGenre = {};
  
  anime.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    (a.genres || []).forEach(g => {
      byGenre[g] = (byGenre[g] || 0) + 1;
    });
  });

  return res.status(200).json({
    stats,
    totalAnime: anime.length,
    recommendations: recommendations.length,
    byType,
    topGenres: Object.entries(byGenre)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }))
  });
}
