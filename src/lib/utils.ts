export interface Anime {
  id: number;
  title: string;
  anilistId: string;
  anilistUrl: string;
  letter: string;
  isTopRecommendation: boolean;
  score: number | null;
  type: 'TV' | 'Movie' | 'OVA' | 'Special' | null;
  genres: string[];
  episodes: number | null;
  status: 'Completed' | 'Watching' | 'Plan to Watch' | 'Dropped';
  coverImage: string | null;
  description: string;
  startDate: string | null;
  endDate: string | null;
  addedAt: string;
  updatedAt: string;
}

export interface AnimeStats {
  total: number;
  tv: number;
  movies: number;
  ovas: number;
  specials: number;
  averageScore: number;
  totalEpisodes: number;
  completed: number;
  watching: number;
  planToWatch: number;
  dropped: number;
  topRecommendations: number;
  recentlyAdded: Anime[];
}

export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getScoreColor(score: number | null): string {
  if (!score) return 'text-gray-400';
  if (score >= 9) return 'text-ios-green';
  if (score >= 7) return 'text-ios-blue';
  if (score >= 5) return 'text-ios-orange';
  return 'text-ios-red';
}

export function getTypeBadgeColor(type: string | null): string {
  switch (type) {
    case 'TV': return 'bg-ios-blue/10 text-ios-blue';
    case 'Movie': return 'bg-ios-purple/10 text-ios-purple';
    case 'OVA': return 'bg-ios-orange/10 text-ios-orange';
    case 'Special': return 'bg-ios-teal/10 text-ios-teal';
    default: return 'bg-gray-100 text-gray-500';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Completed': return 'bg-ios-green/10 text-ios-green';
    case 'Watching': return 'bg-ios-blue/10 text-ios-blue';
    case 'Plan to Watch': return 'bg-ios-yellow/10 text-ios-yellow';
    case 'Dropped': return 'bg-ios-red/10 text-ios-red';
    default: return 'bg-gray-100 text-gray-500';
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(animeList: Anime[]): number {
  return animeList.length > 0 ? Math.max(...animeList.map(a => a.id)) + 1 : 1;
}

export function searchAnime(animeList: Anime[], query: string): Anime[] {
  const q = query.toLowerCase();
  return animeList.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.anilistId.includes(q) ||
    a.genres.some(g => g.toLowerCase().includes(q))
  );
}

export function filterByLetter(animeList: Anime[], letter: string): Anime[] {
  if (!letter || letter === 'ALL') return animeList;
  return animeList.filter(a => a.letter === letter);
}

export function sortAnime(animeList: Anime[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Anime[] {
  return [...animeList].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'score':
        comparison = (a.score ?? 0) - (b.score ?? 0);
        break;
      case 'episodes':
        comparison = (a.episodes ?? 0) - (b.episodes ?? 0);
        break;
      case 'addedAt':
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        break;
      default:
        comparison = a.id - b.id;
    }
    return order === 'desc' ? -comparison : comparison;
  });
}

export function exportToCSV(animeList: Anime[]): string {
  const headers = ['ID', 'Title', 'AniList ID', 'AniList URL', 'Score', 'Type', 'Genres', 'Episodes', 'Status', 'Cover Image'];
  const rows = animeList.map(a => [
    a.id,
    `"${a.title.replace(/"/g, '""')}"`,
    a.anilistId,
    a.anilistUrl,
    a.score ?? '',
    a.type ?? '',
    `"${a.genres.join(', ')}"`,
    a.episodes ?? '',
    a.status,
    a.coverImage ?? '',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
