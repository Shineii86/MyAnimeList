/**
 * Main Application Controller
 * Orchestrates GitHub sync, API calls, and UI updates
 */

import { fetchGitHubReadme } from './github.js';
import { parseAnimeList, Sorters, filterByGenre, filterByStatus, calculateStats } from './parser.js';
import { searchAniLab, getAnimeDetails, getTrendingAnime } from './api.js';
import { createAnimeCard, createSearchItem, showNotification, updateHeroStats, openModal, closeModal } from './ui.js';

// State management
const state = {
    githubAnime: [],      // Raw titles from README
    enrichedAnime: [],    // Full data from AniLab
    filteredAnime: [],    // Currently displayed
    currentView: 'grid',
    currentSort: 'rating_desc',
    currentGenre: 'all',
    currentStatus: 'all',
    isLoading: false,
    searchTimeout: null
};

// DOM Elements
const elements = {
    grid: document.getElementById('animeGrid'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('globalSearch'),
    searchDropdown: document.getElementById('searchDropdown'),
    sortSelect: document.getElementById('sortSelect'),
    genreFilter: document.getElementById('genreFilter'),
    statusFilter: document.getElementById('statusFilter'),
    viewToggles: document.querySelectorAll('.toggle-btn'),
    syncBtn: document.getElementById('syncGithubBtn'),
    modal: document.getElementById('animeModal'),
    modalClose: document.getElementById('modalClose'),
    heroCount: document.getElementById('heroCount'),
    heroRating: document.getElementById('heroRating'),
    loader: document.getElementById('mainLoader')
};

// Initialize app
async function init() {
    setupEventListeners();
    setupTheme();
    updateHeroStats();
    
    // Load from cache or fetch fresh
    const cached = localStorage.getItem('anitrack_data');
    if (cached) {
        state.enrichedAnime = JSON.parse(cached);
        applyFilters();
        updateStats();
    } else {
        await syncWithGitHub();
    }
}

// Sync with GitHub README
async function syncWithGitHub() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    showLoader(true);
    updateSyncStatus('syncing');
    
    try {
        // Fetch README
        const readme = await fetchGitHubReadme();
        const parsed = parseAnimeList(readme);
        state.githubAnime = parsed;
        
        showNotification(`Found ${parsed.length} anime in README. Fetching details...`, 'info');
        
        // Enrich with AniLab data (batch processing with delay to avoid rate limits)
        const enriched = [];
        for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            try {
                const searchResults = await searchAniLab(item.title, 1);
                if (searchResults.length > 0) {
                    const details = await getAnimeDetails(searchResults[0].id);
                    enriched.push({
                        ...details,
                        githubSource: true
                    });
                }
                
                // Update progress every 5 items
                if (i % 5 === 0) {
                    showNotification(`Enriched ${i}/${parsed.length} anime...`, 'info');
                }
                
                // Small delay to be nice to the API
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                console.warn(`Failed to enrich ${item.title}:`, e);
                // Add basic info even if API fails
                enriched.push({
                    id: `local_${i}`,
                    title: item.title,
                    githubSource: true,
                    rating: 0
                });
            }
        }
        
        state.enrichedAnime = enriched;
        localStorage.setItem('anitrack_data', JSON.stringify(enriched));
        
        applyFilters();
        updateStats();
        populateGenreFilter();
        
        showNotification(`Successfully synced ${enriched.length} anime!`, 'success');
        updateSyncStatus('synced');
        
    } catch (error) {
        console.error('Sync error:', error);
        showNotification('Sync failed. Using cached data if available.', 'error');
        updateSyncStatus('error');
    } finally {
        state.isLoading = false;
        showLoader(false);
    }
}

// Apply filters and sorting
function applyFilters() {
    let result = [...state.enrichedAnime];
    
    // Genre filter
    result = filterByGenre(result, state.currentGenre);
    
    // Status filter
    result = filterByStatus(result, state.currentStatus);
    
    // Sort
    const sorter = Sorters[state.currentSort] || Sorters.rating_desc;
    result.sort(sorter);
    
    state.filteredAnime = result;
    renderGrid();
}

// Render anime grid
function renderGrid() {
    elements.grid.innerHTML = '';
    
    if (state.filteredAnime.length === 0) {
        elements.grid.style.display = 'none';
        elements.emptyState.style.display = 'block';
        return;
    }
    
    elements.grid.style.display = 'grid';
    elements.emptyState.style.display = 'none';
    
    state.filteredAnime.forEach((anime, index) => {
        const card = createAnimeCard(anime, state.currentView);
        card.style.animationDelay = `${index * 0.05}s`;
        elements.grid.appendChild(card);
    });
}

