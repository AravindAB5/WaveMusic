import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const SORT_KEYS = ['rank', 'title', 'artist', 'newest', 'oldest'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABELS: Readonly<Record<SortKey, string>> = {
  rank: 'Chart position',
  title: 'Title (A–Z)',
  artist: 'Artist (A–Z)',
  newest: 'Newest first',
  oldest: 'Oldest first',
};

export const isSortKey = (value: unknown): value is SortKey =>
  typeof value === 'string' && (SORT_KEYS as readonly string[]).includes(value);

/** Longest search string we keep; anything longer is truncated. */
export const MAX_QUERY_LENGTH = 100;

export interface FiltersState {
  /** Raw search text as typed (trimmed only when matching / serializing). */
  query: string;
  /** Genre label from the feed, e.g. "Pop"; null means all genres. */
  genre: string | null;
  sort: SortKey;
  /** Show only favorited albums. */
  favoritesOnly: boolean;
}

export const initialFiltersState: FiltersState = {
  query: '',
  genre: null,
  sort: 'rank',
  favoritesOnly: false,
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState: initialFiltersState,
  reducers: {
    queryChanged(state, action: PayloadAction<string>) {
      state.query = action.payload.slice(0, MAX_QUERY_LENGTH);
    },
    genreChanged(state, action: PayloadAction<string | null>) {
      state.genre = action.payload || null;
    },
    sortChanged(state, action: PayloadAction<SortKey>) {
      state.sort = action.payload;
    },
    favoritesOnlyToggled(state) {
      state.favoritesOnly = !state.favoritesOnly;
    },
    filtersReset() {
      return initialFiltersState;
    },
    /** Replace all filters at once, e.g. from the URL. Unchanged fields keep identity. */
    filtersHydrated(state, action: PayloadAction<FiltersState>) {
      state.query = action.payload.query.slice(0, MAX_QUERY_LENGTH);
      state.genre = action.payload.genre || null;
      state.sort = action.payload.sort;
      state.favoritesOnly = action.payload.favoritesOnly;
    },
  },
  selectors: {
    selectFilters: (state) => state,
    selectHasActiveFilters: (state) =>
      state.query.trim() !== '' ||
      state.genre !== null ||
      state.sort !== initialFiltersState.sort ||
      state.favoritesOnly,
  },
});

export const { queryChanged, genreChanged, sortChanged, favoritesOnlyToggled, filtersReset, filtersHydrated } =
  filtersSlice.actions;
export const { selectFilters, selectHasActiveFilters } = filtersSlice.selectors;
