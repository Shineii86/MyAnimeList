'use client';

import type { AnimeStats } from '@/lib/utils';

interface StatsCardsProps {
  stats: AnimeStats | null;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-dark-card rounded-ios-lg p-5 shadow-ios dark:shadow-dark-ios animate-pulse">
            <div className="h-4 bg-ios-gray-5 dark:bg-dark-separator rounded w-20 mb-3" />
            <div className="h-8 bg-ios-gray-5 dark:bg-dark-separator rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Anime', value: stats.total, color: 'bg-ios-blue/10 text-ios-blue', icon: '🎬' },
    { label: 'TV Shows', value: stats.tv, color: 'bg-ios-green/10 text-ios-green', icon: '📺' },
    { label: 'Movies', value: stats.movies, color: 'bg-ios-purple/10 text-ios-purple', icon: '🎭' },
    { label: 'OVAs', value: stats.ovas, color: 'bg-ios-orange/10 text-ios-orange', icon: '📀' },
    { label: 'Avg Score', value: stats.averageScore.toFixed(1), color: 'bg-ios-yellow/10 text-ios-yellow', icon: '⭐' },
    { label: 'Episodes', value: stats.totalEpisodes.toLocaleString(), color: 'bg-ios-teal/10 text-ios-teal', icon: '📊' },
    { label: 'Completed', value: stats.completed, color: 'bg-ios-green/10 text-ios-green', icon: '✅' },
    { label: 'Top Picks', value: stats.topRecommendations, color: 'bg-ios-pink/10 text-ios-pink', icon: '💖' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="bg-white dark:bg-dark-card rounded-ios-lg p-5 shadow-ios dark:shadow-dark-ios hover:shadow-ios-md dark:hover:shadow-dark-ios transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{card.icon}</span>
            <span className="text-xs font-medium text-ios-gray-1 dark:text-dark-secondary">{card.label}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
