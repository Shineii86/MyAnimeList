import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function Sidebar({ currentPath }) {
  const router = useRouter();
  
  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'All Anime', path: '/anime', icon: 'M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2' },
    { label: 'Add Anime', path: '/anime/add', icon: 'M12 4v16m8-8H4' },
    { label: 'AniList Search', path: '/anilist', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { label: 'Push to GitHub', path: '/push', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
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
          {navItems.slice(0, 3).map(item => (
            <Link key={item.path} href={item.path} className={`nav-link ${currentPath === item.path ? 'active' : ''}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-section-title">Tools</div>
          {navItems.slice(3).map(item => (
            <Link key={item.path} href={item.path} className={`nav-link ${currentPath === item.path ? 'active' : ''}`}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
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
  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    checkAuth();
  }, []);

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
      <Sidebar currentPath={router.pathname} />
      <main className="main-content">
        <Component {...pageProps} showToast={showToast} />
      </main>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MyApp;
