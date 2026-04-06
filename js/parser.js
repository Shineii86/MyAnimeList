/**
 * Anime List Parser
 * Extracts anime titles from various README formats
 */

// Extract anime titles from markdown
export function parseAnimeList(markdown) {
    const animeList = [];
    const lines = markdown.split('\n');
    const seen = new Set();
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and headers
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue;
        
        // Pattern 1: Bullet list with markdown links
        // - [Anime Name](url) - metadata
        const bulletMatch = trimmed.match(/^[-*]\s*\[([^\]]+)\](?:\([^)]+\))?\s*-?\s*(.*)/);
        if (bulletMatch) {
            const title = cleanTitle(bulletMatch[1]);
            const meta = bulletMatch[2] || '';
            if (title && title.length > 1 && !seen.has(title.toLowerCase())) {
                seen.add(title.toLowerCase());
                animeList.push({
                    title: title,
                    raw: trimmed,
                    metadata: meta,
                    source: 'github'
                });
            }
            continue;
        }
        
        // Pattern 2: Numbered list
        // 1. Anime Name
        const numberedMatch = trimmed.match(/^\d+\.\s*(.+)/);
        if (numberedMatch) {
            const title = cleanTitle(numberedMatch[1]);
            if (title && title.length > 1 && !seen.has(title.toLowerCase())) {
                seen.add(title.toLowerCase());
                animeList.push({
                    title: title,
                    raw: trimmed,
                    metadata: '',
                    source: 'github'
                });
            }
        }
    }
    
    console.log(`Parsed ${animeList.length} anime from README`);
    return animeList;
}

// Clean and normalize title
function cleanTitle(title) {
    return title
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\*/g, '')   // Remove italic markers
        .replace(/^\s+|\s+$/g, '') // Trim
        .replace(/\s+/g, ' '); // Normalize spaces
}

// Sort functions
export const Sorters = {
    name_az: (a, b) => a.title.localeCompare(b.title),
    name_za: (a, b) => b.title.localeCompare(a.title),
    rating_desc: (a, b) => (b.rating || 0) - (a.rating || 0),
    rating_asc: (a, b) => (a.rating || 0) - (b.rating || 0),
    recent: (a, b) => (b.year || 0) - (a.year || 0)
};

// Filter functions
export function filterByGenre(animeList, genre) {
    if (!genre || genre === 'all') return animeList;
    return animeList.filter(anime => 
        anime.genres?.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );
}

export function filterByStatus(animeList, status) {
    if (!status || status === 'all') return animeList;
    return animeList.filter(anime => 
        anime.status?.toLowerCase().replace(/\s+/g, '') === status.toLowerCase()
    );
}

// Calculate statistics
export function calculateStats(animeList) {
    if (!animeList.length) {
        return { total: 0, avgRating: 0, favorites: 0 };
    }
    
    const total = animeList.length;
    const rated = animeList.filter(a => a.rating);
    const avgRating = rated.length 
        ? (rated.reduce((acc, curr) => acc + (curr.rating || 0), 0) / rated.length).toFixed(1)
        : 0;
    
    return {
        total,
        avgRating,
        favorites: animeList.filter(a => a.isFavorite).length
    };
}
