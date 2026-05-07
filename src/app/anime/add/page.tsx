'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { AnimeForm } from '@/components/anime/AnimeForm';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import type { Anime } from '@/lib/utils';

export default function AddAnimePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const sounds = useSoundEffects();

  const handleSubmit = async (data: Partial<Anime>) => {
    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add');
      sounds.success();
      addToast('Anime added successfully!', 'success');
      router.push('/anime');
    } catch {
      sounds.error();
      addToast('Failed to add anime', 'error');
    }
  };

  return (
    <div>
      <Header title="Add Anime" subtitle="Add a new anime to your collection" />
      <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
        <AnimeForm onSubmit={handleSubmit} submitLabel="Add Anime" />
      </div>
    </div>
  );
}
