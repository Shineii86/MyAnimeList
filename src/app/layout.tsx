import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'Anime Admin Panel',
  description: 'Manage your anime collection with style',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-ios-gray-6 dark:bg-dark-bg min-h-screen">
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
