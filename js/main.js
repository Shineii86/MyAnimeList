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

// State management
const state = {
    myAnime: [],
    trending: [],
    currentView: 'grid',
    currentSort: 'rating', // Default to rating since that's how parser returns
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

// Initialize App
async function init() {
    try {
        initParticles();
        setupEventListeners();
        setupTheme();
        
        // Load data in parallel
        await Promise.all([
            loadTrending(),
            loadMyAnime()
        ]);
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Some features failed to load', 'warning');
    }
}

// Load Trending Anime with caching
async function loadTrending() {
    try {
        // Check cache first
        const cached = Cache.get('trending');
        if (cached) {
            state.trending = cached;
            renderTrending();
            return;
        }
        
        // Show skeleton loading
        elements.trendingGrid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
        elements.trendingError.style.display = 'none';
        
        state.trending = await fetchTrendingAnime(1, 12);
        Cache.set('trending', state.trending, 30); // Cache for 30 minutes
        
        renderTrending();
    } catch (error) {
        console.error('Trending load error:', error);
        elements.trendingGrid.innerHTML = '';
        elements.trendingError.style.display = 'block';
        showNotification('Failed to load trending anime', 'error');
    }
}

function renderTrending() {
    elements.trendingGrid.innerHTML = '';
    state.trending.forEach(anime => {
        elements.trendingGrid.appendChild(createAnimeCard(anime));
    });
    initScrollReveal();
}

// Load My Anime from GitHub with multiple fallbacks
async function loadMyAnime(forceRefresh = false) {
    if (state.isLoading) return;
    state.isLoading = true;
    
    updateSyncBadge('syncing', 'Fetching README...');
    elements.showcaseError.style.display = 'none';
    
    try {
        // Check cache unless force refresh
        if (!forceRefresh) {
            const cached = Cache.get('myAnime');
            if (cached && cached.length > 0) {
                state.myAnime = cached;
                updateSyncBadge('synced', `Loaded ${cached.length} anime from cache`);
                updateStats();
                renderMyAnime();
                state.isLoading = false;
                return;
            }
        }
        
        elements.showcaseGrid.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1;">
                <div class="spinner"></div>
                <p>Fetching from GitHub...</p>
                <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">This may take a few seconds</small>
            </div>
        `;
        
        const readme = await fetchGitHubReadme();
        state.myAnime = parseAnimeList(readme);
        
        if (state.myAnime.length === 0) {
            throw new Error('No anime found in README');
        }
        
        // Cache the results
        Cache.set('myAnime', state.myAnime, 60); // Cache for 1 hour
        
        updateSyncBadge('synced', `Synced ${state.myAnime.length} anime`);
        updateStats();
        renderMyAnime();
        showNotification(`Successfully loaded ${state.myAnime.length} anime!`, 'success');
        
    } catch (error) {
        console.error('GitHub load error:', error);
        updateSyncBadge('error', 'Sync failed');
        
        // Try to use cached data even if expired
        const expiredCache = localStorage.getItem('cache_myAnime');
        if (expiredCache) {
            try {
                const { data } = JSON.parse(expiredCache);
                if (data && data.length > 0) {
                    state.myAnime = data;
                    updateStats();
                    renderMyAnime();
                    showNotification('Using cached data (GitHub unavailable)', 'warning');
                    state.isLoading = false;
                    return;
                }
            } catch (e) {
                console.error('Cache parse error:', e);
            }
        }
        
        // Show error state
        elements.showcaseGrid.innerHTML = '';
        elements.showcaseError.style.display = 'block';
        showNotification('Failed to load from GitHub', 'error');
    } finally {
        state.isLoading = false;
    }
}

// Render My Anime with current sort/view
function renderMyAnime() {
    const sorter = Sorters[state.currentSort] || Sorters.az;
    const sorted = [...state.myAnime].sort(sorter);
    
    elements.showcaseGrid.innerHTML = '';
    elements.showcaseGrid.className = `anime-grid ${state.currentView === 'list' ? 'list-view' : ''}`;
    
    if (sorted.length === 0) {
        elements.showcaseGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No anime found</p>';
        return;
    }
    
    sorted.forEach(anime => {
        // Normalize data format for UI
        const enhanced = {
            ...anime,
            title: typeof anime.title === 'string' ? { romaji: anime.title } : anime.title,
            coverImage: { 
                large: anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : null,
                medium: anime.anilistId ? `https://img.anili.st/media/${anime.anilistId}` : null
            },
            averageScore: anime.rating ? anime.rating * 10 : null
        };
        elements.showcaseGrid.appendChild(createAnimeCard(enhanced, state.currentView));
    });
    
    initScrollReveal();
}

