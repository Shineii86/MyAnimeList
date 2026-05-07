'use client';

import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: '☀️', label: 'Light' },
    { value: 'dark' as const, icon: '🌙', label: 'Dark' },
    { value: 'system' as const, icon: '💻', label: 'System' },
  ];

  return (
    <div className="flex items-center bg-ios-gray-6 dark:bg-dark-elevated rounded-ios p-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            theme === opt.value
              ? 'bg-white dark:bg-dark-card shadow-ios dark:shadow-dark-ios text-gray-900 dark:text-dark-label'
              : 'text-gray-500 dark:text-dark-secondary hover:text-gray-700 dark:hover:text-dark-label'
          }`}
        >
          <span>{opt.icon}</span>
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
