/**
 * Parse README.md content to extract anime list
 * Handles multiple formats from the MyAnimeList README
 */
export function parseAnimeList(markdown) {
    const animeList = [];
    const seen = new Set(); // Prevent duplicates
    
    // Pattern 1: - [**Title**](link) - Type ⭐ Rating | Genres
    // Pattern 2: - [Title](link) - Type ⭐ Rating | Genres  
    // Pattern 3: Various emoji and formatting combinations
    
    const patterns = [
        // Primary pattern with bold markers
        /-\s*\[\*\*([^*\]]+)\*\*\]\(([^)]+)\)\s*-\s*([^⭐]+)[⭐★]\s*([\d.]+)\s*[|\-]?\s*(.+?)(?=\n|$)/g,
        // Pattern without bold
        /-\s*\[([^\]]+)\]\(([^)]+)\)\s*-\s*([^⭐]+)[⭐★]\s*([\d.]+)\s*[|\-]?\s*(.+?)(?=\n|$)/g,
        // Alternative with different emoji separators
        /-\s*\[([^\]]+)\]\(([^)]+)\)\s*[|\-]\s*([^0-9]+)\s*([\d.]+)\s*[|\-]?\s*(.+?)(?=\n|$)/g
    ];
    
    for (const regex of patterns) {
        let match;
        while ((match = regex.exec(markdown)) !== null) {
            const [fullMatch, title, url, typeRaw, rating, genresRaw] = match;
            
            // Skip if already processed
            const key = `${title}-${rating}`;
            if (seen.has(key)) continue;
            seen.add(key);
            
            // Extract AniList ID if present
            const anilistMatch = url.match(/anilist\.co\/anime\/(\d+)/);
            const anilistId = anilistMatch ? parseInt(anilistMatch[1]) : null;
            
            // Clean up genres - remove emojis and standardize
            const genres = genresRaw
                .replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ') // Remove emojis
                .replace(/\s+/g, ' ')
                .trim()
                .split(/,|\|/)
                .map(g => g.trim())
                .filter(g => g.length > 0 && !g.match(/^\d+$/)); // Filter out numbers only
            
            // Determine format from type string
            const typeStr = (typeRaw || '').trim().toLowerCase();
            const format = typeStr.includes('movie') ? 'Movie' : 
                          typeStr.includes('ova') ? 'OVA' : 
                          typeStr.includes('special') ? 'Special' : 
                          typeStr.includes('ona') ? 'ONA' : 'TV';
            
            // Extract year if present in title (e.g., "Anime Title (2011)")
            const yearMatch = title.match(/\((\d{4})\)/);
            const year = yearMatch ? parseInt(yearMatch[1]) : null;
            const cleanTitle = title.replace(/\s*\(\d{4}\)/, '').trim();
            
            animeList.push({
                id: anilistId || `local-${title.toLowerCase().replace(/\s+/g, '-')}`,
                title: cleanTitle,
                rawTitle: title,
                url: url.trim(),
                format: format,
                rating: parseFloat(rating) || 0,
                genres: genres.slice(0, 3), // Limit to 3 genres
                allGenres: genres,
                anilistId: anilistId,
                year: year,
                source: 'github',
                addedAt: new Date().toISOString()
            });
        }
    }
    
    // Sort by rating descending by default
    return animeList.sort((a, b) => b.rating - a.rating);
}

// Sort functions
export const Sorters = {
    az: (a, b) => a.title.localeCompare(b.title),
    rating: (a, b) => b.rating - a.rating,
    recent: (a, b) => (b.year || 0) - (a.year || 0)
};

// Stats calculator with better accuracy
export function calculateStats(animeList) {
    const total = animeList.length;
    
    if (total === 0) {
        return {
            total: 0,
            avgRating: '0.0',
            estimatedEpisodes: 0,
            movies: 0,
            tvShows: 0
        };
    }
    
    const avgRating = (animeList.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1);
    
    // Better episode estimation based on format
    const estimatedEpisodes = animeList.reduce((acc, curr) => {
        if (curr.format === 'Movie') return acc + 1;
        if (curr.format === 'OVA') return acc + 3;
        if (curr.format === 'ONA') return acc + 12;
        // TV shows - estimate based on rating (higher rated often have more episodes)
        if (curr.rating >= 9) return acc + 24; // Likely long series
        if (curr.rating >= 8) return acc + 12; // Standard cour
        return acc + 12;
    }, 0);
    
    const movies = animeList.filter(a => a.format === 'Movie').length;
    const tvShows = animeList.filter(a => a.format === 'TV').length;
    
    return {
        total,
        avgRating,
        estimatedEpisodes,
        movies,
        tvShows,
        completionRate: Math.min(95, Math.round((total / 120) * 100)) // Estimate based on 120 total
    };
}

// Search within local anime list
export function searchLocalAnime(animeList, query) {
    const lowerQuery = query.toLowerCase();
    return animeList.filter(anime => 
        anime.title.toLowerCase().includes(lowerQuery) ||
        anime.genres.some(g => g.toLowerCase().includes(lowerQuery))
    );
}
