'use client';

import { useState } from 'react';
import type { AniListMedia } from '@/lib/anilist';

interface AniListSearchProps {
  onSelect?: (media: AniListMedia) => void;
}

export function AniListSearch({ onSelect }: AniListSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/anilist/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Search anime on AniList..."
          className="flex-1 px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios p-4">
          <p className="text-sm text-ios-red">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-ios-gray-1 dark:text-dark-secondary">{results.length} results found</p>
          {results.map(media => (
            <div
              key={media.id}
              className="flex gap-4 p-4 bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios hover:shadow-ios-md dark:hover:shadow-dark-ios transition-all cursor-pointer"
              onClick={() => onSelect?.(media)}
            >
              {media.coverImage?.large && (
                <img src={media.coverImage.large} alt="" className="w-16 h-24 object-cover rounded-ios flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-dark-label">{media.title.english || media.title.romaji}</h3>
                {media.title.english && media.title.romaji && (
                  <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary mt-0.5">{media.title.romaji}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {media.format && (
                    <span className="text-xs px-2 py-0.5 bg-ios-blue/10 text-ios-blue rounded-md">{media.format}</span>
                  )}
                  {media.episodes && (
                    <span className="text-xs text-ios-gray-1 dark:text-dark-secondary">{media.episodes} episodes</span>
                  )}
                  {media.averageScore && (
                    <span className="text-xs text-ios-yellow">★ {Math.round(media.averageScore / 10)}/10</span>
                  )}
                </div>
                {media.genres.length > 0 && (
                  <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary mt-1">{media.genres.join(', ')}</p>
                )}
                {media.description && (
                  <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-2 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: media.description.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]*>/g, '') }}
                  />
                )}
              </div>
              {onSelect && (
                <div className="flex items-center">
                  <span className="text-ios-blue text-sm font-medium">Add →</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
