import { useState, useEffect } from 'react';
import Head from 'next/head';
import { SettingsIcon, RocketIcon, TagIcon, SaveIcon, DownloadIcon, UploadIcon, CheckCircleIcon } from '../lib/icons';

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
    fetch('/api/anime')
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
        
        if (!confirm(`Import ${data.anime.length} anime entries? This will replace all current data.`)) return;

        const res = await fetch('/api/anime/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          showToast?.(`Imported ${data.anime.length} entries`, 'success');
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

      {/* Save */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-success" onClick={handleSave}>
          {saved ? <><CheckCircleIcon size={16} /> Saved!</> : <><SaveIcon size={16} /> Save Settings</>}
        </button>
      </div>
    </>
  );
}