// Update Statistics
function updateStats() {
    const stats = calculateStats(state.myAnime);
    elements.stats.total.textContent = stats.total;
    elements.stats.rating.textContent = stats.avgRating;
    elements.stats.episodes.textContent = stats.estimatedEpisodes + '+';
    elements.stats.completion.textContent = stats.completionRate + '%';
}

// Search with Debounce (AniList API + Local fallback)
function handleSearch(e) {
    clearTimeout(state.searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        elements.searchDropdown.classList.remove('active');
        return;
    }
    
    state.searchTimeout = setTimeout(async () => {
        try {
            // Try AniList first
            const results = await searchAnime(query, 5);
            
            elements.searchDropdown.innerHTML = '';
            
            // If API fails or returns empty, search local
            if (results.length === 0 && state.myAnime.length > 0) {
                const localResults = searchLocalAnime(state.myAnime, query);
                if (localResults.length > 0) {
                    localResults.slice(0, 3).forEach(anime => {
                        elements.searchDropdown.appendChild(
                            createSearchItem({
                                ...anime,
                                title: { romaji: anime.title },
                                coverImage: { medium: `https://img.anili.st/media/${anime.anilistId}` }
                            }, (selected) => {
                                openModal(selected);
                                elements.searchDropdown.classList.remove('active');
                                elements.searchInput.value = '';
                            })
                        );
                    });
                }
            } else {
                results.forEach(anime => {
                    elements.searchDropdown.appendChild(
                        createSearchItem(anime, (selected) => {
                            openModal(selected.id);
                            elements.searchDropdown.classList.remove('active');
                            elements.searchInput.value = '';
                        })
                    );
                });
            }
            
            if (elements.searchDropdown.children.length === 0) {
                elements.searchDropdown.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">No results found</div>';
            }
            
            elements.searchDropdown.classList.add('active');
        } catch (error) {
            console.error('Search error:', error);
            // Search local as fallback
            if (state.myAnime.length > 0) {
                const localResults = searchLocalAnime(state.myAnime, query);
                elements.searchDropdown.innerHTML = '';
                localResults.slice(0, 5).forEach(anime => {
                    elements.searchDropdown.appendChild(
                        createSearchItem({
                            ...anime,
                            title: { romaji: anime.title }
                        }, (selected) => {
                            openModal(selected);
                            elements.searchDropdown.classList.remove('active');
                            elements.searchInput.value = '';
                        })
                    );
                });
                if (localResults.length > 0) {
                    elements.searchDropdown.classList.add('active');
                }
            }
        }
    }, 300);
}

// Modal Functions
async function openModal(animeOrId) {
    try {
        let anime = animeOrId;
        
        // If it's an ID, fetch details
        if (typeof animeOrId === 'number' || (typeof animeOrId === 'string' && !isNaN(animeOrId))) {
            elements.modalBody.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading details...</p></div>';
            elements.modal.classList.add('active');
            
            anime = await fetchAnimeDetails(parseInt(animeOrId));
        } else if (animeOrId.anilistId && !animeOrId.description) {
            // Has AniList ID but no details (from GitHub list)
            elements.modalBody.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading details...</p></div>';
            elements.modal.classList.add('active');
            
            try {
                anime = await fetchAnimeDetails(animeOrId.anilistId);
            } catch (e) {
                // Fallback to basic info
                anime = animeOrId;
            }
        }
        
        elements.modalBody.innerHTML = createModalContent(anime);
        elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Modal error:', error);
        showNotification('Failed to load anime details', 'error');
        closeModal();
    }
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Theme Toggle
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
    showNotification(`Switched to ${next} mode`, 'info', 1500);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Event Listeners
function setupEventListeners() {
    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            elements.searchDropdown.classList.remove('active');
        }
    });
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
    
    // Anime selection event
    window.addEventListener('animeSelect', (e) => {
        openModal(e.detail);
    });
    
    // View Toggle
    elements.viewToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.viewToggles.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentView = btn.dataset.view;
            renderMyAnime();
        });
    });
    
    // Sort
    elements.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        renderMyAnime();
    });
    
    // Sync Button
    elements.syncBtn.addEventListener('click', () => {
        loadMyAnime(true);
    });
    
    // Retry Button
    elements.retryGithub?.addEventListener('click', () => {
        loadMyAnime(true);
    });
    
    // Refresh Trending
    document.getElementById('refreshTrending')?.addEventListener('click', () => {
        Cache.set('trending', null, 0); // Clear cache
        loadTrending();
    });
    
    // Mobile Menu
    elements.mobileMenuBtn?.addEventListener('click', () => {
        elements.navLinks.classList.toggle('active');
    });
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                elements.navLinks.classList.remove('active');
            }
        });
    });
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
