'use client';

import type { Anime } from '@/lib/utils';
import { AnimeCard } from './AnimeCard';

interface AnimeGridProps {
  animeList: Anime[];
  onDelete?: (id: number) => void;
}

export function AnimeGrid({ animeList, onDelete }: AnimeGridProps) {
  if (animeList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg className="w-16 h-16 text-ios-gray-3 dark:text-dark-separator mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p className="text-ios-gray-1 dark:text-dark-secondary text-sm">No anime found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {animeList.map(anime => (
        <AnimeCard key={anime.id} anime={anime} onDelete={onDelete} />
      ))}
    </div>
  );
}
