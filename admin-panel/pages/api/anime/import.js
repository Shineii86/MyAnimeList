const { readData, writeData, updateStats, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { anime, metadata, recommendations } = req.body;

    if (!anime || !Array.isArray(anime)) {
      return res.status(400).json({ error: 'Invalid data: anime array required' });
    }

    const valid = anime.filter(a => a.title && typeof a.title === 'string');
    if (valid.length === 0) return res.status(400).json({ error: 'No valid anime entries found' });

    valid.sort((a, b) => a.title.localeCompare(b.title));
    valid.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });

    const data = {
      metadata: metadata || {},
      recommendations: recommendations || [],
      anime: valid
    };

    const gh = getGhFromReq(req);
    updateStats(data);
    await writeData(data, gh);

    addEntry({ action: 'import', target: 'Collection', details: `Imported ${valid.length} anime entries from backup`, gh });

    return res.status(200).json({ success: true, message: `Imported ${valid.length} anime entries`, total: valid.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
