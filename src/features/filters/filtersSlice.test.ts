/** @jest-environment node */
import { makeStore } from '@/store/store';
import {
  favoritesOnlyToggled,
  filtersHydrated,
  filtersReset,
  genreChanged,
  initialFiltersState,
  isSortKey,
  MAX_QUERY_LENGTH,
  queryChanged,
  selectFilters,
  selectHasActiveFilters,
  sortChanged,
} from './filtersSlice';

describe('filtersSlice', () => {
  it('starts with no filters, sorted by chart position', () => {
    expect(selectFilters(makeStore().getState())).toEqual({ query: '', genre: null, sort: 'rank', favoritesOnly: false });
  });

  it('updates each filter independently', () => {
    const store = makeStore();
    store.dispatch(queryChanged('swift'));
    store.dispatch(genreChanged('Pop'));
    store.dispatch(sortChanged('newest'));
    store.dispatch(favoritesOnlyToggled());
    expect(selectFilters(store.getState())).toEqual({
      query: 'swift',
      genre: 'Pop',
      sort: 'newest',
      favoritesOnly: true,
    });
    store.dispatch(favoritesOnlyToggled());
    expect(selectFilters(store.getState()).favoritesOnly).toBe(false);
  });

  it('keeps the query as typed but caps its length', () => {
    const store = makeStore();
    store.dispatch(queryChanged('  two words '));
    expect(selectFilters(store.getState()).query).toBe('  two words ');
    store.dispatch(queryChanged('x'.repeat(MAX_QUERY_LENGTH + 50)));
    expect(selectFilters(store.getState()).query).toHaveLength(MAX_QUERY_LENGTH);
  });

  it('treats an empty genre as "all genres"', () => {
    const store = makeStore({ filters: { ...initialFiltersState, genre: 'Pop' } });
    store.dispatch(genreChanged(''));
    expect(selectFilters(store.getState()).genre).toBeNull();
  });

  it('resets everything', () => {
    const store = makeStore({ filters: { query: 'a', genre: 'Pop', sort: 'title', favoritesOnly: true } });
    store.dispatch(filtersReset());
    expect(selectFilters(store.getState())).toEqual(initialFiltersState);
  });

  it('hydrates all filters at once and keeps state identity when nothing changed', () => {
    const store = makeStore();
    store.dispatch(filtersHydrated({ query: 'q', genre: 'Rock', sort: 'oldest', favoritesOnly: true }));
    const before = store.getState().filters;
    store.dispatch(filtersHydrated({ query: 'q', genre: 'Rock', sort: 'oldest', favoritesOnly: true }));
    expect(store.getState().filters).toBe(before);
  });

  it.each([
    [{ query: '', genre: null, sort: 'rank' }, false],
    [{ query: '   ', genre: null, sort: 'rank' }, false],
    [{ query: 'a', genre: null, sort: 'rank' }, true],
    [{ query: '', genre: 'Pop', sort: 'rank' }, true],
    [{ query: '', genre: null, sort: 'title' }, true],
    [{ query: '', genre: null, sort: 'rank', favoritesOnly: true }, true],
  ] as const)('selectHasActiveFilters(%j) → %s', (filters, expected) => {
    expect(selectHasActiveFilters(makeStore({ filters: { ...initialFiltersState, ...filters } }).getState())).toBe(expected);
  });

  it('validates sort keys', () => {
    expect(isSortKey('newest')).toBe(true);
    expect(isSortKey('price')).toBe(false);
    expect(isSortKey(undefined)).toBe(false);
  });
});
