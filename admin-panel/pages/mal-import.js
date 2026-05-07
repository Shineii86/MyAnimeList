import { useState } from 'react';
import Head from 'next/head';
import { UploadIcon, StarIcon, RocketIcon, CheckCircleIcon, TrashIcon, SearchIcon } from '../lib/icons';
import { apiPost } from '../lib/api';

export default function MalImport({ showToast }) {
  const [importMode, setImportMode] = useState('xml'); // 'xml' or 'json' or 'username'
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'done'

  function parseXML(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const entries = doc.querySelectorAll('anime');
    const anime = [];

    entries.forEach(entry => {
      const title = entry.querySelector('series_title')?.textContent || entry.querySelector('my_title')?.textContent || '';
      const episodes = parseInt(entry.querySelector('my_watched_episodes')?.textContent || '0');
      const score = parseFloat(entry.querySelector('my_score')?.textContent || '0');
      const status = entry.querySelector('my_status')?.textContent || 'Completed';
      const malId = parseInt(entry.querySelector('series_animedb_id')?.textContent || '0');
      const type = entry.querySelector('series_type')?.textContent || 'TV';

      if (title) {
        anime.push({
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'").replace(/&quot;/g, '"'),
          episodes,
          score,
          status: status === 'Completed' ? 'Completed' : status === 'Watching' ? 'Watching' : status === 'Plan to Watch' ? 'Plan to Watch' : status === 'On-Hold' ? 'On Hold' : status === 'Dropped' ? 'Dropped' : 'Completed',
          malId,
          type: type === 'Movie' ? 'Movie' : type === 'OVA' ? 'OVA' : type === 'ONA' ? 'ONA' : 'TV',
          source: 'MAL'
        });
      }
    });

    return anime;
  }

  function parseJSON(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      const entries = Array.isArray(data) ? data : data.data || data.anime || [];
      return entries.map(e => ({
        title: e.title || e.node?.title || '',
        episodes: e.episodes || e.num_watched_episodes || e.node?.num_episodes || 0,
        score: e.score || e.mean || 0,
        status: e.status === 'completed' ? 'Completed' : e.status === 'watching' ? 'Watching' : e.status === 'plan_to_watch' ? 'Plan to Watch' : 'Completed',
        malId: e.id || e.node?.id || 0,
        type: e.type || 'TV',
        source: 'MAL'
      })).filter(a => a.title);
    } catch {
      return [];
    }
  }

  async function handleFileUpload(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setLoading(true);

    try {
      const text = await f.text();
      let parsed;
      if (f.name.endsWith('.xml')) {
        parsed = parseXML(text);
      } else {
        parsed = parseJSON(text);
      }

      if (parsed.length === 0) {
        showToast?.('No anime found in file', 'error');
        setLoading(false);
        return;
      }

      setResults(parsed);
      setSelected(new Set(parsed.map((_, i) => i)));
      setStep('preview');
      showToast?.(`Found ${parsed.length} anime entries`, 'success');
    } catch {
      showToast?.('Failed to parse file', 'error');
    }
    setLoading(false);
  }

  async function handleUsernameImport() {
    if (!username.trim()) {
      showToast?.('Enter a MAL username', 'error');
      return;
    }

    setLoading(true);
    try {
      // Use MAL's direct JSON API with pagination
      const allAnime = [];
      let offset = 0;
      const limit = 300;
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`https://myanimelist.net/animelist/${encodeURIComponent(username)}/load.json?status=7&offset=${offset}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        if (!res.ok) throw new Error(`MAL returned ${res.status}. Is the profile public?`);
        const data = await res.json();
        
        if (!Array.isArray(data) || data.length === 0) break;
        
        allAnime.push(...data);
        offset += data.length;
        hasMore = data.length >= limit;
        
        // Rate limit: MAL needs a small delay between pages
        if (hasMore) await new Promise(r => setTimeout(r, 1000));
      }

      const parsed = allAnime
        .filter(e => e.status === 2) // Only completed
        .map(e => ({
          title: e.anime_title_eng || e.anime_title,
          episodes: e.anime_num_episodes || e.num_watched_episodes || 0,
          score: e.score || 0,
          status: 'Completed',
          malId: e.anime_id,
          type: e.anime_airing_status === 3 ? 'Movie' : 'TV',
          genres: (e.genres || []).map(g => g.name),
          source: 'MAL'
        }))
        .filter(a => a.title);

      if (parsed.length === 0) {
        showToast?.('No completed anime found. Is the profile public?', 'error');
      } else {
        setResults(parsed);
        setSelected(new Set(parsed.map((_, i) => i)));
        setStep('preview');
        showToast?.(`Found ${parsed.length} completed anime for ${username}`, 'success');
      }
    } catch (err) {
      showToast?.(err.message || 'Failed to fetch MAL data', 'error');
    }
    setLoading(false);
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
        const res = await apiPost('/api/anime', {
          title: anime.title,
          type: anime.type || 'TV',
          score: anime.score || 0,
          episodes: anime.episodes || 0,
          status: anime.status || 'Completed',
          genres: []
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    setImporting(false);
    setStep('done');
    showToast?.(`Imported ${success} anime${failed ? `, ${failed} failed` : ''}`, success > 0 ? 'success' : 'error');
  }

  function toggleSelect(index) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(results.map((_, i) => i))); }
  function deselectAll() { setSelected(new Set()); }

  return (
    <>
      <Head><title>MAL Import - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><UploadIcon size={18} style={{ marginRight: 6 }} /> Import from MyAnimeList</h1>
        <p style={{ color: 'var(--text-muted)' }}>Import your anime collection from MyAnimeList.net</p>
      </div>

      {step === 'upload' && (
        <>
          {/* Mode Toggle */}
          <div className="tabs" style={{ marginBottom: 24 }}>
            <button className={`tab ${importMode === 'xml' ? 'active' : ''}`} onClick={() => setImportMode('xml')}>XML Export</button>
            <button className={`tab ${importMode === 'json' ? 'active' : ''}`} onClick={() => setImportMode('json')}>JSON Export</button>
            <button className={`tab ${importMode === 'username' ? 'active' : ''}`} onClick={() => setImportMode('username')}>Username</button>
          </div>

          {importMode === 'username' ? (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Import by Username</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                Enter your MyAnimeList username to import your completed anime list.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="MAL username..." onKeyDown={e => e.key === 'Enter' && handleUsernameImport()} />
                <button className="btn btn-primary" onClick={handleUsernameImport} disabled={loading}>
                  {loading ? <div className="spinner" /> : <><SearchIcon size={16} /> Fetch</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Upload {importMode.toUpperCase()} File</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                {importMode === 'xml' 
                  ? 'Export your anime list from MAL: Settings → Export → Anime List (XML)'
                  : 'Export your anime list from MAL API or use a backup JSON file'}
              </p>
              <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; const f = e.dataTransfer.files[0]; if (f) { handleFileUpload({ target: { files: [f] } }); } }}
                onClick={() => document.getElementById('mal-file-input').click()}
              >
                <UploadIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Drag & drop your {importMode.toUpperCase()} file here, or click to browse
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Accepts .{importMode} files
                </p>
                <input id="mal-file-input" type="file" accept={`.${importMode}`} onChange={handleFileUpload} style={{ display: 'none' }} />
              </div>
            </div>
          )}
        </>
      )}

      {step === 'preview' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Preview Import</h2>
              <p style={{ color: 'var(--text-muted)' }}>{selected.size} of {results.length} selected</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-outline" onClick={selectAll}>Select All</button>
              <button className="btn btn-sm btn-outline" onClick={deselectAll}>Deselect All</button>
              <button className="btn btn-sm btn-outline" onClick={() => { setStep('upload'); setResults([]); }}>Back</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={importing || selected.size === 0}>
                {importing ? <><div className="spinner" /> Importing...</> : <><RocketIcon size={16} /> Import {selected.size}</>}
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" checked={selected.size === results.length} onChange={() => selected.size === results.length ? deselectAll() : selectAll()} style={{ accentColor: 'var(--accent)' }} /></th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Episodes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((a, i) => (
                  <tr key={i} onClick={() => toggleSelect(i)} style={{ cursor: 'pointer', background: selected.has(i) ? 'rgba(124, 58, 237, 0.08)' : undefined }}>
                    <td><input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} style={{ accentColor: 'var(--accent)' }} /></td>
                    <td style={{ fontWeight: 600 }}>{a.title}</td>
                    <td><span className={`badge badge-${a.type?.toLowerCase()}`}>{a.type}</span></td>
                    <td><span style={{ color: '#fbbf24' }}><StarIcon size={12} /> {a.score || '—'}</span></td>
                    <td>{a.episodes || '—'}</td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {step === 'done' && (
        <div className="empty-state" style={{ padding: 60 }}>
          <CheckCircleIcon size={64} style={{ color: 'var(--success)', marginBottom: 16 }} />
          <h3>Import Complete!</h3>
          <p style={{ marginBottom: 24 }}>Your anime have been added to the collection.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => { setStep('upload'); setResults([]); setFile(null); }}>Import More</button>
            <a href="/anime" className="btn btn-primary">View Collection</a>
          </div>
        </div>
      )}
    </>
  );
}
