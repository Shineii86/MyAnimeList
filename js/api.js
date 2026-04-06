// API Configuration
const ANILIST_API = 'https://graphql.anilist.co';

// CORS Proxy fallbacks for GitHub
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
];

// GraphQL Queries
const queries = {
    trending: `
        query($page: Int, $perPage: Int) {
            Page(page: $page, perPage: $perPage) {
                media(sort: TRENDING_DESC, type: ANIME) {
                    id
                    title { romaji english native }
                    coverImage { large }
                    bannerImage
                    averageScore
                    episodes
                    genres
                    description
                    status
                    startDate { year month day }
                    format
                    duration
                    trailer { id site }
                }
            }
        }
    `,
    
    search: `
        query($search: String, $perPage: Int) {
            Page(page: 1, perPage: $perPage) {
                media(search: $search, type: ANIME) {
                    id
                    title { romaji english }
                    coverImage { medium }
                    averageScore
                    episodes
                    format
                }
            }
        }
    `,
    
    details: `
        query($id: Int) {
            Media(id: $id, type: ANIME) {
                id
                title { romaji english native }
                coverImage { large }
                bannerImage
                averageScore
                episodes
                genres
                description
                status
                startDate { year month day }
                endDate { year month day }
                duration
                format
                trailer { id site }
                characters(sort: ROLE) {
                    edges {
                        node {
                            id
                            name { full }
                            image { medium }
                        }
                        voiceActors(language: JAPANESE) {
                            id
                            name { full }
                            image { medium }
                        }
                    }
                }
                studios { nodes { name } }
            }
        }
    `
};

// Fetch with error handling and retries
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Fetch GraphQL with error handling
async function fetchGraphQL(query, variables = {}) {
    try {
        const response = await fetchWithRetry(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });
        
        const data = await response.json();
        if (data.errors) throw new Error(data.errors[0].message);
        
        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Fetch GitHub README with CORS fallback
export async function fetchGitHubReadme() {
    const targetUrl = 'https://raw.githubusercontent.com/Shineii86/MyAnimeList/main/README.md';
    const errors = [];
    
    // Try direct fetch first (might work in some environments)
    try {
        const response = await fetch(targetUrl);
        if (response.ok) return await response.text();
    } catch (e) {
        errors.push(`Direct: ${e.message}`);
    }
    
    // Try CORS proxies
    for (const proxy of CORS_PROXIES) {
        try {
            const response = await fetchWithRetry(`${proxy}${encodeURIComponent(targetUrl)}`);
            if (response.ok) {
                const text = await response.text();
                // Verify we got markdown content
                if (text.includes('##') || text.includes('Anime')) {
                    return text;
                }
            }
        } catch (e) {
            errors.push(`${proxy}: ${e.message}`);
        }
    }
    
    console.error('All fetch attempts failed:', errors);
    throw new Error('Unable to fetch README. CORS restrictions may apply.');
}

// Public API functions
export async function fetchTrendingAnime(page = 1, perPage = 12) {
    const data = await fetchGraphQL(queries.trending, { page, perPage });
    return data.Page.media;
}

export async function searchAnime(searchTerm, perPage = 8) {
    if (!searchTerm || searchTerm.length < 2) return [];
    const data = await fetchGraphQL(queries.search, { search: searchTerm, perPage });
    return data.Page.media;
}

export async function fetchAnimeDetails(id) {
    const data = await fetchGraphQL(queries.details, { id });
    return data.Media;
}

// Local Storage helpers for favorites
export const Favorites = {
    get: () => {
        try {
            return JSON.parse(localStorage.getItem('animeFavorites') || '[]');
        } catch {
            return [];
        }
    },
    add: (id) => {
        const favs = Favorites.get();
        if (!favs.includes(id)) {
            favs.push(id);
            localStorage.setItem('animeFavorites', JSON.stringify(favs));
        }
    },
    remove: (id) => {
        const favs = Favorites.get().filter(fav => fav !== id);
        localStorage.setItem('animeFavorites', JSON.stringify(favs));
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

// Cache helper
export const Cache = {
    get: (key) => {
        try {
            const item = localStorage.getItem(`cache_${key}`);
            if (!item) return null;
            const { data, expiry } = JSON.parse(item);
            if (Date.now() > expiry) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            return data;
        } catch {
            return null;
        }
    },
    set: (key, data, ttlMinutes = 60) => {
        try {
            const item = {
                data,
                expiry: Date.now() + (ttlMinutes * 60 * 1000)
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(item));
        } catch (e) {
            console.warn('Cache write failed:', e);
        }
    }
};
