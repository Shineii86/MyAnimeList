import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PlusIcon, SearchIcon, TrashIcon, EditIcon, StarIcon, GridIcon, ListIcon, EyeIcon, CheckCircleIcon, ClockIcon, WarningIcon, NoteIcon, FilterIcon, DiceIcon, DownloadIcon, RocketIcon } from '../../lib/icons';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';

// Color from title string (deterministic)
function titleColor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 50%, 25%)`;
}

export default function AnimeList({ showToast }) {
  const router = useRouter();
  const [anime, setAnime] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState('table');
  const [deleteModal, setDeleteModal] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pushing, setPushing] = useState(false);

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
      const res = await apiGet('/api/anime');
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
      const res = await apiDelete(`/api/anime/${id}`);
      if (res.ok) {
        setAnime(prev => prev.filter(a => a.id !== id));
        setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
        showToast?.('Anime deleted', 'success');
      } else {
        showToast?.('Failed to delete', 'error');
      }
    } catch {
      showToast?.('Error deleting', 'error');
    }
    setDeleteModal(null);
  }

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      const res = await apiPost('/api/anime/bulk-delete', { ids: Array.from(selected) });
      if (res.ok) {
        const data = await res.json();
        setAnime(prev => prev.filter(a => !selected.has(a.id)));
        setSelected(new Set());
        showToast?.(`Deleted ${data.deleted} anime`, 'success');
      } else {
        showToast?.('Bulk delete failed', 'error');
      }
    } catch {
      showToast?.('Bulk delete error', 'error');
    }
    setBulkDeleteModal(false);
    setDeleting(false);
  }

  async function handlePushNow() {
    setPushing(true);
    try {
      const settings = JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
      const res = await apiPost('/api/push', {
        action: 'push',
        github_token: settings.githubToken,
        owner: settings.owner || 'Shineii86',
        repo: settings.repo || 'MyAnimeList'
      });
      if (res.ok) showToast?.('Pushed to GitHub!', 'success');
      else { const d = await res.json(); showToast?.(d.error || 'Push failed', 'error'); }
    } catch {
      showToast?.('Push error', 'error');
    } finally {
      setPushing(false);
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
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

  function handleExportCSV() {
    const headers = ['Title', 'Type', 'Score', 'Episodes', 'Status', 'Genres', 'AniList URL'];
    const rows = filtered.map(a => [
      `"${a.title}"`, a.type, a.score, a.episodes, a.status || 'Completed',
      `"${(a.genres || []).join(', ')}"`, a.anilistUrl || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = `myanime-${new Date().toISOString().split('T')[0]}.csv`;
    el.click(); URL.revokeObjectURL(url);
    showToast?.('Exported CSV', 'success');
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const statuses = ['', 'Completed', 'Watching', 'Plan to Watch', 'Dropped', 'On Hold'];
  const types = ['', 'TV', 'Movie', 'OVA', 'ONA'];

  // Quick stats
  const stats = {
    total: anime.length,
    completed: anime.filter(a => a.status === 'Completed').length,
    watching: anime.filter(a => a.status === 'Watching').length,
    planToWatch: anime.filter(a => a.status === 'Plan to Watch').length,
    avgScore: anime.filter(a => a.score > 0).length
      ? (anime.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / anime.filter(a => a.score > 0).length).toFixed(1)
      : '0'
  };

  return (
    <>
      <Head><title>All Anime - MyAnimeList Admin</title></Head>

      {/* Quick Stats Bar */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap',
        padding: '14px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', fontSize: 13
      }}>
        <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{stats.total} Total</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ color: 'var(--success)' }}>✓ {stats.completed} Completed</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ color: '#3b82f6' }}>▶ {stats.watching} Watching</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span style={{ color: '#f59e0b' }}>📋 {stats.planToWatch} Planned</span>
        <span style={{ color: 'var(--text-muted)' }}>•</span>
        <span><StarIcon size={12} style={{ color: '#fbbf24', verticalAlign: 'middle' }} /> {stats.avgScore} Avg</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>All Anime</h1>
          <p style={{ color: 'var(--text-muted)' }}>{filtered.length} of {anime.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <button 
              onClick={() => toggleView('table')}
              style={{ padding: '8px 12px', background: viewMode === 'table' ? 'var(--accent)' : 'var(--bg-input)', border: 'none', color: 'white', cursor: 'pointer' }}
              title="Table View"
            ><ListIcon size={14} /></button>
            <button 
              onClick={() => toggleView('grid')}
              style={{ padding: '8px 12px', background: viewMode === 'grid' ? 'var(--accent)' : 'var(--bg-input)', border: 'none', color: 'white', cursor: 'pointer' }}
              title="Grid View"
            ><GridIcon size={14} /></button>
          </div>
          <button className="btn btn-outline" onClick={() => router.push('/random')} title="Random Pick">
            <DiceIcon size={16} />
          </button>
          <button className="btn btn-outline" onClick={handleExportCSV} title="Export CSV">
            <DownloadIcon size={16} />
          </button>
          <button className="btn btn-success" onClick={handlePushNow} disabled={pushing} title="Push to GitHub">
            {pushing ? <div className="spinner" /> : <RocketIcon size={16} />}
          </button>
          <Link href="/anime/add" className="btn btn-primary"><PlusIcon size={16} /> Add Anime</Link>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)', fontSize: 14
        }}>
          <CheckCircleIcon size={16} style={{ color: 'var(--danger)' }} />
          <span style={{ fontWeight: 600 }}>{selected.size} selected</span>
          <button className="btn btn-sm btn-danger" onClick={() => setBulkDeleteModal(true)}>
            <TrashIcon size={12} /> Delete Selected
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setSelected(new Set())}>
            Clear Selection
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-container" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <SearchIcon size={18} className="search-icon" />
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
          <FilterIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3>No anime found</h3>
          <p>Try adjusting your filters or add a new anime entry.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {filtered.map(a => (
            <div key={a.id} style={{
              background: 'var(--bg-card)', border: selected.has(a.id) ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', cursor: 'pointer', position: 'relative'
            }}
              onClick={() => toggleSelect(a.id)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Selection checkbox */}
              <div style={{
                position: 'absolute', top: 8, left: 8, zIndex: 5,
                width: 22, height: 22, borderRadius: 6,
                background: selected.has(a.id) ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
                border: selected.has(a.id) ? 'none' : '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s'
              }}>
                {selected.has(a.id) && <CheckCircleIcon size={14} style={{ color: 'white' }} />}
              </div>

              <div style={{ height: 220, background: a.coverImage ? 'transparent' : titleColor(a.title), position: 'relative', overflow: 'hidden' }}>
                {a.coverImage ? (
                  <img src={a.coverImage} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.15)'
                  }}>
                    {a.title.charAt(0)}
                  </div>
                )}
                {a.score > 0 && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 6,
                    fontSize: 13, fontWeight: 700, color: getScoreColor(a.score),
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <StarIcon size={12} style={{ color: '#fbbf24' }} /> {a.score}
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: `${getStatusColor(a.status)}dd`, padding: '3px 8px', borderRadius: 6,
                  fontSize: 10, fontWeight: 600, color: 'white'
                }}>
                  {a.status || 'Completed'}
                </div>
              </div>
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
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '40px 12px 12px',
                display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <Link href={`/anime/${a.id}`} className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={e => e.stopPropagation()}><EditIcon size={12} /> Edit</Link>
                <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); setDeleteModal(a); }}><TrashIcon size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                </th>
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
                <tr key={a.id} style={selected.has(a.id) ? { background: 'rgba(124, 58, 237, 0.08)' } : {}}>
                  <td>
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {a.coverImage ? (
                        <img src={a.coverImage} alt="" style={{ width: 32, height: 44, borderRadius: 4, objectFit: 'cover' }} loading="lazy" />
                      ) : (
                        <div style={{
                          width: 32, height: 44, borderRadius: 4, background: titleColor(a.title),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)', flexShrink: 0
                        }}>
                          {a.title.charAt(0)}
                        </div>
                      )}
                      <div>
                        <a href={a.anilistUrl} target="_blank" rel="noopener" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>
                          {a.title}
                        </a>
                        {a.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}><NoteIcon size={10} /> {a.notes}</div>}
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
                  <td><span style={{ fontWeight: 700, color: getScoreColor(a.score), display: 'inline-flex', alignItems: 'center', gap: 4 }}><StarIcon size={12} style={{ color: '#fbbf24' }} /> {a.score}</span></td>
                  <td>
                    <div className="genre-tags">
                      {(a.genres || []).slice(0, 2).map(g => <span key={g} className="genre-tag">{g}</span>)}
                      {(a.genres || []).length > 2 && <span className="genre-tag">+{a.genres.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/anime/${a.id}`} className="btn-icon" title="Edit"><EditIcon size={16} /></Link>
                      <button className="btn-icon" title="Delete" onClick={() => setDeleteModal(a)} style={{ color: 'var(--danger)' }}><TrashIcon size={16} /></button>
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
            <h3 className="modal-title"><TrashIcon size={18} style={{ marginRight: 6 }} /> Delete Anime</h3>
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

      {/* Bulk Delete Modal */}
      {bulkDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setBulkDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title"><TrashIcon size={18} style={{ marginRight: 6 }} /> Delete {selected.size} Anime</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Are you sure you want to delete <strong>{selected.size}</strong> selected entries? This cannot be undone.
            </p>
            <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 24, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
              {anime.filter(a => selected.has(a.id)).map(a => (
                <div key={a.id} style={{ padding: '4px 0', fontSize: 13, color: 'var(--text-secondary)' }}>• {a.title}</div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setBulkDeleteModal(false)} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={deleting}>
                {deleting ? <><div className="spinner" /> Deleting...</> : <><TrashIcon size={14} /> Delete {selected.size}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
