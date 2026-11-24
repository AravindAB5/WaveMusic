'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while this component is being hydrated from server HTML, true
 * afterwards, and true straight away for components that mount on the client
 * (e.g. after a client-side navigation), so those don't flash.
 *
 * Use it to gate anything that depends on client-only state (localStorage,
 * etc.). Note that a store-level "loaded" flag is not enough on its own: with
 * streaming, React can hydrate the root layout and run its effects (which load
 * that state) before it hydrates a later Suspense boundary, so that boundary
 * would see loaded data the server never rendered.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
