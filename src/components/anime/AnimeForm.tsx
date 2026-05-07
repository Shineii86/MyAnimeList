'use client';

import { useState } from 'react';
import type { Anime } from '@/lib/utils';

interface AnimeFormProps {
  initialData?: Partial<Anime>;
  onSubmit: (data: Partial<Anime>) => Promise<void>;
  submitLabel?: string;
}

export function AnimeForm({ initialData, onSubmit, submitLabel = 'Save' }: AnimeFormProps) {
  const [form, setForm] = useState<Partial<Anime>>({
    title: '',
    anilistUrl: '',
    score: null,
    type: null,
    genres: [],
    episodes: null,
    status: 'Completed',
    coverImage: '',
    description: '',
    ...initialData,
  });
  const [genreInput, setGenreInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  const addGenre = () => {
    if (genreInput.trim() && !form.genres?.includes(genreInput.trim())) {
      setForm(prev => ({ ...prev, genres: [...(prev.genres || []), genreInput.trim()] }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setForm(prev => ({ ...prev, genres: prev.genres?.filter(g => g !== genre) || [] }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title || ''}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">AniList URL</label>
          <input
            type="url"
            value={form.anilistUrl || ''}
            onChange={e => setForm(prev => ({ ...prev, anilistUrl: e.target.value }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
            placeholder="https://anilist.co/anime/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Score (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={form.score ?? ''}
            onChange={e => setForm(prev => ({ ...prev, score: e.target.value ? Number(e.target.value) : null }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Type</label>
          <select
            value={form.type || ''}
            onChange={e => setForm(prev => ({ ...prev, type: (e.target.value || null) as Anime['type'] }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          >
            <option value="">Select type</option>
            <option value="TV">TV</option>
            <option value="Movie">Movie</option>
            <option value="OVA">OVA</option>
            <option value="Special">Special</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Episodes</label>
          <input
            type="number"
            min="0"
            value={form.episodes ?? ''}
            onChange={e => setForm(prev => ({ ...prev, episodes: e.target.value ? Number(e.target.value) : null }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Status</label>
          <select
            value={form.status || 'Completed'}
            onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Anime['status'] }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          >
            <option value="Completed">Completed</option>
            <option value="Watching">Watching</option>
            <option value="Plan to Watch">Plan to Watch</option>
            <option value="Dropped">Dropped</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Cover Image URL</label>
          <input
            type="url"
            value={form.coverImage || ''}
            onChange={e => setForm(prev => ({ ...prev, coverImage: e.target.value }))}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
            placeholder="https://..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Genres</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={genreInput}
              onChange={e => setGenreInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGenre(); } }}
              className="flex-1 px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
              placeholder="Add genre and press Enter"
            />
            <button
              type="button"
              onClick={addGenre}
              className="px-4 py-2.5 bg-ios-blue/10 text-ios-blue rounded-ios font-medium text-sm hover:bg-ios-blue/20 transition-colors"
            >
              Add
            </button>
          </div>
          {form.genres && form.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.genres.map(genre => (
                <span key={genre} className="inline-flex items-center gap-1 px-3 py-1 bg-ios-blue/10 text-ios-blue rounded-full text-xs font-medium">
                  {genre}
                  <button type="button" onClick={() => removeGenre(genre)} className="hover:text-ios-red">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Description</label>
          <textarea
            value={form.description || ''}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !form.title?.trim()}
          className="px-6 py-2.5 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