// Update statistics
function updateStats() {
    const stats = calculateStats(state.enrichedAnime);
    elements.heroCount.textContent = stats.total;
    elements.heroRating.textContent = stats.avgRating;
    updateHeroStats();
}

// Populate genre filter dropdown
function populateGenreFilter() {
    const genres = new Set();
    state.enrichedAnime.forEach(anime => {
        anime.genres?.forEach(g => genres.add(g));
    });
    
    const sortedGenres = Array.from(genres).sort();
    elements.genreFilter.innerHTML = '<option value="all">All Genres</option>' +
        sortedGenres.map(g => `<option value="${g}">${g}</option>`).join('');
}

// Search functionality
function handleSearch(e) {
    clearTimeout(state.searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        elements.searchDropdown.classList.remove('active');
        return;
    }
    
    state.searchTimeout = setTimeout(async () => {
        try {
            const results = await searchAniLab(query, 5);
            elements.searchDropdown.innerHTML = '';
            
            results.forEach(anime => {
                const item = createSearchItem(anime, (selected) => {
                    openModal(selected);
                    closeSearch();
                });
                elements.searchDropdown.appendChild(item);
            });
            
            if (results.length > 0) {
                elements.searchDropdown.classList.add('active');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300);
}

// Event listeners
function setupEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', handleSearch);
    document.getElementById('searchToggle').addEventListener('click', () => {
        document.getElementById('searchContainer').classList.toggle('active');
        if (document.getElementById('searchContainer').classList.contains('active')) {
            setTimeout(() => elements.searchInput.focus(), 100);
        }
    });
    document.getElementById('searchClose').addEventListener('click', closeSearch);
    
    // Filters
    elements.sortSelect.addEventListener('change', (e) => {
        state.currentSort = e.target.value;
        applyFilters();
    });
    
    elements.genreFilter.addEventListener('change', (e) => {
        state.currentGenre = e.target.value;
        applyFilters();
    });
    
    elements.statusFilter.addEventListener('change', (e) => {
        state.currentStatus = e.target.value;
        applyFilters();
    });
    
    // View toggle
    elements.viewToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.viewToggles.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentView = btn.dataset.view;
            elements.grid.className = `anime-grid ${state.currentView === 'list' ? 'list-view' : ''}`;
        });
    });
    
    // Sync button
    elements.syncBtn.addEventListener('click', syncWithGitHub);
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // Close search on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            closeSearch();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeSearch();
        }
    });
    
    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('active');
    });
}

// Helper functions
function closeSearch() {
    document.getElementById('searchContainer').classList.remove('active');
    elements.searchDropdown.classList.remove('active');
    elements.searchInput.value = '';
}

function showLoader(show) {
    elements.loader.style.display = show ? 'flex' : 'none';
}

function updateSyncStatus(status) {
    const dot = document.querySelector('.sync-dot');
    const text = document.querySelector('.sync-text');
    
    if (status === 'syncing') {
        dot.style.background = '#f59e0b';
        dot.style.boxShadow = '0 0 10px #f59e0b';
        text.textContent = 'Syncing...';
    } else if (status === 'synced') {
        dot.style.background = '#10b981';
        dot.style.boxShadow = '0 0 10px #10b981';
        text.textContent = 'Live Sync';
    } else {
        dot.style.background = '#ef4444';
        dot.style.boxShadow = '0 0 10px #ef4444';
        text.textContent = 'Sync Failed';
    }
}

// Theme toggle
function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    toggle.addEventListener('click', () => {
        const current = html.dataset.theme;
        const next = current === 'dark' ? 'light' : 'dark';
        html.dataset.theme = next;
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });
    
    // Load saved theme
    const saved = localStorage.getItem('theme') || 'dark';
    html.dataset.theme = saved;
    updateThemeIcon(saved);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Global functions for onclick handlers
window.toggleFavoriteFromModal = (id) => {
    const isFav = Favorites.toggle(id);
    showNotification(isFav ? 'Added to favorites!' : 'Removed from favorites', 'success');
    updateHeroStats();
    applyFilters(); // Refresh grid to show updated heart icons
};

// Start the app
document.addEventListener('DOMContentLoaded', init);
