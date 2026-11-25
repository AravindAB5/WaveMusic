'use client';

import { useId } from 'react';
import styled, { css } from 'styled-components';
import { HeartIcon, SearchIcon } from '@/components/layout/icons';
import { Select, type SelectOption } from '@/components/ui/Select';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { useFavorites } from '@/features/favorites/useFavorites';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { GenreOption } from './filterAlbums';
import {
  favoritesOnlyToggled,
  filtersReset,
  genreChanged,
  queryChanged,
  selectFilters,
  selectHasActiveFilters,
  sortChanged,
  SORT_KEYS,
  SORT_LABELS,
  type SortKey,
} from './filtersSlice';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(3)};
`;

const TopRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
`;

const pill = css`
  min-height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.surfaceHover};
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const SearchField = styled.div`
  ${pill}
  position: relative;
  flex: 1;
  max-width: 560px;
  display: flex;
  align-items: center;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.focus};
  }

  svg {
    position: absolute;
    left: ${({ theme }) => theme.space(3)};
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textMuted};
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 42px;
    padding: ${({ theme }) => `0 ${theme.space(3)} 0 ${theme.space(10)}`};
    border: 0;
    background: transparent;
    outline: none;

    &::placeholder {
      color: ${({ theme }) => theme.colors.textMuted};
    }
  }
`;

/** Right-aligned on wider screens; capped on phones so the search box keeps room. */
const SortSlot = styled.div`
  flex: none;
  min-width: 0;
  max-width: 11rem;

  /* Phones: drop the decorative sort icon so the search field keeps room. */
  .sort-icon {
    display: none;
  }

  ${({ theme }) => theme.media.md} {
    max-width: none;
    margin-left: auto;

    .sort-icon {
      display: block;
    }
  }
`;

const SORT_OPTIONS: readonly SelectOption<SortKey>[] = SORT_KEYS.map((key) => ({ value: key, label: SORT_LABELS[key] }));

const SortIcon = () => (
  <svg className="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
  </svg>
);

/**
 * One horizontally scrolling shelf of chips at every width (the genre list
 * is long; wrapping would push the grid down). The right edge fades to hint
 * that there's more; keyboard users reach every chip with Tab, which scrolls
 * it into view.
 */
const ChipRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  margin: ${({ theme }) => `0 -${theme.space(4)}`};
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(4)}`};
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-padding-inline: ${({ theme }) => theme.space(4)};
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 48px), transparent);

  &::-webkit-scrollbar {
    display: none;
  }

  ${({ theme }) => theme.media.md} {
    margin: ${({ theme }) => `0 -${theme.space(8)}`};
    padding: ${({ theme }) => `${theme.space(1)} ${theme.space(8)}`};
    scroll-padding-inline: ${({ theme }) => theme.space(8)};
  }
`;

const ChipGroup = styled.div`
  display: contents;
`;

const Divider = styled.span`
  flex: none;
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.border};
`;

const Chip = styled.button`
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 36px;
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast};

  /* Keep a 44px tap target without making the chip itself look bulky. */
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: -4px 0;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  svg {
    width: 16px;
    height: 16px;
  }

  /* Selected: inverted, high-contrast chip. */
  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.bg};
  }
`;

const ChipCount = styled.span`
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
`;

const ClearButton = styled.button`
  flex: none;
  min-height: 36px;
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceRaised};
  }
`;

interface FiltersBarProps {
  genres: readonly GenreOption[];
  totalCount: number;
}

export function FiltersBar({ genres, totalCount }: FiltersBarProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  // The server can't know the count; show it only once it's safe to (see useFavorites).
  const { ready: favoritesReady, ids: favoriteIds } = useFavorites();
  const id = useId();

  return (
    // role="search" landmark; submit is a no-op since results update as you type.
    <Form role="search" aria-label="Filter albums" onSubmit={(event) => event.preventDefault()}>
      <TopRow>
        <SearchField>
          <SearchIcon />
          <VisuallyHidden as="label" htmlFor={`${id}-q`}>
            Search
          </VisuallyHidden>
          <input
            id={`${id}-q`}
            type="search"
            placeholder="Search albums and artists"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            value={filters.query}
            onChange={(event) => dispatch(queryChanged(event.target.value))}
          />
        </SearchField>

        <SortSlot>
          <Select
            label="Sort by"
            value={filters.sort}
            options={SORT_OPTIONS}
            onChange={(sort) => dispatch(sortChanged(sort))}
            icon={<SortIcon />}
          />
        </SortSlot>
      </TopRow>

      <ChipRow>
        <Chip type="button" aria-pressed={filters.favoritesOnly} onClick={() => dispatch(favoritesOnlyToggled())}>
          <HeartIcon filled={filters.favoritesOnly} />
          Favorites
          {favoritesReady && <ChipCount>{favoriteIds.length}</ChipCount>}
        </Chip>

        <Divider aria-hidden="true" />

        {/* Single-select set of toggle buttons; "All" clears the genre. */}
        <ChipGroup role="group" aria-label="Genre">
          <Chip type="button" aria-pressed={filters.genre === null} onClick={() => dispatch(genreChanged(null))}>
            All <ChipCount>{totalCount}</ChipCount>
          </Chip>
          {genres.map(({ genre, count }) => (
            <Chip
              key={genre}
              type="button"
              aria-pressed={filters.genre === genre}
              onClick={() => dispatch(genreChanged(filters.genre === genre ? null : genre))}
            >
              {genre} <ChipCount>{count}</ChipCount>
            </Chip>
          ))}
        </ChipGroup>

        {hasActiveFilters && (
          <ClearButton type="button" onClick={() => dispatch(filtersReset())}>
            Clear filters
          </ClearButton>
        )}
      </ChipRow>
    </Form>
  );
}
