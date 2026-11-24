'use client';

import { setupListeners } from '@reduxjs/toolkit/query';
import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { useFavoritesStorageSync } from '@/features/favorites/useFavoritesStorageSync';
import { makeStore, type AppStore } from './store';

interface StoreEntry {
  factory: typeof makeStore;
  store: AppStore;
}

/**
 * Creates the store once per component instance: once per request on the
 * server, once per page load in the browser (it lives in the root layout, so
 * it survives client-side navigation, which the mini-player relies on).
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<StoreEntry>(() => ({ factory: makeStore, store: makeStore() }));
  let { store } = entry;

  // Development only. Fast Refresh keeps this component's state but re-runs
  // store.ts when a slice or the RTK Query API is edited, so `makeStore` (and
  // the API object it wires in) changes identity. Keeping the old store would
  // pair the new API with the old middleware, and RTK Query throws "Middleware
  // ... has not been added to the store". Rebuild instead ("storing information
  // from previous renders" pattern). In production `makeStore` never changes,
  // so this never runs.
  if (entry.factory !== makeStore) {
    const next = { factory: makeStore, store: makeStore() };
    setEntry(next);
    store = next.store;
  }

  useFavoritesStorageSync(store);
  // Lets RTK Query refetch failed or stale queries when the browser comes back online.
  useEffect(() => setupListeners(store.dispatch), [store]);
  return <Provider store={store}>{children}</Provider>;
}
