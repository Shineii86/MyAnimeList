const { readData, writeData, updateStats, getGhFromReq } = require('../../../lib/data');
const { requireAuth } = require('../../../lib/auth');
const { addEntry } = require('../../../lib/activity-log');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { anime, metadata, recommendations, mode } = req.body;

    if (!anime || !Array.isArray(anime)) {
      return res.status(400).json({ error: 'Invalid data: anime array required' });
    }

    const valid = anime.filter(a => a.title && typeof a.title === 'string');
    if (valid.length === 0) return res.status(400).json({ error: 'No valid anime entries found' });

    const gh = getGhFromReq(req);

    // 'replace' mode = full restore (replaces everything)
    // default = merge (adds new, skips duplicates by title)
    if (mode === 'replace') {
      valid.sort((a, b) => a.title.localeCompare(b.title));
      valid.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });

      const data = {
        metadata: metadata || {},
        recommendations: recommendations || [],
        anime: valid
      };

      updateStats(data);
      await writeData(data, gh);

      addEntry({ action: 'import', target: 'Collection', details: `Replaced collection with ${valid.length} anime entries (full restore)`, gh });

      return res.status(200).json({ success: true, message: `Replaced collection with ${valid.length} anime entries`, total: valid.length, mode: 'replace' });
    }

    // Merge mode (default): add new entries, skip duplicates by title
    const existing = await readData(gh);
    const existingTitles = new Set(existing.anime.map(a => a.title.toLowerCase()));
    let added = 0;
    let skipped = 0;

    for (const entry of valid) {
      if (existingTitles.has(entry.title.toLowerCase())) {
        skipped++;
        continue;
      }
      const newEntry = {
        id: entry.anilistId || entry.id || Date.now() + Math.floor(Math.random() * 1000),
        title: entry.title.trim(),
        anilistUrl: entry.anilistUrl || (entry.anilistId ? `https://anilist.co/anime/${entry.anilistId}` : ''),
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
      existing.anime.push(newEntry);
      added++;
    }

    existing.anime.sort((a, b) => a.title.localeCompare(b.title));
    existing.anime.forEach(a => { a.letter = a.title.charAt(0).toUpperCase(); });
    if (metadata) existing.metadata = { ...existing.metadata, ...metadata };
    if (recommendations) existing.recommendations = recommendations;

    updateStats(existing);
    await writeData(existing, gh);

    addEntry({ action: 'import', target: 'Collection', details: `Merged ${added} new anime (${skipped} duplicates skipped)`, gh });

    return res.status(200).json({ success: true, message: `Imported ${added} anime (${skipped} duplicates skipped)`, added, skipped, total: existing.anime.length, mode: 'merge' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
