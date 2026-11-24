'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { ChevronLeftIcon } from '@/components/layout/icons';
import { selectFilters } from '@/features/filters/filtersSlice';
import { serializeFilters } from '@/features/filters/urlState';
import { useAppSelector } from '@/store/hooks';

const StyledLink = styled(Link)`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 40px;
  margin-bottom: ${({ theme }) => theme.space(6)};
  padding: ${({ theme }) => `0 ${theme.space(4)} 0 ${theme.space(2)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.surfaceRaised} 80%, transparent);
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  backdrop-filter: blur(8px);
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  svg {
    width: 18px;
    height: 18px;
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
      <ChevronLeftIcon /> Top Albums
    </StyledLink>
  );
}
