import { useState } from 'react';
import Head from 'next/head';
import { NoteIcon, RocketIcon } from '../lib/icons';

export default function PushPage({ showToast }) {
  const [githubToken, setGithubToken] = useState('');
  const [owner, setOwner] = useState('Shineii86');
  const [repo, setRepo] = useState('MyAnimeList');
  const [pushing, setPushing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState('');

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(data.message, 'success');
        setPreview(data.preview);
      } else {
        showToast?.(data.error || 'Generation failed', 'error');
      }
    } catch {
      showToast?.('Error generating README', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePush() {
    if (!githubToken.trim()) {
      showToast?.('GitHub token is required', 'error');
      return;
    }

    setPushing(true);
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'push',
          github_token: githubToken,
          owner,
          repo
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.('Pushed to GitHub successfully!', 'success');
      } else {
        showToast?.(data.error || 'Push failed', 'error');
      }
    } catch {
      showToast?.('Error pushing to GitHub', 'error');
    } finally {
      setPushing(false);
    }
  }

  return (
    <>
      <Head>
        <title>Push to GitHub - MyAnimeList Admin</title>
      </Head>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Push to GitHub</h1>
        <p style={{ color: 'var(--text-muted)' }}>Generate README and push changes to your repository</p>
      </div>

      {/* Generate README */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title"><NoteIcon size={18} style={{ marginRight: 6 }} /> Step 1: Generate README</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Regenerate the README.md file from your current anime data. This updates the file locally.
        </p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><div className="spinner" /> Generating...</> : <><NoteIcon size={16} /> Generate README.md</>}
        </button>

        {preview && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-input)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 200, overflow: 'auto' }}>
            {preview}
          </div>
        )}
      </div>

      {/* Push to GitHub */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><RocketIcon size={18} style={{ marginRight: 6 }} /> Step 2: Push to GitHub</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Push the generated README and data files to your GitHub repository. You need a Personal Access Token with repo permissions.
        </p>

        <div className="form-group">
          <label className="form-label">GitHub Personal Access Token</label>
          <input 
            className="form-input" 
            type="password"
            value={githubToken} 
            onChange={e => setGithubToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Generate at: GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
          </p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Repository Owner</label>
            <input className="form-input" value={owner} onChange={e => setOwner(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Repository Name</label>
            <input className="form-input" value={repo} onChange={e => setRepo(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-success" onClick={handlePush} disabled={pushing}>
          {pushing ? <><div className="spinner" /> Pushing...</> : <><RocketIcon size={16} /> Push to GitHub</>}
        </button>
      </div>
    </>
  );
}
