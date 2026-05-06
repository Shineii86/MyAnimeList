import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AnimeList({ showToast }) {
  const [anime, setAnime] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [deleteModal, setDeleteModal] = useState(null);
  const router = useRouter();

  useEffect(() => { loadAnime(); }, []);

  useEffect(() => {
    let result = [...anime];
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q));
    }
    if (activeLetter) {
      result = result.filter(a => a.letter === activeLetter);
    }
    if (typeFilter) {
      result = result.filter(a => a.type === typeFilter);
    }
    if (sortBy === 'score') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFiltered(result);
  }, [search, activeLetter, typeFilter, sortBy, anime]);

  async function loadAnime() {
    try {
      const res = await fetch('/api/anime');
      if (res.ok) {
        const data = await res.json();
        setAnime(data.anime);
      }
    } catch (err) {
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
        showToast?.('Anime deleted successfully', 'success');
      } else {
        showToast?.('Failed to delete', 'error');
      }
    } catch (err) {
      showToast?.('Error deleting anime', 'error');
    }
    setDeleteModal(null);
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const types = ['', 'TV', 'Movie', 'OVA', 'ONA'];

  return (
    <>
      <Head>
        <title>All Anime - MyAnimeList Admin</title>
      </Head>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>All Anime</h1>
          <p style={{ color: 'var(--text-muted)' }}>{filtered.length} of {anime.length} entries</p>
        </div>
        <Link href="/anime/add" className="btn btn-primary">➕ Add Anime</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-container" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            placeholder="Search anime..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: 140 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {types.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-input" style={{ width: 140 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="title">Sort: Title</option>
          <option value="score">Sort: Score</option>
        </select>
      </div>

      {/* Letter Filter */}
      <div className="letter-filter">
        <button 
          className={`letter-btn ${!activeLetter ? 'active' : ''}`}
          onClick={() => setActiveLetter('')}
        >
          All
        </button>
        {letters.map(l => (
          <button
            key={l}
            className={`letter-btn ${activeLetter === l ? 'active' : ''}`}
            onClick={() => setActiveLetter(activeLetter === l ? '' : l)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2" />
          </svg>
          <h3>No anime found</h3>
          <p>Try adjusting your filters or add a new anime entry.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Title</th>
                <th>Type</th>
                <th>Score</th>
                <th>Genres</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(anime => (
                <tr key={anime.id}>
                  <td>
                    <div className="anime-title-text">
                      <a href={anime.anilistUrl} target="_blank" rel="noopener" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {anime.title}
                      </a>
                    </div>
                    <div className="anime-subtitle">{anime.anilistUrl?.split('/').pop()}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${anime.type?.toLowerCase()}`}>{anime.type}</span>
                  </td>
                  <td>
                    <div className="score-display">
                      <span className="score-star">⭐</span>
                      {anime.score}
                    </div>
                  </td>
                  <td>
                    <div className="genre-tags">
                      {(anime.genres || []).slice(0, 2).map(g => (
                        <span key={g} className="genre-tag">{g}</span>
                      ))}
                      {(anime.genres || []).length > 2 && (
                        <span className="genre-tag">+{anime.genres.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/anime/${anime.id}`} className="btn-icon" title="Edit">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button className="btn-icon" title="Delete" onClick={() => setDeleteModal(anime)} style={{ color: 'var(--danger)' }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
              Are you sure you want to delete <strong>{deleteModal.title}</strong>? This action cannot be undone.
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
