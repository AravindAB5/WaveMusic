'use client';

import { useMemo } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/Button';
import { StatusPanel } from '@/components/ui/StatusPanel';
import { filterAndSortAlbums, getGenreOptions } from '@/features/filters/filterAlbums';
import { filtersReset, selectFilters } from '@/features/filters/filtersSlice';
import { FiltersBar } from '@/features/filters/FiltersBar';
import { useFiltersUrlSync } from '@/features/filters/useFiltersUrlSync';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Album } from '@/types/album';
import { AlbumGrid } from './AlbumGrid';

const ResultCount = styled.p`
  margin-bottom: ${({ theme }) => theme.space(4)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface AlbumBrowserProps {
  albums: readonly Album[];
}

/** Filter controls + result count + grid. Albums come from the server; filters from Redux/URL. */
export function AlbumBrowser({ albums }: AlbumBrowserProps) {
  useFiltersUrlSync();
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const visible = useMemo(() => filterAndSortAlbums(albums, filters), [albums, filters]);
  const genres = useMemo(() => getGenreOptions(albums, filters.genre), [albums, filters.genre]);

  // The chart itself is empty: show the grid's own empty state, no filters.
  if (albums.length === 0) return <AlbumGrid albums={albums} />;

  const countText =
    visible.length === albums.length
      ? `Showing all ${albums.length} albums`
      : `Showing ${visible.length} of ${albums.length} albums`;

  return (
    <>
      <FiltersBar genres={genres} totalCount={albums.length} />
      {/* Polite live region: announces result changes without stealing focus. */}
      <ResultCount role="status" aria-live="polite">
        {countText}
      </ResultCount>
      {visible.length > 0 ? (
        <AlbumGrid albums={visible} />
      ) : (
        <StatusPanel
          title="No albums match"
          action={
            <Button type="button" onClick={() => dispatch(filtersReset())}>
              Clear filters
            </Button>
          }
        >
          Try a different search or genre.
        </StatusPanel>
      )}
    </>
  );
}
