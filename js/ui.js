/**
 * UI Rendering & Interactions
 */

import { truncate, isInViewport, smoothScroll } from './utils.js';

export const UI = {
  // Create anime card HTML
  createCard(anime) {
    if (!anime) return null;
    
    const {
      title = 'Unknown',
      coverImage = '',
      rating = 0,
      episodes = 0,
      status = 'unknown',
      description = '',
      genres = [],
      id = ''
    } = anime;
    
    const placeholder = 'https://via.placeholder.com/300x450/1a1033/8B5CF6?text=No+Image';
    
    return `
      <article class="anime-card reveal" data-anime-id="${id}" role="listitem" tabindex="0">
        <div class="card__image">
          <img src="${coverImage || placeholder}" alt="${title}" loading="lazy" onerror="this.src='${placeholder}'">
          ${status ? `<span class="status-badge ${status}">${status}</span>` : ''}
        </div>
        <div class="card__content">
          <h3 class="anime-title">${title}</h3>
          <div class="card__meta">
            ${rating ? `<span class="rating"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${rating}</span>` : ''}
            ${episodes ? `<span>${episodes} eps</span>` : ''}
          </div>
          <p class="description">${truncate(description)}</p>
          ${genres.length ? `<div class="genres">${genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}</div>` : ''}
        </div>
        <div class="card__overlay">
          <button class="view-details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View Details
          </button>
        </div>
      </article>
    `;
  },
  
  // Render cards to grid
  renderCards(animeList, containerId = 'anime-grid') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!animeList || animeList.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    const html = animeList
      .map(anime => this.createCard(anime))
      .filter(Boolean)
      .join('');
    
    container.innerHTML = html;
    
    // Update count
    const countEl = document.getElementById('anime-count');
    if (countEl) {
      countEl.textContent = `${animeList.length} title${animeList.length !== 1 ? 's' : ''}`;
    }
    
    // Initialize reveal animations
    this.initRevealAnimations();
  },
  
  // Initialize scroll reveal
  initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.reveal').forEach(el => {
      observer.observe(el);
    });
  },
  
  // Show/hide states
  showLoading(show) {
    const loading = document.getElementById('loading-state');
    const grid = document.getElementById('anime-grid');
    const empty = document.getElementById('empty-state');
    const error = document.getElementById('error-state');
    
    if (show) {
      loading?.classList.remove('hidden');
      loading?.setAttribute('hidden', null);
      grid?.classList.add('hidden');
      empty?.classList.add('hidden');
      error?.classList.add('hidden');
    } else {
      loading?.classList.add('hidden');
      loading?.setAttribute('hidden', 'hidden');
    }
  },
  
  showError(message) {
    const error = document.getElementById('error-state');
    const msg = document.getElementById('error-message');
    const loading = document.getElementById('loading-state');
    const grid = document.getElementById('anime-grid');
    
    if (msg) msg.textContent = message;
    error?.classList.remove('hidden');
    error?.removeAttribute('hidden');
    loading?.classList.add('hidden');
    grid?.classList.add('hidden');
  },
  
  showEmpty() {
    const empty = document.getElementById('empty-state');
    const loading = document.getElementById('loading-state');
    const grid = document.getElementById('anime-grid');
    
    empty?.classList.remove('hidden');
    empty?.removeAttribute('hidden');
    loading?.classList.add('hidden');
    grid?.classList.add('hidden');
  },
  
  // Modal handling
  openModal(anime) {
    const modal = document.getElementById('anime-modal');
    if (!modal || !anime) return;
    
    // Populate modal content
    document.getElementById('modal-title').textContent = anime.title || 'Unknown';
    document.getElementById('modal-cover').src = anime.coverImage || '';
    document.getElementById('modal-cover').alt = anime.title || 'Anime cover';
    document.getElementById('modal-rating').querySelector('.rating-value').textContent = anime.rating || 'N/A';
    document.getElementById('modal-status').textContent = anime.status || '';
    document.getElementById('modal-status').className = `badge badge--status ${anime.status || ''}`;
    document.getElementById('modal-year').textContent = anime.year || '';
    document.getElementById('modal-description').textContent = anime.description || '';
    document.getElementById('modal-episodes').textContent = anime.episodes || 'N/A';
    document.getElementById('modal-studio').textContent = anime.studio || 'Unknown';
    
    // Genres
    const genresContainer = document.getElementById('modal-genres');
    if (genresContainer && anime.genres?.length) {
      genresContainer.innerHTML = anime.genres.map(g => 
        `<span class="genre-tag">${g}</span>`
      ).join('');
    }
    
    // Link
    const link = document.getElementById('modal-link');
    if (link && anime.id) {
      link.href = `https://anilab.to/anime/${anime.id}`;
    }
    
    // Favorites check
    const favBtn = document.getElementById('favorite-btn');
    const favorites = JSON.parse(localStorage.getItem('anitrack_favorites') || '[]');
    const isFavorited = favorites.includes(anime.id);
    
    if (favBtn) {
      favBtn.dataset.favorited = isFavorited;
      favBtn.querySelector('.favorite-text').textContent = 
        isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
    }
    
    // Show modal
    modal.setAttribute('open', 'open');
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    const closeBtn = modal.querySelector('[data-close-modal]');
    closeBtn?.focus();
  },
  
  closeModal() {
    const modal = document.getElementById('anime-modal');
    if (!modal) return;
    
    modal.removeAttribute('open');
    document.body.style.overflow = '';
  },
  
  // Update favorites button state
  updateFavoriteButton(animeId, isFavorited) {
    const btn = document.getElementById('favorite-btn');
    if (!btn) return;
    
    btn.dataset.favorited = isFavorited;
    btn.querySelector('.favorite-text').textContent = 
      isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
  }
};
