import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
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

export async function GET() {
  try {
    const anime = await readAnime();
    return NextResponse.json(anime);
  } catch {
    return NextResponse.json({ error: 'Failed to read anime data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const anime = await readAnime();
    const newId = anime.length > 0 ? Math.max(...anime.map(a => a.id)) + 1 : 1;
    const now = new Date().toISOString();

    const newAnime: Anime = {
      id: newId,
      title: body.title || 'Untitled',
      anilistId: body.anilistId || '',
      anilistUrl: body.anilistUrl || '',
      letter: body.letter || body.title?.charAt(0).toUpperCase() || '#',
      isTopRecommendation: body.isTopRecommendation || false,
      score: body.score ?? null,
      type: body.type ?? null,
      genres: body.genres || [],
      episodes: body.episodes ?? null,
      status: body.status || 'Completed',
      coverImage: body.coverImage || null,
      description: body.description || '',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      addedAt: now,
      updatedAt: now,
    };

    anime.push(newAnime);
    await writeAnime(anime);

    // Sync to GitHub in background
    const syncResult = await syncToGitHub(`feat: add "${newAnime.title}" to anime collection`);

    return NextResponse.json({ ...newAnime, githubSync: syncResult }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add anime' }, { status: 500 });
  }
}
