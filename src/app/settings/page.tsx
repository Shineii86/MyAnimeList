'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';

export default function SettingsPage() {
  const { theme, soundEnabled, setSoundEnabled } = useTheme();
  const { addToast } = useToast();
  const sounds = useSoundEffects();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleTestSound = () => {
    sounds.click();
    addToast('Sound test!', 'info');
  };

  return (
    <div>
      <Header title="Settings" subtitle="Customize your experience" />

      <div className="max-w-2xl space-y-6">
        {/* Appearance */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-ios-gray-5 dark:border-dark-separator">
            <h3 className="font-semibold text-gray-900 dark:text-dark-label">Appearance</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-dark-label">Theme</p>
                <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-0.5">
                  Choose light, dark, or follow system preference
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-dark-label">Current Theme</p>
                <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-0.5">
                  {theme === 'system' ? 'Following system preference' : `Manually set to ${theme}`}
                </p>
              </div>
              <span className="text-2xl">{theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}</span>
            </div>
          </div>
        </div>

        {/* Sound */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-ios-gray-5 dark:border-dark-separator">
            <h3 className="font-semibold text-gray-900 dark:text-dark-label">Sound Effects</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-dark-label">Enable Sounds</p>
                <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-0.5">
                  Play sounds on actions like add, delete, and errors
                </p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`toggle-switch ${soundEnabled ? 'active' : ''}`}
                role="switch"
                aria-checked={soundEnabled}
              />
            </div>

            {soundEnabled && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-label">Test Sound</p>
                  <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-0.5">
                    Preview the click sound effect
                  </p>
                </div>
                <button
                  onClick={handleTestSound}
                  className="px-4 py-2 bg-ios-blue/10 text-ios-blue rounded-ios text-sm font-medium hover:bg-ios-blue/20 transition-colors"
                >
                  🔊 Play
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-ios-gray-5 dark:border-dark-separator">
            <h3 className="font-semibold text-gray-900 dark:text-dark-label">Data Management</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-dark-label">Export Data</p>
                <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-0.5">
                  Download your anime collection as JSON or CSV
                </p>
              </div>
              <a
                href="/import"
                className="px-4 py-2 bg-ios-green/10 text-ios-green rounded-ios text-sm font-medium hover:bg-ios-green/20 transition-colors"
              >
                Go to Export
              </a>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-dark-label">Import from AniList</p>
                <p className="text-xs text-ios-gray-1 dark:text-dark-secondary mt-0.5">
                  Import your completed anime from AniList
                </p>
              </div>
              <a
                href="/import"
                className="px-4 py-2 bg-ios-blue/10 text-ios-blue rounded-ios text-sm font-medium hover:bg-ios-blue/20 transition-colors"
              >
                Go to Import
              </a>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-ios-gray-5 dark:border-dark-separator">
            <h3 className="font-semibold text-gray-900 dark:text-dark-label">About</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ios-gray-1 dark:text-dark-secondary">Version</span>
              <span className="text-sm font-medium text-gray-900 dark:text-dark-label">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ios-gray-1 dark:text-dark-secondary">Built with</span>
              <span className="text-sm font-medium text-gray-900 dark:text-dark-label">Next.js 14 + Tailwind CSS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ios-gray-1 dark:text-dark-secondary">Data Source</span>
              <span className="text-sm font-medium text-gray-900 dark:text-dark-label">AniList API + Local JSON</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ios-gray-1 dark:text-dark-secondary">UI Style</span>
              <span className="text-sm font-medium text-gray-900 dark:text-dark-label">iOS Design Language</span>
            </div>
            <div className="pt-3 border-t border-ios-gray-5 dark:border-dark-separator">
              <a
                href="https://github.com/Shineii86/MyAnimeList"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-ios-blue hover:underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-ios-gray-5 dark:border-dark-separator">
            <h3 className="font-semibold text-gray-900 dark:text-dark-label">Keyboard Shortcuts</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {[
                { key: 'Esc', action: 'Close modals and dialogs' },
                { key: 'Enter', action: 'Submit forms and search' },
                { key: '/', action: 'Focus search (on list page)' },
              ].map(shortcut => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-sm text-ios-gray-1 dark:text-dark-secondary">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-ios-gray-6 dark:bg-dark-elevated rounded text-xs font-mono text-gray-700 dark:text-dark-label border border-ios-gray-4 dark:border-dark-separator">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
