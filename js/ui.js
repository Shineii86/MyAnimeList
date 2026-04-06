/**
 * UI Components and Renderers
 * Creates DOM elements for anime cards, modals, and notifications
 */

import { Favorites } from './api.js';

// Create anime card element
export function createAnimeCard(anime, viewMode = 'grid') {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.style.animationDelay = `${Math.random() * 0.2}s`;
    
    const isFav = Favorites.isFav(anime.id);
    const image = anime.coverImage || anime.image || `https://via.placeholder.com/300x450/1e1e2e/f8fafc?text=${encodeURIComponent(anime.title?.charAt(0) || 'A')}`;
    const rating = anime.rating || (anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A');
    
    card.innerHTML = `
        <div class="anime-card-image">
            <img src="${image}" alt="${anime.title}" loading="lazy" 
                 onerror="this.src='https://via.placeholder.com/300x450/1e1e2e/f8fafc?text=No+Image'">
            <div class="anime-rating-badge">
                <i class="fas fa-star"></i> ${rating}
            </div>
            <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${anime.id}">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="anime-card-overlay">
                <span class="btn btn-sm btn-neon">View Details</span>
            </div>
        </div>
        <div class="anime-card-content">
            <h3 class="anime-title" title="${anime.title}">${anime.title}</h3>
            <div class="anime-meta">
                <span>${anime.format || 'TV'} ${anime.episodes ? `• ${anime.episodes} eps` : ''}</span>
                <span>${anime.year || ''}</span>
            </div>
            ${anime.genres?.length ? `
                <div class="anime-genres">
                    ${anime.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Favorite button handler
    const favBtn = card.querySelector('.favorite-btn');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowFav = Favorites.toggle(anime.id);
        favBtn.classList.toggle('active', nowFav);
        favBtn.innerHTML = `<i class="${nowFav ? 'fas' : 'far'} fa-heart"></i>`;
        showNotification(nowFav ? 'Added to favorites!' : 'Removed from favorites', 'success');
        updateHeroStats();
    });
    
    // Card click handler
    card.addEventListener('click', () => {
        openModal(anime);
    });
    
    return card;
}

// Create modal content
export function createModalContent(anime) {
    const image = anime.bannerImage || anime.coverImage || anime.image || '';
    const genres = anime.genres || [];
    
    return `
        <div class="modal-banner">
            <img src="${image}" alt="${anime.title}" onerror="this.style.display='none'">
            <div class="modal-gradient-overlay"></div>
        </div>
        <div class="modal-info">
            <h2 class="modal-title">${anime.title}</h2>
            ${anime.titleEnglish && anime.titleEnglish !== anime.title ? 
                `<p style="color: var(--text-secondary); margin-bottom: 1rem; font-style: italic;">${anime.titleEnglish}</p>` : ''}
            
            <div class="modal-meta">
                <span class="meta-badge"><i class="fas fa-star"></i> ${anime.rating || 'N/A'}</span>
                <span class="meta-badge"><i class="fas fa-tv"></i> ${anime.format || 'TV'}</span>
                <span class="meta-badge"><i class="fas fa-calendar"></i> ${anime.year || 'Unknown'}</span>
                <span class="meta-badge"><i class="fas fa-film"></i> ${anime.episodes || '?'} eps</span>
                <span class="meta-badge"><i class="fas fa-circle"></i> ${anime.status || 'Unknown'}</span>
            </div>
            
            <div class="modal-description">
                ${anime.description || 'No description available.'}
            </div>
            
            ${genres.length ? `
                <div style="margin-bottom: 2rem;">
                    <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Genres</h4>
                    <div class="anime-genres">
                        ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${anime.trailer ? `
                <div style="margin-top: 2rem;">
                    <h4 style="margin-bottom: 1rem;">Trailer</h4>
                    <iframe width="100%" height="250" src="${anime.trailer}" 
                            frameborder="0" allowfullscreen style="border-radius: var(--radius-md);"></iframe>
                </div>
            ` : ''}
            
            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                <a href="${anime.url || '#'}" target="_blank" class="btn btn-neon" style="text-decoration: none;">
                    <i class="fas fa-external-link-alt"></i> View on AniLab
                </a>
                <button class="btn btn-glass-rgb" onclick="toggleFavoriteFromModal('${anime.id}')">
                    <i class="${Favorites.isFav(anime.id) ? 'fas' : 'far'} fa-heart"></i> 
                    ${Favorites.isFav(anime.id) ? 'Favorited' : 'Add to Favorites'}
                </button>
            </div>
        </div>
    `;
}

// Show notification toast
export function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-enter 0.4s ease reverse';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Update hero statistics
export function updateHeroStats() {
    const favorites = Favorites.get();
    document.getElementById('heroFavs').textContent = favorites.length;
}

// Modal functions
export function openModal(anime) {
    const modal = document.getElementById('animeModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = createModalContent(anime);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function closeModal() {
    const modal = document.getElementById('animeModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Create search dropdown item
export function createSearchItem(anime, onClick) {
    const div = document.createElement('div');
    div.className = 'search-item';
    div.style.cssText = 'padding: 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; border-bottom: 1px solid var(--glass-border); transition: background 0.2s;';
    div.innerHTML = `
        <img src="${anime.image || anime.coverImage || ''}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">
        <div style="flex: 1;">
            <div style="font-weight: 600; color: var(--text-primary);">${anime.title}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">${anime.format || 'TV'} • ${anime.year || 'Unknown'}</div>
        </div>
        <span style="color: #fbbf24; font-weight: 700;"><i class="fas fa-star"></i> ${anime.rating || 'N/A'}</span>
    `;
    
    div.addEventListener('click', () => onClick(anime));
    div.addEventListener('mouseenter', () => div.style.background = 'rgba(255,255,255,0.05)');
    div.addEventListener('mouseleave', () => div.style.background = 'transparent');
    
    return div;
}
