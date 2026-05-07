import { NextRequest, NextResponse } from 'next/server';
import { searchAniList } from '@/lib/anilist';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const results = await searchAniList(query);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: 'AniList search failed' }, { status: 500 });
  }
}
