const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'anime.json');

const VALID_STATUSES = ['Completed', 'Watching', 'Plan to Watch', 'Dropped', 'On Hold'];

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { metadata: {}, recommendations: [], anime: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getAllAnime() {
  const data = readData();
  return data.anime || [];
}

function getAnimeById(id) {
  const anime = getAllAnime();
  return anime.find(a => a.id === parseInt(id));
}

function addAnime(entry) {
  const data = readData();
  const newEntry = {
    id: entry.anilistId || Date.now(),
    title: entry.title,
    anilistUrl: entry.anilistUrl || `https://anilist.co/anime/${entry.anilistId}`,
    anilistId: entry.anilistId || null,
    type: entry.type || 'TV',
    score: parseFloat(entry.score) || 0,
    genres: entry.genres || [],
    episodes: parseInt(entry.episodes) || 0,
    status: entry.status || 'Completed',
    notes: entry.notes || '',
    tags: entry.tags || [],
    letter: entry.title.charAt(0).toUpperCase(),
    coverImage: entry.coverImage || null,
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.anime.push(newEntry);
  data.anime.sort((a, b) => a.title.localeCompare(b.title));
  data.anime.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });
  writeData(data);
  updateStats(data);
  return newEntry;
}

function updateAnime(id, updates) {
  const data = readData();
  const index = data.anime.findIndex(a => a.id === parseInt(id));
  if (index === -1) return null;
  
  data.anime[index] = { ...data.anime[index], ...updates, updatedAt: new Date().toISOString() };
  if (updates.title) {
    data.anime[index].letter = updates.title.charAt(0).toUpperCase();
  }
  data.anime.sort((a, b) => a.title.localeCompare(b.title));
  writeData(data);
  updateStats(data);
  return data.anime[index];
}

function deleteAnime(id) {
  const data = readData();
  const index = data.anime.findIndex(a => a.id === parseInt(id));
  if (index === -1) return false;
  
  data.anime.splice(index, 1);
  writeData(data);
  updateStats(data);
  return true;
}

function getRandomAnime(filters = {}) {
  let anime = getAllAnime();
  
  if (filters.status) {
    anime = anime.filter(a => a.status === filters.status);
  }
  if (filters.type) {
    anime = anime.filter(a => a.type === filters.type);
  }
  if (filters.minScore) {
    anime = anime.filter(a => a.score >= parseFloat(filters.minScore));
  }
  if (filters.genre) {
    anime = anime.filter(a => a.genres && a.genres.some(g => g.toLowerCase() === filters.genre.toLowerCase()));
  }
  
  if (anime.length === 0) return null;
  return anime[Math.floor(Math.random() * anime.length)];
}

function updateStats(data) {
  const anime = data.anime || [];
  const totalAnime = anime.length;
  const totalEpisodes = anime.reduce((sum, a) => sum + (a.episodes || 0), 0);
  const moviesWatched = anime.filter(a => a.type === 'Movie').length;
  const ovasSpecials = anime.filter(a => a.type === 'OVA' || a.type === 'Special').length;
  const scores = anime.filter(a => a.score > 0).map(a => a.score);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  
  const statusCounts = {};
  VALID_STATUSES.forEach(s => { statusCounts[s] = 0; });
  anime.forEach(a => {
    const s = a.status || 'Completed';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  
  const completionRate = totalAnime > 0 ? Math.round((statusCounts['Completed'] / totalAnime) * 100) + '%' : '0%';

  data.metadata = {
    totalAnime: `${totalAnime}`,
    totalEpisodes: `${totalEpisodes.toLocaleString()}+`,
    moviesWatched: `${moviesWatched}`,
    ovasSpecials: `${ovasSpecials}`,
    averageScore: avgScore,
    completionRate: completionRate,
    statusCounts
  };
  writeData(data);
}

function getStats() {
  const data = readData();
  return data.metadata || {};
}

function getRecommendations() {
  const data = readData();
  return data.recommendations || [];
}

function addRecommendation(rec) {
  const data = readData();
  data.recommendations.push(rec);
  writeData(data);
  return rec;
}

function deleteRecommendation(index) {
  const data = readData();
  if (index >= 0 && index < data.recommendations.length) {
    data.recommendations.splice(index, 1);
    writeData(data);
    return true;
  }
  return false;
}

module.exports = {
  readData,
  writeData,
  getAllAnime,
  getAnimeById,
  addAnime,
  updateAnime,
  deleteAnime,
  getRandomAnime,
  getStats,
  getRecommendations,
  addRecommendation,
  deleteRecommendation,
  updateStats,
  VALID_STATUSES
};
