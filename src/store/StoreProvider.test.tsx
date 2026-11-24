import { act, render, screen } from '@testing-library/react';
import {
  favoritesLoaded,
  favoriteToggled,
  selectFavoriteCount,
  selectFavoritesHydrated,
} from '@/features/favorites/favoritesSlice';
import { FAVORITES_STORAGE_KEY, loadFavorites, saveFavorites } from '@/features/favorites/storage';
import { albumSet } from '@/test/factories';
import { useAppDispatch, useAppSelector } from './hooks';
import { makeStore } from './store';
import { StoreProvider } from './StoreProvider';

const [first, second] = albumSet as [(typeof albumSet)[0], (typeof albumSet)[0]];

afterEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('favorites persistence (store middleware)', () => {
  it('saves after a user toggles a favorite', () => {
    const store = makeStore();
    store.dispatch(favoriteToggled(first));
    expect(loadFavorites().map((f) => f.album.id)).toEqual([first.id]);

    store.dispatch(favoriteToggled(first));
    expect(loadFavorites()).toEqual([]);
  });

  it('does not write back when favorites are loaded from storage', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    makeStore().dispatch(favoritesLoaded([]));
    expect(setItem).not.toHaveBeenCalled();
  });
});

function Probe() {
  const count = useAppSelector(selectFavoriteCount);
  const hydrated = useAppSelector(selectFavoritesHydrated);
  const dispatch = useAppDispatch();
  return (
    <>
      <p>{hydrated ? `${count} favorites` : 'loading'}</p>
      <button type="button" onClick={() => dispatch(favoriteToggled(second))}>
        toggle
      </button>
    </>
  );
}

describe('StoreProvider favorites sync', () => {
  it('loads saved favorites after mount', () => {
    saveFavorites([{ album: first, addedAt: '2026-11-24T00:00:00.000Z' }]);
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    expect(screen.getByText('1 favorites')).toBeInTheDocument();
  });

  it('picks up changes made in another tab', () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    expect(screen.getByText('0 favorites')).toBeInTheDocument();

    // Simulate another tab: write storage directly, then fire the storage event.
    saveFavorites([
      { album: first, addedAt: '2026-11-24T00:00:00.000Z' },
      { album: second, addedAt: '2026-11-24T00:00:01.000Z' },
    ]);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_STORAGE_KEY }));
    });

    expect(screen.getByText('2 favorites')).toBeInTheDocument();
  });

  it('ignores storage events for unrelated keys', () => {
    render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    saveFavorites([{ album: first, addedAt: '2026-11-24T00:00:00.000Z' }]);
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'wm-theme' }));
    });
    expect(screen.getByText('0 favorites')).toBeInTheDocument();
  });

  it('stops listening after unmount', () => {
    const remove = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );
    unmount();
    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
