const { getAllAnime, addAnime, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default async function handler(req, res) {
  if (!requireAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  const { search, letter, type, genre, sort, status, tag } = req.query;
  const gh = getGhFromReq(req);
  let anime = await getAllAnime(gh);

  if (search) {
    const q = search.toLowerCase();
    anime = anime.filter(a => 
      a.title.toLowerCase().includes(q) || 
      (a.notes && a.notes.toLowerCase().includes(q)) ||
      (a.genres && a.genres.some(g => g.toLowerCase().includes(q)))
    );
  }
  if (letter) anime = anime.filter(a => a.letter === letter.toUpperCase());
  if (type) anime = anime.filter(a => a.type === type);
  if (status) anime = anime.filter(a => (a.status || 'Completed') === status);
  if (genre) anime = anime.filter(a => a.genres && a.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
  if (tag) anime = anime.filter(a => a.tags && a.tags.some(t => t.toLowerCase() === tag.toLowerCase()));

  if (sort === 'score') anime.sort((a, b) => b.score - a.score);
  else if (sort === 'title') anime.sort((a, b) => a.title.localeCompare(b.title));
  else if (sort === 'recent') anime.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  else if (sort === 'updated') anime.sort((a, b) => new Date(b.updatedAt || b.addedAt) - new Date(a.updatedAt || a.addedAt));

  return res.status(200).json({ total: anime.length, anime });
}

async function handlePost(req, res) {
  const { title, anilistUrl, anilistId, type, score, genres, episodes, status, notes, tags, coverImage } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const gh = getGhFromReq(req);
    const entry = await addAnime({
      title, anilistUrl: anilistUrl || (anilistId ? `https://anilist.co/anime/${anilistId}` : ''),
      anilistId: anilistId ? parseInt(anilistId) : null,
      type: type || 'TV', score: score || 0, genres: genres || [],
      episodes: episodes || 0, status: status || 'Completed',
      notes: notes || '', tags: tags || [], coverImage: coverImage || null
    }, gh);

    addEntry({ action: 'add', target: title, details: `${type || 'TV'} • ${score || 0} • ${(genres || []).join(', ')}`, gh });

    return res.status(201).json({ success: true, anime: entry });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
