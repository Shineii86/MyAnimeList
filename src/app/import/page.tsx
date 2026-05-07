'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import type { Anime } from '@/lib/utils';

export default function ImportExportPage() {
  const { addToast } = useToast();
  const sounds = useSoundEffects();
  const [username, setUsername] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; total: number; skipped: number; githubSync?: { synced: boolean } } | null>(null);
  const [githubStatus, setGithubStatus] = useState<{ configured: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/github/status').then(r => r.json()).then(setGithubStatus).catch(() => {});
  }, []);

  const handleImport = async () => {
    if (!username.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();
      setImportResult(data);
      sounds.success();
      addToast(`Imported ${data.added} anime from ${username}!`, 'success');
    } catch {
      sounds.error();
      addToast('Import failed — check the username', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const res = await fetch('/api/anime');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anime-${new Date().toISOString().slice(0, 10)}.json`;
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
      const data: Anime[] = await res.json();
      const headers = ['ID', 'Title', 'AniList ID', 'Score', 'Type', 'Episodes', 'Status', 'Genres'];
      const rows = data.map(a => [
        a.id,
        `"${a.title.replace(/"/g, '""')}"`,
        a.anilistId,
        a.score ?? '',
        a.type ?? '',
        a.episodes ?? '',
        a.status,
        `"${a.genres.join(', ')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anime-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Exported as CSV', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  };

  return (
    <div>
      <Header title="Import / Export" subtitle="Import from AniList or export your collection" />

      <div className="space-y-6">
        {/* GitHub Status Banner */}
        {githubStatus && (
          <div className={`rounded-ios-lg p-4 flex items-center gap-3 ${githubStatus.configured ? 'bg-ios-green/10 border border-ios-green/20' : 'bg-ios-yellow/10 border border-ios-yellow/20'}`}>
            <span className={`w-3 h-3 rounded-full ${githubStatus.configured ? 'bg-ios-green' : 'bg-ios-yellow'}`} />
            <p className="text-sm text-gray-700 dark:text-dark-secondary">
              {githubStatus.configured
                ? 'GitHub sync is enabled — all changes will be pushed to your repo automatically.'
                : 'GitHub sync is not configured. Set GITHUB_TOKEN in .env to enable auto-push.'}
            </p>
          </div>
        )}

        {/* Import from AniList */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-2">Import from AniList</h3>
          <p className="text-sm text-ios-gray-1 dark:text-dark-secondary mb-4">
            Import your completed anime list from an AniList account. New entries will be added and synced to GitHub.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleImport(); }}
              placeholder="AniList username"
              className="flex-1 px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
            />
            <button
              onClick={handleImport}
              disabled={importing || !username.trim()}
              className="px-5 py-2.5 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>

          {importResult && (
            <div className="mt-4 bg-ios-green/10 border border-ios-green/20 rounded-ios p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-ios-green">{importResult.added}</p>
                  <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">Added</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-ios-blue">{importResult.total}</p>
                  <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-ios-yellow">{importResult.skipped}</p>
                  <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">Skipped</p>
                </div>
              </div>
              {importResult.githubSync && (
                <p className="text-xs text-center mt-3 text-ios-gray-1 dark:text-dark-secondary">
                  {importResult.githubSync.synced ? '✅ Synced to GitHub' : '⚠️ GitHub sync skipped (not configured)'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
          <h3 className="font-semibold text-gray-900 dark:text-dark-label mb-2">Export Collection</h3>
          <p className="text-sm text-ios-gray-1 dark:text-dark-secondary mb-4">
            Download your anime collection as JSON or CSV.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-3 bg-ios-blue/10 text-ios-blue rounded-ios font-medium text-sm hover:bg-ios-blue/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 py-3 bg-ios-green/10 text-ios-green rounded-ios font-medium text-sm hover:bg-ios-green/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
