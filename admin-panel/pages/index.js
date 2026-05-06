import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { StarIcon, PlusIcon, SearchIcon, ClipboardIcon, RocketIcon, TagIcon, CheckCircleIcon, EyeIcon, ClockIcon, TrashIcon, WarningIcon, RefreshIcon } from '../lib/icons';

export default function Dashboard({ showToast }) {
  const [stats, setStats] = useState(null);
  const [recentAnime, setRecentAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, animeRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/anime?sort=recent')
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (animeRes.ok) {
        const data = await animeRes.json();
        setRecentAnime(data.anime.slice(0, 10));
      }
    } catch (err) {
      showToast?.('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - MyAnimeList Admin</title>
      </Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Overview of your anime collection</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Anime</div>
          <div className="value">{stats?.stats?.totalAnime || stats?.totalAnime || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Average Score</div>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><StarIcon size={18} style={{ color: '#fbbf24' }} /> {stats?.stats?.averageScore || '0'}</div>
        </div>
        <div className="stat-card">
          <div className="label">TV Shows</div>
          <div className="value">{stats?.stats?.tvShows || stats?.byType?.TV || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Movies</div>
          <div className="value">{stats?.stats?.moviesWatched || stats?.byType?.Movie || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">OVAs</div>
          <div className="value">{stats?.stats?.ovasSpecials || stats?.byType?.OVA || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Completion Rate</div>
          <div className="value">{stats?.stats?.completionRate || '0%'}</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Completed', key: 'Completed', color: 'var(--success)', Icon: CheckCircleIcon },
          { label: 'Watching', key: 'Watching', color: '#3b82f6', Icon: EyeIcon },
          { label: 'Plan to Watch', key: 'Plan to Watch', color: '#f59e0b', Icon: ClockIcon },
          { label: 'On Hold', key: 'On Hold', color: '#8b5cf6', Icon: WarningIcon },
          { label: 'Dropped', key: 'Dropped', color: 'var(--danger)', Icon: TrashIcon },
        ].map(({ label, key, color, Icon }) => (
          <div key={key} style={{
            flex: '1 1 150px', padding: '12px 16px', background: 'var(--bg-card)',
            border: `1px solid var(--border)`, borderRadius: 8,
            borderLeft: `3px solid ${color}`
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Icon size={12} /> {label}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{stats?.byStatus?.[key] || 0}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><RefreshIcon size={18} style={{ marginRight: 6 }} /> Quick Actions</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/anime/add" className="btn btn-primary">
            <PlusIcon size={16} /> Add Anime
          </Link>
          <Link href="/anilist" className="btn btn-outline">
            <SearchIcon size={16} /> Search AniList
          </Link>
          <Link href="/anime" className="btn btn-outline">
            <ClipboardIcon size={16} /> View All Anime
          </Link>
          <Link href="/push" className="btn btn-success">
            <RocketIcon size={16} /> Push to GitHub
          </Link>
        </div>
      </div>

      {/* Top Genres */}
      {stats?.topGenres?.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title"><TagIcon size={18} style={{ marginRight: 6 }} /> Top Genres</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stats.topGenres.map(({ genre, count }) => (
              <span key={genre} className="genre-tag" style={{ fontSize: 13, padding: '6px 14px' }}>
                {genre} <strong>({count})</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Anime */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><ClockIcon size={18} style={{ marginRight: 6 }} /> Recently Added</h2>
          <Link href="/anime" className="btn btn-sm btn-outline">View All</Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Score</th>
                <th>Genres</th>
              </tr>
            </thead>
            <tbody>
              {recentAnime.map(anime => (
                <tr key={anime.id}>
                  <td>
                    <div className="anime-title-cell">
                      <div>
                        <div className="anime-title-text">{anime.title}</div>
                        <div className="anime-subtitle">{anime.letter}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${anime.type?.toLowerCase()}`}>
                      {anime.type}
                    </span>
                  </td>
                  <td>
                    <div className="score-display">
                      <StarIcon size={14} style={{ color: '#fbbf24' }} />
                      {anime.score}
                    </div>
                  </td>
                  <td>
                    <div className="genre-tags">
                      {(anime.genres || []).slice(0, 3).map(g => (
                        <span key={g} className="genre-tag">{g}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
