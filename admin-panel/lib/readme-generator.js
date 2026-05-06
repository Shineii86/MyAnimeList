// Generate README.md from anime.json data
const fs = require('fs');
const path = require('path');

const EMOJI_MAP = {
  'Action': '⚔️', 'Adventure': '🗡️', 'Comedy': '😄', 'Drama': '💔',
  'Fantasy': '🧙', 'Horror': '🎭', 'Mecha': '🤖', 'Music': '🎵',
  'Mystery': '🕰️', 'Psychological': '🧠', 'Romance': '💕', 'Sci-Fi': '🔬',
  'Slice of Life': '😃', 'Sports': '🏐', 'Supernatural': '🔥', 'Thriller': '🎭',
  'Ecchi': '😈', 'Harem': '💕', 'Historical': '📜', 'Military': '🎖️',
  'Parody': '😂', 'School': '🎓', 'Seinen': '🔞', 'Shoujo': '💮',
  'Shounen': '🔥', 'Space': '🌌', 'Super Power': '💥', 'Vampire': '🧛',
  'Game': '🎮', 'Racing': '🏎️', 'Demons': '👹', 'Magic': '✨',
  'Martial Arts': '🥋', 'Samurai': '⛩️', 'Police': '👮', 'Kids': '👶',
  'Josei': '👩', 'Isekai': '🌀',
};

function getGenreEmoji(genre) { return EMOJI_MAP[genre] || '🏷️'; }

function formatGenreLine(genres) {
  return genres.map(g => `${getGenreEmoji(g)} ${g}`).join(', ');
}

function computeStats(anime) {
  const total = anime.length;
  const movies = anime.filter(a => a.type === 'Movie').length;
  const tv = anime.filter(a => a.type === 'TV').length;
  const ovas = anime.filter(a => a.type === 'OVA' || a.type === 'Special').length;
  const ona = anime.filter(a => a.type === 'ONA').length;
  const scores = anime.filter(a => a.score > 0).map(a => a.score);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
  const totalEpisodes = anime.reduce((sum, a) => sum + (a.episodes || 0), 0);
  const completed = anime.filter(a => a.status === 'Completed').length;
  const watching = anime.filter(a => a.status === 'Watching').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalAnime: `${total}`,
    totalEpisodes: totalEpisodes > 0 ? `${totalEpisodes.toLocaleString()}` : '1,240+',
    moviesWatched: `${movies}`,
    tvShows: `${tv}`,
    ovasSpecials: `${ovas}`,
    onaShows: `${ona}`,
    averageScore: avgScore,
    completionRate: `${completionRate}%`,
    completed: completed,
    watching: watching
  };
}

