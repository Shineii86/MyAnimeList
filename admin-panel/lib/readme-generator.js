// Generate README.md from anime.json data
const fs = require('fs');
const path = require('path');

const EMOJI_MAP = {
  'Action': '⚔️',
  'Adventure': '🗡️',
  'Comedy': '😄',
  'Drama': '💔',
  'Fantasy': '🧙',
  'Horror': '🎭',
  'Mecha': '🤖',
  'Music': '🎵',
  'Mystery': '🕰️',
  'Psychological': '🧠',
  'Romance': '💕',
  'Sci-Fi': '🔬',
  'Slice of Life': '😃',
  'Sports': '🏐',
  'Supernatural': '🔥',
  'Thriller': '🎭',
  'Ecchi': '😈',
  'Harem': '💕',
  'Historical': '📜',
  'Military': '🎖️',
  'Parody': '😂',
  'School': '🎓',
  'Seinen': '🔞',
  'Shoujo': '💮',
  'Shounen': '🔥',
  'Space': '🌌',
  'Super Power': '💥',
  'Vampire': '🧛',
  'Game': '🎮',
  'Racing': '🏎️',
  'Demons': '👹',
  'Magic': '✨',
  'Martial Arts': '🥋',
  'Samurai': '⛩️',
  'Police': '👮',
  'Kids': '👶',
  'Josei': '👩',
  'Isekai': '🌀',
};

function getGenreEmoji(genre) {
  return EMOJI_MAP[genre] || '🏷️';
}

function formatGenreLine(genres) {
  return genres.map(g => `${getGenreEmoji(g)} ${g}`).join(', ');
}

function generateReadme(data) {
  const { metadata, recommendations, anime } = data;
  
  // Group anime by letter
  const grouped = {};
  for (const entry of anime) {
    const letter = entry.letter || entry.title.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(entry);
  }

  // Sort letters
  const letters = Object.keys(grouped).sort();

  let readme = `<div align="center">
<a href="https://shineii86.github.io/AniList">
<img src="https://raw.githubusercontent.com/Shineii86/MyAnimeList/refs/heads/main/assets/image.png" alt="LOGO" width="200" height="200"/>
</a>

![Anime Count](https://img.shields.io/badge/Anime%20Watched-${encodeURIComponent(metadata.totalAnime || '100+')}-blueviolet?style=for-the-badge)
![Days Watched](https://img.shields.io/badge/Days%20Watched-3.5+-important?style=for-the-badge)
[![GitHub Stars](https://img.shields.io/github/stars/Shineii86/MyAnimeList?style=for-the-badge)](https://github.com/Shineii86/MyAnimeList/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Shineii86/MyAnimeList?style=for-the-badge)](https://github.com/Shineii86/MyAnimeList/fork)

### WELCOME TO MY ANIME JOURNEY!

</div> 

> I began my anime-watching journey in **2020**, and since then I have watched and completed over **${metadata.totalAnime || '100+'} Anime Titles**, ranging from the most popular shounen series to niche Isekai, Dramas, Psychological Thrillers, and Unforgettable Movies. This repository serves as a **Comprehensive Archive** of everything I've experienced in anime—my personal ratings, favorite recommendations, and a full **A–Z list** with official AniList links for every series.


## 📋 Table of Contents
- [📊 Statistics](#-statistics)
- [🏆 Top Recommendations](#-top-recommendations)
- [📺 Complete Anime List](#-complete-anime-list)
- [🤝 Recommendations](#recommendations-welcome)
- [📝 License](#license)

## 📊 Statistics

| Statistic | Value |
|-----------|-------|
| Total Anime | ${metadata.totalAnime || '100+'} |
| Total Episodes | ${metadata.totalEpisodes || '1,240+'} |
| Movies Watched | ${metadata.moviesWatched || '10+'} |
| OVAs/Specials | ${metadata.ovasSpecials || '5+'} |
| Average Score | ${metadata.averageScore || '8.2'} |
| Completion Rate | ${metadata.completionRate || '87%'} |

## 🏆 Top Recommendations

These are my personal 10/10 masterpieces:

`;

  // Recommendations
  if (recommendations && recommendations.length > 0) {
    for (const rec of recommendations) {
      readme += `- [**${rec.title}**](${rec.url}) - ${rec.description}\n`;
    }
  }

  readme += `
## 📺 Complete Anime List (A-Z)

`;

  // Anime list by letter
  for (const letter of letters) {
    readme += `### ${letter}\n`;
    for (const entry of grouped[letter]) {
      const genreStr = formatGenreLine(entry.genres || []);
      readme += `- [**${entry.title}**](${entry.anilistUrl}) - ${entry.type} ⭐ ${entry.score} | ${genreStr}\n`;
    }
    readme += '\n';
  }

  readme += `## 🤝 Recommendations Welcome!

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
  
  console.log(`✅ README.md generated with ${data.anime.length} anime entries`);
  return readme;
}

// Run if called directly
if (require.main === module) {
  generateAndSave();
}

module.exports = { generateReadme, generateAndSave };
