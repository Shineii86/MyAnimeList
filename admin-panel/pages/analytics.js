import { useState, useEffect } from 'react';
import Head from 'next/head';

// SVG-based charts — no external dependencies
function BarChart({ data, width = 600, height = 300, color = 'var(--accent)' }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.value));
  const barWidth = Math.max(20, (width - 80) / data.length - 8);
  const chartHeight = height - 60;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Y-axis labels */}
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
      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = maxVal > 0 ? (d.value / maxVal) * chartHeight : 0;
        const x = 50 + i * ((width - 80) / data.length) + 4;
        const y = chartHeight - barHeight + 20;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barWidth} height={barHeight}
              fill={d.color || color} rx={4} opacity={0.85}
            />
            <text
              x={x + barWidth / 2} y={height - 5}
              textAnchor="middle" fill="var(--text-muted)" fontSize={10}
            >
              {d.label.length > 8 ? d.label.substring(0, 8) + '…' : d.label}
            </text>
            <text
              x={x + barWidth / 2} y={y - 6}
              textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight={600}
            >
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
      {/* Legend */}
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
    fetch('/api/anime')
      .then(r => r.json())
      .then(data => { setAnime(data.anime || []); setLoading(false); })
      .catch(() => { showToast?.('Failed to load data', 'error'); setLoading(false); });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  // Compute analytics
  const total = anime.length;
  const byType = {};
  const byGenre = {};
  const byLetter = {};
  const byScore = {};
  const scores = [];

  anime.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    (a.genres || []).forEach(g => { byGenre[g] = (byGenre[g] || 0) + 1; });
    byLetter[a.letter] = (byLetter[a.letter] || 0) + 1;
    if (a.score > 0) {
      const bucket = Math.floor(a.score);
      byScore[bucket] = (byScore[bucket] || 0) + 1;
      scores.push(a.score);
    }
  });

  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0';
  const highestRated = [...anime].filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  const typeData = Object.entries(byType).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const genreData = Object.entries(byGenre).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 12);
  const scoreData = [5, 6, 7, 8, 9, 10].map(s => ({ label: `${s}★`, value: byScore[s] || 0 }));
  const letterData = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => ({ label: l, value: byLetter[l] || 0 }));

  return (
    <>
      <Head><title>Analytics - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>📊 Analytics</h1>
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
      </div>

      {/* Score Distribution */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title">⭐ Score Distribution</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <BarChart data={scoreData} width={500} height={250} color="#fbbf24" />
        </div>
      </div>

      {/* Type & Genre */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📺 By Type</h2>
          </div>
          <DonutChart data={typeData} size={180} />
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🏷️ Top Genres</h2>
          </div>
          {genreData.slice(0, 8).map((g, i) => (
            <StatRow key={g.label} label={g.label} value={g.value} total={total} color={
              ['#7c3aed', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'][i]
            } />
          ))}
        </div>
      </div>

      {/* Letter Distribution */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title">🔤 Distribution by Letter</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <BarChart data={letterData} width={900} height={200} color="#7c3aed" />
        </div>
      </div>

      {/* Highest Rated */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🏆 Highest Rated</h2>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {highestRated.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: 'var(--bg-input)', borderRadius: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', width: 30 }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.type} • {(a.genres || []).slice(0, 3).join(', ')}</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>⭐ {a.score}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
