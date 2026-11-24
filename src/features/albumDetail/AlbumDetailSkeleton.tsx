'use client';

import styled, { keyframes } from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { Cover } from './AlbumHeader';
import { Row } from './TrackList';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const Bar = styled.span<{ $width: string; $height?: string }>`
  display: block;
  width: ${({ $width }) => $width};
  height: ${({ $height = '0.9em' }) => $height};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.border};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

/** Mirrors AlbumDetail's layout: hero column + tracks column from 1024px. */
const LayoutShape = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(8)};

  ${({ theme }) => theme.media.lg} {
    grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
    align-items: start;
    gap: ${({ theme }) => theme.space(12)};
  }
`;

const HeaderShape = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
`;

const PulsingCover = styled(Cover)`
  box-shadow: none;
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** Placeholder rows matching TrackList's geometry. */
export function TrackListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status">
      <VisuallyHidden>Loading tracks…</VisuallyHidden>
      <List aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <Row key={i}>
            <Bar $width="1.2rem" />
            <Bar $width={`${50 + ((i * 17) % 40)}%`} />
            <Bar $width="2.5rem" />
          </Row>
        ))}
      </List>
    </div>
  );
}

/** Whole-page placeholder for when not even the album header is known yet. */
export function AlbumDetailSkeleton() {
  return (
    <div role="status">
      <VisuallyHidden>Loading album…</VisuallyHidden>
      <div aria-hidden="true">
        <LayoutShape>
          <HeaderShape>
            <Bar $width="35%" $height="0.75rem" />
            <PulsingCover />
            <Bar $width="70%" $height="1.75rem" />
            <Bar $width="45%" $height="1.1rem" />
            <Bar $width="55%" />
          </HeaderShape>
          <List>
            {Array.from({ length: 8 }, (_, i) => (
              <Row key={i}>
                <Bar $width="1.2rem" />
                <Bar $width={`${50 + ((i * 17) % 40)}%`} />
                <Bar $width="2.5rem" />
              </Row>
            ))}
          </List>
        </LayoutShape>
      </div>
    </div>
  );
}
