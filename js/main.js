/**
 * AniTrack - Main Application
 */

import { GitHubParser } from './github.js';
import { AniLabAPI } from './api.js';
import { UI } from './ui.js';
import { Search } from './search.js';
import { Filters } from './filters.js';
import { debounce, showToast, storage, smoothScroll } from './utils.js';

// App State
const AppState = {
  animeList: [],
  favorites: JSON.parse(localStorage.getItem('anitrack_favorites') || '[]'),
  config: {
    github: {
      username: 'Shineii86',  // TODO: Configure or get from URL params
      repo: 'MyAnimeList',
      branch: 'main'
    }
  }
};

// DOM Elements
const DOM = {
  loadBtn: null,
  retryBtn: null,
  grid: null,
  modal: null,
  themeToggle: null
};

// Initialize App
async function init() {
  // Cache DOM references
  DOM.loadBtn = document.getElementById('load-readme-btn');
  DOM.retryBtn = document.getElementById('retry-btn');
  DOM.grid = document.getElementById('anime-grid');
  DOM.modal = document.getElementById('anime-modal');
  DOM.themeToggle = document.getElementById('theme-toggle');
  
  // Initialize subsystems
  Search.init();
  Filters.init();
  initThemeToggle();
  initModal();
  initCardInteractions();
  initNavigation();
  
  // Load favorites badge
  updateFavoritesUI();
  
  // Event Listeners
  DOM.loadBtn?.addEventListener('click', handleLoadReadme);
  DOM.retryBtn?.addEventListener('click', handleLoadReadme);
  
  // Listen for filter changes
  window.addEventListener('filters:changed', handleFilterChange);
  
  // Initial load if config is set
  if (AppState.config.github.username && AppState.config.github.repo) {
    await handleLoadReadme();
  }
}

// Theme Toggle
function initThemeToggle() {
  // Check saved preference or system preference
  const saved = localStorage.getItem('anitrack_theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (systemDark ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', theme);
  
  DOM.themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('anitrack_theme', next);
    
    showToast(`Switched to ${next} mode`, 'info', 2000);
  });
}

// Modal Handling
function initModal() {
  const modal = document.getElementById('anime-modal');
  if (!modal) return;
  
  // Close on backdrop click
  modal.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => UI.closeModal());
  });
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.hasAttribute('open')) {
      UI.closeModal();
    }
  });
  
  // Favorite button
  document.getElementById('favorite-btn')?.addEventListener('click', handleFavoriteToggle);
}

// Card Interactions
function initCardInteractions() {
  // Event delegation for dynamic cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.anime-card');
    const viewBtn = e.target.closest('.view-details');
    
    if (viewBtn && card) {
      e.stopPropagation();
      const animeId = card.dataset.animeId;
      const anime = AppState.animeList.find(a => a.id === animeId);
      if (anime) UI.openModal(anime);
    } else if (card) {
      const animeId = card.dataset.animeId;
      const anime = AppState.animeList.find(a => a.id === animeId);
      if (anime) UI.openModal(anime);
    }
  });
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = document.activeElement?.closest('.anime-card');
      if (card) {
        e.preventDefault();
        const animeId = card.dataset.animeId;
        const anime = AppState.animeList.find(a => a.id === animeId);
        if (anime) UI.openModal(anime);
      }
    }
  });
}

// Navigation
function initNavigation() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        smoothScroll(href);
        
        // Update active nav
        document.querySelectorAll('.navbar__link').forEach(nav => {
          nav.classList.toggle('active', nav.dataset.nav === href.slice(1));
        });
      }
    });
  });
  
  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navbarMenu = document.getElementById('navbar-menu');
  
  mobileToggle?.addEventListener('click', () => {
    const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
    mobileToggle.setAttribute('aria-expanded', !expanded);
    navbarMenu?.classList.toggle('active');
  });
}

// Load README & Fetch Anime
async function handleLoadReadme() {
  const { username, repo, branch } = AppState.config.github;
  
  if (!username || !repo) {
    showToast('Please configure GitHub username and repo', 'error');
    return;
  }
  
  UI.showLoading(true);
  
  try {
    // 1. Parse README
    const titles = await GitHubParser.getAnimeList(username, repo, branch);
    
    if (titles.length === 0) {
      UI.showEmpty();
      showToast('No anime titles found in README', 'info');
      return;
    }
    
    // 2. Fetch from AniLab with concurrency
    const results = await AniLabAPI.fetchBatch(titles, 5);
    
    // 3. Filter successful fetches
    const animeList = results
      .filter(r => r.data && !r.error)
      .map(r => r.data);
    
    if (animeList.length === 0) {
      UI.showError('Could not fetch anime data. Please try again.');
      return;
    }
    
    // 4. Store and render
    AppState.animeList = animeList;
    applyFiltersAndRender();
    
    showToast(`Loaded ${animeList.length} anime`, 'success');
    
  } catch (error) {
    console.error('Load error:', error);
    UI.showError('Failed to load anime list. Check your GitHub settings.');
  }
}

// Handle Filter Changes
function handleFilterChange() {
  applyFiltersAndRender();
}

// Apply filters and re-render
function applyFiltersAndRender() {
  const filtered = Filters.apply(AppState.animeList);
  UI.renderCards(filtered);
}

// Toggle Favorites
function handleFavoriteToggle() {
  const modal = document.getElementById('anime-modal');
  if (!modal) return;
  
  const animeId = modal.querySelector('.modal__cover')?.alt; // Fallback
  // Better: store anime ID in modal dataset
  const anime = AppState.animeList.find(a => a.title === document.getElementById('modal-title')?.textContent);
  
  if (!anime?.id) return;
  
  const index = AppState.favorites.indexOf(anime.id);
  const isFavorited = index > -1;
  
  if (isFavorited) {
    AppState.favorites.splice(index, 1);
    showToast('Removed from favorites', 'info');
  } else {
    AppState.favorites.push(anime.id);
    showToast('Added to favorites', 'success');
  }
  
  // Save and update UI
  localStorage.setItem('anitrack_favorites', JSON.stringify(AppState.favorites));
  UI.updateFavoriteButton(anime.id, !isFavorited);
  updateFavoritesUI();
}

// Update favorites UI indicators
function updateFavoritesUI() {
  // Could add heart badges to cards, etc.
  console.log('Favorites count:', AppState.favorites.length);
}

// Start App
document.addEventListener('DOMContentLoaded', init);

// Export for testing/debugging
if (typeof window !== 'undefined') {
  window.AniTrack = { AppState, UI, Filters, Search };
}
