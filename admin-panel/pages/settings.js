import { useState, useEffect } from 'react';
import Head from 'next/head';
import { SettingsIcon, RocketIcon, TagIcon, SaveIcon, DownloadIcon, UploadIcon, CheckCircleIcon } from '../lib/icons';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export default function SettingsPage({ showToast }) {
  const [settings, setSettings] = useState({
    autoPush: false,
    githubToken: '',
    owner: 'Shineii86',
    repo: 'MyAnimeList',
    showCovers: true,
    defaultType: 'TV',
    defaultSort: 'title',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('mal_admin_settings');
    if (stored) {
      setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
    }
  }, []);

  function handleChange(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem('mal_admin_settings', JSON.stringify(settings));
    setSaved(true);
    showToast?.('Settings saved', 'success');
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    apiGet('/api/anime')
      .then(r => r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `myanimelist-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast?.('Backup downloaded', 'success');
      })
      .catch(() => showToast?.('Export failed', 'error'));
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.anime || !Array.isArray(data.anime)) {
          showToast?.('Invalid backup file', 'error');
          return;
        }
        
        const mode = confirm(`Import ${data.anime.length} anime entries?\n\nOK = Merge (add new, skip duplicates)\nCancel = Replace (⚠️ overwrites everything)`)
          ? 'merge' : 'replace';

        if (mode === 'replace' && !confirm(`⚠️ This will REPLACE your entire collection with ${data.anime.length} entries. Continue?`)) return;

        const res = await apiPost('/api/anime/import', { ...data, mode });

        if (res.ok) {
          const result = await res.json();
          showToast?.(result.message, 'success');
        } else {
          showToast?.('Import failed', 'error');
        }
      } catch {
        showToast?.('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <Head><title>Settings - MyAnimeList Admin</title></Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><SettingsIcon size={24} style={{ marginRight: 8 }} /> Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure your admin panel preferences</p>
      </div>

      {/* Auto-Push */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><RocketIcon size={18} style={{ marginRight: 6 }} /> Auto-Push to GitHub</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          When enabled, every add/edit/delete automatically commits and pushes changes to your repository.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button
            onClick={() => handleChange('autoPush', !settings.autoPush)}
            style={{
              width: 56, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
              background: settings.autoPush ? 'var(--success)' : 'var(--border)',
              position: 'relative', transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 12, background: 'white',
              position: 'absolute', top: 3, left: settings.autoPush ? 29 : 3,
              transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }} />
          </button>
          <span style={{ fontWeight: 600, color: settings.autoPush ? 'var(--success)' : 'var(--text-muted)' }}>
            {settings.autoPush ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {settings.autoPush && (
          <>
            <div className="form-group">
              <label className="form-label">GitHub Token (required for auto-push)</label>
              <input
                className="form-input"
                type="password"
                value={settings.githubToken}
                onChange={e => handleChange('githubToken', e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Owner</label>
                <input className="form-input" value={settings.owner} onChange={e => handleChange('owner', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Repo</label>
                <input className="form-input" value={settings.repo} onChange={e => handleChange('repo', e.target.value)} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Display */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><TagIcon size={18} style={{ marginRight: 6 }} /> Display</h2>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Default Type</label>
            <select className="form-input" value={settings.defaultType} onChange={e => handleChange('defaultType', e.target.value)}>
              <option value="TV">TV</option>
              <option value="Movie">Movie</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Sort</label>
            <select className="form-input" value={settings.defaultSort} onChange={e => handleChange('defaultSort', e.target.value)}>
              <option value="title">Title (A-Z)</option>
              <option value="score">Score (High-Low)</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><SaveIcon size={18} style={{ marginRight: 6 }} /> Backup & Restore</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Export your entire anime collection as a JSON file, or restore from a previous backup.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExport}>
            <DownloadIcon size={16} /> Export Collection
          </button>
          <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
            <UploadIcon size={16} /> Import Backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Auto-Backup */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><SaveIcon size={18} style={{ marginRight: 6 }} /> Auto-Backup to GitHub</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Automatically back up your anime.json to a <code>backups/</code> folder in your repository.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button
            onClick={() => handleChange('autoBackup', !settings.autoBackup)}
            style={{
              width: 56, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
              background: settings.autoBackup ? 'var(--success)' : 'var(--border)',
              position: 'relative', transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 12, background: 'white',
              position: 'absolute', top: 3, left: settings.autoBackup ? 29 : 3,
              transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }} />
          </button>
          <span style={{ fontWeight: 600, color: settings.autoBackup ? 'var(--success)' : 'var(--text-muted)' }}>
            {settings.autoBackup ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        {settings.autoBackup && (
          <div className="form-group">
            <label className="form-label">Backup Interval</label>
            <select className="form-input" value={settings.backupInterval || 'daily'} onChange={e => handleChange('backupInterval', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        )}
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={async () => {
          const settings = JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
          try {
            const res = await apiPost('/api/backup', { action: 'backup', github_token: settings.githubToken, owner: settings.owner, repo: settings.repo });
            if (res.ok) { const d = await res.json(); showToast?.(`Backup saved: ${d.path}`, 'success'); }
            else showToast?.('Backup failed', 'error');
          } catch { showToast?.('Backup error', 'error'); }
        }}>
          <DownloadIcon size={16} /> Backup Now
        </button>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-success" onClick={handleSave}>
          {saved ? <><CheckCircleIcon size={16} /> Saved!</> : <><SaveIcon size={16} /> Save Settings</>}
        </button>
      </div>
    </>
  );
}
