'use client';

import { useId } from 'react';
import styled, { css } from 'styled-components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { GenreOption } from './filterAlbums';
import {
  filtersReset,
  genreChanged,
  isSortKey,
  queryChanged,
  selectFilters,
  selectHasActiveFilters,
  sortChanged,
  SORT_KEYS,
  SORT_LABELS,
} from './filtersSlice';

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space(3)};
  align-items: end;
  margin-bottom: ${({ theme }) => theme.space(3)};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  }
`;

const Field = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  min-width: 0;
  grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};

  ${({ theme }) => theme.media.md} {
    grid-column: auto;
  }

  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const controlStyles = css`
  width: 100%;
  min-height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Input = styled.input`
  ${controlStyles}
  padding: ${({ theme }) => `0 ${theme.space(3)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Select = styled.select`
  ${controlStyles}
  padding: ${({ theme }) => `0 ${theme.space(2)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`;

const ClearButton = styled.button`
  grid-column: 1 / -1;
  min-height: 44px;
  padding: ${({ theme }) => `0 ${theme.space(4)}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  ${({ theme }) => theme.media.md} {
    grid-column: auto;
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
  const id = useId();

  return (
    // role="search" landmark; submit is a no-op since results update as you type.
    <Form role="search" aria-label="Filter albums" onSubmit={(event) => event.preventDefault()}>
      <Field $wide>
        <label htmlFor={`${id}-q`}>Search</label>
        <Input
          id={`${id}-q`}
          type="search"
          placeholder="Title or artist"
          autoComplete="off"
          spellCheck={false}
          value={filters.query}
          onChange={(event) => dispatch(queryChanged(event.target.value))}
        />
      </Field>

      <Field>
        <label htmlFor={`${id}-genre`}>Genre</label>
        <Select
          id={`${id}-genre`}
          value={filters.genre ?? ''}
          onChange={(event) => dispatch(genreChanged(event.target.value || null))}
        >
          <option value="">All genres ({totalCount})</option>
          {genres.map(({ genre, count }) => (
            <option key={genre} value={genre}>
              {genre} ({count})
            </option>
          ))}
        </Select>
      </Field>

      <Field>
        <label htmlFor={`${id}-sort`}>Sort by</label>
        <Select
          id={`${id}-sort`}
          value={filters.sort}
          onChange={(event) => {
            if (isSortKey(event.target.value)) dispatch(sortChanged(event.target.value));
          }}
        >
          {SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </Select>
      </Field>

      <ClearButton type="button" onClick={() => dispatch(filtersReset())} disabled={!hasActiveFilters}>
        Clear filters
      </ClearButton>
    </Form>
  );
}
