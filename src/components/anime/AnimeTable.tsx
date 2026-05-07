'use client';

import Link from 'next/link';
import type { Anime } from '@/lib/utils';
import { getScoreColor, getTypeBadgeColor, getStatusColor, formatDate } from '@/lib/utils';

interface AnimeTableProps {
  animeList: Anime[];
  onDelete?: (id: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export function AnimeTable({ animeList, onDelete, sortBy, sortOrder, onSort }: AnimeTableProps) {
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-ios-gray-3">↕</span>;
    return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ios-gray-5 dark:border-dark-separator">
            {onSort && (
              <>
                <th onClick={() => onSort('title')} className="text-left py-3 px-4 text-xs font-semibold text-ios-gray-1 dark:text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-gray-700">
                  Title <SortIcon field="title" />
                </th>
                <th onClick={() => onSort('score')} className="text-left py-3 px-4 text-xs font-semibold text-ios-gray-1 dark:text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-gray-700 hidden sm:table-cell">
                  Score <SortIcon field="score" />
                </th>
                <th onClick={() => onSort('type')} className="text-left py-3 px-4 text-xs font-semibold text-ios-gray-1 dark:text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-gray-700 hidden md:table-cell">
                  Type
                </th>
                <th onClick={() => onSort('episodes')} className="text-left py-3 px-4 text-xs font-semibold text-ios-gray-1 dark:text-dark-secondary uppercase tracking-wider cursor-pointer hover:text-gray-700 hidden lg:table-cell">
                  Episodes <SortIcon field="episodes" />
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-ios-gray-1 dark:text-dark-secondary uppercase tracking-wider hidden xl:table-cell">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-ios-gray-1 dark:text-dark-secondary uppercase tracking-wider hidden xl:table-cell">
                  Added
                </th>
                <th className="w-10"></th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {animeList.map((anime, index) => (
            <tr
              key={anime.id}
              className={`border-b border-ios-gray-6 dark:border-dark-separator hover:bg-ios-gray-6/50 dark:hover:bg-dark-elevated/50 transition-colors ${
                index % 2 === 0 ? '' : 'bg-ios-gray-6/30 dark:bg-dark-elevated/30'
              }`}
            >
              <td className="py-3 px-4">
                <Link href={`/anime/${anime.id}`} className="flex items-center gap-3">
                  {anime.coverImage ? (
                    <img src={anime.coverImage} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-10 h-14 bg-ios-gray-6 dark:bg-dark-elevated rounded-lg flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-dark-label line-clamp-1">{anime.title}</p>
                    {anime.genres.length > 0 && (
                      <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary mt-0.5">{anime.genres.slice(0, 2).join(', ')}</p>
                    )}
                  </div>
                </Link>
              </td>
              <td className="py-3 px-4 hidden sm:table-cell">
                <span className={`text-sm font-semibold ${getScoreColor(anime.score)}`}>
                  {anime.score ?? '—'}
                </span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                {anime.type && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${getTypeBadgeColor(anime.type)}`}>
                    {anime.type}
                  </span>
                )}
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-gray-600 dark:text-dark-secondary">{anime.episodes ?? '—'}</span>
              </td>
              <td className="py-3 px-4 hidden xl:table-cell">
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(anime.status)}`}>
                  {anime.status}
                </span>
              </td>
              <td className="py-3 px-4 hidden xl:table-cell">
                <span className="text-xs text-ios-gray-2 dark:text-dark-tertiary">{formatDate(anime.addedAt)}</span>
              </td>
              <td className="py-3 px-4">
                {onDelete && (
                  <button
                    onClick={() => onDelete(anime.id)}
                    className="text-ios-red hover:bg-ios-red/10 p-1.5 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
