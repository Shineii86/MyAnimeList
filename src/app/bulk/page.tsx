'use client';

import { Header } from '@/components/layout/Header';
import { BulkAddForm } from '@/components/anime/BulkAddForm';
import { useToast } from '@/components/ui/Toast';
import { useSoundEffects } from '@/components/providers/SoundProvider';
import type { Anime } from '@/lib/utils';

export default function BulkAddPage() {
  const { addToast } = useToast();
  const sounds = useSoundEffects();

  const handleSubmit = async (anime: Partial<Anime>[]) => {
    const res = await fetch('/api/anime/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anime }),
    });
    if (!res.ok) {
      sounds.error();
      addToast('Failed to bulk add', 'error');
      throw new Error('Failed');
    }
    const data = await res.json();
    sounds.success();
    addToast(`Added ${data.added} anime!`, 'success');
    return data;
  };

  return (
    <div>
      <Header title="Bulk Add" subtitle="Add multiple anime at once" />
      <div className="bg-white dark:bg-dark-card rounded-ios-lg shadow-ios dark:shadow-dark-ios p-6">
        <BulkAddForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
