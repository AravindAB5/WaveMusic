import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { albumSet } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import { FavoriteButton } from './FavoriteButton';
import { favoritesLoaded, favoritesSlice, selectIsFavorite } from './favoritesSlice';

const album = albumSet[0]!;

/** As in the app, where StoreProvider loads favorites from storage on mount. */
const loaded = { favorites: favoritesSlice.reducer(undefined, favoritesLoaded([])) };

afterEach(() => {
  window.localStorage.clear();
});

describe('FavoriteButton', () => {
  it('is a named toggle button that reflects and flips the favorite state', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<FavoriteButton album={album} />, { preloadedState: loaded });

    const button = screen.getByRole('button', { name: `Favorite ${album.title}` });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(selectIsFavorite(store.getState(), album.id)).toBe(true);

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('works from the keyboard', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<FavoriteButton album={album} />, { preloadedState: loaded });

    await user.tab();
    await user.keyboard('{Enter}');
    expect(selectIsFavorite(store.getState(), album.id)).toBe(true);
    await user.keyboard(' ');
    expect(selectIsFavorite(store.getState(), album.id)).toBe(false);
  });

  it('renders unpressed while favorites are not marked as loaded', () => {
    // The album is in the store, but the loaded flag is off (the server's view).
    const withFavorite = favoritesSlice.reducer(
      undefined,
      favoritesLoaded([{ album, addedAt: '2026-11-24T00:00:00.000Z' }]),
    );
    renderWithProviders(<FavoriteButton album={album} />, {
      preloadedState: { favorites: { ...withFavorite, hydrated: false } },
    });
    expect(screen.getByRole('button', { name: `Favorite ${album.title}` })).toHaveAttribute('aria-pressed', 'false');
  });
});
