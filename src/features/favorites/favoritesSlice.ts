import { createEntityAdapter, createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit';
import type { Album } from '@/types/album';

/**
 * A favorite keeps a full snapshot of the album, not just its id: the chart
 * changes daily, and a favorite that drops out of it should still be
 * listable rather than silently vanish.
 */
export interface FavoriteEntry {
  album: Album;
  /** ISO timestamp; favorites list newest first. */
  addedAt: string;
}

const favoritesAdapter = createEntityAdapter({
  selectId: (entry: FavoriteEntry) => entry.album.id,
  sortComparer: (a, b) => b.addedAt.localeCompare(a.addedAt),
});

export interface FavoritesState extends EntityState<FavoriteEntry, string> {
  /**
   * False until favorites have been read from storage. The server render
   * never has them, so views that depend on them (favorites-only) can show
   * a placeholder instead of a misleading "no favorites" flash.
   */
  hydrated: boolean;
}

const initialState: FavoritesState = favoritesAdapter.getInitialState({ hydrated: false });

const adapterSelectors = favoritesAdapter.getSelectors();

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    favoriteToggled: {
      reducer(state, action: PayloadAction<FavoriteEntry>) {
        const { id } = action.payload.album;
        if (state.entities[id]) favoritesAdapter.removeOne(state, id);
        else favoritesAdapter.addOne(state, action.payload);
      },
      // The timestamp is taken here, not in the reducer, so reducers stay pure.
      prepare(album: Album) {
        return { payload: { album, addedAt: new Date().toISOString() } };
      },
    },
    favoriteRemoved(state, action: PayloadAction<string>) {
      favoritesAdapter.removeOne(state, action.payload);
    },
    /** Replaces all favorites with what was read from storage (initial load or another tab). */
    favoritesLoaded(state, action: PayloadAction<FavoriteEntry[]>) {
      favoritesAdapter.setAll(state, action.payload);
      state.hydrated = true;
    },
  },
  selectors: {
    selectAllFavorites: adapterSelectors.selectAll,
    selectFavoriteIds: adapterSelectors.selectIds,
    selectFavoriteCount: adapterSelectors.selectTotal,
    selectIsFavorite: (state, id: string) => id in state.entities,
    selectFavoritesHydrated: (state) => state.hydrated,
  },
});

export const { favoriteToggled, favoriteRemoved, favoritesLoaded } = favoritesSlice.actions;
export const {
  selectAllFavorites,
  selectFavoriteIds,
  selectFavoriteCount,
  selectIsFavorite,
  selectFavoritesHydrated,
} = favoritesSlice.selectors;
