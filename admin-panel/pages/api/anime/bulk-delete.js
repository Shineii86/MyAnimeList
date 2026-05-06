const { readData, writeData, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  try {
    const gh = getGhFromReq(req);
    const data = await readData(gh);
    const idSet = new Set(ids.map(Number));
    const removed = [];
    
    data.anime = data.anime.filter(a => {
      if (idSet.has(a.id)) {
        removed.push(a.title);
        return false;
      }
      return true;
    });

    // Sort and update letters
    data.anime.sort((a, b) => a.title.localeCompare(b.title));
    data.anime.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });

    // Update stats
    const { updateStats } = require('../../../lib/data');
    updateStats(data);

    // Single writeData call (pushes anime.json + README.md)
    await writeData(data, gh);

    addEntry({
      action: 'delete',
      target: `Bulk: ${removed.slice(0, 3).join(', ')}${removed.length > 3 ? ` +${removed.length - 3} more` : ''}`,
      details: `Deleted ${removed.length} anime entries`,
      gh
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${removed.length} anime`,
      deleted: removed.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
