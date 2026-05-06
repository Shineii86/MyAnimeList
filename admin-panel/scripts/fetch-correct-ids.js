#!/usr/bin/env node
// Fetch correct AniList IDs for placeholder entries with proper rate limiting
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'anime.json');
const ANILIST_API = 'https://graphql.anilist.co';
const DELAY_MS = 800;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchAniList(title) {
  const query = `query ($search: String) { Media(search: $search, type: ANIME) { id title { romaji english } format } }`;
  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { search: title } })
    });
    if (res.status === 429) {
      console.log('  ⏳ Rate limited, waiting 10s...');
      await sleep(10000);
      return searchAniList(title); // Retry
    }
    if (!res.ok) return null;
    const data = await res.json();
    const m = data.data?.Media;
    if (!m) return null;
    return { id: m.id, type: m.format === 'MOVIE' ? 'Movie' : m.format === 'OVA' ? 'OVA' : m.format === 'ONA' ? 'ONA' : 'TV' };
  } catch { return null; }
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const anime = data.anime;

  const needsFix = anime.filter(a => a.anilistId >= 900000);
  console.log(`Found ${needsFix.length} entries with placeholder IDs\n`);

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < needsFix.length; i++) {
    const entry = needsFix[i];
    const idx = anime.indexOf(entry);
    
    process.stdout.write(`  [${i + 1}/${needsFix.length}] ${entry.title}... `);
    
    const result = await searchAniList(entry.title);
    await sleep(DELAY_MS);

    if (result) {
      anime[idx].anilistId = result.id;
      anime[idx].anilistUrl = `https://anilist.co/anime/${result.id}`;
      if (result.type) anime[idx].type = result.type;
      fixed++;
      console.log(`✅ → ID ${result.id}`);
    } else {
      failed++;
      console.log(`❌ not found`);
    }
  }

  // Save
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

  // Verify duplicates
  const idMap = {};
  anime.forEach(a => {
    if (!idMap[a.anilistId]) idMap[a.anilistId] = 0;
    idMap[a.anilistId]++;
  });
  const dupes = Object.entries(idMap).filter(([_, c]) => c > 1);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${anime.length}`);
  console.log(`🔍 Duplicate IDs: ${dupes.length}`);
  if (dupes.length > 0) {
    dupes.forEach(([id, count]) => {
      const entries = anime.filter(a => a.anilistId === parseInt(id));
      console.log(`  ID ${id} (${count}x): ${entries.map(e => e.title).join(', ')}`);
    });
  }
  console.log(`\n💾 Saved`);
}

main().catch(console.error);
