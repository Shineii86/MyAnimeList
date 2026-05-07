import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { StarIcon, CalendarIcon, PlusIcon, FilterIcon } from '../lib/icons';
import { apiGet } from '../lib/api';

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
const SEASON_MONTHS = { Winter: [0, 1, 2], Spring: [3, 4, 5], Summer: [6, 7, 8], Fall: [9, 10, 11] };

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month < 3) return 'Winter';
  if (month < 6) return 'Spring';
  if (month < 9) return 'Summer';
  return 'Fall';
}

export default function SeasonalTracker({ showToast }) {
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());

  useEffect(() => {
    apiGet('/api/anime')
      .then(r => r.json())
      .then(data => { setAnime(data.anime || []); setLoading(false); })
      .catch(() => { showToast?.('Failed to load data', 'error'); setLoading(false); });
  }, []);

  // Group anime by year+season based on addedAt
  const seasonalMap = {};
  anime.forEach(a => {
    if (!a.addedAt) return;
    const date = new Date(a.addedAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    let season;
    if (month < 3) season = 'Winter';
    else if (month < 6) season = 'Spring';
    else if (month < 9) season = 'Summer';
    else season = 'Fall';
    
    const key = `${year}-${season}`;
    if (!seasonalMap[key]) seasonalMap[key] = [];
    seasonalMap[key].push(a);
  });

  // Available years
  const years = [...new Set(anime.map(a => a.addedAt ? new Date(a.addedAt).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) years.unshift(new Date().getFullYear());

  const currentKey = `${selectedYear}-${selectedSeason}`;
  const seasonAnime = seasonalMap[currentKey] || [];
  const sortedAnime = [...seasonAnime].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Stats for selected season
  const seasonStats = {
    total: seasonAnime.length,
    avgScore: seasonAnime.filter(a => a.score > 0).length
      ? (seasonAnime.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / seasonAnime.filter(a => a.score > 0).length).toFixed(1)
      : 'N/A',
    topRated: [...seasonAnime].sort((a, b) => (b.score || 0) - (a.score || 0))[0],
    episodes: seasonAnime.reduce((s, a) => s + (a.episodes || 0), 0)
  };

  // Season overview for the year
  const yearSeasons = SEASONS.map(s => ({
    season: s,
    key: `${selectedYear}-${s}`,
    count: (seasonalMap[`${selectedYear}-${s}`] || []).length,
    avgScore: (() => {
      const items = (seasonalMap[`${selectedYear}-${s}`] || []).filter(a => a.score > 0);
      return items.length ? (items.reduce((s, a) => s + a.score, 0) / items.length).toFixed(1) : 'N/A';
    })()
  }));

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <>
      <Head><title>Seasonal Tracker - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><CalendarIcon size={18} style={{ marginRight: 6 }} /> Seasonal Tracker</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track your anime watching by season</p>
      </div>

      {/* Year & Season Selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 120 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {SEASONS.map(s => (
            <button key={s} className={`btn ${selectedSeason === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedSeason(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Year Overview */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {yearSeasons.map(({ season, key, count, avgScore }) => (
          <div key={season} className="stat-card" style={{ cursor: 'pointer', borderLeft: selectedSeason === season ? '3px solid var(--accent)' : undefined }} onClick={() => setSelectedSeason(season)}>
            <div className="label">{season} {selectedYear}</div>
            <div className="value">{count}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <StarIcon size={10} style={{ color: '#fbbf24' }} /> {avgScore} avg
            </div>
          </div>
        ))}
      </div>

      {/* Season Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="stat-card" style={{ flex: 1, minWidth: 150 }}>
          <div className="label">Anime Watched</div>
          <div className="value">{seasonStats.total}</div>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: 150 }}>
          <div className="label">Avg Score</div>
          <div className="value">{seasonStats.avgScore}</div>
        </div>
        <div className="stat-card" style={{ flex: 1, minWidth: 150 }}>
          <div className="label">Total Episodes</div>
          <div className="value">{seasonStats.episodes}</div>
        </div>
        {seasonStats.topRated && (
          <div className="stat-card" style={{ flex: 2, minWidth: 200 }}>
            <div className="label">Top Rated</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{seasonStats.topRated.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><StarIcon size={10} style={{ color: '#fbbf24' }} /> {seasonStats.topRated.score}</div>
          </div>
        )}
      </div>

      {/* Anime List */}
      {sortedAnime.length === 0 ? (
        <div className="empty-state">
          <CalendarIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3>No anime for {selectedSeason} {selectedYear}</h3>
          <p>Anime are grouped by when they were added to your collection.</p>
        </div>
      ) : (
        <div className="seasonal-grid">
          {sortedAnime.map(a => (
            <Link key={a.id} href={`/anime/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="seasonal-card">
                <div style={{ display: 'flex', gap: 16 }}>
                  {a.coverImage && (
                    <img src={a.coverImage} alt={a.title} style={{ width: 60, height: 84, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {a.type} {a.episodes > 0 && `• ${a.episodes} ep`}
                    </div>
                    <div className="genre-tags">
                      {(a.genres || []).slice(0, 2).map(g => <span key={g} className="genre-tag" style={{ fontSize: 10 }}>{g}</span>)}
                    </div>
                  </div>
                  {a.score > 0 && (
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <StarIcon size={14} /> {a.score}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
