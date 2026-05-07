'use client';

import Link from 'next/link';
import type { Anime } from '@/lib/utils';
import { getScoreColor, getTypeBadgeColor } from '@/lib/utils';

interface AnimeCardProps {
  anime: Anime;
  onDelete?: (id: number) => void;
}

export function AnimeCard({ anime, onDelete }: AnimeCardProps) {
  return (
    <div className="group bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden hover:shadow-ios-md dark:hover:shadow-dark-ios transition-all duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-[3/4] bg-ios-gray-6 dark:bg-dark-elevated overflow-hidden">
        {anime.coverImage ? (
          <img
            src={anime.coverImage}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-ios-gray-3 dark:text-dark-separator" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}
        {anime.score && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
            <span className={`text-sm font-bold ${getScoreColor(anime.score)}`}>{anime.score}</span>
          </div>
        )}
        {anime.type && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getTypeBadgeColor(anime.type)}`}>
              {anime.type}
            </span>
          </div>
        )}
        {anime.isTopRecommendation && (
          <div className="absolute bottom-2 left-2">
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-ios-yellow/90 text-white">⭐ Top</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <Link href={`/anime/${anime.id}`}>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-dark-label line-clamp-2 hover:text-ios-blue transition-colors">
            {anime.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          {anime.episodes && (
            <span className="text-xs text-ios-gray-1 dark:text-dark-secondary">{anime.episodes} eps</span>
          )}
          {anime.genres.length > 0 && (
            <span className="text-xs text-ios-gray-2 dark:text-dark-tertiary truncate">{anime.genres[0]}</span>
          )}
        </div>
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(anime.id); }}
            className="mt-2 text-xs text-ios-red opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
