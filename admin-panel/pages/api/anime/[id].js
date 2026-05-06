const { getAnimeById, updateAnime, deleteAnime } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

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
  const updated = updateAnime(id, body);
  if (!updated) {
    return res.status(404).json({ error: 'Anime not found' });
  }
  return res.status(200).json({ success: true, anime: updated });
}

function handleDelete(id, res) {
  const deleted = deleteAnime(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Anime not found' });
  }
  return res.status(200).json({ success: true, message: 'Anime deleted' });
}
