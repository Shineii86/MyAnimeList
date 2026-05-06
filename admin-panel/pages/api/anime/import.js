const { writeData, readData, updateStats } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { anime, metadata, recommendations } = req.body;

    if (!anime || !Array.isArray(anime)) {
      return res.status(400).json({ error: 'Invalid data: anime array required' });
    }

    // Validate entries
    const valid = anime.filter(a => a.title && typeof a.title === 'string');
    if (valid.length === 0) {
      return res.status(400).json({ error: 'No valid anime entries found' });
    }

    // Sort alphabetically
    valid.sort((a, b) => a.title.localeCompare(b.title));
    valid.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });

    const data = {
      metadata: metadata || {},
      recommendations: recommendations || [],
      anime: valid
    };

    updateStats(data);
    writeData(data);

    return res.status(200).json({
      success: true,
      message: `Imported ${valid.length} anime entries`,
      total: valid.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
