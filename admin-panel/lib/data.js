const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data', 'anime.json');

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
    letter: entry.title.charAt(0).toUpperCase(),
    addedAt: new Date().toISOString()
  };
  data.anime.push(newEntry);
  // Sort alphabetically
  data.anime.sort((a, b) => a.title.localeCompare(b.title));
  // Recalculate letters
  data.anime.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });
  writeData(data);
  updateStats(data);
  return newEntry;
}

function updateAnime(id, updates) {
  const data = readData();
  const index = data.anime.findIndex(a => a.id === parseInt(id));
  if (index === -1) return null;
  
  data.anime[index] = { ...data.anime[index], ...updates };
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

function updateStats(data) {
  const anime = data.anime || [];
  const totalAnime = anime.length;
  const totalEpisodes = anime.reduce((sum, a) => sum + (a.episodes || 0), 0);
  const moviesWatched = anime.filter(a => a.type === 'Movie').length;
  const ovasSpecials = anime.filter(a => a.type === 'OVA' || a.type === 'Special').length;
  const scores = anime.filter(a => a.score > 0).map(a => a.score);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  const completionRate = totalAnime > 0 ? Math.round((anime.filter(a => a.status === 'Completed' || !a.status).length / totalAnime) * 100) + '%' : '0%';

  data.metadata = {
    totalAnime: `${totalAnime}`,
    totalEpisodes: `${totalEpisodes.toLocaleString()}+`,
    moviesWatched: `${moviesWatched}`,
    ovasSpecials: `${ovasSpecials}`,
    averageScore: avgScore,
    completionRate: completionRate
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
  getStats,
  getRecommendations,
  addRecommendation,
  deleteRecommendation,
  updateStats
};
