import { useState, useEffect } from 'react';
import Head from 'next/head';
import { PlusIcon, EditIcon, TrashIcon, RocketIcon, DownloadIcon, RefreshIcon, KeyIcon, SettingsIcon, NoteIcon, SearchIcon, ClipboardIcon, ClockIcon } from '../lib/icons';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

const ACTION_ICONS = {
  add: PlusIcon,
  edit: EditIcon,
  delete: TrashIcon,
  push: RocketIcon,
  import: DownloadIcon,
  generate: RefreshIcon,
  login: KeyIcon,
  settings: SettingsIcon,
  export: DownloadIcon,
};

const ACTION_COLORS = {
  add: 'var(--success)',
  edit: '#3b82f6',
  delete: 'var(--danger)',
  push: 'var(--accent)',
  import: '#f59e0b',
  generate: '#8b5cf6',
  login: '#ec4899',
  settings: '#6b7280',
  export: '#06b6d4',
};

export default function ActivityLog({ showToast }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  useEffect(() => { loadLog(); }, [filter, search, page]);

  async function loadLog() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (filter) params.set('action', filter);
      if (search) params.set('search', search);

      const res = await apiGet(`/api/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      }
    } catch {
      showToast?.('Failed to load activity log', 'error');
    }
    setLoading(false);
  }

  async function handleClear() {
    if (!confirm('Clear entire activity log? This cannot be undone.')) return;
    try {
      const res = await apiDelete('/api/activity');
      if (res.ok) {
        setEntries([]);
        setTotal(0);
        showToast?.('Activity log cleared', 'success');
      }
    } catch {
      showToast?.('Failed to clear log', 'error');
    }
  }

  function formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  function groupByDate(entries) {
    const groups = {};
    entries.forEach(e => {
      const date = new Date(e.timestamp).toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(e);
    });
    return Object.entries(groups);
  }

  const grouped = groupByDate(entries);
  const actions = ['', 'add', 'edit', 'delete', 'push', 'import', 'generate', 'login', 'settings', 'export'];
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Head><title>Activity Log - MyAnimeList Admin</title></Head>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><ClockIcon size={24} style={{ marginRight: 8 }} /> Activity Log</h1>
          <p style={{ color: 'var(--text-muted)' }}>{total} events recorded</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleClear} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          <TrashIcon size={14} /> Clear Log
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-container" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <SearchIcon size={18} className="search-icon" />
          <input 
            className="search-input" 
            placeholder="Search activity..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(0); }} 
          />
        </div>
        <select className="form-input" style={{ width: 150 }} value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
          <option value="">All Actions</option>
          {actions.slice(1).map(a => {
            const ActionIcon = ACTION_ICONS[a];
            return (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            );
          })}
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <ClipboardIcon size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No activity yet</h3>
          <p>Actions like adding, editing, deleting anime and pushing to GitHub will appear here.</p>
        </div>
      ) : (
        <div>
          {grouped.map(([date, items]) => (
            <div key={date} style={{ marginBottom: 32 }}>
              <div style={{ 
                fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', 
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
                paddingBottom: 8, borderBottom: '1px solid var(--border)'
              }}>
                {date}
              </div>

              <div style={{ position: 'relative', paddingLeft: 24 }}>
                {/* Timeline line */}
                <div style={{
                  position: 'absolute', left: 7, top: 0, bottom: 0,
                  width: 2, background: 'var(--border)', borderRadius: 1
                }} />

                {items.map((entry, i) => {
                  const ActionIcon = ACTION_ICONS[entry.action] || NoteIcon;
                  return (
                    <div key={entry.id || i} style={{ 
                      display: 'flex', gap: 16, marginBottom: 16, position: 'relative',
                      animation: 'slideUp 0.3s ease'
                    }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute', left: -20, top: 6,
                        width: 12, height: 12, borderRadius: 6,
                        background: ACTION_COLORS[entry.action] || 'var(--text-muted)',
                        border: '2px solid var(--bg-primary)',
                        zIndex: 1
                      }} />

                      {/* Entry card */}
                      <div style={{
                        flex: 1, padding: '12px 16px',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: `${ACTION_COLORS[entry.action]}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, color: ACTION_COLORS[entry.action]
                        }}>
                          <ActionIcon size={18} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ 
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                              color: ACTION_COLORS[entry.action] || 'var(--text-muted)',
                              letterSpacing: 0.5
                            }}>
                              {entry.action}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                            {entry.target}
                          </div>
                          {entry.details && (
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                              {entry.details}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page < 3 ? i : page - 2 + i;
                if (p >= totalPages) return null;
                return (
                  <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p + 1}
                  </button>
                );
              })}
              <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
