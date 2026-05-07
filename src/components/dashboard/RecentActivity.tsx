'use client';

import Link from 'next/link';
import type { Anime } from '@/lib/utils';
import { formatDate, getTypeBadgeColor } from '@/lib/utils';

interface RecentActivityProps {
  animeList: Anime[];
}

export function RecentActivity({ animeList }: RecentActivityProps) {
  const recent = [...animeList]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 10);

  if (recent.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-ios-lg p-6 shadow-ios dark:shadow-dark-ios">
        <p className="text-sm text-ios-gray-1 dark:text-dark-secondary text-center">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
      <div className="px-5 py-4 border-b border-ios-gray-5 dark:border-dark-separator">
        <h3 className="font-semibold text-gray-900 dark:text-dark-label">Recently Added</h3>
      </div>
      <div className="divide-y divide-ios-gray-6 dark:divide-dark-separator">
        {recent.map(anime => (
          <Link
            key={anime.id}
            href={`/anime/${anime.id}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-ios-gray-6/50 dark:hover:bg-dark-elevated/50 transition-colors"
          >
            {anime.coverImage ? (
              <img src={anime.coverImage} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-10 h-14 bg-ios-gray-6 dark:bg-dark-elevated rounded-lg flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-dark-label truncate">{anime.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {anime.type && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeBadgeColor(anime.type)}`}>{anime.type}</span>
                )}
                <span className="text-xs text-ios-gray-2 dark:text-dark-tertiary">{formatDate(anime.addedAt)}</span>
              </div>
            </div>
            {anime.score && (
              <span className="text-sm font-bold text-ios-blue">★ {anime.score}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
