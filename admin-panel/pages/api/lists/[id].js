const { readData, writeData, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;

  switch (req.method) {
    case 'GET': return handleGet(req, res, id);
    case 'PUT': return handlePut(req, res, id);
    case 'DELETE': return handleDelete(req, res, id);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res, id) {
  const gh = getGhFromReq(req);
  const data = await readData(gh);
  const list = (data.lists || []).find(l => l.id === id);
  if (!list) return res.status(404).json({ error: 'List not found' });
  return res.status(200).json({ list });
}

async function handlePut(req, res, id) {
  const { name, emoji, description, animeIds } = req.body;
  const gh = getGhFromReq(req);
  const data = await readData(gh);
  const lists = data.lists || [];
  const index = lists.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'List not found' });

  if (name) lists[index].name = name.trim();
  if (emoji) lists[index].emoji = emoji;
  if (description !== undefined) lists[index].description = description;
  if (Array.isArray(animeIds)) lists[index].animeIds = animeIds;
  lists[index].updatedAt = new Date().toISOString();

  data.lists = lists;
  await writeData(data, gh);

  return res.status(200).json({ success: true, list: lists[index] });
}

async function handleDelete(req, res, id) {
  const gh = getGhFromReq(req);
  const data = await readData(gh);
  const lists = (data.lists || []).filter(l => l.id !== id);
  data.lists = lists;
  await writeData(data, gh);

  return res.status(200).json({ success: true });
}
