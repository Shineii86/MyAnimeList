import { useState, useEffect } from 'react';
import Head from 'next/head';
import { StarIcon, SearchIcon, PlusIcon, RefreshIcon, TagIcon, RocketIcon } from '../lib/icons';
import { apiGet, apiPost } from '../lib/api';

export default function Discover({ showToast }) {
  const [anime, setAnime] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [activeGenre, setActiveGenre] = useState(null);
  const [importing, setImporting] = useState(null);

  useEffect(() => {
    apiGet('/api/anime')
      .then(r => r.json())
      .then(data => {
        setAnime(data.anime || []);
        generateRecommendations(data.anime || []);
        setLoading(false);
      })
      .catch(() => { showToast?.('Failed to load data', 'error'); setLoading(false); });
  }, []);

  function generateRecommendations(collection) {
    // Analyze user's preferences
    const genreScores = {};
    const genreCounts = {};
    collection.forEach(a => {
      (a.genres || []).forEach(g => {
        if (!genreScores[g]) { genreScores[g] = { total: 0, count: 0 }; }
        if (a.score > 0) { genreScores[g].total += a.score; genreScores[g].count++; }
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    // Get top genres by avg score (with minimum 2 anime)
    const topGenres = Object.entries(genreScores)
      .filter(([_, v]) => v.count >= 2)
      .map(([genre, v]) => ({ genre, avg: v.total / v.count, count: genreCounts[genre] }))
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 5)
      .map(g => g.genre);

    // Fetch recommendations from AniList for top genres
    fetchAniListRecommendations(topGenres, collection);
  }

  async function fetchAniListRecommendations(genres, collection) {
    setFetching(true);
    const existingIds = new Set(collection.map(a => a.anilistId).filter(Boolean));
    const allRecs = [];

    for (const genre of genres.slice(0, 3)) {
      try {
        const query = `
          query ($genre: String) {
            Page(page: 1, perPage: 10) {
              media(genre: $genre, type: ANIME, sort: SCORE_DESC, status: FINISHED) {
                id
                title { romaji english }
                type
                format
                episodes
                averageScore
                genres
                coverImage { large }
                siteUrl
              }
            }
          }
        `;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query, variables: { genre } })
        });
        if (res.ok) {
          const data = await res.json();
          const media = data.data?.Page?.media || [];
          media.forEach(m => {
            if (!existingIds.has(m.id)) {
              allRecs.push({
                anilistId: m.id,
                title: m.title.english || m.title.romaji,
                titleRomaji: m.title.romaji,
                type: m.type === 'ANIME' ? (m.format === 'MOVIE' ? 'Movie' : 'TV') : m.type,
                episodes: m.episodes,
                score: m.averageScore ? (m.averageScore / 10).toFixed(1) : null,
                genres: m.genres || [],
                coverImage: m.coverImage?.large,
                anilistUrl: m.siteUrl || `https://anilist.co/anime/${m.id}`,
                reason: genre
              });
              existingIds.add(m.id);
            }
          });
        }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }

    // Deduplicate and sort by score
    const seen = new Set();
    const unique = allRecs.filter(r => {
      if (seen.has(r.anilistId)) return false;
      seen.add(r.anilistId);
      return true;
    }).sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0));

    setRecommendations(unique.slice(0, 20));
    setFetching(false);
  }

  async function quickAdd(rec) {
    setImporting(rec.anilistId);
    try {
      const res = await apiPost('/api/anime', {
        title: rec.title,
        anilistUrl: rec.anilistUrl,
        anilistId: rec.anilistId,
        type: rec.type || 'TV',
        score: rec.score ? parseFloat(rec.score) : 0,
        genres: rec.genres || [],
        episodes: rec.episodes || 0
      });
      if (res.ok) {
        showToast?.(`Added: ${rec.title}`, 'success');
        setAnime(prev => [...prev, { ...rec, id: Date.now(), status: 'Plan to Watch' }]);
      } else {
        showToast?.('Failed to add', 'error');
      }
    } catch {
      showToast?.('Error adding', 'error');
    }
    setImporting(null);
  }

  // Get unique genres from collection
  const topGenres = [...new Set(anime.flatMap(a => a.genres || []))].sort();
  const filteredRecs = activeGenre ? recommendations.filter(r => r.genres.includes(activeGenre)) : recommendations;

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <>
      <Head><title>What to Watch - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><StarIcon size={18} style={{ marginRight: 6 }} /> What to Watch Next</h1>
        <p style={{ color: 'var(--text-muted)' }}>Recommendations based on your top-rated genres from AniList</p>
      </div>

      {/* Top Genres Analysis */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><TagIcon size={18} style={{ marginRight: 6 }} /> Your Top Genres</h2>
          <button className="btn btn-sm btn-outline" onClick={() => generateRecommendations(anime)} disabled={fetching}>
            {fetching ? <div className="spinner" /> : <><RefreshIcon size={14} /> Refresh</>}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`genre-tag ${!activeGenre ? 'active' : ''}`} style={!activeGenre ? { background: 'var(--accent)', color: 'white', border: 'none' } : {}} onClick={() => setActiveGenre(null)}>
            All
          </button>
          {topGenres.slice(0, 12).map(g => (
            <button key={g} className="genre-tag" style={activeGenre === g ? { background: 'var(--accent)', color: 'white', border: 'none' } : { cursor: 'pointer' }} onClick={() => setActiveGenre(activeGenre === g ? null : g)}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {fetching ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Fetching recommendations from AniList...</p>
          </div>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="empty-state">
          <StarIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3>No recommendations yet</h3>
          <p>Add more anime with scores to get personalized recommendations.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredRecs.map(rec => (
            <div key={rec.anilistId} className="card" style={{ display: 'flex', gap: 16, padding: 16 }}>
              {rec.coverImage && (
                <img src={rec.coverImage} alt={rec.title} style={{ width: 70, height: 98, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.title}</div>
                {rec.titleRomaji !== rec.title && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.titleRomaji}</div>
                )}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${rec.type?.toLowerCase()}`}>{rec.type}</span>
                  {rec.score && <span style={{ fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 2 }}><StarIcon size={10} /> {rec.score}</span>}
                  {rec.episodes > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.episodes} ep</span>}
                </div>
                <div className="genre-tags" style={{ marginBottom: 8 }}>
                  {(rec.genres || []).slice(0, 3).map(g => <span key={g} className="genre-tag" style={{ fontSize: 10 }}>{g}</span>)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-primary" onClick={() => quickAdd(rec)} disabled={importing === rec.anilistId}>
                    {importing === rec.anilistId ? <div className="spinner" /> : <><PlusIcon size={12} /> Add</>}
                  </button>
                  <a href={rec.anilistUrl} target="_blank" rel="noopener" className="btn btn-sm btn-outline">
                    View ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
