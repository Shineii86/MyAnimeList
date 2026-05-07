'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          placeholder="Enter username"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-ios-gray-6 dark:bg-dark-elevated rounded-ios text-gray-900 dark:text-dark-label focus:outline-none focus:ring-2 focus:ring-ios-blue/30 transition-all"
          placeholder="Enter password"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios p-3">
          <p className="text-sm text-ios-red">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-ios-blue text-white rounded-ios font-semibold text-sm hover:bg-ios-blue/90 disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ios-gray-6 dark:bg-dark-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ios-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-ios-md">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-label">Anime Admin</h1>
          <p className="text-sm text-ios-gray-1 dark:text-dark-secondary mt-1">Sign in to manage your collection</p>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-ios-xl shadow-ios-lg dark:shadow-dark-ios p-6">
          <Suspense fallback={<div className="text-center py-8 text-ios-gray-1">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-ios-gray-2 dark:text-dark-tertiary mt-6">
          Set ADMIN_USERNAME and ADMIN_PASSWORD in .env
        </p>
      </div>
    </div>
  );
}
