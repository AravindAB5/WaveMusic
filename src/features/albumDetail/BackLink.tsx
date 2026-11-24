'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { selectFilters } from '@/features/filters/filtersSlice';
import { serializeFilters } from '@/features/filters/urlState';
import { useAppSelector } from '@/store/hooks';

const StyledLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 44px;
  margin-bottom: ${({ theme }) => theme.space(4)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

/**
 * Back to the chart, keeping whatever search/genre/sort/favorites view the
 * user had: the filters slice outlives client-side navigation, so the link
 * rebuilds the same URL the grid was on. On a cold load there are no
 * filters and it's simply "/" (same on server and client: no mismatch).
 */
export function BackLink() {
  const filters = useAppSelector(selectFilters);
  const query = serializeFilters(filters).toString();

  return (
    <StyledLink href={query ? `/?${query}` : '/'}>
      <span aria-hidden="true">←</span> Top Albums
    </StyledLink>
  );
}
