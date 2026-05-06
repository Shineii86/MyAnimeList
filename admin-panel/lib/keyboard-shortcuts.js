import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        // Allow Escape to blur inputs
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      // Don't trigger with modifiers (except shift for some)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          router.push('/anime/add');
          break;
        case '/':
          e.preventDefault();
          // Focus the search input if on anime list page
          const searchInput = document.querySelector('.search-input');
          if (searchInput) {
            searchInput.focus();
          } else {
            router.push('/anime');
          }
          break;
        case 'Escape':
          e.preventDefault();
          // Close any open modals
          const overlay = document.querySelector('.modal-overlay');
          if (overlay) {
            overlay.click();
          }
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          router.push('/');
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          router.push('/anime');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          router.push('/anilist');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          router.push('/random');
          break;
        case '?':
          e.preventDefault();
          // Show shortcuts help
          showShortcutsHelp();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}

function showShortcutsHelp() {
  // Create or toggle shortcuts modal
  let modal = document.getElementById('shortcuts-modal');
  if (modal) {
    modal.remove();
    return;
  }

  modal = document.createElement('div');
  modal.id = 'shortcuts-modal';
  modal.className = 'modal-overlay';
  modal.onclick = () => modal.remove();
  modal.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <h3 class="modal-title">⌨️ Keyboard Shortcuts</h3>
      <div style="display: grid; gap: 12px; margin-top: 16px;">
        ${[
          ['N', 'Add new anime'],
          ['/', 'Focus search'],
          ['H', 'Go to Dashboard'],
          ['A', 'Go to All Anime'],
          ['S', 'Go to AniList Search'],
          ['R', 'Go to Random Picker'],
          ['Esc', 'Close modal / blur input'],
          ['?', 'Show this help'],
        ].map(([key, desc]) => `
          <div style="display: flex; align-items: center; gap: 12px;">
            <kbd style="background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 13px; font-weight: 700; min-width: 32px; text-align: center; font-family: monospace;">${key}</kbd>
            <span style="color: var(--text-secondary); font-size: 14px;">${desc}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <button class="btn btn-outline" onclick="document.getElementById('shortcuts-modal').remove()">Got it</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
