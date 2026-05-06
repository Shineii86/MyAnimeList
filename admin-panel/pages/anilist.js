import { useState } from 'react';
import Head from 'next/head';
import { SearchIcon, PlusIcon, StarIcon } from '../lib/icons';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export default function AniListSearch({ showToast }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/anilist/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        if (data.results?.length === 0) showToast?.('No results found', 'info');
      } else {
        showToast?.('Search failed', 'error');
      }
    } catch {
      showToast?.('Search error', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function quickAdd(anime) {
    setImporting(anime.anilistId);
    try {
      const body = {
        title: anime.titleEnglish || anime.titleRomaji,
        anilistUrl: anime.anilistUrl,
        anilistId: anime.anilistId,
        type: anime.type || 'TV',
        score: anime.score ? parseFloat(anime.score) : 0,
        genres: anime.genres || [],
        episodes: anime.episodes || 0
      };

      const res = await apiPost('/api/anime', body);

      if (res.ok) {
        showToast?.(`Added: ${body.title}`, 'success');
      } else {
        const data = await res.json();
        showToast?.(data.error || 'Failed to add', 'error');
      }
    } catch {
      showToast?.('Error adding anime', 'error');
    } finally {
      setImporting(null);
    }
  }

  return (
    <>
      <Head>
        <title>AniList Search - MyAnimeList Admin</title>
      </Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>AniList Search</h1>
        <p style={{ color: 'var(--text-muted)' }}>Search and import anime directly from AniList</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <div className="search-container" style={{ flex: 1, marginBottom: 0 }}>
          <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            placeholder="Search anime on AniList (e.g., Attack on Titan, Steins;Gate)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <div className="spinner" /> : <><SearchIcon size={16} /> Search</>}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{results.length} results found</p>
          <div style={{ display: 'grid', gap: 16 }}>
            {results.map((anime, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: 20, padding: 20 }}>
                {anime.coverImage && (
                  <img 
                    src={anime.coverImage} 
                    alt={anime.title}
                    style={{ width: 100, height: 140, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                    {anime.titleEnglish || anime.titleRomaji}
                  </h3>
                  {anime.titleRomaji !== anime.titleEnglish && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{anime.titleRomaji}</p>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${anime.type?.toLowerCase()}`}>{anime.type}</span>
                    {anime.score && <span className="badge badge-high"><StarIcon size={14} style={{ color: '#fbbf24' }} /> {anime.score}</span>}
                    {anime.episodes && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{anime.episodes} episodes</span>}
                    {anime.year && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{anime.year}</span>}
                    {anime.status && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{anime.status}</span>}
                  </div>
                  <div className="genre-tags" style={{ marginBottom: 12 }}>
                    {(anime.genres || []).map(g => <span key={g} className="genre-tag">{g}</span>)}
                  </div>
                  {anime.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                      {anime.description.substring(0, 200)}...
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => quickAdd(anime)}
                      disabled={importing === anime.anilistId}
                    >
                      {importing === anime.anilistId ? <div className="spinner" /> : <><PlusIcon size={16} /> Quick Add</>}
                    </button>
                    <a 
                      href={anime.anilistUrl} 
                      target="_blank" 
                      rel="noopener"
                      className="btn btn-outline btn-sm"
                    >
                      View on AniList ↗
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3>Search AniList</h3>
          <p>Enter an anime title to search the AniList database and import directly into your collection.</p>
        </div>
      )}
    </>
  );
}
