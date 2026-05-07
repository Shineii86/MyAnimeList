'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSound } from '@/hooks/useSound';
import { useTheme } from '@/hooks/useTheme';

interface SoundContextType {
  click: () => void;
  success: () => void;
  del: () => void;
  error: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const { soundEnabled } = useTheme();
  const sounds = useSound(soundEnabled);

  return (
    <SoundContext.Provider value={sounds}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundEffects() {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSoundEffects must be used within SoundProvider');
  return context;
}
