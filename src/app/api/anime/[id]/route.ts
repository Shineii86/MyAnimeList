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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const anime = await readAnime();
    const found = anime.find(a => a.id === id);
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(found);
  } catch {
    return NextResponse.json({ error: 'Failed to read anime' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const anime = await readAnime();
    const index = anime.findIndex(a => a.id === id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    anime[index] = {
      ...anime[index],
      ...body,
      id: anime[index].id,
      addedAt: anime[index].addedAt,
      updatedAt: new Date().toISOString(),
    };

    await writeAnime(anime);
    return NextResponse.json(anime[index]);
  } catch {
    return NextResponse.json({ error: 'Failed to update anime' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const anime = await readAnime();
    const filtered = anime.filter(a => a.id !== id);
    if (filtered.length === anime.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await writeAnime(filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete anime' }, { status: 500 });
  }
}
