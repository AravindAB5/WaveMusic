'use client';

import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { useFavoritesStorageSync } from '@/features/favorites/useFavoritesStorageSync';
import { makeStore } from './store';

/**
 * Creates the store once per component instance: once per request on the
 * server, once per page load in the browser (it lives in the root layout, so
 * it survives client-side navigation, which the mini-player relies on).
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => makeStore());
  useFavoritesStorageSync(store);
  return <Provider store={store}>{children}</Provider>;
}
