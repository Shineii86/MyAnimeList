'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/ui/SearchBar';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { AnimeTable } from '@/components/anime/AnimeTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import type { Anime } from '@/lib/utils';
import { searchAnime, filterByLetter, sortAnime } from '@/lib/utils';

export default function AnimeListPage() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [letterFilter, setLetterFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { addToast } = useToast();
  const sounds = useSoundEffects();

  const PER_PAGE = 50;

  useEffect(() => {
    fetch('/api/anime').then(r => r.json()).then(data => {
      setAnimeList(data);
      setLoading(false);
    });
  }, []);

  const letters = useMemo(() => {
    const set = new Set(animeList.map(a => a.letter));
    return ['ALL', ...Array.from(set).sort()];
  }, [animeList]);

  const filtered = useMemo(() => {
    let result = animeList;
    result = filterByLetter(result, letterFilter);
    result = searchAnime(result, search);
    result = sortAnime(result, sortBy, sortOrder);
    return result;
  }, [animeList, letterFilter, search, sortBy, sortOrder]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/anime/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setAnimeList(prev => prev.filter(a => a.id !== deleteTarget));
      sounds.del();
      addToast('Anime deleted', 'success');
    } catch {
      sounds.error();
      addToast('Failed to delete', 'error');
    }
    setDeleteTarget(null);
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header
        title="Anime List"
        subtitle={`${filtered.length} anime`}
        actions={
          <div className="flex items-center gap-2">
            <div className="segmented-control">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === 'grid' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-dark-label' : 'text-gray-500 dark:text-dark-secondary'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  view === 'list' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-dark-label' : 'text-gray-500 dark:text-dark-secondary'
                }`}
              >
                List
              </button>
            </div>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search anime..." className="flex-1" />
        <select
          value={letterFilter}
          onChange={e => { setLetterFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white dark:bg-dark-card rounded-ios text-sm text-gray-900 dark:text-dark-label border border-ios-gray-5 dark:border-dark-separator focus:outline-none focus:ring-2 focus:ring-ios-blue/30"
        >
          {letters.map(l => (
            <option key={l} value={l}>{l === 'ALL' ? 'All Letters' : l}</option>
          ))}
        </select>
      </div>

      {view === 'grid' ? (
        <AnimeGrid animeList={paginated} onDelete={id => setDeleteTarget(id)} />
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
          <AnimeTable
            animeList={paginated}
            onDelete={id => setDeleteTarget(id)}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-ios bg-white dark:bg-dark-card text-sm font-medium text-gray-700 dark:text-dark-label disabled:opacity-50 shadow-ios dark:shadow-dark-ios hover:bg-ios-gray-6 dark:hover:bg-dark-elevated transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-ios-gray-1 dark:text-dark-secondary px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-ios bg-white dark:bg-dark-card text-sm font-medium text-gray-700 dark:text-dark-label disabled:opacity-50 shadow-ios dark:shadow-dark-ios hover:bg-ios-gray-6 dark:hover:bg-dark-elevated transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Anime"
        message="Are you sure you want to delete this anime? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
