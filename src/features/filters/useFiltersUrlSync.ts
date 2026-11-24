'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import { filtersHydrated, selectFilters } from './filtersSlice';
import { parseFilters, serializeFilters } from './urlState';

/**
 * Delay before writing to the address bar. Batches keystrokes, and keeps us
 * under Safari's cap of ~100 history.replaceState calls per 30 seconds.
 */
export const URL_WRITE_DELAY_MS = 300;

/**
 * Keeps the filters slice and the query string in sync, both ways.
 *
 * - Mount: the URL wins. Filters are loaded into the store during the first
 *   render (the "per-route state initialization" pattern from the Redux
 *   Next.js guide), so the server renders the filtered grid and the client
 *   hydrates to identical markup with no unfiltered flash.
 * - Store → URL: after a short debounce, via `history.replaceState`. Next 15
 *   syncs that with its router without a server round trip. Replace rather
 *   than push, so Back leaves the page instead of undoing each keystroke.
 * - URL → store: if the query string changes from outside while mounted
 *   (e.g. clicking the logo link to `/`), the store follows.
 *
 * `lastSyncedKey` is the query string both sides last agreed on; it's what
 * stops our own URL writes from echoing back as "external" changes.
 */
export function useFiltersUrlSync(): void {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const urlKey = searchParams.toString();
  const lastSyncedKey = useRef<string | null>(null);

  if (lastSyncedKey.current === null) {
    store.dispatch(filtersHydrated(parseFilters(searchParams)));
    lastSyncedKey.current = urlKey;
  }

  // URL → store
  useEffect(() => {
    if (urlKey === lastSyncedKey.current) return;
    lastSyncedKey.current = urlKey;
    dispatch(filtersHydrated(parseFilters(new URLSearchParams(urlKey))));
  }, [urlKey, dispatch]);

  // Store → URL
  const filters = useAppSelector(selectFilters);
  useEffect(() => {
    const nextKey = serializeFilters(filters).toString();
    if (nextKey === lastSyncedKey.current) return;

    const timer = window.setTimeout(() => {
      lastSyncedKey.current = nextKey;
      const { pathname, hash } = window.location;
      window.history.replaceState(null, '', `${pathname}${nextKey ? `?${nextKey}` : ''}${hash}`);
    }, URL_WRITE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [filters]);
}
