/**
 * AniLab API Integration
 * Handles all API requests to AniLab and caching
 */

const ANILAB_API_BASE = 'https://api.anilab.to/anime';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Cache utilities
const Cache = {
    get(key) {
        try {
            const item = localStorage.getItem(`anilab_${key}`);
            if (!item) return null;
            const { data, timestamp } = JSON.parse(item);
            if (Date.now() - timestamp > CACHE_DURATION) {
                localStorage.removeItem(`anilab_${key}`);
                return null;
            }
            return data;
        } catch {
            return null;
        }
    },
    
    set(key, data) {
        try {
            localStorage.setItem(`anilab_${key}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Cache write failed:', e);
        }
    }
};

// Fetch with retry logic
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Search anime by name
export async function searchAniLab(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = Cache.get(cacheKey);
    if (cached) return cached;
    
    try {
        const data = await fetchWithRetry(
            `${ANILAB_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        Cache.set(cacheKey, data.results || []);
        return data.results || [];
    } catch (error) {
        console.error('AniLab Search Error:', error);
        throw error;
    }
}

// Get anime details by ID
export async function getAnimeDetails(id) {
    const cacheKey = `details_${id}`;
    const cached = Cache.get(cacheKey);
    if (cached) return cached;
    
    try {
        const data = await fetchWithRetry(`${ANILAB_API_BASE}/${id}`);
        Cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error('AniLab Details Error:', error);
        throw error;
    }
}

// Get trending/popular anime
export async function getTrendingAnime(limit = 12) {
    const cacheKey = 'trending';
    const cached = Cache.get(cacheKey);
    if (cached) return cached;
    
    try {
        const data = await fetchWithRetry(`${ANILAB_API_BASE}/trending?limit=${limit}`);
        Cache.set(cacheKey, data.results || []);
        return data.results || [];
    } catch (error) {
        console.error('AniLab Trending Error:', error);
        throw error;
    }
}

// Favorites management
export const Favorites = {
    get: () => {
        try {
            return JSON.parse(localStorage.getItem('anitrack_favorites') || '[]');
        } catch {
            return [];
        }
    },
    
    add: (id) => {
        const favs = Favorites.get();
        if (!favs.includes(id)) {
            favs.push(id);
            localStorage.setItem('anitrack_favorites', JSON.stringify(favs));
        }
    },
    
    remove: (id) => {
        const favs = Favorites.get().filter(fav => fav !== id);
        localStorage.setItem('anitrack_favorites', JSON.stringify(favs));
    },
    
    isFav: (id) => Favorites.get().includes(id),
    
    toggle: (id) => {
        if (Favorites.isFav(id)) {
            Favorites.remove(id);
            return false;
        } else {
            Favorites.add(id);
            return true;
        }
    }
};
