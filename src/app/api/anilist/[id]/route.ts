import { NextRequest, NextResponse } from 'next/server';
import { getAniListMedia } from '@/lib/anilist';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const media = await getAniListMedia(id);
    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from AniList' }, { status: 500 });
  }
}