function generateReadme(data) {
  const { recommendations, anime } = data;
  const stats = computeStats(anime);
  
  // Group anime by letter
  const grouped = {};
  for (const entry of anime) {
    const letter = entry.letter || entry.title.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(entry);
  }
  const letters = Object.keys(grouped).sort();

  let readme = `<div align="center">
<a href="https://shineii86.github.io/AniList">
<img src="https://raw.githubusercontent.com/Shineii86/MyAnimeList/refs/heads/main/assets/image.png" alt="LOGO" width="200" height="200"/>
</a>

![Anime Count](https://img.shields.io/badge/Anime%20Watched-${stats.totalAnime}-blueviolet?style=for-the-badge)
![Days Watched](https://img.shields.io/badge/Days%20Watched-3.5+-important?style=for-the-badge)
[![GitHub Stars](https://img.shields.io/github/stars/Shineii86/MyAnimeList?style=for-the-badge)](https://github.com/Shineii86/MyAnimeList/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Shineii86/MyAnimeList?style=for-the-badge)](https://github.com/Shineii86/MyAnimeList/fork)

### WELCOME TO MY ANIME JOURNEY!

</div> 

> I began my anime-watching journey in **2020**, and since then I have watched and completed over **${stats.totalAnime} Anime Titles**, ranging from the most popular shounen series to niche Isekai, Dramas, Psychological Thrillers, and Unforgettable Movies. This repository serves as a **Comprehensive Archive** of everything I've experienced in anime—my personal ratings, favorite recommendations, and a full **A–Z list** with official AniList links for every series.


## 📋 Table of Contents
- [📊 Statistics](#-statistics)
- [🏆 Top Recommendations](#-top-recommendations)
- [📺 Complete Anime List](#-complete-anime-list)
- [🛠️ Admin Panel](#%EF%B8%8F-admin-panel)
- [🤝 Recommendations](#recommendations-welcome)
- [📝 License](#license)

## 📊 Statistics

| Statistic | Value |
|-----------|-------|
| Total Anime | ${stats.totalAnime} |
| Total Episodes | ${stats.totalEpisodes} |
| TV Shows | ${stats.tvShows} |
| Movies Watched | ${stats.moviesWatched} |
| OVAs/Specials | ${stats.ovasSpecials} |
| ONA | ${stats.onaShows} |
| Average Score | ${stats.averageScore} |
| Completion Rate | ${stats.completionRate} |

## 🏆 Top Recommendations

These are my personal 10/10 masterpieces:

`;

  if (recommendations && recommendations.length > 0) {
    for (const rec of recommendations) {
      readme += `- [**${rec.title}**](${rec.url}) - ${rec.description}\n`;
    }
  }

  readme += `
## 📺 Complete Anime List (A-Z)

`;

  for (const letter of letters) {
    readme += `### ${letter}\n`;
    for (const entry of grouped[letter]) {
      const genreStr = formatGenreLine(entry.genres || []);
      readme += `- [**${entry.title}**](${entry.anilistUrl}) - ${entry.type} ⭐ ${entry.score} | ${genreStr}\n`;
    }
    readme += '\n';
  }

  readme += `## 🛠️ Admin Panel

This repository includes a **web-based Admin Panel** for managing the anime collection.

### Features
- 🔐 Password-protected authentication
- 📊 Dashboard with real-time stats
- ➕ Add/Edit/Delete anime with full CRUD
- 🔍 AniList API search & quick import
- 📦 Bulk import from multiple AniList URLs
- 📊 Visual analytics (score charts, genre breakdown)
- 🎲 Random anime picker
- 📋 Activity log with full audit trail
- 🚀 Push changes directly to GitHub
- ⚙️ Auto-push toggle for seamless updates

### Quick Start
\`\`\`bash
cd admin-panel
npm install
cp .env.example .env.local  # Set ADMIN_PASSWORD
npm run dev                  # Open localhost:3000
\`\`\`

### Deploy to Vercel
1. Import repo at [vercel.com](https://vercel.com)
2. Set Root Directory to \`admin-panel\`
3. Add env var: \`ADMIN_PASSWORD\`
4. Deploy!

See [admin-panel/README.md](admin-panel/README.md) for full documentation.

## 🤝 Recommendations Welcome!

I'm always looking for new anime to watch! Feel free to:

1. Open an issue with a recommendation
2. Suggest improvements to this README
3. Discuss any of the anime on my list
4. Share your own favorites!

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 💕 Loved My Work?

🚨 [Follow me on GitHub](https://github.com/Shineii86)

⭐ [Give a star to this project](https://github.com/Shineii86/MyAnimeList)

<div align="center">

<a href="https://github.com/Shineii86/MyAnimeList">
<img src="https://github.com/Shineii86/AniPay/blob/main/Source/Banner6.png" alt="Banner">
</a>
  
  *For inquiries or collaborations*
     
[![Telegram Badge](https://img.shields.io/badge/-Telegram-2CA5E0?style=flat&logo=Telegram&logoColor=white)](https://telegram.me/Shineii86 "Contact on Telegram")
[![Instagram Badge](https://img.shields.io/badge/-Instagram-C13584?style=flat&logo=Instagram&logoColor=white)](https://instagram.com/ikx7.a "Follow on Instagram")
[![Pinterest Badge](https://img.shields.io/badge/-Pinterest-E60023?style=flat&logo=Pinterest&logoColor=white)](https://pinterest.com/ikx7a "Follow on Pinterest")
[![Gmail Badge](https://img.shields.io/badge/-Gmail-D14836?style=flat&logo=Gmail&logoColor=white)](mailto:ikx7a@hotmail.com "Send an Email")

  <sup><b>Copyright © 2026 <a href="https://telegram.me/Shineii86">Shinei Nouzen</a> All Rights Reserved</b></sup>

![Last Commit](https://img.shields.io/github/last-commit/Shineii86/MyAnimeList?style=for-the-badge)

</div>
`;

  return readme;
}

function generateAndSave() {
  const dataFile = path.join(__dirname, '..', 'data', 'anime.json');
  const readmeFile = path.join(__dirname, '..', '..', 'README.md');
  
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const readme = generateReadme(data);
  fs.writeFileSync(readmeFile, readme, 'utf-8');
  
  const stats = computeStats(data.anime);
  console.log(`✅ README.md generated with live stats:`);
  console.log(`   Anime: ${stats.totalAnime} | Avg Score: ${stats.averageScore} | Movies: ${stats.moviesWatched} | TV: ${stats.tvShows}`);
  return readme;
}

if (require.main === module) {
  generateAndSave();
}

module.exports = { generateReadme, generateAndSave, computeStats };
