// Parse existing README.md into anime.json
const fs = require('fs');
const path = require('path');

const readme = fs.readFileSync(path.join(__dirname, '..', '..', 'README.md'), 'utf-8');

// Find the anime list section
const listStart = readme.indexOf('## 📺 Complete Anime List (A-Z)');
const listEnd = readme.indexOf('## 🤝 Recommendations Welcome!');
const listSection = readme.substring(listStart, listEnd);

const anime = [];
const lines = listSection.split('\n');
let currentLetter = '';

for (const line of lines) {
  // Match letter headers
  const letterMatch = line.match(/^### ([A-Z])$/);
  if (letterMatch) {
    currentLetter = letterMatch[1];
    continue;
  }

  // Match anime entries: - [**Title**](url) - Type ⭐ score | emoji genres
  const animeMatch = line.match(/^- \[\*\*(.+?)\*\*\]\((.+?)\)\s*-\s*(\w+)\s*⭐\s*([\d.]+)\s*\|\s*(.+)$/);
  if (animeMatch) {
    const [, title, anilistUrl, type, score, genreStr] = animeMatch;
    
    // Parse genres - remove emoji prefixes
    const genres = genreStr.split(',').map(g => {
      g = g.trim();
      // Remove common emoji prefixes
      g = g.replace(/^[^\w\s]+\s*/, '');
      return g.trim();
    }).filter(Boolean);

    // Extract AniList ID from URL
    const idMatch = anilistUrl.match(/\/anime\/(\d+)/);
    const anilistId = idMatch ? parseInt(idMatch[1]) : null;

    anime.push({
      id: anilistId || anime.length + 1000,
      title,
      anilistUrl,
      anilistId,
      type, // TV, Movie, OVA
      score: parseFloat(score),
      genres,
      letter: currentLetter,
      addedAt: new Date().toISOString()
    });
  }
}

// Extract recommendations
const recStart = readme.indexOf('These are my personal 10/10 masterpieces:');
const recEnd = readme.indexOf('## 📺 Complete Anime List');
const recSection = readme.substring(recStart, recEnd);
const recommendations = [];
const recLines = recSection.split('\n');

for (const line of recLines) {
  const recMatch = line.match(/^- \[\*\*(.+?)\*\*\]\((.+?)\)\s*-\s*(.+)$/);
  if (recMatch) {
    const [, title, url, description] = recMatch;
    recommendations.push({ title, url, description });
  }
}

// Extract stats
const statsMatch = readme.match(/\| Total Anime \| (.+?) \|/);
const episodesMatch = readme.match(/\| Total Episodes \| (.+?) \|/);
const moviesMatch = readme.match(/\| Movies Watched \| (.+?) \|/);
const ovasMatch = readme.match(/\| OVAs\/Specials \| (.+?) \|/);
const avgScoreMatch = readme.match(/\| Average Score \| (.+?) \|/);
const completionMatch = readme.match(/\| Completion Rate \| (.+?) \|/);

const data = {
  metadata: {
    totalAnime: statsMatch ? statsMatch[1] : '100+',
    totalEpisodes: episodesMatch ? episodesMatch[1] : '1,240+',
    moviesWatched: moviesMatch ? moviesMatch[1] : '10+',
    ovasSpecials: ovasMatch ? ovasMatch[1] : '5+',
    averageScore: avgScoreMatch ? avgScoreMatch[1] : '8.2',
    completionRate: completionMatch ? completionMatch[1] : '87%'
  },
  recommendations,
  anime
};

fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'anime.json'),
  JSON.stringify(data, null, 2),
  'utf-8'
);

console.log(`Parsed ${anime.length} anime entries`);
console.log(`Parsed ${recommendations.length} recommendations`);
console.log('Stats:', data.metadata);
