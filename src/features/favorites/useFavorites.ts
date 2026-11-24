'use client';

import { useHydrated } from '@/lib/useHydrated';
import { useAppSelector } from '@/store/hooks';
import {
  selectAllFavorites,
  selectFavoriteIds,
  selectFavoritesHydrated,
  selectIsFavorite,
  type FavoriteEntry,
} from './favoritesSlice';

const NO_FAVORITES: readonly FavoriteEntry[] = [];
const NO_IDS: readonly string[] = [];

/**
 * The only way components should read favorites.
 *
 * Favorites live in localStorage, so the server always renders "no
 * favorites, not loaded". `ready` is true only once storage has been read
 * AND this component has finished hydrating; until then every value reports
 * the server's view, which keeps hydration markup identical.
 */
export function useFavoritesReady(): boolean {
  const hydrated = useHydrated();
  const loaded = useAppSelector(selectFavoritesHydrated);
  return hydrated && loaded;
}

export function useFavorites(): {
  ready: boolean;
  favorites: readonly FavoriteEntry[];
  ids: readonly string[];
} {
  const ready = useFavoritesReady();
  const favorites = useAppSelector(selectAllFavorites);
  const ids = useAppSelector(selectFavoriteIds);
  return ready ? { ready, favorites, ids } : { ready, favorites: NO_FAVORITES, ids: NO_IDS };
}

export function useIsFavorite(albumId: string): boolean {
  const ready = useFavoritesReady();
  const isFavorite = useAppSelector((state) => selectIsFavorite(state, albumId));
  return ready && isFavorite;
}
