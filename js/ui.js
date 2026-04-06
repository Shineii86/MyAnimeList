import { Favorites } from './api.js';

// Create anime card HTML
export function createAnimeCard(anime, viewMode = 'grid') {
    const isFav = Favorites.isFav(anime.id);
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.id;
    
    // Handle both AniList and GitHub parsed formats
    const image = anime.coverImage?.large || 
                  anime.coverImage?.medium || 
                  (anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : 'https://via.placeholder.com/230x345?text=No+Image');
    
    const title = anime.title?.romaji || 
                  anime.title?.english || 
                  (typeof anime.title === 'string' ? anime.title : 'Unknown Title');
    
    const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 
                  anime.rating || 'N/A';
    
    const format = anime.format || 'TV';
    const episodes = anime.episodes ? `• ${anime.episodes} eps` : '';
    
    card.innerHTML = `
        <div class="anime-card-image">
            <img src="${image}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/230x345?text=No+Image'">
            <div class="anime-card-overlay">
                <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${anime.id}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="anime-card-content">
            <h3 class="anime-title" title="${title}">${title}</h3>
            <div class="anime-meta">
                <span>${format} ${episodes}</span>
                <span class="anime-score">
                    <i class="fas fa-star"></i> ${score}
                </span>
            </div>
            ${anime.genres && anime.genres.length ? `
                <div class="anime-genres">
                    ${anime.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Event listeners
    const favBtn = card.querySelector('.favorite-btn');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowFav = Favorites.toggle(anime.id);
        favBtn.classList.toggle('active', nowFav);
        favBtn.innerHTML = `<i class="${nowFav ? 'fas' : 'far'} fa-heart"></i>`;
        favBtn.setAttribute('aria-label', nowFav ? 'Remove from favorites' : 'Add to favorites');
        
        showNotification(nowFav ? 'Added to favorites!' : 'Removed from favorites', 'success');
    });
    
    card.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('animeSelect', { detail: anime }));
    });
    
    // Add hover tilt effect
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
    
    return card;
}

// Create modal content with fallbacks
export function createModalContent(anime) {
    const banner = anime.bannerImage || 
                   anime.coverImage?.large || 
                   (anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : 'https://via.placeholder.com/900x400?text=No+Banner');
    
    const title = anime.title?.romaji || 
                  anime.title?.english || 
                  (typeof anime.title === 'string' ? anime.title : 'Unknown Title');
    
    const englishTitle = anime.title?.english && anime.title.english !== title ? anime.title.english : '';
    
    let dateStr = 'Unknown';
    if (anime.startDate?.year) {
        dateStr = `${anime.startDate.year}${anime.startDate.month ? '-' + String(anime.startDate.month).padStart(2, '0') : ''}`;
    } else if (anime.year) {
        dateStr = String(anime.year);
    }
    
    const characters = anime.characters?.edges?.slice(0, 6) || [];
    const studios = anime.studios?.nodes || [];
    
    // Clean description
    const description = anime.description ? 
        anime.description.replace(/<[^>]*>/g, '').substring(0, 300) + '...' : 
        'No description available.';
    
    return `
        <div class="modal-banner" style="background-image: url('${banner}'); background-size: cover; background-position: center; height: 400px; border-radius: var(--radius-md); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);"></div>
        <div class="modal-info">
            <h2>${title}</h2>
            ${englishTitle ? `<p style="color: var(--text-muted); margin-bottom: 1rem; font-style: italic;">${englishTitle}</p>` : ''}
            
            <div class="modal-meta">
                <span class="meta-tag"><i class="fas fa-star"></i> ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : (anime.rating || 'N/A')}</span>
                <span class="meta-tag">${anime.format || 'TV'}</span>
                <span class="meta-tag">${anime.status || 'Unknown'}</span>
                <span class="meta-tag">${dateStr}</span>
                ${anime.episodes ? `<span class="meta-tag">${anime.episodes} Episodes</span>` : ''}
                ${studios.length ? `<span class="meta-tag"><i class="fas fa-building"></i> ${studios[0].name}</span>` : ''}
            </div>
            
            <div class="modal-description">
                ${description}
            </div>
            
            ${characters.length > 0 ? `
                <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Main Characters</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${characters.map(char => `
                        <div style="text-align: center; width: 80px;">
                            <img src="${char.node.image.medium}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin-bottom: 0.5rem; border: 2px solid var(--glass-border);" onerror="this.style.display='none'">
                            <p style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${char.node.name.full}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${anime.trailer?.site === 'youtube' ? `
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Trailer</h3>
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${anime.trailer.id}" 
                            frameborder="0" allowfullscreen style="border-radius: var(--radius-md); border: 1px solid var(--glass-border);"></iframe>
                </div>
            ` : ''}
            
            ${anime.url ? `
                <div style="margin-top: 2rem;">
                    <a href="${anime.url}" target="_blank" class="btn btn-primary" style="text-decoration: none;">
                        <i class="fas fa-external-link-alt"></i> View on AniList
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

// Search dropdown item
export function createSearchItem(anime, onClick) {
    const div = document.createElement('div');
    div.className = 'search-item';
    const title = anime.title?.romaji || anime.title?.english || 'Unknown Title';
    const image = anime.coverImage?.medium || 'https://via.placeholder.com/40x60?text=?';
    
    div.innerHTML = `
        <img src="${image}" alt="${title}" onerror="this.src='https://via.placeholder.com/40x60?text=?'">
        <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
                ${anime.format || 'TV'} • ⭐ ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => onClick(anime));
    return div;
}

// Toast notification system
export function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; bottom: 2rem; right: 2rem; z-index: 3000;';
    document.body.appendChild(container);
    return container;
}

// Scroll reveal animation with IntersectionObserver
export function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    document.querySelectorAll('.anime-card, .stat-item').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
        observer.observe(card);
    });
}

// Particle animation
export function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    // Clear existing
    container.innerHTML = '';
    
    // Create particles
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

// Update sync badge status
export function updateSyncBadge(status, message) {
    const badge = document.getElementById('syncBadge');
    if (!badge) return;
    
    const icon = badge.querySelector('i');
    const text = badge.querySelector('span');
    
    badge.className = `sync-badge ${status}`;
    
    if (status === 'syncing') {
        icon.className = 'fas fa-sync fa-spin';
        text.textContent = message || 'Syncing...';
    } else if (status === 'synced') {
        icon.className = 'fas fa-check';
        text.textContent = message || 'Synced';
        setTimeout(() => {
            icon.className = 'fas fa-sync';
            text.textContent = 'Synced with GitHub';
            badge.classList.remove('synced');
        }, 3000);
    } else if (status === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
        text.textContent = message || 'Sync failed';
    }
}
