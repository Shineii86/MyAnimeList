import { useState } from 'react';
import Head from 'next/head';
import { BoxIcon, LinkIcon, SearchIcon, ClipboardIcon, RocketIcon, StarIcon } from '../lib/icons';

export default function BulkImport({ showToast }) {
  const [mode, setMode] = useState('url'); // 'url' or 'search'
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Parse URLs from pasted text
  function parseUrls(text) {
    const urlRegex = /https?:\/\/anilist\.co\/anime\/(\d+)/g;
    const matches = [];
    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      matches.push({ id: match[1], url: match[0] });
    }
    return matches;
  }

  // Fetch details for multiple AniList IDs
  async function fetchBulkDetails(ids) {
    setLoading(true);
    const fetched = [];
    
    for (const id of ids) {
      try {
        const res = await fetch(`/api/anilist/search?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results?.[0]) {
            fetched.push(data.results[0]);
          }
        }
      } catch {
        // Skip failed fetches
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
    
    setLoading(false);
    return fetched;
  }

  async function handleUrlPaste() {
    const urls = parseUrls(input);
    if (urls.length === 0) {
      showToast?.('No AniList URLs found. Paste URLs like https://anilist.co/anime/16498', 'error');
      return;
    }

    showToast?.(`Found ${urls.length} AniList URLs. Fetching details...`, 'info');
    const fetched = await fetchBulkDetails(urls.map(u => u.id));
    setResults(fetched);
    setSelected(new Set(fetched.map((_, i) => i)));
    showToast?.(`Fetched ${fetched.length} anime details`, 'success');
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/anilist/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {
      showToast?.('Search failed', 'error');
    }
    setLoading(false);
  }

  function addToResults(anime) {
    if (results.find(r => r.anilistId === anime.anilistId)) {
      showToast?.('Already in import list', 'info');
      return;
    }
    setResults(prev => [...prev, anime]);
    setSelected(prev => new Set([...prev, results.length]));
    setSearchResults([]);
    setSearchQuery('');
    showToast?.(`Added: ${anime.title}`, 'success');
  }

  function toggleSelect(index) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(results.map((_, i) => i)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function handleImport() {
    const toImport = results.filter((_, i) => selected.has(i));
    if (toImport.length === 0) {
      showToast?.('No anime selected', 'error');
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const anime of toImport) {
      try {
        const res = await fetch('/api/anime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: anime.titleEnglish || anime.titleRomaji,
            anilistUrl: anime.anilistUrl,
            anilistId: anime.anilistId,
            type: anime.type || 'TV',
            score: anime.score ? parseFloat(anime.score) : 0,
            genres: anime.genres || [],
            episodes: anime.episodes || 0
          })
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    setImporting(false);
    showToast?.(`Imported ${success} anime${failed ? `, ${failed} failed` : ''}`, success > 0 ? 'success' : 'error');
    
    if (success > 0) {
      setResults([]);
      setSelected(new Set());
      setInput('');
    }
  }

  return (
    <>
      <Head><title>Bulk Import - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><BoxIcon size={18} style={{ marginRight: 6 }} /> Bulk Import</h1>
        <p style={{ color: 'var(--text-muted)' }}>Import multiple anime at once from AniList URLs or search</p>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={`btn ${mode === 'url' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('url')}>
          <LinkIcon size={16} /> Paste URLs
        </button>
        <button className={`btn ${mode === 'search' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('search')}>
          <SearchIcon size={16} /> Search & Add
        </button>
      </div>

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">Paste AniList URLs</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Paste one or more AniList URLs (one per line or mixed in text). We'll auto-detect them all.
          </p>
          <textarea
            className="form-input"
            rows={6}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`https://anilist.co/anime/16498\nhttps://anilist.co/anime/5114\nhttps://anilist.co/anime/9253\n\nOr paste any text containing AniList URLs...`}
          />
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={handleUrlPaste} disabled={loading}>
              {loading ? <><div className="spinner" /> Fetching...</> : <><SearchIcon size={16} /> Detect & Fetch Details</>}
            </button>
          </div>
        </div>
      )}

      {/* Search Mode */}
      {mode === 'search' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">Search AniList</h2>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search anime..."
            />
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div>
              {searchResults.map((anime, i) => (
                <div key={i} className="anilist-result" onClick={() => addToResults(anime)}>
                  {anime.coverImage && <img src={anime.coverImage} alt={anime.title} />}
                  <div className="anilist-result-info">
                    <h4>{anime.titleEnglish || anime.titleRomaji}</h4>
                    <p>{anime.type} • <StarIcon size={14} style={{ color: '#fbbf24' }} /> {anime.score || 'N/A'} • {anime.year || ''}</p>
                    <p>{(anime.genres || []).join(', ')}</p>
                  </div>
                  <button className="btn btn-sm btn-primary" style={{ marginLeft: 'auto' }}>+ Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import Queue */}
      {results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><ClipboardIcon size={18} style={{ marginRight: 6 }} /> Import Queue ({results.length} items)</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-outline" onClick={selectAll}>Select All</button>
              <button className="btn btn-sm btn-outline" onClick={deselectAll}>Deselect All</button>
              <button className="btn btn-sm btn-success" onClick={handleImport} disabled={importing || selected.size === 0}>
                {importing ? <><div className="spinner" /> Importing...</> : <><RocketIcon size={16} /> Import {selected.size} Selected</>}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {results.map((anime, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 12,
                  background: selected.has(i) ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-input)',
                  border: `1px solid ${selected.has(i) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s'
                }}
                onClick={() => toggleSelect(i)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelect(i)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                />
                {anime.coverImage && (
                  <img src={anime.coverImage} alt="" style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{anime.titleEnglish || anime.titleRomaji}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {anime.type} • <StarIcon size={14} style={{ color: '#fbbf24' }} /> {anime.score || 'N/A'} • {(anime.genres || []).slice(0, 3).join(', ')}
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={e => { e.stopPropagation(); setResults(prev => prev.filter((_, j) => j !== i)); setSelected(prev => { const n = new Set(prev); n.delete(i); return n; }); }}
                  style={{ color: 'var(--danger)' }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && (
        <div className="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3>No anime in queue</h3>
          <p>Paste AniList URLs or search for anime to add them to the import queue.</p>
        </div>
      )}
    </>
  );
}
