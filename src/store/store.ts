import { combineSlices, configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  favoriteRemoved,
  favoritesSlice,
  favoriteToggled,
  selectAllFavorites,
} from '@/features/favorites/favoritesSlice';
import { saveFavorites } from '@/features/favorites/storage';
import { filtersSlice } from '@/features/filters/filtersSlice';

/** The player and the RTK Query API slice join here in later steps. */
export const rootReducer = combineSlices(filtersSlice, favoritesSlice);

export type RootState = ReturnType<typeof rootReducer>;

/**
 * A factory, not a singleton: on the server each request must get its own
 * store, or one visitor's state would leak into another's render.
 */
export const makeStore = (preloadedState?: Partial<RootState>) => {
  const listener = createListenerMiddleware();

  // Persist favorites after user changes only. `favoritesLoaded` is excluded:
  // writing back what was just read is pointless, and for a cross-tab update
  // it would fire another storage event in the other tab.
  listener.startListening({
    matcher: isAnyOf(favoriteToggled, favoriteRemoved),
    effect: (_action, api) => saveFavorites(selectAllFavorites(api.getState() as RootState)),
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listener.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
