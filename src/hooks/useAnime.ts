'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Anime, AnimeStats } from '@/lib/utils';

export function useAnime() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [stats, setStats] = useState<AnimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnime = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/anime');
      if (!res.ok) throw new Error('Failed to fetch anime');
      const data = await res.json();
      setAnimeList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const addAnime = useCallback(async (anime: Partial<Anime>) => {
    const res = await fetch('/api/anime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anime),
    });
    if (!res.ok) throw new Error('Failed to add anime');
    const data = await res.json();
    await fetchAnime();
    await fetchStats();
    return data;
  }, [fetchAnime, fetchStats]);

  const updateAnime = useCallback(async (id: number, updates: Partial<Anime>) => {
    const res = await fetch(`/api/anime/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update anime');
    const data = await res.json();
    await fetchAnime();
    await fetchStats();
    return data;
  }, [fetchAnime, fetchStats]);

  const deleteAnime = useCallback(async (id: number) => {
    const res = await fetch(`/api/anime/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete anime');
    await fetchAnime();
    await fetchStats();
  }, [fetchAnime, fetchStats]);

  const bulkAdd = useCallback(async (anime: Partial<Anime>[]) => {
    const res = await fetch('/api/anime/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anime }),
    });
    if (!res.ok) throw new Error('Failed to bulk add');
    const data = await res.json();
    await fetchAnime();
    await fetchStats();
    return data;
  }, [fetchAnime, fetchStats]);

  useEffect(() => {
    fetchAnime();
    fetchStats();
  }, [fetchAnime, fetchStats]);

  return { animeList, stats, loading, error, fetchAnime, fetchStats, addAnime, updateAnime, deleteAnime, bulkAdd };
}
