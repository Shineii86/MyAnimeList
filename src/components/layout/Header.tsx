'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-label">{title}</h1>
        {subtitle && <p className="text-sm text-ios-gray-1 dark:text-dark-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="px-3 py-2 text-xs font-medium text-ios-gray-1 dark:text-dark-secondary hover:text-ios-red hover:bg-ios-red/10 rounded-ios transition-colors"
          title="Sign out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
