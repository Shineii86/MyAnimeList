import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AddAnime({ showToast }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    anilistUrl: '',
    anilistId: '',
    type: 'TV',
    score: '',
    genres: '',
    episodes: ''
  });
  const [loading, setLoading] = useState(false);
  const [anilistQuery, setAnilistQuery] = useState('');
  const [anilistResults, setAnilistResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [urlDetected, setUrlDetected] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  // Detect AniList URL paste and auto-fetch
  useEffect(() => {
    const urlMatch = form.anilistUrl.match(/anilist\.co\/anime\/(\d+)/);
    if (urlMatch && !urlDetected) {
      autoFetchFromUrl(urlMatch[1]);
    }
  }, [form.anilistUrl]);

  async function autoFetchFromUrl(anilistId) {
    setFetchingUrl(true);
    setUrlDetected(true);
    try {
      const res = await fetch(`/api/anilist/search?id=${anilistId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results?.[0]) {
          const anime = data.results[0];
          setForm({
            title: anime.titleEnglish || anime.titleRomaji || '',
            anilistUrl: anime.anilistUrl || `https://anilist.co/anime/${anilistId}`,
            anilistId: String(anime.anilistId || anilistId),
            type: anime.type || 'TV',
            score: anime.score || '',
            genres: (anime.genres || []).join(', '),
            episodes: anime.episodes ? String(anime.episodes) : ''
          });
          showToast?.(`Auto-fetched: ${anime.titleEnglish || anime.titleRomaji}`, 'success');
        }
      }
    } catch {
      showToast?.('Failed to fetch from AniList', 'error');
    } finally {
      setFetchingUrl(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'anilistUrl') {
      setUrlDetected(false);
    }
  }

  async function searchAniList() {
    if (!anilistQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/anilist/search?q=${encodeURIComponent(anilistQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setAnilistResults(data.results || []);
      } else {
        showToast?.('AniList search failed', 'error');
      }
    } catch {
      showToast?.('Search error', 'error');
    } finally {
      setSearching(false);
    }
  }

  function importFromAniList(anime) {
    setForm({
      title: anime.titleEnglish || anime.titleRomaji || '',
      anilistUrl: anime.anilistUrl || '',
      anilistId: String(anime.anilistId || ''),
      type: anime.type || 'TV',
      score: anime.score || '',
      genres: (anime.genres || []).join(', '),
      episodes: anime.episodes ? String(anime.episodes) : ''
    });
    setAnilistResults([]);
    setAnilistQuery('');
    showToast?.(`Imported: ${anime.titleEnglish || anime.titleRomaji}`, 'success');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast?.('Title is required', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const body = {
        ...form,
        genres: form.genres ? form.genres.split(',').map(g => g.trim()).filter(Boolean) : [],
        score: form.score ? parseFloat(form.score) : 0,
        episodes: form.episodes ? parseInt(form.episodes) : 0,
        anilistId: form.anilistId ? parseInt(form.anilistId) : null
      };

      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        // Auto-push if enabled
        try {
          const settings = JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
          if (settings.autoPush && settings.githubToken) {
            fetch('/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'push',
                github_token: settings.githubToken,
                owner: settings.owner || 'Shineii86',
                repo: settings.repo || 'MyAnimeList'
              })
            }).catch(() => {});
          }
        } catch {}

        showToast?.(`Added: ${form.title}`, 'success');
        router.push('/anime');
      } else {
        const data = await res.json();
        showToast?.(data.error || 'Failed to add', 'error');
      }
    } catch {
      showToast?.('Error adding anime', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Add Anime - MyAnimeList Admin</title>
      </Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Add Anime</h1>
        <p style={{ color: 'var(--text-muted)' }}>Add a new anime to your collection</p>
      </div>

      {/* AniList Search Panel */}
      <div className="anilist-search-panel">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>🔍 Quick Import from AniList</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            className="form-input"
            placeholder="Search anime on AniList..."
            value={anilistQuery}
            onChange={e => setAnilistQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchAniList()}
          />
          <button className="btn btn-primary" onClick={searchAniList} disabled={searching}>
            {searching ? <div className="spinner" /> : 'Search'}
          </button>
        </div>

        {anilistResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {anilistResults.map((anime, i) => (
              <div key={i} className="anilist-result" onClick={() => importFromAniList(anime)}>
                {anime.coverImage && <img src={anime.coverImage} alt={anime.title} />}
                <div className="anilist-result-info">
                  <h4>{anime.titleEnglish || anime.titleRomaji}</h4>
                  <p>{anime.titleRomaji} • {anime.type} • ⭐ {anime.score || 'N/A'} • {anime.year || 'N/A'}</p>
                  <p>{(anime.genres || []).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Form */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">✏️ Manual Entry</h2>
          {fetchingUrl && <span style={{ color: 'var(--accent-light)', fontSize: 13 }}><div className="spinner" style={{ display: 'inline-block', width: 14, height: 14, marginRight: 6 }} />Fetching from AniList...</span>}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">AniList URL <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(paste to auto-fill)</span></label>
            <input 
              className="form-input" 
              name="anilistUrl" 
              value={form.anilistUrl} 
              onChange={handleChange} 
              placeholder="https://anilist.co/anime/16498 — paste a URL and all fields auto-fill!" 
              style={urlDetected ? { borderColor: 'var(--success)', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' } : {}}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Attack on Titan" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">AniList ID</label>
              <input className="form-input" name="anilistId" value={form.anilistId} onChange={handleChange} placeholder="e.g., 16498" />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" name="type" value={form.type} onChange={handleChange}>
                <option value="TV">TV</option>
                <option value="Movie">Movie</option>
                <option value="OVA">OVA</option>
                <option value="ONA">ONA</option>
                <option value="Special">Special</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Score (0-10)</label>
              <input className="form-input" name="score" type="number" min="0" max="10" step="0.1" value={form.score} onChange={handleChange} placeholder="e.g., 8.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Episodes</label>
              <input className="form-input" name="episodes" type="number" min="0" value={form.episodes} onChange={handleChange} placeholder="e.g., 24" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Genres (comma separated)</label>
            <input className="form-input" name="genres" value={form.genres} onChange={handleChange} placeholder="e.g., Action, Drama, Fantasy" />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading || fetchingUrl}>
              {loading ? <><div className="spinner" /> Adding...</> : '➕ Add Anime'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => router.push('/anime')}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
