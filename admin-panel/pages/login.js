import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { UnlockIcon, WarningIcon } from '../lib/icons';

export default function Login({ showToast }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [noPassword, setNoPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if ADMIN_PASSWORD is configured
    fetch('/api/auth', { method: 'GET' })
      .then(r => r.json())
      .then(data => {
        if (data.noPassword) setNoPassword(true);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok) {
        showToast?.('Welcome back!', 'success');
        router.push('/');
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login - MyAnimeList Admin</title>
      </Head>
      <div className="login-container">
        <div className="login-card">
          <img 
            src="https://raw.githubusercontent.com/Shineii86/MyAnimeList/refs/heads/main/assets/logo.png" 
            alt="Logo" 
          />
          <h1>MyAnimeList</h1>

          {noPassword ? (
            <>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 700, color: 'var(--danger)' }}>
                  <WarningIcon size={16} /> Admin Password Not Configured
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Set the <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>ADMIN_PASSWORD</code> environment variable to secure your admin panel.
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-input)', padding: 12, borderRadius: 6 }}>
                  <div style={{ marginBottom: 4, color: 'var(--text-secondary)' }}>In Vercel → Settings → Environment Variables:</div>
                  <div>ADMIN_PASSWORD=your-secret-password</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>Enter your admin password to continue</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                {error && <div className="login-error">{error}</div>}
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? <><div className="spinner" /> Authenticating...</> : <><UnlockIcon size={16} /> Sign In</>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
