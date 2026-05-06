const { getAnimeById, updateAnime, deleteAnime } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(id, res);
      case 'PUT':
      case 'PATCH':
        return handleUpdate(id, req.body, res);
      case 'DELETE':
        return handleDelete(id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}

function handleGet(id, res) {
  const anime = getAnimeById(id);
  if (!anime) {
    return res.status(404).json({ error: 'Anime not found' });
  }
  return res.status(200).json(anime);
}

function handleUpdate(id, body, res) {
  const existing = getAnimeById(id);
  const updated = updateAnime(id, body);
  if (!updated) {
    return res.status(404).json({ error: 'Anime not found' });
  }

  // Build change details
  const changes = [];
  if (existing) {
    if (body.score && body.score !== existing.score) changes.push(`score ${existing.score}→${body.score}`);
    if (body.status && body.status !== existing.status) changes.push(`status ${existing.status}→${body.status}`);
    if (body.title && body.title !== existing.title) changes.push(`renamed to "${body.title}"`);
    if (body.type && body.type !== existing.type) changes.push(`type ${existing.type}→${body.type}`);
  }
  const detail = changes.length > 0 ? changes.join(', ') : 'updated details';

  addEntry({ action: 'edit', target: updated.title, details: detail });

  return res.status(200).json({ success: true, anime: updated });
}

function handleDelete(id, res) {
  const existing = getAnimeById(id);
  const deleted = deleteAnime(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Anime not found' });
  }

  addEntry({ action: 'delete', target: existing ? existing.title : `ID ${id}`, details: `${existing?.type || '?'} • ⭐ ${existing?.score || '?'}` });

  return res.status(200).json({ success: true, message: 'Anime deleted' });
}
