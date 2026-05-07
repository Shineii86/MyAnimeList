'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { AnimeForm } from '@/components/anime/AnimeForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import type { Anime } from '@/lib/utils';
import { formatDate, getTypeBadgeColor, getStatusColor, getScoreColor } from '@/lib/utils';

export default function AnimeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { addToast } = useToast();
  const sounds = useSoundEffects();

  useEffect(() => {
    fetch(`/api/anime/${id}`).then(r => r.json()).then(data => {
      setAnime(data);
      setLoading(false);
    });
  }, [id]);

  const handleUpdate = async (data: Partial<Anime>) => {
    try {
      const res = await fetch(`/api/anime/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setAnime(updated);
      setEditing(false);
      sounds.success();
      addToast('Anime updated!', 'success');
    } catch {
      sounds.error();
      addToast('Failed to update', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/anime/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      sounds.del();
      addToast('Anime deleted', 'success');
      router.push('/anime');
    } catch {
      sounds.error();
      addToast('Failed to delete', 'error');
    }
  };

  if (loading) return <PageLoading />;
  if (!anime) return <div className="text-center py-16 text-ios-gray-1 dark:text-dark-secondary">Anime not found</div>;

  return (
    <div>
      <Header
        title={anime.title}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 bg-ios-red text-white rounded-ios font-medium text-sm hover:bg-ios-red/90 transition-colors"
            >
              Delete
            </button>
          </div>
        }
      />

      {editing ? (
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
          <AnimeForm initialData={anime} onSubmit={handleUpdate} submitLabel="Update" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
              {anime.coverImage ? (
                <img src={anime.coverImage} alt={anime.title} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-ios-gray-6 dark:bg-dark-elevated flex items-center justify-center">
                  <svg className="w-16 h-16 text-ios-gray-3 dark:text-dark-separator" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
              )}
              <div className="p-4 space-y-3">
                {anime.anilistUrl && (
                  <a
                    href={anime.anilistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-ios-blue hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on AniList
                  </a>
                )}
                {anime.isTopRecommendation && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-ios-yellow/10 text-ios-yellow rounded-full text-xs font-semibold">
                    ⭐ Top Recommendation
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-label mb-4">{anime.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {anime.score && (
                  <div>
                    <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mb-1">Score</p>
                    <p className={`text-lg font-bold ${getScoreColor(anime.score)}`}>{anime.score}/10</p>
                  </div>
                )}
                {anime.type && (
                  <div>
                    <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mb-1">Type</p>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-md ${getTypeBadgeColor(anime.type)}`}>{anime.type}</span>
                  </div>
                )}
                {anime.episodes && (
                  <div>
                    <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mb-1">Episodes</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-dark-label">{anime.episodes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mb-1">Status</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-md ${getStatusColor(anime.status)}`}>{anime.status}</span>
                </div>
              </div>
            </div>

            {anime.genres.length > 0 && (
              <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-secondary mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map(genre => (
                    <span key={genre} className="px-3 py-1 bg-ios-blue/10 text-ios-blue rounded-full text-xs font-medium">{genre}</span>
                  ))}
                </div>
              </div>
            )}

            {anime.description && (
              <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-secondary mb-3">Description</h3>
                <p className="text-sm text-gray-600 dark:text-dark-secondary leading-relaxed">{anime.description}</p>
              </div>
            )}

            <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-secondary mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-ios-gray-1 dark:text-dark-secondary">AniList ID</p>
                  <p className="text-gray-900 dark:text-dark-label font-medium">{anime.anilistId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-ios-gray-1 dark:text-dark-secondary">Letter</p>
                  <p className="text-gray-900 dark:text-dark-label font-medium">{anime.letter}</p>
                </div>
                <div>
                  <p className="text-ios-gray-1 dark:text-dark-secondary">Added</p>
                  <p className="text-gray-900 dark:text-dark-label font-medium">{formatDate(anime.addedAt)}</p>
                </div>
                <div>
                  <p className="text-ios-gray-1 dark:text-dark-secondary">Updated</p>
                  <p className="text-gray-900 dark:text-dark-label font-medium">{formatDate(anime.updatedAt)}</p>
                </div>
                {anime.startDate && (
                  <div>
                    <p className="text-ios-gray-1 dark:text-dark-secondary">Start Date</p>
                    <p className="text-gray-900 dark:text-dark-label font-medium">{anime.startDate}</p>
                  </div>
                )}
                {anime.endDate && (
                  <div>
                    <p className="text-ios-gray-1 dark:text-dark-secondary">End Date</p>
                    <p className="text-gray-900 dark:text-dark-label font-medium">{anime.endDate}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Anime"
        message={`Are you sure you want to delete "${anime.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
