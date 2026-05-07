'use client';

import { useState } from 'react';
import type { Anime } from '@/lib/utils';

interface BulkAddFormProps {
  onSubmit: (anime: Partial<Anime>[]) => Promise<{ added: number }>;
}

export function BulkAddForm({ onSubmit }: BulkAddFormProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Partial<Anime>[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ added: number } | null>(null);

  const parseInput = () => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const parsed: Partial<Anime>[] = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        return {
          title: parts[0],
          anilistUrl: parts[1]?.startsWith('http') ? parts[1] : '',
          type: (parts[2] as Anime['type']) || null,
          score: parts[3] ? Number(parts[3]) : null,
        };
      }
      return { title: parts[0] };
    });
    setPreview(parsed);
  };

  const handleSubmit = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    try {
      const res = await onSubmit(preview);
      setResult(res);
      setText('');
      setPreview([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">
          Enter anime (one per line, CSV format: Title, AniList URL, Type, Score)
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all resize-none"
          placeholder={`Attack on Titan, https://anilist.co/anime/16498, TV, 10\nFullmetal Alchemist: Brotherhood, https://anilist.co/anime/5114, TV, 10\nSteins;Gate, https://anilist.co/anime/9253, TV, 9`}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={parseInput}
          disabled={!text.trim()}
          className="px-4 py-2.5 bg-ios-gray-6 dark:bg-dark-elevated text-gray-700 dark:text-dark-label rounded-ios font-medium text-sm hover:bg-ios-gray-4 dark:hover:bg-dark-separator disabled:opacity-50 transition-colors"
        >
          Preview ({text.trim() ? text.trim().split('\n').filter(l => l.trim()).length : 0} items)
        </button>
        {preview.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2.5 bg-ios-blue text-white rounded-ios font-medium text-sm hover:bg-ios-blue/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding...' : `Add ${preview.length} Anime`}
          </button>
        )}
      </div>

      {preview.length > 0 && (
        <div className="bg-ios-gray-6/50 dark:bg-dark-elevated/50 rounded-ios p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-label mb-3">Preview</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {preview.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-ios-blue/10 text-ios-blue rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="text-gray-900 dark:text-dark-label font-medium">{item.title}</span>
                {item.type && <span className="text-xs text-ios-gray-1 dark:text-dark-secondary">({item.type})</span>}
                {item.score && <span className="text-xs text-ios-blue">★ {item.score}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="bg-ios-green/10 border border-ios-green/20 rounded-ios p-4">
          <p className="text-sm text-ios-green font-medium">Successfully added {result.added} anime!</p>
        </div>
      )}
    </div>
  );
}
