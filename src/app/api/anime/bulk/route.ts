import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
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
    const { anime: newAnimeList } = await request.json();
    if (!Array.isArray(newAnimeList)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const existing = await readAnime();
    let nextId = existing.length > 0 ? Math.max(...existing.map(a => a.id)) + 1 : 1;
    const now = new Date().toISOString();

    const toAdd: Anime[] = newAnimeList.map((item: Partial<Anime>) => ({
      id: nextId++,
      title: item.title || 'Untitled',
      anilistId: item.anilistId || '',
      anilistUrl: item.anilistUrl || '',
      letter: item.letter || item.title?.charAt(0).toUpperCase() || '#',
      isTopRecommendation: item.isTopRecommendation || false,
      score: item.score ?? null,
      type: item.type ?? null,
      genres: item.genres || [],
      episodes: item.episodes ?? null,
      status: item.status || 'Completed',
      coverImage: item.coverImage || null,
      description: item.description || '',
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      addedAt: now,
      updatedAt: now,
    }));

    const updated = [...existing, ...toAdd];
    await writeAnime(updated);
    return NextResponse.json({ added: toAdd.length, total: updated.length });
  } catch {
    return NextResponse.json({ error: 'Failed to bulk add' }, { status: 500 });
  }
}
