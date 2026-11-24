'use client';

import styled from 'styled-components';
import { StatusPanel } from '@/components/ui/StatusPanel';
import type { Album } from '@/types/album';
import { AlbumCard } from './AlbumCard';

export const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: ${({ theme }) => `${theme.space(6)} ${theme.space(4)}`};
  margin: 0;
  padding: 0;
  list-style: none;

  ${({ theme }) => theme.media.md} {
    grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
    gap: ${({ theme }) => `${theme.space(8)} ${theme.space(6)}`};
  }
`;

/** Roughly the first two rows on a desktop viewport. */
const PRIORITY_COUNT = 6;

interface AlbumGridProps {
  albums: readonly Album[];
  /** Accessible name of the list. */
  label?: string;
  showRank?: boolean;
  headingLevel?: 2 | 3;
  /** Eager-load the first row or two; off for grids further down the page. */
  prioritizeFirst?: boolean;
}

export function AlbumGrid({
  albums,
  label = 'Top albums',
  showRank = true,
  headingLevel = 2,
  prioritizeFirst = true,
}: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <StatusPanel title="No albums right now">
        The iTunes chart came back empty. Check back in a little while.
      </StatusPanel>
    );
  }

  return (
    // Explicit role: Safari drops list semantics when list-style is none.
    <Grid role="list" aria-label={label}>
      {albums.map((album, index) => (
        <li key={album.id}>
          <AlbumCard
            album={album}
            priority={prioritizeFirst && index < PRIORITY_COUNT}
            showRank={showRank}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </Grid>
  );
}
