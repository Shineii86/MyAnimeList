import { Favorites } from './api.js';

export function createAnimeCard(anime, viewMode = 'grid') {
    const isFav = Favorites.isFav(anime.id);
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.id;
    
    // Better image handling with fallbacks
    let image = anime.coverImage?.large || anime.coverImage?.medium;
    
    // If no image but has anilistId, construct AniList CDN URL
    if (!image && anime.anilistId) {
        image = `https://img.anili.st/media/${anime.anilistId}`;
    }
    
    // Final fallback
    if (!image) {
        image = `https://via.placeholder.com/230x345/1e1e2e/f8fafc?text=${encodeURIComponent(anime.title?.charAt(0) || 'A')}`;
    }
    
    const title = anime.title?.romaji || anime.title?.english || anime.title;
    const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : (anime.rating || 'N/A');
    const format = anime.format || 'TV';
    const episodes = anime.episodes ? `• ${anime.episodes} eps` : '';
    
    card.innerHTML = `
        <div class="anime-card-image">
            <img src="${image}" 
                 alt="${title}" 
                 loading="lazy" 
                 onerror="this.src='https://via.placeholder.com/230x345/1e1e2e/f8fafc?text=${encodeURIComponent(title?.charAt(0) || 'A')}'">
            <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${anime.id}">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
        <div class="anime-card-content">
            <h3 class="anime-title" title="${title}">${title}</h3>
            <div class="anime-meta">
                <span>${format} ${episodes}</span>
                <span class="anime-score">
                    <i class="fas fa-star"></i> ${score}
                </span>
            </div>
            ${anime.genres?.length ? `
                <div class="anime-genres">
                    ${anime.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    const favBtn = card.querySelector('.favorite-btn');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowFav = Favorites.toggle(anime.id);
        favBtn.classList.toggle('active', nowFav);
        favBtn.innerHTML = `<i class="${nowFav ? 'fas' : 'far'} fa-heart"></i>`;
        showNotification(nowFav ? 'Added to favorites!' : 'Removed from favorites', 'success');
    });
    
    card.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('animeSelect', { detail: anime }));
    });
    
    return card;
}

export function createModalContent(anime) {
    const banner = anime.bannerImage || 
                   anime.coverImage?.large || 
                   (anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : null) ||
                   'https://via.placeholder.com/900x400/1e1e2e/f8fafc?text=No+Image';
    
    const title = anime.title?.romaji || anime.title?.english || anime.title;
    const englishTitle = anime.title?.english && anime.title.english !== title ? anime.title.english : '';
    
    let dateStr = 'Unknown';
    if (anime.startDate?.year) {
        dateStr = `${anime.startDate.year}${anime.startDate.month ? '-' + String(anime.startDate.month).padStart(2, '0') : ''}`;
    } else if (anime.year) {
        dateStr = String(anime.year);
    }
    
    const characters = anime.characters?.edges?.slice(0, 6) || [];
    
    return `
        <div class="modal-banner" style="background-image: url('${banner}'); background-size: cover; background-position: center;"></div>
        <div class="modal-info">
            <h2>${title}</h2>
            ${englishTitle ? `<p style="color: var(--text-muted); font-style: italic; margin-bottom: 1rem;">${englishTitle}</p>` : ''}
            
            <div class="modal-meta">
                <span class="meta-tag"><i class="fas fa-star"></i> ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : (anime.rating || 'N/A')}</span>
                <span class="meta-tag">${anime.format || 'TV'}</span>
                <span class="meta-tag">${anime.status || 'Unknown'}</span>
                <span class="meta-tag">${dateStr}</span>
                ${anime.episodes ? `<span class="meta-tag">${anime.episodes} eps</span>` : ''}
            </div>
            
            <div class="modal-description">
                ${anime.description ? anime.description.replace(/<[^>]*>/g, '').substring(0, 300) + '...' : 'No description available.'}
            </div>
            
            ${characters.length > 0 ? `
                <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Characters</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                    ${characters.map(char => `
                        <div style="text-align: center; width: 80px;">
                            <img src="${char.node.image.medium}" 
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid var(--glass-border);"
                                 onerror="this.style.display='none'">
                            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">${char.node.name.full}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${anime.trailer?.site === 'youtube' ? `
                <div style="margin-top: 1rem;">
                    <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Trailer</h3>
                    <iframe width="100%" height="250" src="https://www.youtube.com/embed/${anime.trailer.id}" 
                            frameborder="0" allowfullscreen style="border-radius: var(--radius-md);"></iframe>
                </div>
            ` : ''}
            
            ${anime.url ? `
                <div style="margin-top: 1.5rem;">
                    <a href="${anime.url}" target="_blank" class="btn btn-primary" style="text-decoration: none;">
                        <i class="fas fa-external-link-alt"></i> View on AniList
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

export function createSearchItem(anime, onClick) {
    const div = document.createElement('div');
    div.className = 'search-item';
    const title = anime.title?.romaji || anime.title?.english || 'Unknown';
    const image = anime.coverImage?.medium || 
                  (anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : null) ||
                  'https://via.placeholder.com/50x75';
    
    div.innerHTML = `
        <img src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/50x75'">
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
                ${anime.format || 'TV'} • ⭐ ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => onClick(anime));
    return div;
}

export function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
    return container;
}

export function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.anime-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
        observer.observe(card);
    });
}

export function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        particle.style.width = (Math.random() * 4 + 2) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

export function updateSyncBadge(status, message) {
    const badge = document.getElementById('syncBadge');
    if (!badge) return;
    
    const icon = badge.querySelector('i');
    const text = badge.querySelector('span');
    
    badge.className = `sync-badge ${status}`;
    
    if (status === 'syncing') {
        icon.className = 'fas fa-sync fa-spin';
    } else if (status === 'synced') {
        icon.className = 'fas fa-check';
    } else if (status === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
    }
    
    text.textContent = message;
}
