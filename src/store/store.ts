import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { filtersSlice } from '@/features/filters/filtersSlice';

/** Favorites, player and the RTK Query API slice join here in later steps. */
export const rootReducer = combineSlices(filtersSlice);

export type RootState = ReturnType<typeof rootReducer>;

/**
 * A factory, not a singleton: on the server each request must get its own
 * store, or one visitor's state would leak into another's render.
 */
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({ reducer: rootReducer, preloadedState });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
