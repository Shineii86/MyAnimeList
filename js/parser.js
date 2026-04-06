/**
 * Parse README.md content to extract anime list
 * STRICT filtering to avoid section headers and invalid entries
 */
export function parseAnimeList(markdown) {
    const animeList = [];
    const seen = new Set();
    
    // Split into lines for better processing
    const lines = markdown.split('\n');
    
    for (const line of lines) {
        // Skip if line doesn't start with "-" (not a list item)
        if (!line.trim().startsWith('-')) continue;
        
        // Skip table of contents, headers, and section markers
        if (line.includes('📋') || 
            line.includes('📊') || 
            line.includes('🏆') || 
            line.includes('📺') ||
            line.includes('🤝') ||
            line.includes('📝') ||
            line.includes('Table of Contents') ||
            line.includes('## ') ||
            line.includes('### ') ||
            line.includes('LICENSE') ||
            line.includes('Stars') ||
            line.includes('Forks') ||
            line.includes('Last Commit')) {
            continue;
        }
        
        // Try to match anime entry patterns
        // Pattern: - [**Title**](link) - Type ⭐ Rating | Genres
        // Or: - [Title](link) - Type ⭐ Rating | Genres
        
        const match = line.match(/-\s*\[([^\]]+)\]\(([^)]+)\)\s*-\s*([^⭐]+)[⭐★]\s*([\d.]+)\s*\|?\s*(.*)/);
        
        if (!match) continue;
        
        let [_, titleRaw, url, typeRaw, rating, genresRaw] = match;
        
        // Clean title - remove markdown bold markers ** 
        let title = titleRaw.replace(/\*\*/g, '').trim();
        
        // Skip if title looks like a section header (contains emojis or common headers)
        if (title.includes('📊') || 
            title.includes('🏆') || 
            title.includes('📋') ||
            title.includes('Table of') ||
            title.includes('Statistics') ||
            title.includes('Recommendations') ||
            title.includes('License') ||
            title.length < 2) {
            continue;
        }
        
        // Skip if already processed
        const key = `${title}-${rating}`;
        if (seen.has(key)) continue;
        seen.add(key);
        
        // Extract AniList ID from URL
        const anilistMatch = url.match(/anilist\.co\/anime\/(\d+)/);
        const anilistId = anilistMatch ? parseInt(anilistMatch[1]) : null;
        
        // Clean up genres
        const genres = (genresRaw || '')
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, ' ') // Remove emojis
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/\s+/g, ' ')
            .trim()
            .split(/,|\|/)
            .map(g => g.trim())
            .filter(g => g.length > 0 && !g.match(/^\d+$/) && !g.includes('http'));
        
        // Determine format
        const typeStr = (typeRaw || '').trim().toLowerCase();
        const format = typeStr.includes('movie') ? 'Movie' : 
                      typeStr.includes('ova') ? 'OVA' : 
                      typeStr.includes('special') ? 'Special' : 
                      typeStr.includes('ona') ? 'ONA' : 'TV';
        
        // Extract year if present
        const yearMatch = title.match(/\((\d{4})\)/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;
        const cleanTitle = title.replace(/\s*\(\d{4}\)/, '').trim();
        
        animeList.push({
            id: anilistId || `local-${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            title: cleanTitle,
            rawTitle: title,
            url: url.trim(),
            format: format,
            rating: parseFloat(rating) || 0,
            genres: genres.slice(0, 3),
            allGenres: genres,
            anilistId: anilistId,
            year: year,
            source: 'github'
        });
    }
    
    console.log(`Parsed ${animeList.length} anime from README`);
    return animeList.sort((a, b) => b.rating - a.rating);
}

// Sort functions
export const Sorters = {
    az: (a, b) => a.title.localeCompare(b.title),
    rating: (a, b) => b.rating - a.rating,
    recent: (a, b) => (b.year || 0) - (a.year || 0)
};

// Stats calculator
export function calculateStats(animeList) {
    const total = animeList.length;
    
    if (total === 0) {
        return {
            total: 0,
            avgRating: '0.0',
            estimatedEpisodes: 0,
            completionRate: '0%'
        };
    }
    
    const avgRating = (animeList.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1);
    
    const estimatedEpisodes = animeList.reduce((acc, curr) => {
        if (curr.format === 'Movie') return acc + 1;
        if (curr.format === 'OVA') return acc + 3;
        return acc + 12;
    }, 0);
    
    return {
        total,
        avgRating,
        estimatedEpisodes,
        completionRate: '87%'
    };
}

// Search local anime
export function searchLocalAnime(animeList, query) {
    const lowerQuery = query.toLowerCase();
    return animeList.filter(anime => 
        anime.title.toLowerCase().includes(lowerQuery) ||
        anime.genres.some(g => g.toLowerCase().includes(lowerQuery))
    );
}
