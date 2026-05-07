import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChartIcon, StarIcon, TvIcon, TagIcon, ListIcon, RocketIcon, CheckCircleIcon } from '../lib/icons';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

function BarChart({ data, width = 600, height = 300, color = 'var(--accent)' }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value));
  const barWidth = Math.max(20, (width - 80) / data.length - 8);
  const chartHeight = height - 60;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = chartHeight - (chartHeight * pct) + 20;
        const val = Math.round(maxVal * pct);
        return (
          <g key={pct}>
            <line x1={40} y1={y} x2={width - 20} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="4" />
            <text x={35} y={y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11}>{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barHeight = maxVal > 0 ? (d.value / maxVal) * chartHeight : 0;
        const x = 50 + i * ((width - 80) / data.length) + 4;
        const y = chartHeight - barHeight + 20;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} fill={d.color || color} rx={4} opacity={0.85} />
            <text x={x + barWidth / 2} y={height - 5} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
              {d.label.length > 8 ? d.label.substring(0, 8) + '…' : d.label}
            </text>
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, size = 200 }) {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 20;
  const innerR = r * 0.6;
  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#3b82f6', '#60a5fa', '#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ef4444', '#f87171', '#ec4899'];

  let cumAngle = -90;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const ix1 = cx + innerR * Math.cos(endRad);
    const iy1 = cy + innerR * Math.sin(endRad);
    const ix2 = cx + innerR * Math.cos(startRad);
    const iy2 = cy + innerR * Math.sin(startRad);
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    return (
      <path key={i} d={path} fill={colors[i % colors.length]} opacity={0.85}>
        <title>{d.label}: {d.value} ({Math.round(d.value / total * 100)}%)</title>
      </path>
    );
  });

  return (
    <svg width={size + 160} height={size}>
      {slices}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize={24} fontWeight={800}>{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>Total</text>
      <g transform={`translate(${size + 10}, 10)`}>
        {data.slice(0, 8).map((d, i) => (
          <g key={i} transform={`translate(0, ${i * 22})`}>
            <rect width={12} height={12} rx={3} fill={colors[i % colors.length]} opacity={0.85} />
            <text x={18} y={10} fill="var(--text-secondary)" fontSize={11}>{d.label} ({d.value})</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function HeatmapGrid({ data, rows, cols, rowLabels, colLabels }) {
  if (!data) return null;
  const maxVal = Math.max(...data.flat().map(d => d.value));
  const getColor = (val) => {
    if (val === 0) return 'var(--bg-input)';
    const intensity = val / maxVal;
    if (intensity < 0.25) return 'rgba(124, 58, 237, 0.2)';
    if (intensity < 0.5) return 'rgba(124, 58, 237, 0.4)';
    if (intensity < 0.75) return 'rgba(124, 58, 237, 0.6)';
    return 'rgba(124, 58, 237, 0.9)';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${cols}, 1fr)`, gap: 4, minWidth: 500 }}>
        <div></div>
        {colLabels.map((label, j) => (
          <div key={j} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', padding: '4px 0' }}>{label}</div>
        ))}
        {rowLabels.map((label, i) => (
          <>
            <div key={`label-${i}`} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', paddingRight: 8 }}>{label}</div>
            {data[i].map((cell, j) => (
              <div key={`${i}-${j}`} className="heatmap-cell" style={{ background: getColor(cell.value), color: cell.value > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {cell.value > 0 ? cell.value : ''}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{value} ({Math.round(pct)}%)</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color || 'var(--accent)', borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function Analytics({ showToast }) {
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/anime')
      .then(r => r.json())
      .then(data => { setAnime(data.anime || []); setLoading(false); })
      .catch(() => { showToast?.('Failed to load data', 'error'); setLoading(false); });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  const total = anime.length;
  const byType = {};
  const byGenre = {};
  const byLetter = {};
  const byScore = {};
  const byYear = {};
  const byStudio = {};
  const scores = [];
  const genreByScore = {};

  anime.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    (a.genres || []).forEach(g => {
      byGenre[g] = (byGenre[g] || 0) + 1;
      if (!genreByScore[g]) genreByScore[g] = { total: 0, count: 0 };
      if (a.score > 0) { genreByScore[g].total += a.score; genreByScore[g].count++; }
    });
    byLetter[a.letter] = (byLetter[a.letter] || 0) + 1;
    if (a.score > 0) {
      const bucket = Math.floor(a.score);
      byScore[bucket] = (byScore[bucket] || 0) + 1;
      scores.push(a.score);
    }
    if (a.addedAt) {
      const year = new Date(a.addedAt).getFullYear();
      byYear[year] = (byYear[year] || 0) + 1;
    }
    (a.studios || []).forEach(s => { byStudio[s] = (byStudio[s] || 0) + 1; });
  });

  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0';
  const highestRated = [...anime].filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  const typeData = Object.entries(byType).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const genreData = Object.entries(byGenre).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 12);
  const scoreData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => ({ label: `${s}★`, value: byScore[s] || 0 }));
  const letterData = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => ({ label: l, value: byLetter[l] || 0 }));
  const yearData = Object.entries(byYear).map(([label, value]) => ({ label, value })).sort((a, b) => a.label - b.label);
  const studioData = Object.entries(byStudio).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  // Genre avg score ranking
  const genreAvgScore = Object.entries(genreByScore)
    .filter(([_, v]) => v.count >= 3)
    .map(([genre, v]) => ({ genre, avg: (v.total / v.count).toFixed(1), count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  // Genre heatmap: genres x score ranges
  const heatmapGenres = genreData.slice(0, 8).map(g => g.label);
  const heatmapScores = ['1-3', '4-5', '6-7', '8-9', '10'];
  const heatmapData = heatmapGenres.map(genre => {
    return heatmapScores.map(range => {
      const [min, max] = range === '10' ? [10, 10] : range.split('-').map(Number);
      const count = anime.filter(a =>
        a.genres && a.genres.includes(genre) && a.score >= min && a.score <= max
      ).length;
      return { value: count };
    });
  });

  return (
    <>
      <Head><title>Analytics - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><ChartIcon size={18} style={{ marginRight: 6 }} /> Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Visual insights into your anime collection</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="label">Total Anime</div>
          <div className="value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Average Score</div>
          <div className="value">{avgScore}</div>
        </div>
        <div className="stat-card">
          <div className="label">Unique Genres</div>
          <div className="value">{Object.keys(byGenre).length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Top Genre</div>
          <div className="value" style={{ fontSize: 18 }}>{genreData[0]?.label || 'N/A'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Episodes</div>
          <div className="value">{anime.reduce((s, a) => s + (a.episodes || 0), 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="label">Highest Score</div>
          <div className="value">{highestRated[0]?.score || 'N/A'}</div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><StarIcon size={18} style={{ marginRight: 6, color: '#fbbf24' }} /> Score Distribution</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <BarChart data={scoreData} width={600} height={250} color="#fbbf24" />
        </div>
      </div>

      {/* Type & Genre */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><TvIcon size={18} style={{ marginRight: 6 }} /> By Type</h2>
          </div>
          <DonutChart data={typeData} size={180} />
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><TagIcon size={18} style={{ marginRight: 6 }} /> Top Genres</h2>
          </div>
          {genreData.slice(0, 8).map((g, i) => (
            <StatRow key={g.label} label={g.label} value={g.value} total={total} color={
              ['#7c3aed', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'][i]
            } />
          ))}
        </div>
      </div>

      {/* Genre Heatmap */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><ChartIcon size={18} style={{ marginRight: 6 }} /> Genre × Score Heatmap</h2>
        </div>
        <HeatmapGrid data={heatmapData} rows={heatmapGenres.length} cols={heatmapScores.length} rowLabels={heatmapGenres} colLabels={heatmapScores} />
      </div>

      {/* Watching Timeline */}
      {yearData.length > 1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title"><ListIcon size={18} style={{ marginRight: 6 }} /> Watching Timeline</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <BarChart data={yearData} width={Math.max(400, yearData.length * 80)} height={200} color="#3b82f6" />
          </div>
        </div>
      )}

      {/* Top Studios */}
      {studioData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title"><TvIcon size={18} style={{ marginRight: 6 }} /> Top Studios</h2>
          </div>
          {studioData.map((s, i) => (
            <StatRow key={s.label} label={s.label} value={s.value} total={total} color={
              ['#7c3aed', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6'][i]
            } />
          ))}
        </div>
      )}

      {/* Genre Avg Score Ranking */}
      {genreAvgScore.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title"><StarIcon size={18} style={{ marginRight: 6, color: '#fbbf24' }} /> Genre Avg Score (3+ anime)</h2>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {genreAvgScore.slice(0, 10).map((g, i) => (
              <div key={g.genre} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', width: 30 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{g.genre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.count} anime</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}><StarIcon size={14} style={{ color: '#fbbf24' }} /> {g.avg}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letter Distribution */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><ListIcon size={18} style={{ marginRight: 6 }} /> Distribution by Letter</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <BarChart data={letterData} width={900} height={200} color="#7c3aed" />
        </div>
      </div>

      {/* Highest Rated */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><CheckCircleIcon size={18} style={{ marginRight: 6, color: '#fbbf24' }} /> Highest Rated</h2>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {highestRated.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', width: 30 }}>#{i + 1}</span>
              {a.coverImage && <img src={a.coverImage} alt="" style={{ width: 36, height: 50, borderRadius: 4, objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.type} • {(a.genres || []).slice(0, 3).join(', ')}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}><StarIcon size={14} style={{ color: '#fbbf24' }} /> {a.score}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
