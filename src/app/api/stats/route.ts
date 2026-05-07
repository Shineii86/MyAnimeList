import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Anime, AnimeStats } from '@/lib/utils';

const DATA_FILE = join(process.cwd(), 'data', 'anime.json');

export async function GET() {
  try {
    const data = await readFile(DATA_FILE, 'utf-8');
    const anime: Anime[] = JSON.parse(data);

    const scores = anime.filter(a => a.score !== null).map(a => a.score as number);
    const episodes = anime.filter(a => a.episodes !== null).map(a => a.episodes as number);

    const stats: AnimeStats = {
      total: anime.length,
      tv: anime.filter(a => a.type === 'TV').length,
      movies: anime.filter(a => a.type === 'Movie').length,
      ovas: anime.filter(a => a.type === 'OVA').length,
      specials: anime.filter(a => a.type === 'Special').length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      totalEpisodes: episodes.reduce((a, b) => a + b, 0),
      completed: anime.filter(a => a.status === 'Completed').length,
      watching: anime.filter(a => a.status === 'Watching').length,
      planToWatch: anime.filter(a => a.status === 'Plan to Watch').length,
      dropped: anime.filter(a => a.status === 'Dropped').length,
      topRecommendations: anime.filter(a => a.isTopRecommendation).length,
      recentlyAdded: anime
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 10),
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
