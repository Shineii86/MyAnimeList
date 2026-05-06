import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AnimeList({ showToast }) {
  const [anime, setAnime] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('mal_view_mode');
    if (stored) setViewMode(stored);
    loadAnime();
  }, []);

  useEffect(() => {
    let result = [...anime];
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q)) ||
        (a.genres && a.genres.some(g => g.toLowerCase().includes(q)))
      );
    }
    if (activeLetter) {
      result = result.filter(a => a.letter === activeLetter);
    }
    if (typeFilter) {
      result = result.filter(a => a.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter(a => (a.status || 'Completed') === statusFilter);
    }
    if (sortBy === 'score') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }
    
    setFiltered(result);
  }, [search, activeLetter, typeFilter, statusFilter, sortBy, anime]);

  async function loadAnime() {
    try {
      const res = await fetch('/api/anime');
      if (res.ok) {
        const data = await res.json();
        setAnime(data.anime);
      }
    } catch {
      showToast?.('Failed to load anime', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/anime/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnime(prev => prev.filter(a => a.id !== id));
        showToast?.('Anime deleted', 'success');
        try {
          const settings = JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
          if (settings.autoPush && settings.githubToken) {
            fetch('/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'push', github_token: settings.githubToken, owner: settings.owner || 'Shineii86', repo: settings.repo || 'MyAnimeList' })
            }).catch(() => {});
          }
        } catch {}
      } else {
        showToast?.('Failed to delete', 'error');
      }
    } catch {
      showToast?.('Error deleting', 'error');
    }
    setDeleteModal(null);
  }

  function toggleView(mode) {
    setViewMode(mode);
    localStorage.setItem('mal_view_mode', mode);
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

  function getScoreColor(score) {
    if (score >= 8) return 'var(--success)';
    if (score >= 6) return '#f59e0b';
    if (score > 0) return 'var(--danger)';
    return 'var(--text-muted)';
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const statuses = ['', 'Completed', 'Watching', 'Plan to Watch', 'Dropped', 'On Hold'];
  const types = ['', 'TV', 'Movie', 'OVA', 'ONA'];

  return (
    <>
      <Head><title>All Anime - MyAnimeList Admin</title></Head>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>All Anime</h1>
          <p style={{ color: 'var(--text-muted)' }}>{filtered.length} of {anime.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <button 
              onClick={() => toggleView('table')}
              style={{ padding: '8px 12px', background: viewMode === 'table' ? 'var(--accent)' : 'var(--bg-input)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 13 }}
              title="Table View"
            >☰</button>
            <button 
              onClick={() => toggleView('grid')}
              style={{ padding: '8px 12px', background: viewMode === 'grid' ? 'var(--accent)' : 'var(--bg-input)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 13 }}
              title="Grid View"
            >⊞</button>
          </div>
          <Link href="/anime/add" className="btn btn-primary">➕ Add Anime</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-container" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="search-input" placeholder="Search title, notes, genres..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 130 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statuses.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
        <select className="form-input" style={{ width: 120 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <select className="form-input" style={{ width: 130 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="title">Sort: Title</option>
          <option value="score">Sort: Score</option>
          <option value="recent">Sort: Recent</option>
        </select>
      </div>

      {/* Letter Filter */}
      <div className="letter-filter">
        <button className={`letter-btn ${!activeLetter ? 'active' : ''}`} onClick={() => setActiveLetter('')}>All</button>
        {letters.map(l => (
          <button key={l} className={`letter-btn ${activeLetter === l ? 'active' : ''}`} onClick={() => setActiveLetter(activeLetter === l ? '' : l)}>{l}</button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" /></svg>
          <h3>No anime found</h3>
          <p>Try adjusting your filters or add a new anime entry.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {filtered.map(a => (
            <div key={a.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer', position: 'relative'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Cover Image */}
              <div style={{ 
                height: 220, background: 'var(--bg-input)', position: 'relative', overflow: 'hidden'
              }}>
                {a.coverImage ? (
                  <img src={a.coverImage} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.2 }}>📺</div>
                )}
                {/* Score Badge */}
                {a.score > 0 && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 6,
                    fontSize: 13, fontWeight: 700, color: getScoreColor(a.score)
                  }}>
                    ⭐ {a.score}
                  </div>
                )}
                {/* Status Badge */}
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: `${getStatusColor(a.status)}dd`, padding: '3px 8px', borderRadius: 6,
                  fontSize: 10, fontWeight: 600, color: 'white'
                }}>
                  {a.status || 'Completed'}
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {a.type} {a.episodes > 0 && `• ${a.episodes} ep`}
                </div>
                <div className="genre-tags" style={{ marginBottom: 0 }}>
                  {(a.genres || []).slice(0, 2).map(g => <span key={g} className="genre-tag" style={{ fontSize: 10 }}>{g}</span>)}
                </div>
              </div>
              {/* Hover Actions */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '40px 12px 12px',
                display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <Link href={`/anime/${a.id}`} className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>Edit</Link>
                <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); setDeleteModal(a); }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Title</th>
                <th>Status</th>
                <th>Type</th>
                <th>Score</th>
                <th>Genres</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {a.coverImage && <img src={a.coverImage} alt="" style={{ width: 32, height: 44, borderRadius: 4, objectFit: 'cover' }} />}
                      <div>
                        <a href={a.anilistUrl} target="_blank" rel="noopener" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>
                          {a.title}
                        </a>
                        {a.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {a.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: `${getStatusColor(a.status)}20`, color: getStatusColor(a.status)
                    }}>
                      {a.status || 'Completed'}
                    </span>
                  </td>
                  <td><span className={`badge badge-${a.type?.toLowerCase()}`}>{a.type}</span></td>
                  <td><span style={{ fontWeight: 700, color: getScoreColor(a.score) }}>⭐ {a.score}</span></td>
                  <td>
                    <div className="genre-tags">
                      {(a.genres || []).slice(0, 2).map(g => <span key={g} className="genre-tag">{g}</span>)}
                      {(a.genres || []).length > 2 && <span className="genre-tag">+{a.genres.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/anime/${a.id}`} className="btn-icon" title="Edit">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </Link>
                      <button className="btn-icon" title="Delete" onClick={() => setDeleteModal(a)} style={{ color: 'var(--danger)' }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">🗑️ Delete Anime</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{deleteModal.title}</strong>?
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteModal.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
