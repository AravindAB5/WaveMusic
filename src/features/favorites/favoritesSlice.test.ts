/** @jest-environment node */
import { makeStore } from '@/store/store';
import { albumSet } from '@/test/factories';
import {
  favoriteRemoved,
  favoritesLoaded,
  favoriteToggled,
  selectAllFavorites,
  selectFavoriteCount,
  selectFavoriteIds,
  selectFavoritesHydrated,
  selectIsFavorite,
} from './favoritesSlice';

const [taylor, clay, beyonce] = albumSet as [(typeof albumSet)[0], (typeof albumSet)[0], (typeof albumSet)[0]];

afterEach(() => {
  jest.useRealTimers();
});

describe('favoritesSlice', () => {
  it('starts empty and not yet hydrated from storage', () => {
    const state = makeStore().getState();
    expect(selectFavoriteCount(state)).toBe(0);
    expect(selectFavoritesHydrated(state)).toBe(false);
  });

  it('toggles a favorite on with a timestamp, then off', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-24T10:00:00Z'));
    const store = makeStore();

    store.dispatch(favoriteToggled(taylor));
    expect(selectIsFavorite(store.getState(), taylor.id)).toBe(true);
    expect(selectAllFavorites(store.getState())).toEqual([
      { album: taylor, addedAt: '2026-11-24T10:00:00.000Z' },
    ]);

    store.dispatch(favoriteToggled(taylor));
    expect(selectIsFavorite(store.getState(), taylor.id)).toBe(false);
    expect(selectFavoriteCount(store.getState())).toBe(0);
  });

  it('lists favorites newest first', () => {
    jest.useFakeTimers();
    const store = makeStore();
    for (const album of [taylor, clay, beyonce]) {
      jest.advanceTimersByTime(1000);
      store.dispatch(favoriteToggled(album));
    }
    expect(selectFavoriteIds(store.getState())).toEqual([beyonce.id, clay.id, taylor.id]);
  });

  it('removes by id', () => {
    const store = makeStore();
    store.dispatch(favoriteToggled(taylor));
    store.dispatch(favoriteRemoved(taylor.id));
    expect(selectFavoriteCount(store.getState())).toBe(0);
  });

  it('replaces everything on load and marks itself hydrated', () => {
    const store = makeStore();
    store.dispatch(favoriteToggled(taylor));
    store.dispatch(favoritesLoaded([{ album: clay, addedAt: '2026-01-01T00:00:00.000Z' }]));

    expect(selectFavoriteIds(store.getState())).toEqual([clay.id]);
    expect(selectFavoritesHydrated(store.getState())).toBe(true);
  });
});
