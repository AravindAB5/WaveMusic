'use client';

import styled, { keyframes } from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { Artwork, Body, CardShell } from './AlbumCard';
import { Grid } from './AlbumGrid';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const Bar = styled.span<{ $width: string }>`
  display: block;
  height: 0.8em;
  width: ${({ $width }) => $width};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.border};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

const Placeholder = styled(Artwork)`
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

const StaticCard = styled(CardShell)``;

/** Same grid geometry as the real cards, so nothing shifts when data lands. */
export function AlbumGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite">
      <VisuallyHidden>Loading top albums…</VisuallyHidden>
      <Grid aria-hidden="true" data-testid="album-grid-skeleton">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <StaticCard>
              <Placeholder />
              <Body>
                <Bar $width="85%" />
                <Bar $width="60%" />
              </Body>
            </StaticCard>
          </li>
        ))}
      </Grid>
    </div>
  );
}
