const { getAnimeById, updateAnime, deleteAnime, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const gh = getGhFromReq(req);

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(id, res, gh);
      case 'PUT':
      case 'PATCH':
        return handleUpdate(id, req.body, res, gh);
      case 'DELETE':
        return handleDelete(id, res, gh);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}

async function handleGet(id, res, gh) {
  const anime = await getAnimeById(id, gh);
  if (!anime) return res.status(404).json({ error: 'Anime not found' });
  return res.status(200).json(anime);
}

async function handleUpdate(id, body, res, gh) {
  const existing = await getAnimeById(id, gh);

  // Sanitize inputs
  const updates = { ...body };
  if (updates.title !== undefined) {
    updates.title = (updates.title || '').trim();
    if (!updates.title) return res.status(400).json({ error: 'Title cannot be empty' });
  }
  if (updates.score !== undefined) updates.score = updates.score ? Math.min(10, Math.max(0, parseFloat(updates.score))) : 0;
  if (updates.episodes !== undefined) updates.episodes = updates.episodes ? Math.max(0, parseInt(updates.episodes)) : 0;
  if (updates.type !== undefined && !['TV', 'Movie', 'OVA', 'ONA', 'Special'].includes(updates.type)) updates.type = 'TV';
  if (updates.status !== undefined && !['Completed', 'Watching', 'Plan to Watch', 'On Hold', 'Dropped'].includes(updates.status)) updates.status = 'Completed';
  // Only allow known fields — prevent arbitrary data injection
  const allowedFields = ['title', 'anilistUrl', 'anilistId', 'type', 'score', 'genres', 'episodes', 'status', 'notes', 'tags', 'coverImage'];
  Object.keys(updates).forEach(key => { if (!allowedFields.includes(key)) delete updates[key]; });

  const updated = await updateAnime(id, updates, gh);
  if (!updated) return res.status(404).json({ error: 'Anime not found' });

  const changes = [];
  if (existing) {
    if (body.score && body.score !== existing.score) changes.push(`score ${existing.score}→${body.score}`);
    if (body.status && body.status !== existing.status) changes.push(`status ${existing.status}→${body.status}`);
    if (body.title && body.title !== existing.title) changes.push(`renamed to "${body.title}"`);
    if (body.type && body.type !== existing.type) changes.push(`type ${existing.type}→${body.type}`);
  }

  addEntry({ action: 'edit', target: updated.title, details: changes.length > 0 ? changes.join(', ') : 'updated details', gh });
  return res.status(200).json({ success: true, anime: updated });
}

async function handleDelete(id, res, gh) {
  const existing = await getAnimeById(id, gh);
  const deleted = await deleteAnime(id, gh);
  if (!deleted) return res.status(404).json({ error: 'Anime not found' });

  addEntry({ action: 'delete', target: existing ? existing.title : `ID ${id}`, details: `${existing?.type || '?'} • ${existing?.score || '?'}`, gh });
  return res.status(200).json({ success: true, message: 'Anime deleted' });
}
