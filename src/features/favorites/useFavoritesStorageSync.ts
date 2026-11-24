'use client';

import { useEffect } from 'react';
import type { AppStore } from '@/store/store';
import { favoritesLoaded } from './favoritesSlice';
import { FAVORITES_STORAGE_KEY, loadFavorites } from './storage';

/**
 * Loads favorites from storage after mount (never during render, so the
 * server HTML and the first client render match), and reloads them when
 * another tab changes them. Writes happen in the store's listener middleware.
 */
export function useFavoritesStorageSync(store: AppStore): void {
  useEffect(() => {
    const load = () => store.dispatch(favoritesLoaded(loadFavorites()));
    load();

    const onStorage = (event: StorageEvent) => {
      // key is null when another tab calls localStorage.clear().
      if (event.key === FAVORITES_STORAGE_KEY || event.key === null) load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [store]);
}
