const ANILIST_API = 'https://graphql.anilist.co';

interface AniListTitle {
  romaji: string;
  english: string | null;
}

interface AniListCoverImage {
  large: string;
}

interface AniListDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AniListMedia {
  id: number;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  episodes: number | null;
  format: string;
  genres: string[];
  averageScore: number | null;
  description: string | null;
  startDate: AniListDate;
  endDate: AniListDate;
}

interface AniListSearchResponse {
  data: {
    Page: {
      media: AniListMedia[];
    };
  };
}

interface AniListMediaResponse {
  data: {
    Media: AniListMedia;
  };
}

const SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title { romaji english }
      coverImage { large }
      episodes
      format
      genres
      averageScore
      description
      startDate { year month day }
      endDate { year month day }
    }
  }
}
`;

const MEDIA_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english }
    coverImage { large }
    episodes
    format
    genres
    averageScore
    description
    startDate { year month day }
    endDate { year month day }
  }
}
`;

const USER_ANIME_LIST_QUERY = `
query ($userName: String) {
  MediaListCollection(userName: $userName, type: ANIME, status: COMPLETED) {
    lists {
      entries {
        media {
          id
          title { romaji english }
          coverImage { large }
          episodes
          format
          genres
          averageScore
          description
          startDate { year month day }
          endDate { year month day }
        }
        score
        status
      }
    }
  }
}
`;

export async function searchAniList(query: string, page = 1, perPage = 10): Promise<AniListMedia[]> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: query, page, perPage } }),
  });
  if (!response.ok) throw new Error('AniList API error');
  const data: AniListSearchResponse = await response.json();
  return data.data.Page.media;
}

export async function getAniListMedia(id: number): Promise<AniListMedia> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query: MEDIA_QUERY, variables: { id } }),
  });
  if (!response.ok) throw new Error('AniList API error');
  const data: AniListMediaResponse = await response.json();
  return data.data.Media;
}

export async function importFromAniListUser(userName: string): Promise<{ media: AniListMedia; score: number; status: string }[]> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query: USER_ANIME_LIST_QUERY, variables: { userName } }),
  });
  if (!response.ok) throw new Error('AniList API error');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  const entries: { media: AniListMedia; score: number; status: string }[] = [];
  if (data.data?.MediaListCollection?.lists) {
    for (const list of data.data.MediaListCollection.lists) {
      for (const entry of list.entries) {
        entries.push({ media: entry.media, score: entry.score, status: entry.status });
      }
    }
  }
  return entries;
}

export function formatAniListDate(date: AniListDate): string | null {
  if (!date.year) return null;
  const m = date.month?.toString().padStart(2, '0') ?? '01';
  const d = date.day?.toString().padStart(2, '0') ?? '01';
  return `${date.year}-${m}-${d}`;
}

export function mapAniListFormat(format: string): 'TV' | 'Movie' | 'OVA' | 'Special' {
  switch (format) {
    case 'TV': case 'TV_SHORT': return 'TV';
    case 'MOVIE': return 'Movie';
    case 'OVA': return 'OVA';
    default: return 'Special';
  }
}

export function mapAniListScore(score: number | null): number | null {
  if (!score) return null;
  return Math.round(score / 10);
}
