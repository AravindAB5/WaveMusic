'use client';

import styled from 'styled-components';
import { StatusPanel } from '@/components/ui/StatusPanel';
import type { Album } from '@/types/album';
import { AlbumCard } from './AlbumCard';

export const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.space(4)};
  margin: 0;
  padding: 0;
  list-style: none;

  ${({ theme }) => theme.media.md} {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: ${({ theme }) => theme.space(6)};
  }
`;

/** Roughly the first two rows on a desktop viewport. */
const PRIORITY_COUNT = 6;

interface AlbumGridProps {
  albums: readonly Album[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  if (albums.length === 0) {
    return (
      <StatusPanel title="No albums right now">
        The iTunes chart came back empty. Check back in a little while.
      </StatusPanel>
    );
  }

  return (
    // Explicit role: Safari drops list semantics when list-style is none.
    <Grid role="list" aria-label="Top albums">
      {albums.map((album, index) => (
        <li key={album.id}>
          <AlbumCard album={album} priority={index < PRIORITY_COUNT} />
        </li>
      ))}
    </Grid>
  );
}
