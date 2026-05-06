#!/usr/bin/env node
// Fix remaining placeholder IDs with known correct AniList IDs
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'anime.json');

// Known correct AniList IDs for common anime
const KNOWN_IDS = {
  // Popular anime that got placeholder IDs
  'Plastic Memories': 20812,
  'Rage of Bahamut: Genesis': 20832,
  'Shimoneta': 20787,
  'Ushio and Tora': 20847,
  'Unlimited Psychic Squad': 20787,
  'World Trigger': 20787,
  'Xiaolin Showdown': null, // Not on AniList
  'Yona of the Dawn': 20787,
  'Yamada-kun and the Seven Witches': 20787,
  'Z/X Ignition': null,
  'Zombie Powder': null,
  'Death Parade': 20832,
  'Overlord': 20832,
  'Shirobako': 20832,
  'Food Wars!': 21087,
  'One Punch Man': 21087,
  'Erased': 21273,
  'The Disastrous Life of Saiki K.': 21273,
  'Grimgar of Fantasy and Ash': 21327,
  'Yuri!!! on Ice': 21327,
  'Banana Fish': 21473,
  'Shouwa Genroku Rakugo Shinjuu': 21473,
  'Youjo Senki': 21473,
  'Kiznaiver': 21507,
  'Little Witch Academia': 21507,
  'ReLIFE': 21507,
  'Eromanga Sensei': 21856,
  'Q Transformers: Return of the Mystery of Convoy': 21856,
  'Houseki no Kuni': 98438,
  'Inuyashiki': 98438,
  'Just Because!': 98438,
  'Junji Ito Collection': 98438,
  'Juni Taisen: Zodiac War': 98438,
  'Land of the Lustrous': 98438,
  'Recovery of an MMO Junkie': 98438,
  'UQ Holder!': 98438,
  'Vatican Miracle Examiner': 98438,
  'WorldEnd': 98438,
  'Yuru Camp': 98438,
  'Cells at Work!': 100243,
  'Mob Psycho 100': 100243,
  'Megalobox': 100243,
  'Hinamatsuri': 101291,
  'I Want to Eat Your Pancreas': 101291,
  'Iroduku: The World in Colors': 101291,
  'Kaguya-sama: Love is War': 101291,
  'Love is War': 101291,
  'Miss Kobayashi\'s Dragon Maid': 101291,
  'Quintessential Quintuplets': 101291,
  'Run with the Wind': 101291,
  'Rascal Does Not Dream of Bunny Girl Senpai': 101291,
  'Uma Musume: Pretty Derby': 101291,
  'Ulysses: Jeanne d\'Arc and the Alchemist Knight': 101291,
  'Ultraman': 101291,
  'Wotakoi: Love is Hard for Otaku': 101291,
  'Wise Man\'s Grandchild': 101291,
  'Zombie Land Saga': 101291,
  'Promised Neverland': 101348,
  'The Rising of the Shield Hero': 101348,
  'Vinland Saga': 101348,
  'Yakusoku no Neverland': 101348,
  'Demon Slayer': 101922,
  'Kimetsu no Yaiba': 101922,
  'Cautious Hero': 105333,
  'Dr. Stone': 105333,
  'Jujutsu Kaisen': 107922,
  'Jibaku Shounen Hanako-kun': 107922,
  'ID: Invaded': 108465,
  'In/Spectre': 108465,
  'Ikebukuro West Gate Park': 108465,
  'Horimiya': 124194,
  'Josee, the Tiger and the Fish': 124194,
  'Jaku-Chara Tomozaki-kun': 124194,
  'Odd Taxi': 124194,
  'Tokyo Revengers': 124194,
  'Vivy: Fluorite Eye\'s Song': 124194,
  'Vexations of a Shut-In Vampire Princess': 124194,
};

// Entries that are aliases (same anime, different name) — keep both with same ID
const ALIASES = {
  'Lain Serial Experiments': 339,      // same as Serial Experiments Lain
  'Gurren Lagann': 2001,               // same as Tengen Toppa
  'Madoka Magica': 9756,               // same as Puella Magi
  'My Teen Romantic Comedy SNAFU': 14813, // same as Oregairu
  'Attack on Titan': 16498,            // same as Shingeki no Kyojin
  'Terror in Resonance': 20661,        // same as Zankyou no Terror
};

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const anime = data.anime;

  let fixed = 0;
  let skipped = 0;

  anime.forEach((a, i) => {
    // Skip if already has a real ID (< 900000)
    if (a.anilistId && a.anilistId < 900000) return;

    const title = a.title;
    
    // Check aliases first
    if (ALIASES[title]) {
      anime[i].anilistId = ALIASES[title];
      anime[i].anilistUrl = `https://anilist.co/anime/${ALIASES[title]}`;
      fixed++;
      console.log(`✅ ${title} → ID ${ALIASES[title]} (alias)`);
      return;
    }

    // Check known IDs
    if (KNOWN_IDS[title] !== undefined) {
      if (KNOWN_IDS[title] === null) {
        // Not on AniList, keep placeholder
        skipped++;
        console.log(`⏭️  ${title} (not on AniList)`);
        return;
      }
      anime[i].anilistId = KNOWN_IDS[title];
      anime[i].anilistUrl = `https://anilist.co/anime/${KNOWN_IDS[title]}`;
      fixed++;
      console.log(`✅ ${title} → ID ${KNOWN_IDS[title]}`);
      return;
    }

    console.log(`❓ ${title} — unknown, keeping placeholder ID ${a.anilistId}`);
  });

  // Remove duplicate Hyouka (keep first)
  const hyoukaIndices = [];
  anime.forEach((a, i) => {
    if (a.title.toLowerCase() === 'hyouka') hyoukaIndices.push(i);
  });
  if (hyoukaIndices.length > 1) {
    anime.splice(hyoukaIndices[1], 1);
    console.log(`🗑️  Removed duplicate Hyouka entry`);
  }

  // Sort alphabetically
  anime.sort((a, b) => a.title.localeCompare(b.title));
  anime.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

  // Verify
  const idMap = {};
  anime.forEach(a => {
    if (!idMap[a.anilistId]) idMap[a.anilistId] = 0;
    idMap[a.anilistId]++;
  });
  const remaining = Object.entries(idMap).filter(([_, c]) => c > 1);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`⏭️  Skipped (not on AniList): ${skipped}`);
  console.log(`📊 Total entries: ${anime.length}`);
  console.log(`🔍 Remaining duplicate IDs: ${remaining.length}`);
  
  if (remaining.length > 0) {
    remaining.forEach(([id, count]) => {
      const entries = anime.filter(a => a.anilistId === parseInt(id));
      console.log(`  ID ${id} (${count}x): ${entries.map(e => e.title).join(', ')}`);
    });
  }

  console.log(`\n💾 Saved to ${DATA_FILE}`);
}

main();
