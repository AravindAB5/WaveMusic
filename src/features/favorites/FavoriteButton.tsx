'use client';

import styled from 'styled-components';
import { useAppDispatch } from '@/store/hooks';
import type { Album } from '@/types/album';
import { favoriteToggled } from './favoritesSlice';
import { useIsFavorite } from './useFavorites';

const Button = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.overlay};
  color: ${({ $active, theme }) => ($active ? theme.colors.accentHover : '#fff')};
  backdrop-filter: blur(4px);
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.08);
  }

  &:active {
    transform: scale(0.94);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
  </svg>
);

interface FavoriteButtonProps {
  album: Album;
  className?: string;
}

/**
 * Toggle button: `aria-pressed` conveys the state, and the label names the
 * album so a screen-reader user tabbing through the grid knows which one.
 */
export function FavoriteButton({ album, className }: FavoriteButtonProps) {
  const dispatch = useAppDispatch();
  const isFavorite = useIsFavorite(album.id);

  return (
    <Button
      type="button"
      className={className}
      $active={isFavorite}
      aria-pressed={isFavorite}
      aria-label={`Favorite ${album.title}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => dispatch(favoriteToggled(album))}
    >
      <HeartIcon filled={isFavorite} />
    </Button>
  );
}
