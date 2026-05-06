import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login({ showToast }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        showToast?.('Welcome back! 👋', 'success');
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
              {loading ? <><div className="spinner" /> Authenticating...</> : '🔓 Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
