import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useKeyboardShortcuts from '../lib/keyboard-shortcuts';

function Sidebar({ currentPath, isOpen, onClose }) {
  const [autoPushEnabled, setAutoPushEnabled] = useState(false);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
      setAutoPushEnabled(settings.autoPush && settings.githubToken);
    } catch {}
  }, [currentPath]);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'All Anime', path: '/anime', icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2' },
    { label: 'Add Anime', path: '/anime/add', icon: 'M12 4v16m8-8H4' },
    { label: 'Bulk Import', path: '/bulk-import', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: 'Analytics', path: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Random Picker', path: '/random', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  ];

  const discoverItems = [
    { label: 'Seasonal Tracker', path: '/seasonal', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'What to Watch', path: '/discover', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { label: 'Custom Lists', path: '/lists', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ];

  const toolItems = [
    { label: 'AniList Search', path: '/anilist', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { label: 'MAL Import', path: '/mal-import', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { label: 'Push to GitHub', path: '/push', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Activity Log', path: '/activity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" onClick={onClose}>
            <img src="https://raw.githubusercontent.com/Shineii86/MyAnimeList/refs/heads/main/assets/logo.png" alt="Logo" />
            <div>
              <h1>MyAnimeList</h1>
              <span>Admin Panel</span>
            </div>
          </Link>
        </div>
        <nav>
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {navItems.map(item => (
              <Link key={item.path} href={item.path} className={`nav-link ${currentPath === item.path ? 'active' : ''}`} onClick={onClose}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Discover</div>
            {discoverItems.map(item => (
              <Link key={item.path} href={item.path} className={`nav-link ${currentPath === item.path ? 'active' : ''}`} onClick={onClose}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Tools</div>
            {toolItems.map(item => (
              <Link key={item.path} href={item.path} className={`nav-link ${currentPath === item.path ? 'active' : ''}`} onClick={onClose}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
          {/* Auto-Push Status */}
          <div className="nav-section" style={{ marginTop: 16, padding: '0 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: autoPushEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(136, 136, 170, 0.1)',
              border: `1px solid ${autoPushEnabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
              borderRadius: 8, fontSize: 12
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                background: autoPushEnabled ? 'var(--success)' : 'var(--text-muted)',
                boxShadow: autoPushEnabled ? '0 0 6px var(--success)' : 'none'
              }} />
              <span style={{ color: autoPushEnabled ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                Auto-Push {autoPushEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, []);

  return <div className={`toast toast-${type}`}>{message}</div>;
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = router.pathname === '/login';

  useKeyboardShortcuts();

  useEffect(() => {
    checkAuth();
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/stats');
      if (res.status === 401) {
        setAuthenticated(false);
        if (!isLoginPage) router.push('/login');
      } else {
        setAuthenticated(true);
        if (isLoginPage) router.push('/');
      }
    } catch {
      setAuthenticated(false);
    }
  }

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  if (authenticated === null && !isLoginPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (isLoginPage) {
    return <Component {...pageProps} showToast={showToast} />;
  }

  if (!authenticated) return null;

  return (
    <div className="app-container">
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      <Sidebar currentPath={router.pathname} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Component {...pageProps} showToast={showToast} />
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MyApp;
