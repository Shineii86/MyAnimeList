import { 
    fetchTrendingAnime, 
    fetchGitHubReadme, 
    fetchAnimeDetails,
    searchAnime,
    Cache 
} from './api.js';
import { parseAnimeList, Sorters, calculateStats, searchLocalAnime } from './parser.js';
import { 
    createAnimeCard, 
    createModalContent, 
    createSearchItem,
    showNotification,
    initScrollReveal,
    initParticles,
    updateSyncBadge 
} from './ui.js';

// State
const state = {
    myAnime: [],
    trending: [],
    currentView: 'grid',
    currentSort: 'rating',
    searchTimeout: null,
    isLoading: false
};

// DOM Elements
const elements = {
    trendingGrid: document.getElementById('trendingGrid'),
    showcaseGrid: document.getElementById('showcaseGrid'),
    trendingError: document.getElementById('trendingError'),
    showcaseError: document.getElementById('showcaseError'),
    modal: document.getElementById('animeModal'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    searchContainer: document.getElementById('searchContainer'),
    searchToggle: document.getElementById('searchToggle'),
    searchClose: document.getElementById('searchClose'),
    searchInput: document.getElementById('globalSearch'),
    searchDropdown: document.getElementById('searchDropdown'),
    themeToggle: document.getElementById('themeToggle'),
    sortSelect: document.getElementById('sortSelect'),
    syncBtn: document.getElementById('syncReadme'),
    retryGithub: document.getElementById('retryGithub'),
    viewToggles: document.querySelectorAll('.toggle-btn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navLinks: document.getElementById('navLinks'),
    stats: {
        total: document.getElementById('totalAnime'),
        rating: document.getElementById('avgRating'),
        episodes: document.getElementById('totalEpisodes'),
        completion: document.getElementById('completionRate')
    }
};

// Initialize
async function init() {
    try {
        initParticles();
        setupEventListeners();
        setupTheme();
        setupExpandableSearch();
        
        await Promise.all([
            loadTrending(),
            loadMyAnime()
        ]);
    } catch (error) {
        console.error('Init error:', error);
    }
}

// Setup Expandable Search
function setupExpandableSearch() {
    // Open search
    elements.searchToggle.addEventListener('click', () => {
        elements.searchContainer.classList.add('active');
        setTimeout(() => elements.searchInput.focus(), 100);
    });
    
    // Close search
    elements.searchClose.addEventListener('click', closeSearch);
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            closeSearch();
        }
    });
}

function closeSearch() {
    elements.searchContainer.classList.remove('active');
    elements.searchInput.value = '';
    elements.searchDropdown.classList.remove('active');
}

// Load Trending
async function loadTrending() {
    try {
        const cached = Cache.get('trending');
        if (cached) {
            state.trending = cached;
            renderTrending();
            return;
        }
        
        elements.trendingGrid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
        elements.trendingError.style.display = 'none';
        
        state.trending = await fetchTrendingAnime(1, 12);
        Cache.set('trending', state.trending, 30);
        renderTrending();
    } catch (error) {
        console.error('Trending error:', error);
        elements.trendingGrid.innerHTML = '';
        elements.trendingError.style.display = 'block';
    }
}

function renderTrending() {
    elements.trendingGrid.innerHTML = '';
    state.trending.forEach(anime => {
        elements.trendingGrid.appendChild(createAnimeCard(anime));
    });
    initScrollReveal();
}

