'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import { SoundProvider } from '@/components/providers/SoundProvider';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
          <BottomNav />
        </div>
      </ToastProvider>
    </SoundProvider>
  );
}
