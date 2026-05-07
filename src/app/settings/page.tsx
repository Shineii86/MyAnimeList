'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { soundEnabled, setSoundEnabled } = useTheme();
  const { addToast } = useToast();
  const [githubStatus, setGithubStatus] = useState<{ configured: boolean; owner?: string; repo?: string; branch?: string } | null>(null);
  const [animeCount, setAnimeCount] = useState(0);

  useEffect(() => {
    fetch('/api/github/status').then(r => r.json()).then(setGithubStatus).catch(() => {});
    fetch('/api/anime').then(r => r.json()).then(data => setAnimeCount(data.length)).catch(() => {});
  }, []);

  const handleExportJSON = async () => {
    try {
      const res = await fetch('/api/anime');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anime-collection-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Exported as JSON', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/anime');
      const data = await res.json();
      const headers = ['ID', 'Title', 'AniList ID', 'Score', 'Type', 'Episodes', 'Status', 'Genres'];
      const rows = data.map((a: Record<string, unknown>) => [
        a.id,
        `"${String(a.title).replace(/"/g, '""')}"`,
        a.anilistId,
        a.score ?? '',
        a.type ?? '',
        a.episodes ?? '',
        a.status,
        `"${Array.isArray(a.genres) ? a.genres.join(', ') : ''}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((r: unknown[]) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anime-collection-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Exported as CSV', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your preferences" />

      <div className="space-y-4">
        {/* Theme */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-5">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-dark-secondary">Theme</p>
              <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary">Choose light, dark, or system</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Sound */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-5">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">Sound Effects</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-dark-secondary">UI Sounds</p>
              <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary">Click, success, and error sounds</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`toggle-switch ${soundEnabled ? 'active' : ''}`}
              role="switch"
              aria-checked={soundEnabled}
            />
          </div>
        </div>

        {/* GitHub Sync */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-5">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">GitHub Sync</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${githubStatus?.configured ? 'bg-ios-green' : 'bg-ios-gray-3'}`} />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-dark-secondary">
                  {githubStatus?.configured ? 'Connected' : 'Not configured'}
                </p>
                {githubStatus?.configured && (
                  <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary">
                    {githubStatus.owner}/{githubStatus.repo} ({githubStatus.branch})
                  </p>
                )}
              </div>
            </div>
            {!githubStatus?.configured && (
              <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">
                Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in your .env file to enable automatic sync.
              </p>
            )}
          </div>
        </div>

        {/* Data */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-5">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">Data Management</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-dark-secondary">Total Anime</p>
                <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary">{animeCount} entries in collection</p>
              </div>
              <span className="text-lg font-bold text-ios-blue">{animeCount}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2.5 bg-ios-blue/10 text-ios-blue rounded-ios font-medium text-sm hover:bg-ios-blue/20 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="flex-1 py-2.5 bg-ios-green/10 text-ios-green rounded-ios font-medium text-sm hover:bg-ios-green/20 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-5">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-4">Account</h3>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-ios-red/10 text-ios-red rounded-ios font-medium text-sm hover:bg-ios-red/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