// Load My Anime
async function loadMyAnime(forceRefresh = false) {
    if (state.isLoading) return;
    state.isLoading = true;
    
    updateSyncBadge('syncing', 'Fetching...');
    elements.showcaseError.style.display = 'none';
    
    try {
        if (!forceRefresh) {
            const cached = Cache.get('myAnime');
            if (cached && cached.length > 0) {
                state.myAnime = cached;
                updateSyncBadge('synced', `${cached.length} anime`);
                updateStats();
                renderMyAnime();
                state.isLoading = false;
                return;
            }
        }
        
        elements.showcaseGrid.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1;">
                <div class="spinner"></div>
                <p>Connecting to GitHub...</p>
                <small>Fetching README.md</small>
            </div>
        `;
        
        const readme = await fetchGitHubReadme();
        state.myAnime = parseAnimeList(readme);
        
        if (state.myAnime.length === 0) {
            throw new Error('No anime parsed');
        }
        
        Cache.set('myAnime', state.myAnime, 60);
        updateSyncBadge('synced', `${state.myAnime.length} anime`);
        updateStats();
        renderMyAnime();
        showNotification(`Loaded ${state.myAnime.length} anime!`, 'success');
        
    } catch (error) {
        console.error('GitHub error:', error);
        updateSyncBadge('error', 'Failed');
        
        // Try cache even if expired
        const expired = localStorage.getItem('cache_myAnime');
        if (expired) {
            try {
                const { data } = JSON.parse(expired);
                if (data?.length > 0) {
                    state.myAnime = data;
                    updateStats();
                    renderMyAnime();
                    showNotification('Using cached data', 'warning');
                    state.isLoading = false;
                    return;
                }
            } catch (e) {}
        }
        
        elements.showcaseGrid.innerHTML = '';
        elements.showcaseError.style.display = 'block';
    } finally {
        state.isLoading = false;
    }
}

function renderMyAnime() {
    const sorter = Sorters[state.currentSort] || Sorters.rating;
    const sorted = [...state.myAnime].sort(sorter);
    
    elements.showcaseGrid.innerHTML = '';
    elements.showcaseGrid.className = `anime-grid ${state.currentView === 'list' ? 'list-view' : ''}`;
    
    if (sorted.length === 0) {
        elements.showcaseGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No anime found</p>';
        return;
    }
    
    sorted.forEach(anime => {
        const enhanced = {
            ...anime,
            title: { romaji: anime.title },
            coverImage: { 
                large: anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : null 
            },
            averageScore: anime.rating * 10
        };
        elements.showcaseGrid.appendChild(createAnimeCard(enhanced, state.currentView));
    });
    
    initScrollReveal();
}

function updateStats() {
    const stats = calculateStats(state.myAnime);
    elements.stats.total.textContent = stats.total;
    elements.stats.rating.textContent = stats.avgRating;
    elements.stats.episodes.textContent = stats.estimatedEpisodes + '+';
    elements.stats.completion.textContent = stats.completionRate;
}

// Search with Debounce
function handleSearch(e) {
    clearTimeout(state.searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        elements.searchDropdown.classList.remove('active');
        return;
    }
    
    state.searchTimeout = setTimeout(async () => {
        try {
            const results = await searchAnime(query, 5);
            elements.searchDropdown.innerHTML = '';
            
            if (results.length === 0 && state.myAnime.length > 0) {
                // Fallback to local
                const local = searchLocalAnime(state.myAnime, query).slice(0, 3);
                local.forEach(anime => {
                    elements.searchDropdown.appendChild(createSearchItem({
                        ...anime,
                        title: { romaji: anime.title },
                        coverImage: { medium: `https://img.anili.st/media/${anime.anilistId}` }
                    }, (selected) => {
                        openModal(selected.anilistId || selected);
                        closeSearch();
                    }));
                });
            } else {
                results.forEach(anime => {
                    elements.searchDropdown.appendChild(createSearchItem(anime, (selected) => {
                        openModal(selected.id);
                        closeSearch();
                    }));
                });
            }
            
            if (elements.searchDropdown.children.length > 0) {
                elements.searchDropdown.classList.add('active');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

// Modal
async function openModal(animeOrId) {
    try {
        let anime = animeOrId;
        
        if (typeof animeOrId === 'number' || typeof animeOrId === 'string') {
            elements.modalBody.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
            elements.modal.classList.add('active');
            anime = await fetchAnimeDetails(parseInt(animeOrId));
        } else if (animeOrId.anilistId && !animeOrId.description) {
            elements.modalBody.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
            elements.modal.classList.add('active');
            try {
                anime = await fetchAnimeDetails(animeOrId.anilistId);
            } catch (e) {
                anime = animeOrId;
            }
        }
        
        elements.modalBody.innerHTML = createModalContent(anime);
        elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        showNotification('Failed to load details', 'error');
        closeModal();
    }
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Theme
function setupTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    updateThemeIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Event Listeners
function setupEventListeners() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.searchInput.addEventListener('input', handleSearch);
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    window.addEventListener('animeSelect', (e) => openModal(e.detail));
    
    elements.viewToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.viewToggles.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentView = btn.dataset.view;
            renderMyAnime();
        });
    });
    
    elements.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        renderMyAnime();
    });
    
    elements.syncBtn.addEventListener('click', () => loadMyAnime(true));
    elements.retryGithub?.addEventListener('click', () => loadMyAnime(true));
    
    document.getElementById('refreshTrending')?.addEventListener('click', () => {
        Cache.set('trending', null, 0);
        loadTrending();
    });
    
    elements.mobileMenuBtn?.addEventListener('click', () => {
        elements.navLinks.classList.toggle('active');
    });
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                elements.navLinks.classList.remove('active');
            }
        });
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
