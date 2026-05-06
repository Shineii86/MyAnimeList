#!/usr/bin/env node
// Fix duplicate AniList IDs by fetching correct ones from AniList API
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'anime.json');
const ANILIST_API = 'https://graphql.anilist.co';
const DELAY_MS = 600; // Rate limit: ~100 req/min

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchAniList(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title { romaji english }
        type
        format
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { search: title } })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const media = data.data?.Media;
    if (!media) return null;

    return {
      anilistId: media.id,
      anilistUrl: `https://anilist.co/anime/${media.id}`,
      type: media.format === 'MOVIE' ? 'Movie' : media.format === 'OVA' ? 'OVA' : media.format === 'ONA' ? 'ONA' : 'TV'
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log('🔍 Loading anime data...\n');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const anime = data.anime;

  // Find duplicates by anilistId
  const idMap = {};
  anime.forEach((a, i) => {
    if (!a.anilistId) return;
    if (!idMap[a.anilistId]) idMap[a.anilistId] = [];
    idMap[a.anilistId].push({ index: i, ...a });
  });

  const duplicates = Object.entries(idMap).filter(([_, entries]) => entries.length > 1);
  
  console.log(`Found ${duplicates.length} duplicate AniList ID groups affecting ${duplicates.reduce((s, [_, e]) => s + e.length, 0)} entries\n`);

  // Also find duplicate titles
  const titleMap = {};
  anime.forEach((a, i) => {
    const key = a.title.toLowerCase().trim();
    if (!titleMap[key]) titleMap[key] = [];
    titleMap[key].push({ index: i, ...a });
  });
  const dupeTitles = Object.entries(titleMap).filter(([_, entries]) => entries.length > 1);
  if (dupeTitles.length > 0) {
    console.log(`Found ${dupeTitles.length} duplicate title groups:`);
    dupeTitles.forEach(([title, entries]) => {
      console.log(`  "${title}" — ${entries.length} entries`);
    });
    console.log('');
  }

  // Fix strategy: fetch correct ID from AniList for each entry
  let fixed = 0;
  let failed = 0;
  let skipped = 0;

  // Collect all entries that need fixing (have duplicate IDs)
  const needsFix = new Set();
  duplicates.forEach(([id, entries]) => {
    entries.forEach(e => needsFix.add(e.index));
  });

  // Also fix duplicate titles
  dupeTitles.forEach(([_, entries]) => {
    entries.slice(1).forEach(e => needsFix.add(e.index)); // Keep first, fix rest
  });

  console.log(`Need to fix ${needsFix.size} entries...\n`);

  for (const index of needsFix) {
    const entry = anime[index];
    const title = entry.title;
    
    process.stdout.write(`  [${fixed + failed + skipped + 1}/${needsFix.size}] ${title}... `);
    
    const result = await searchAniList(title);
    await sleep(DELAY_MS);

    if (result && result.anilistId) {
      anime[index].anilistId = result.anilistId;
      anime[index].anilistUrl = result.anilistUrl;
      if (result.type) anime[index].type = result.type;
      fixed++;
      console.log(`✅ → ID ${result.anilistId}`);
    } else {
      // Use a unique ID based on index to avoid collisions
      anime[index].anilistId = 900000 + index;
      anime[index].anilistUrl = `https://anilist.co/anime/${900000 + index}`;
      failed++;
      console.log(`⚠️ (AniList not found, assigned placeholder ID ${900000 + index})`);
    }
  }

  // Verify no more duplicates
  const newIdMap = {};
  anime.forEach(a => {
    if (!a.anilistId) return;
    if (!newIdMap[a.anilistId]) newIdMap[a.anilistId] = 0;
    newIdMap[a.anilistId]++;
  });
  const remainingDupes = Object.entries(newIdMap).filter(([_, count]) => count > 1);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`⚠️ Placeholder IDs: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`🔍 Remaining duplicate IDs: ${remainingDupes.length}`);

  if (remainingDupes.length > 0) {
    console.log('\nRemaining duplicates:');
    remainingDupes.forEach(([id, count]) => {
      const entries = anime.filter(a => a.anilistId === parseInt(id));
      console.log(`  ID ${id} (${count}x): ${entries.map(e => e.title).join(', ')}`);
    });
  }

  // Save
  if (fixed > 0 || failed > 0) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Saved to ${DATA_FILE}`);
  } else {
    console.log('\nNo changes needed.');
  }
}

main().catch(console.error);
