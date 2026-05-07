'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import { exportToCSV } from '@/lib/utils';
import type { Anime } from '@/lib/utils';

export default function ImportExportPage() {
  const [username, setUsername] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; total: number; skipped: number } | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const { addToast } = useToast();
  const sounds = useSoundEffects();

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
      addToast('Failed to import. Check the username and try again.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/anime');
      if (!res.ok) throw new Error('Failed to fetch');
      const animeList: Anime[] = await res.json();

      let content: string;
      let mimeType: string;
      let extension: string;

      if (exportFormat === 'json') {
        content = JSON.stringify(animeList, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        content = exportToCSV(animeList);
        mimeType = 'text/csv';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anime-collection.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      sounds.success();
      addToast(`Exported ${animeList.length} anime as ${extension.toUpperCase()}!`, 'success');
    } catch {
      sounds.error();
      addToast('Failed to export', 'error');
    }
  };

  return (
    <div>
      <Header title="Import / Export" subtitle="Manage your anime collection data" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import from AniList */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-ios-blue/10 rounded-ios flex items-center justify-center">
              <svg className="w-5 h-5 text-ios-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-label">Import from AniList</h3>
              <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">Import your completed anime list</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">AniList Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleImport(); }}
                placeholder="e.g., ikx7a"
                className="w-full px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={importing || !username.trim()}
              className="w-full px-4 py-2.5 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </span>
              ) : 'Import Completed Anime'}
            </button>

            {importResult && (
              <div className="bg-ios-green/10 border border-ios-green/20 rounded-ios p-4 space-y-1">
                <p className="text-sm text-ios-green font-medium">Import complete!</p>
                <p className="text-xs text-ios-green/80">Added: {importResult.added} | Skipped (duplicates): {importResult.skipped} | Total now: {importResult.total}</p>
              </div>
            )}

            <div className="bg-ios-blue/5 rounded-ios p-3">
              <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">
                This will import all <strong>completed</strong> anime from your AniList account. 
                Duplicates (same AniList ID) will be skipped automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-ios-green/10 rounded-ios flex items-center justify-center">
              <svg className="w-5 h-5 text-ios-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-label">Export Collection</h3>
              <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">Download your anime data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Format</label>
              <div className="segmented-control w-full">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    exportFormat === 'json'
                      ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-dark-label'
                      : 'text-gray-500 dark:text-dark-secondary'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    exportFormat === 'csv'
                      ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-dark-label'
                      : 'text-gray-500 dark:text-dark-secondary'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full px-4 py-2.5 bg-ios-green text-white rounded-ios font-medium text-sm hover:bg-ios-green/90 transition-colors"
            >
              Download {exportFormat.toUpperCase()} File
            </button>

            <div className="bg-ios-green/5 rounded-ios p-3">
              <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">
                Export includes: title, AniList URL, score, type, genres, episodes, status, cover image, and all metadata.
              </p>
            </div>
          </div>
        </div>

        {/* JSON Paste Import */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-ios-purple/10 rounded-ios flex items-center justify-center">
              <svg className="w-5 h-5 text-ios-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-label">Paste JSON Data</h3>
              <p className="text-xs text-ios-gray-1 dark:text-dark-secondary">Import anime from pasted JSON array</p>
            </div>
          </div>
          <JsonPasteImport onSuccess={() => {
            sounds.success();
            addToast('JSON import complete!', 'success');
          }} onError={() => {
            sounds.error();
            addToast('Failed to import JSON', 'error');
          }} />
        </div>
      </div>
    </div>
  );
}

function JsonPasteImport({ onSuccess, onError }: { onSuccess: () => void; onError: () => void }) {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      setLoading(true);
      const res = await fetch('/api/anime/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anime: items }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setJsonText('');
      onSuccess();
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={jsonText}
        onChange={e => setJsonText(e.target.value)}
        rows={6}
        className="w-full px-4 py-3 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all resize-none"
        placeholder={`[\n  { "title": "Anime Title", "anilistUrl": "https://anilist.co/anime/123", "score": 8, "type": "TV" },\n  ...\n]`}
      />
      <button
        onClick={handleImport}
        disabled={loading || !jsonText.trim()}
        className="px-4 py-2.5 bg-ios-purple text-white rounded-ios font-medium text-sm hover:bg-ios-purple/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Importing...' : 'Import JSON'}
      </button>
    </div>
  );
}
