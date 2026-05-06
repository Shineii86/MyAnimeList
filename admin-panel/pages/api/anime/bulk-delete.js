const { getAnimeById, deleteAnime, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  const gh = getGhFromReq(req);
  const results = { success: 0, failed: 0, titles: [] };

  for (const id of ids) {
    try {
      const existing = await getAnimeById(id, gh);
      const deleted = await deleteAnime(id, gh);
      if (deleted) {
        results.success++;
        results.titles.push(existing?.title || `ID ${id}`);
      } else {
        results.failed++;
      }
    } catch {
      results.failed++;
    }
  }

  addEntry({
    action: 'delete',
    target: `Bulk: ${results.titles.slice(0, 3).join(', ')}${results.titles.length > 3 ? ` +${results.titles.length - 3} more` : ''}`,
    details: `Deleted ${results.success} anime entries`,
    gh
  });

  return res.status(200).json({
    success: true,
    message: `Deleted ${results.success} anime`,
    deleted: results.success,
    failed: results.failed
  });
}
