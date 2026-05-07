import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { importFromAniListUser, formatAniListDate, mapAniListFormat, mapAniListScore } from '@/lib/anilist';
import { syncToGitHub } from '@/lib/github';
import type { Anime } from '@/lib/utils';

const DATA_FILE = join(process.cwd(), 'data', 'anime.json');

async function readAnime(): Promise<Anime[]> {
  const data = await readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeAnime(anime: Anime[]): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(anime, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const entries = await importFromAniListUser(username);
    const existing = await readAnime();
    const existingAnilistIds = new Set(existing.map(a => a.anilistId));

    let nextId = existing.length > 0 ? Math.max(...existing.map(a => a.id)) + 1 : 1;
    const now = new Date().toISOString();
    let added = 0;

    for (const entry of entries) {
      const anilistId = String(entry.media.id);
      if (existingAnilistIds.has(anilistId)) continue;

      const title = entry.media.title.english || entry.media.title.romaji;
      existing.push({
        id: nextId++,
        title,
        anilistId,
        anilistUrl: `https://anilist.co/anime/${entry.media.id}`,
        letter: title.charAt(0).toUpperCase(),
        isTopRecommendation: false,
        score: mapAniListScore(entry.score || entry.media.averageScore),
        type: mapAniListFormat(entry.media.format),
        genres: entry.media.genres,
        episodes: entry.media.episodes,
        status: 'Completed',
        coverImage: entry.media.coverImage?.large || null,
        description: entry.media.description?.replace(/<[^>]*>/g, '') || '',
        startDate: formatAniListDate(entry.media.startDate),
        endDate: formatAniListDate(entry.media.endDate),
        addedAt: now,
        updatedAt: now,
      });
      added++;
    }

    await writeAnime(existing);
    const syncResult = await syncToGitHub(`feat: import ${added} anime from AniList user "${username}"`);
    return NextResponse.json({ added, total: existing.length, skipped: entries.length - added, githubSync: syncResult });
  } catch {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
