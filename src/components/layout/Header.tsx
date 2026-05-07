'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-label">{title}</h1>
        {subtitle && <p className="text-sm text-ios-gray-1 dark:text-dark-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
