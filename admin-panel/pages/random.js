import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { DiceIcon, TargetIcon, StarIcon, NoteIcon } from '../lib/icons';

export default function RandomPicker({ showToast }) {
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({ status: '', type: '', minScore: '' });
  const [totalCount, setTotalCount] = useState(0);
  const spinRef = useRef(null);

  useEffect(() => {
    fetch('/api/anime')
      .then(r => r.json())
      .then(data => setTotalCount(data.total || 0))
      .catch(() => {});
  }, []);

  async function spin() {
    setSpinning(true);
    setResult(null);

    // Build query params
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.minScore) params.set('minScore', filters.minScore);

    // Dramatic spin delay
    await new Promise(r => setTimeout(r, 1500));

    try {
      const res = await fetch(`/api/anime/random?${params}`);
      if (res.ok) {
        const anime = await res.json();
        setResult(anime);
        setHistory(prev => [anime, ...prev].slice(0, 10));
        showToast?.(<><DiceIcon size={16} /> {anime.title}</>, 'success');
      } else {
        showToast?.('No anime found matching filters', 'error');
      }
    } catch {
      showToast?.('Error picking anime', 'error');
    }
    setSpinning(false);
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Completed': return 'var(--success)';
      case 'Watching': return '#3b82f6';
      case 'Plan to Watch': return '#f59e0b';
      case 'Dropped': return 'var(--danger)';
      case 'On Hold': return '#8b5cf6';
      default: return 'var(--text-muted)';
    }
  }

  return (
    <>
      <Head><title>Random Picker - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><DiceIcon size={18} style={{ marginRight: 6 }} /> Random Picker</h1>
        <p style={{ color: 'var(--text-muted)' }}>Can't decide what to watch? Let fate choose.</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><TargetIcon size={18} style={{ marginRight: 6 }} /> Filters</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{totalCount} anime in collection</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: 160 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Any Status</option>
            <option value="Completed">Completed</option>
            <option value="Watching">Watching</option>
            <option value="Plan to Watch">Plan to Watch</option>
            <option value="Dropped">Dropped</option>
            <option value="On Hold">On Hold</option>
          </select>
          <select className="form-input" style={{ width: 140 }} value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">Any Type</option>
            <option value="TV">TV</option>
            <option value="Movie">Movie</option>
            <option value="OVA">OVA</option>
            <option value="ONA">ONA</option>
          </select>
          <select className="form-input" style={{ width: 160 }} value={filters.minScore} onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))}>
            <option value="">Any Score</option>
            <option value="5">5+ ★</option>
            <option value="6">6+ ★</option>
            <option value="7">7+ ★</option>
            <option value="8">8+ ★</option>
            <option value="9">9+ ★</option>
          </select>
        </div>
      </div>

      {/* Spin Button */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <button
          onClick={spin}
          disabled={spinning}
          style={{
            width: 200, height: 200, borderRadius: '50%',
            background: spinning 
              ? 'conic-gradient(from 0deg, #7c3aed, #a78bfa, #c4b5fd, #7c3aed)' 
              : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            border: '4px solid var(--border-light)',
            cursor: spinning ? 'wait' : 'pointer',
            fontSize: 48, color: 'white', fontWeight: 800,
            boxShadow: spinning 
              ? '0 0 60px rgba(124, 58, 237, 0.5)' 
              : '0 0 30px rgba(124, 58, 237, 0.3)',
            transition: 'all 0.3s',
            animation: spinning ? 'spin 0.5s linear infinite' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          {spinning ? (
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          ) : (
            <>
              <DiceIcon size={48} />
              <span style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>SPIN</span>
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && !spinning && (
        <div className="card" style={{ 
          marginBottom: 24, 
          borderColor: 'var(--accent)', 
          boxShadow: '0 0 30px rgba(124, 58, 237, 0.2)',
          animation: 'slideUp 0.4s ease'
        }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {result.coverImage && (
              <img 
                src={result.coverImage} 
                alt={result.title}
                style={{ width: 140, height: 200, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{result.title}</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span className={`badge badge-${result.type?.toLowerCase()}`}>{result.type}</span>
                <span className="badge badge-high"><StarIcon size={14} style={{ color: '#fbbf24' }} /> {result.score}</span>
                <span style={{ 
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: `${getStatusColor(result.status)}20`, color: getStatusColor(result.status)
                }}>
                  {result.status || 'Completed'}
                </span>
                {result.episodes > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{result.episodes} episodes</span>}
              </div>
              <div className="genre-tags" style={{ marginBottom: 16 }}>
                {(result.genres || []).map(g => <span key={g} className="genre-tag">{g}</span>)}
              </div>
              {result.notes && (
                <div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}><NoteIcon size={14} style={{ marginRight: 4 }} /> NOTES</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{result.notes}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={result.anilistUrl} target="_blank" rel="noopener" className="btn btn-outline btn-sm">
                  View on AniList ↗
                </a>
                <button className="btn btn-primary btn-sm" onClick={spin}>
                  <DiceIcon size={16} /> Spin Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><NoteIcon size={18} style={{ marginRight: 6 }} /> Recent Picks</h2>
            <button className="btn btn-sm btn-outline" onClick={() => setHistory([])}>Clear</button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {history.map((a, i) => (
              <div key={`${a.id}-${i}`} style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                background: i === 0 ? 'rgba(124, 58, 237, 0.1)' : 'var(--bg-input)',
                borderRadius: 8, border: i === 0 ? '1px solid var(--accent)' : '1px solid transparent'
              }}>
                {a.coverImage && <img src={a.coverImage} alt="" style={{ width: 32, height: 44, borderRadius: 4, objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.type} • <StarIcon size={14} style={{ color: '#fbbf24' }} /> {a.score}</div>
                </div>
                {i === 0 && <span style={{ fontSize: 11, color: 'var(--accent-light)', fontWeight: 600 }}>LATEST</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !spinning && history.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 64, marginBottom: 16 }}><DiceIcon size={64} /></div>
          <h3>Feeling Lucky?</h3>
          <p>Hit the spin button and we'll pick a random anime from your collection. Use filters to narrow down by status, type, or minimum score.</p>
        </div>
      )}
    </>
  );
}
