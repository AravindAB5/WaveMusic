import { act, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { FiltersBar } from '@/features/filters/FiltersBar';
import { makeStore, type AppStore } from '@/store/store';
import { theme } from '@/styles/theme';
import { albumSet } from '@/test/factories';
import { FavoriteButton } from './FavoriteButton';
import { favoritesLoaded } from './favoritesSlice';

const album = albumSet[0]!;

const app = (store: AppStore): ReactElement => (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <FiltersBar genres={[{ genre: 'Pop', count: 1 }]} totalCount={1} />
      <FavoriteButton album={album} />
    </ThemeProvider>
  </Provider>
);

afterEach(() => {
  document.body.innerHTML = '';
  window.localStorage.clear();
});

/**
 * Regression: with streaming, React can hydrate the root layout and run
 * StoreProvider's effect (which loads favorites from localStorage) before it
 * hydrates the page's Suspense boundary. Components there must still render
 * the server's view during their own hydration, or React throws
 * "Hydration failed because the server rendered HTML didn't match the client".
 */
describe('favorites and hydration', () => {
  it('hydrates without a mismatch even if favorites loaded before this subtree hydrated', async () => {
    // Server: nothing from localStorage.
    const container = document.createElement('div');
    container.innerHTML = renderToString(app(makeStore()));
    document.body.appendChild(container);

    // Client: favorites already loaded by the time this subtree hydrates.
    const clientStore = makeStore();
    clientStore.dispatch(favoritesLoaded([{ album, addedAt: '2026-11-24T00:00:00.000Z' }]));

    const onRecoverableError = jest.fn();
    await act(async () => {
      hydrateRoot(container, app(clientStore), { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();

    // Right after hydration the real values appear.
    expect(screen.getByRole('button', { name: 'Favorites (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Favorite ${album.title}` })).toHaveAttribute('aria-pressed', 'true');
  });
});
