'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/anime', label: 'Anime List', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { href: '/anime/add', label: 'Add Anime', icon: 'M12 4v16m8-8H4' },
  { href: '/bulk', label: 'Bulk Add', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { href: '/search', label: 'AniList Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { href: '/import', label: 'Import/Export', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
  { href: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [githubStatus, setGithubStatus] = useState<{ configured: boolean; owner?: string; repo?: string } | null>(null);

  useEffect(() => {
    fetch('/api/github/status').then(r => r.json()).then(setGithubStatus).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-dark-card/80 backdrop-blur-ios border-r border-ios-gray-5 dark:border-dark-separator h-screen sticky top-0">
      <div className="p-5 border-b border-ios-gray-5 dark:border-dark-separator">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ios-blue rounded-ios flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-dark-label">Anime Admin</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-ios text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-ios-blue/10 text-ios-blue'
                  : 'text-gray-600 dark:text-dark-secondary hover:bg-ios-gray-6 dark:hover:bg-dark-elevated hover:text-gray-900 dark:hover:text-dark-label'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-ios-gray-5 dark:border-dark-separator space-y-3">
        {githubStatus && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-ios text-xs ${githubStatus.configured ? 'bg-ios-green/10 text-ios-green' : 'bg-ios-gray-6 dark:bg-dark-elevated text-ios-gray-1 dark:text-dark-secondary'}`}>
            <span className={`w-2 h-2 rounded-full ${githubStatus.configured ? 'bg-ios-green' : 'bg-ios-gray-3'}`} />
            {githubStatus.configured ? (
              <span>GitHub: {githubStatus.owner}/{githubStatus.repo}</span>
            ) : (
              <span>GitHub: Not configured</span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-ios text-xs font-medium text-ios-gray-1 dark:text-dark-secondary hover:text-ios-red hover:bg-ios-red/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
        <p className="text-xs text-ios-gray-2 dark:text-dark-tertiary text-center">Anime Admin v1.0</p>
      </div>
    </aside>
  );
}
