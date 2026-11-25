'use client';

import { Fragment, useId, useMemo, type ReactNode } from 'react';
import styled from 'styled-components';
import { StickyHeader } from '@/components/layout/StickyHeader';
import { Button } from '@/components/ui/Button';
import { StatusPanel } from '@/components/ui/StatusPanel';
import { useFavorites } from '@/features/favorites/useFavorites';
import { filterAndSortAlbums, getGenreOptions, matchesQuery } from '@/features/filters/filterAlbums';
import { favoritesOnlyToggled, filtersReset, selectFilters } from '@/features/filters/filtersSlice';
import { FiltersBar } from '@/features/filters/FiltersBar';
import { useFiltersUrlSync } from '@/features/filters/useFiltersUrlSync';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { Album } from '@/types/album';
import { AlbumGrid } from './AlbumGrid';
import { AlbumGridSkeleton } from './AlbumGridSkeleton';

const ResultCount = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Section = styled.section`
  margin-top: ${({ theme }) => theme.space(10)};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    margin-bottom: ${({ theme }) => theme.space(1)};
  }

  p {
    margin-bottom: ${({ theme }) => theme.space(4)};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

interface AlbumBrowserProps {
  albums: readonly Album[];
  /** Page title block, pinned together with the filters (rendered by the server page). */
  header?: ReactNode;
}

/**
 * Filter controls + result count + grid. Chart albums come from the server;
 * filters from Redux/URL; favorites from Redux/localStorage.
 */
export function AlbumBrowser({ albums, header }: AlbumBrowserProps) {
  useFiltersUrlSync();
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const { ready: favoritesReady, favorites, ids: favoriteIds } = useFavorites();
  const offChartHeadingId = useId();

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const chartIdSet = useMemo(() => new Set(albums.map((a) => a.id)), [albums]);

  const visible = useMemo(() => {
    const source = filters.favoritesOnly ? albums.filter((a) => favoriteIdSet.has(a.id)) : albums;
    return filterAndSortAlbums(source, filters);
  }, [albums, filters, favoriteIdSet]);

  // Favorites that have dropped out of today's chart. Shown from their saved
  // snapshot; search/genre apply, but their stored rank is stale, so the
  // default sort keeps them newest-favorited first.
  const offChart = useMemo(() => {
    if (!filters.favoritesOnly) return [];
    const missing = favorites.map((f) => f.album).filter((a) => !chartIdSet.has(a.id));
    const matching = missing.filter(
      (a) => (filters.genre === null || a.genre === filters.genre) && matchesQuery(a, filters.query),
    );
    return filters.sort === 'rank' ? matching : filterAndSortAlbums(matching, filters);
  }, [favorites, chartIdSet, filters]);

  const genres = useMemo(() => getGenreOptions(albums, filters.genre), [albums, filters.genre]);

  // The chart itself is empty: show the grid's own empty state, no filters.
  if (albums.length === 0) {
    return (
      <>
        {header}
        <AlbumGrid albums={albums} />
      </>
    );
  }

  /** Title, filters and (optionally) the result count, pinned while the grid scrolls. */
  // Explicit keys: `header` is an element created by the server component, and
  // React key-checks server-created elements even in otherwise static lists.
  const top = (extra?: ReactNode) => (
    <StickyHeader>
      <Fragment key="title">{header}</Fragment>
      <FiltersBar key="filters" genres={genres} totalCount={albums.length} />
      <Fragment key="extra">{extra}</Fragment>
    </StickyHeader>
  );

  if (filters.favoritesOnly && !favoritesReady) {
    // The server render can't see localStorage; avoid flashing "no favorites".
    return (
      <>
        {top()}
        <AlbumGridSkeleton count={6} />
      </>
    );
  }

  if (filters.favoritesOnly && favorites.length === 0) {
    return (
      <>
        {top()}
        <StatusPanel
          title="No favorites yet"
          action={
            <Button type="button" onClick={() => dispatch(favoritesOnlyToggled())}>
              Browse all albums
            </Button>
          }
        >
          Tap the heart on any album to save it here. Favorites are kept on this device.
        </StatusPanel>
      </>
    );
  }

  const shown = visible.length + offChart.length;
  const total = filters.favoritesOnly ? favorites.length : albums.length;
  const noun = filters.favoritesOnly ? 'favorites' : 'albums';
  const countText = shown === total ? `Showing all ${total} ${noun}` : `Showing ${shown} of ${total} ${noun}`;

  return (
    <>
      {top(
        // Polite live region: announces result changes without stealing focus.
        <ResultCount role="status" aria-live="polite">
          {countText}
        </ResultCount>,
      )}

      {shown === 0 && (
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

      {visible.length > 0 && <AlbumGrid albums={visible} />}

      {offChart.length > 0 && (
        <Section aria-labelledby={offChartHeadingId}>
          <h2 id={offChartHeadingId}>No longer in the chart</h2>
          <p>Favorites that have dropped out of today&apos;s Top Albums.</p>
          <AlbumGrid
            albums={offChart}
            label="Favorites no longer in the chart"
            showRank={false}
            headingLevel={3}
            prioritizeFirst={false}
          />
        </Section>
      )}
    </>
  );
}
