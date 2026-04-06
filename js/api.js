// API Configuration
const ANILIST_API = 'https://graphql.anilist.co';
const GITHUB_RAW = 'https://raw.githubusercontent.com/Shineii86/MyAnimeList/main/README.md';

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

// Fetch with error handling
async function fetchGraphQL(query, variables = {}) {
    try {
        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data.errors) throw new Error(data.errors[0].message);
        
        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
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

export async function fetchGitHubReadme() {
    try {
        const response = await fetch(GITHUB_RAW);
        if (!response.ok) throw new Error('Failed to fetch README');
        return await response.text();
    } catch (error) {
        console.error('GitHub Fetch Error:', error);
        throw error;
    }
}

// Local Storage helpers for favorites
export const Favorites = {
    get: () => JSON.parse(localStorage.getItem('animeFavorites') || '[]'),
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
