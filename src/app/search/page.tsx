'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { AniListSearch } from '@/components/search/AniListSearch';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import { mapAniListFormat, mapAniListScore, formatAniListDate } from '@/lib/anilist';
import type { AniListMedia } from '@/lib/anilist';

export default function SearchPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const sounds = useSoundEffects();

  const handleSelect = async (media: AniListMedia) => {
    try {
      const title = media.title.english || media.title.romaji;
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          anilistId: String(media.id),
          anilistUrl: `https://anilist.co/anime/${media.id}`,
          score: mapAniListScore(media.averageScore),
          type: mapAniListFormat(media.format),
          genres: media.genres,
          episodes: media.episodes,
          coverImage: media.coverImage?.large,
          description: media.description?.replace(/<[^>]*>/g, '') || '',
          startDate: formatAniListDate(media.startDate),
          endDate: formatAniListDate(media.endDate),
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      sounds.success();
      addToast(`Added "${title}"!`, 'success');
    } catch {
      sounds.error();
      addToast('Failed to add anime', 'error');
    }
  };

  return (
    <div>
      <Header title="AniList Search" subtitle="Search and add anime from AniList" />
      <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
        <AniListSearch onSelect={handleSelect} />
      </div>
    </div>
  );
}
