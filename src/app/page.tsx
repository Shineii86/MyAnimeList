'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import type { Anime, AnimeStats } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<AnimeStats | null>(null);
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/anime').then(r => r.json()),
    ]).then(([statsData, animeData]) => {
      setStats(statsData);
      setAnimeList(animeData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={`Managing ${stats?.total || 0} anime`}
        actions={
          <Link
            href="/anime/add"
            className="px-4 py-2 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 transition-colors"
          >
            + Add Anime
          </Link>
        }
      />

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentActivity animeList={animeList} />

        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-card rounded-ios-lg p-5 shadow-ios dark:shadow-dark-ios">
            <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/anime/add" className="flex items-center gap-3 p-3 bg-ios-blue/5 hover:bg-ios-blue/10 rounded-ios transition-colors">
                <span className="text-lg">➕</span>
                <span className="text-sm font-medium text-ios-blue">Add Anime</span>
              </Link>
              <Link href="/bulk" className="flex items-center gap-3 p-3 bg-ios-green/5 hover:bg-ios-green/10 rounded-ios transition-colors">
                <span className="text-lg">📦</span>
                <span className="text-sm font-medium text-ios-green">Bulk Add</span>
              </Link>
              <Link href="/search" className="flex items-center gap-3 p-3 bg-ios-purple/5 hover:bg-ios-purple/10 rounded-ios transition-colors">
                <span className="text-lg">🔍</span>
                <span className="text-sm font-medium text-ios-purple">Search AniList</span>
              </Link>
              <Link href="/import" className="flex items-center gap-3 p-3 bg-ios-orange/5 hover:bg-ios-orange/10 rounded-ios transition-colors">
                <span className="text-lg">📥</span>
                <span className="text-sm font-medium text-ios-orange">Import/Export</span>
              </Link>
            </div>
          </div>

          {stats && stats.total > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-ios-lg p-5 shadow-ios dark:shadow-dark-ios">
              <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">Collection Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ios-gray-1 dark:text-dark-secondary">Completion Rate</span>
                  <span className="text-sm font-semibold text-ios-green">
                    {((stats.completed / stats.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-ios-gray-5 dark:bg-dark-separator rounded-full h-2">
                  <div
                    className="bg-ios-green rounded-full h-2 transition-all duration-500"
                    style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ios-gray-1 dark:text-dark-secondary">Watching</span>
                    <span className="font-medium text-ios-blue">{stats.watching}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ios-gray-1 dark:text-dark-secondary">Plan to Watch</span>
                    <span className="font-medium text-ios-yellow">{stats.planToWatch}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
