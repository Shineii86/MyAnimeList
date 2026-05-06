const { getAllAnime, addAnime } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');

export default function handler(req, res) {
  // Auth check for all methods
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

function handleGet(req, res) {
  const { search, letter, type, genre, sort } = req.query;
  let anime = getAllAnime();

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    anime = anime.filter(a => a.title.toLowerCase().includes(q));
  }

  // Filter by letter
  if (letter) {
    anime = anime.filter(a => a.letter === letter.toUpperCase());
  }

  // Filter by type
  if (type) {
    anime = anime.filter(a => a.type === type);
  }

  // Filter by genre
  if (genre) {
    anime = anime.filter(a => a.genres && a.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
  }

  // Sort
  if (sort === 'score') {
    anime.sort((a, b) => b.score - a.score);
  } else if (sort === 'title') {
    anime.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'recent') {
    anime.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }

  return res.status(200).json({ 
    total: anime.length,
    anime 
  });
}

function handlePost(req, res) {
  const { title, anilistUrl, anilistId, type, score, genres, episodes } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const entry = addAnime({
      title,
      anilistUrl: anilistUrl || (anilistId ? `https://anilist.co/anime/${anilistId}` : ''),
      anilistId: anilistId ? parseInt(anilistId) : null,
      type: type || 'TV',
      score: score || 0,
      genres: genres || [],
      episodes: episodes || 0
    });

    return res.status(201).json({ success: true, anime: entry });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
