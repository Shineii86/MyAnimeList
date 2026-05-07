const { readData, writeData, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  switch (req.method) {
    case 'GET': return handleGet(req, res);
    case 'POST': return handlePost(req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  const gh = getGhFromReq(req);
  const data = await readData(gh);
  return res.status(200).json({ lists: data.lists || [] });
}

async function handlePost(req, res) {
  const { name, emoji, description, animeIds } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const gh = getGhFromReq(req);
  const data = await readData(gh);
  if (!data.lists) data.lists = [];

  const newList = {
    id: `list_${Date.now()}`,
    name: name.trim(),
    emoji: emoji || '📋',
    description: description || '',
    animeIds: Array.isArray(animeIds) ? animeIds : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.lists.push(newList);
  await writeData(data, gh);

  return res.status(201).json({ success: true, list: newList });
}
