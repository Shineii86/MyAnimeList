import { Favorites } from './api.js';

// Create anime card HTML
export function createAnimeCard(anime, viewMode = 'grid') {
    const isFav = Favorites.isFav(anime.id);
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.dataset.id = anime.id;
    
    const image = anime.coverImage?.large || anime.coverImage?.medium || 'https://via.placeholder.com/230x345';
    const title = anime.title?.romaji || anime.title?.english || anime.title;
    const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : (anime.rating || 'N/A');
    
    card.innerHTML = `
        <div class="anime-card-image">
            <img src="${image}" alt="${title}" loading="lazy">
            <div class="anime-card-overlay">
                <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${anime.id}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
        <div class="anime-card-content">
            <h3 class="anime-title" title="${title}">${title}</h3>
            <div class="anime-meta">
                <span>${anime.format || 'TV'} ${anime.episodes ? `• ${anime.episodes} eps` : ''}</span>
                <span class="anime-score">
                    <i class="fas fa-star"></i> ${score}
                </span>
            </div>
            ${anime.genres ? `
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
    });
    
    card.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('animeSelect', { detail: anime }));
    });
    
    return card;
}

// Create modal content
export function createModalContent(anime) {
    const banner = anime.bannerImage || anime.coverImage?.large;
    const title = anime.title?.romaji || anime.title?.english || 'Unknown';
    const englishTitle = anime.title?.english && anime.title.english !== title ? anime.title.english : '';
    
    let dateStr = 'Unknown';
    if (anime.startDate?.year) {
        dateStr = `${anime.startDate.year}${anime.startDate.month ? '-' + String(anime.startDate.month).padStart(2, '0') : ''}`;
    }
    
    const characters = anime.characters?.edges?.slice(0, 6) || [];
    
    return `
        <div class="modal-banner" style="background-image: url('${banner}'); background-size: cover; background-position: center;"></div>
        <div class="modal-info">
            <h2>${title}</h2>
            ${englishTitle ? `<p style="color: var(--text-muted); margin-bottom: 1rem;">${englishTitle}</p>` : ''}
            
            <div class="modal-meta">
                <span class="meta-tag"><i class="fas fa-star"></i> ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}</span>
                <span class="meta-tag">${anime.format}</span>
                <span class="meta-tag">${anime.status}</span>
                <span class="meta-tag">${dateStr}</span>
                ${anime.episodes ? `<span class="meta-tag">${anime.episodes} Episodes</span>` : ''}
            </div>
            
            <div class="modal-description">
                ${anime.description ? anime.description.replace(/<[^>]*>/g, '').substring(0, 300) + '...' : 'No description available.'}
            </div>
            
            ${characters.length > 0 ? `
                <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Main Characters</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${characters.map(char => `
                        <div style="text-align: center; width: 80px;">
                            <img src="${char.node.image.medium}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin-bottom: 0.5rem;">
                            <p style="font-size: 0.8rem; color: var(--text-muted);">${char.node.name.full}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${anime.trailer?.site === 'youtube' ? `
                <div style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; font-family: var(--font-heading);">Trailer</h3>
                    <iframe width="100%" height="315" src="https://www.youtube.com/embed/${anime.trailer.id}" 
                            frameborder="0" allowfullscreen style="border-radius: var(--radius-md);"></iframe>
                </div>
            ` : ''}
        </div>
    `;
}

// Search dropdown item
export function createSearchItem(anime, onClick) {
    const div = document.createElement('div');
    div.className = 'search-item';
    const title = anime.title?.romaji || anime.title?.english || 'Unknown';
    const image = anime.coverImage?.medium || 'https://via.placeholder.com/40x60';
    
    div.innerHTML = `
        <img src="${image}" alt="${title}">
        <div>
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${title}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
                ${anime.format} • ⭐ ${anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
            </div>
        </div>
    `;
    
    div.addEventListener('click', () => onClick(anime));
    return div;
}

// Show notification
export function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        border-radius: var(--radius-md);
        box-shadow: var(--glass-shadow);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Scroll reveal animation
export function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.anime-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Particle animation
export function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}
