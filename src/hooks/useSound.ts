'use client';

import { useCallback } from 'react';
import { playClickSound, playSuccessSound, playDeleteSound, playErrorSound } from '@/lib/sounds';

export function useSound(enabled: boolean = true) {
  const click = useCallback(() => { if (enabled) playClickSound(); }, [enabled]);
  const success = useCallback(() => { if (enabled) playSuccessSound(); }, [enabled]);
  const del = useCallback(() => { if (enabled) playDeleteSound(); }, [enabled]);
  const error = useCallback(() => { if (enabled) playErrorSound(); }, [enabled]);

  return { click, success, del, error };
}
