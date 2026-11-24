import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { GeistSans } from 'geist/font/sans';
import { AppShell } from '@/components/layout/AppShell';
import { AudioEngine } from '@/features/player/AudioEngine';
import { MiniPlayer } from '@/features/player/MiniPlayer';
import { colorSchemeInitScript } from '@/styles/colorScheme';
import { palettes } from '@/styles/palettes';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'WaveMusic — Top Albums',
  description: 'Browse, search and preview the current top albums on iTunes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: palettes.light.surface },
    { media: '(prefers-color-scheme: dark)', color: palettes.dark.surface },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The init script sets data-theme before hydration; suppress the expected
    // attribute mismatch on <html> only.
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorSchemeInitScript }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          {/* Outside the page segments, so playback survives navigation. */}
          <MiniPlayer />
          <AudioEngine />
        </Providers>
      </body>
    </html>
  );
}
