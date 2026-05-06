// AniList GraphQL API integration
const ANILIST_API = 'https://graphql.anilist.co';

async function searchAnime(query, page = 1, perPage = 10) {
  const graphqlQuery = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          type
          format
          status
          episodes
          duration
          averageScore
          genres
          coverImage {
            large
            medium
          }
          bannerImage
          description(asHtml: false)
          seasonYear
          studios(isMain: true) {
            nodes {
              name
            }
          }
          siteUrl
        }
      }
    }
  `;

  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { search: query, page, perPage }
    })
  });

  if (!res.ok) {
    throw new Error(`AniList API error: ${res.status}`);
  }

  const data = await res.json();
  return data.data.Page.media.map(formatAnimeResult);
}

async function getAnimeById(anilistId) {
  const graphqlQuery = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        type
        format
        status
        episodes
        duration
        averageScore
        genres
        coverImage {
          large
          medium
        }
        bannerImage
        description(asHtml: false)
        seasonYear
        studios(isMain: true) {
          nodes {
            name
          }
        }
        siteUrl
      }
    }
  `;

  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables: { id: parseInt(anilistId) }
    })
  });

  if (!res.ok) {
    throw new Error(`AniList API error: ${res.status}`);
  }

  const data = await res.json();
  return formatAnimeResult(data.data.Media);
}

function formatAnimeResult(media) {
  return {
    anilistId: media.id,
    title: media.title.english || media.title.romaji,
    titleRomaji: media.title.romaji,
    titleEnglish: media.title.english,
    titleNative: media.title.native,
    type: media.type === 'ANIME' ? (media.format === 'MOVIE' ? 'Movie' : media.format === 'OVA' ? 'OVA' : media.format === 'ONA' ? 'ONA' : 'TV') : media.type,
    format: media.format,
    status: media.status,
    episodes: media.episodes,
    duration: media.duration,
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
    genres: media.genres || [],
    coverImage: media.coverImage?.large || media.coverImage?.medium,
    bannerImage: media.bannerImage,
    description: media.description ? media.description.replace(/<[^>]*>/g, '').substring(0, 300) : '',
    year: media.seasonYear,
    studios: media.studios?.nodes?.map(s => s.name) || [],
    anilistUrl: media.siteUrl || `https://anilist.co/anime/${media.id}`
  };
}

module.exports = { searchAnime, getAnimeById };
