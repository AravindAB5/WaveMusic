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

const HeaderShape = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(5)};
  margin-bottom: ${({ theme }) => theme.space(8)};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 280px 1fr;
    align-items: end;
    gap: ${({ theme }) => theme.space(8)};
  }

  ${({ theme }) => theme.media.lg} {
    grid-template-columns: 320px 1fr;
  }
`;

const Lines = styled.div`
  display: flex;
  flex-direction: column;
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
        <HeaderShape>
          <PulsingCover />
          <Lines>
            <Bar $width="30%" $height="0.75rem" />
            <Bar $width="70%" $height="2rem" />
            <Bar $width="40%" $height="1.25rem" />
            <Bar $width="55%" />
          </Lines>
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
      </div>
    </div>
  );
}
