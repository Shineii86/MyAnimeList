import { 
    fetchTrendingAnime, 
    fetchGitHubReadme, 
    fetchAnimeDetails,
    searchAnime 
} from './api.js';
import { parseAnimeList, Sorters, calculateStats } from './parser.js';
import { 
    createAnimeCard, 
    createModalContent, 
    createSearchItem,
    showNotification,
    initScrollReveal,
    initParticles 
} from './ui.js';

// State
const state = {
    myAnime: [],
    trending: [],
    currentView: 'grid',
    currentSort: 'az',
    searchTimeout: null
};

// DOM Elements
const elements = {
    trendingGrid: document.getElementById('trendingGrid'),
    showcaseGrid: document.getElementById('showcaseGrid'),
    modal: document.getElementById('animeModal'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    searchInput: document.getElementById('globalSearch'),
    searchDropdown: document.getElementById('searchDropdown'),
    themeToggle: document.getElementById('themeToggle'),
    sortSelect: document.getElementById('sortSelect'),
    syncBtn: document.getElementById('syncReadme'),
    viewToggles: document.querySelectorAll('.toggle-btn'),
    stats: {
        total: document.getElementById('totalAnime'),
        rating: document.getElementById('avgRating'),
        episodes: document.getElementById('totalEpisodes')
    }
};

// Initialize App
async function init() {
    initParticles();
    setupEventListeners();
    setupTheme();
    
    // Load initial data
    try {
        await Promise.all([
            loadTrending(),
            loadMyAnime()
        ]);
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to load some data', 'error');
    }
}

// Load Trending Anime
async function loadTrending() {
    try {
        elements.trendingGrid.innerHTML = Array(8).fill('<div class="skeleton-card"></div>').join('');
        
        state.trending = await fetchTrendingAnime(1, 12);
        elements.trendingGrid.innerHTML = '';
        
        state.trending.forEach(anime => {
            elements.trendingGrid.appendChild(createAnimeCard(anime));
        });
        
        initScrollReveal();
    } catch (error) {
        elements.trendingGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Failed to load trending anime</p>';
    }
}

// Load My Anime from GitHub
async function loadMyAnime() {
    try {
        elements.showcaseGrid.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1;">
                <div class="spinner"></div>
                <p>Fetching from GitHub...</p>
            </div>
        `;
        
        const readme = await fetchGitHubReadme();
        state.myAnime = parseAnimeList(readme);
        
        if (state.myAnime.length === 0) {
            throw new Error('No anime found in README');
        }
        
        updateStats();
        renderMyAnime();
        showNotification(`Synced ${state.myAnime.length} anime from GitHub!`);
    } catch (error) {
        console.error('Error loading README:', error);
        elements.showcaseGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                <p>Failed to load from GitHub. Using local cache...</p>
            </div>
        `;
    }
}

// Render My Anime with current sort/view
function renderMyAnime() {
    const sorter = Sorters[state.currentSort] || Sorters.az;
    const sorted = [...state.myAnime].sort(sorter);
    
    elements.showcaseGrid.innerHTML = '';
    elements.showcaseGrid.className = `anime-grid ${state.currentView === 'list' ? 'list-view' : ''}`;
    
    sorted.forEach(anime => {
        // Enhance with AniList data if available
        const enhanced = {
            ...anime,
            title: { romaji: anime.title },
            coverImage: { large: `https://img.anili.st/media/${anime.anilistId || 1}` },
            format: anime.format,
            genres: anime.genres
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
            
            if (results.length === 0) {
                elements.searchDropdown.innerHTML = '<div style="padding: 1rem; color: var(--text-muted);">No results found</div>';
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
            
            elements.searchDropdown.classList.add('active');
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

// Modal Functions
async function openModal(animeOrId) {
    try {
        let anime = animeOrId;
        if (typeof animeOrId === 'number' || typeof animeOrId === 'string') {
            // Show loading state
            elements.modalBody.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
            elements.modal.classList.add('active');
            
            anime = await fetchAnimeDetails(parseInt(animeOrId));
        }
        
        elements.modalBody.innerHTML = createModalContent(anime);
        elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        showNotification('Failed to load anime details', 'error');
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
    
    // Custom event for anime selection
    window.addEventListener('animeSelect', (e) => {
        if (e.detail.anilistId) {
            openModal(e.detail.anilistId);
        } else {
            // For GitHub anime without AniList ID, show basic info
            elements.modalBody.innerHTML = createModalContent(e.detail);
            elements.modal.classList.add('active');
        }
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
        loadMyAnime();
    });
    
    // Refresh Trending
    document.getElementById('refreshTrending')?.addEventListener('click', loadTrending);
    
    // Mobile Menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
