import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  favoritesLoaded,
  favoritesSlice,
  selectFavoriteIds,
  type FavoriteEntry,
} from '@/features/favorites/favoritesSlice';
import { URL_WRITE_DELAY_MS } from '@/features/filters/useFiltersUrlSync';
import { albumSet, makeAlbum } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import { AlbumBrowser } from './AlbumBrowser';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const [taylor, clay, beyonce] = albumSet as [(typeof albumSet)[0], (typeof albumSet)[0], (typeof albumSet)[0]];
const dropped = makeAlbum({ id: '99', rank: 7, title: 'Yesterday’s Hit', artist: 'Old Band', genre: 'Rock' });

const entry = (album: typeof taylor, addedAt: string): FavoriteEntry => ({ album, addedAt });

/** Favorites state as if already read from storage. */
const loadedFavorites = (entries: FavoriteEntry[]) => ({
  favorites: favoritesSlice.reducer(undefined, favoritesLoaded(entries)),
});

const titlesIn = (listName: string, level: 2 | 3 = 2) =>
  within(screen.getByRole('list', { name: listName }))
    .getAllByRole('heading', { level })
    .map((h) => h.textContent);

beforeEach(() => {
  jest.useFakeTimers();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
});

describe('AlbumBrowser favorites', () => {
  it('favorites an album from its card and shows the count on the toggle', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { store } = renderWithProviders(<AlbumBrowser albums={albumSet} />, {
      preloadedState: loadedFavorites([]),
    });

    await user.click(screen.getByRole('button', { name: `Favorite ${clay.title}` }));

    expect(selectFavoriteIds(store.getState())).toEqual([clay.id]);
    expect(screen.getByRole('button', { name: 'Favorites 1' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows only favorites when toggled, and records it in the URL', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders(<AlbumBrowser albums={albumSet} />, {
      preloadedState: loadedFavorites([
        entry(beyonce, '2026-11-20T00:00:00.000Z'),
        entry(taylor, '2026-11-21T00:00:00.000Z'),
      ]),
    });

    await user.click(screen.getByRole('button', { name: 'Favorites 2' }));

    expect(screen.getByRole('button', { name: 'Favorites 2' })).toHaveAttribute('aria-pressed', 'true');
    // Chart order (default sort), not favorited order.
    expect(titlesIn('Top albums')).toEqual([taylor.title, beyonce.title]);
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 2 favorites');

    act(() => jest.advanceTimersByTime(URL_WRITE_DELAY_MS));
    expect(window.location.search).toBe('?favorites=1');
  });

  it('combines favorites-only with search', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    window.history.replaceState(null, '', '/?favorites=1');
    renderWithProviders(<AlbumBrowser albums={albumSet} />, {
      preloadedState: loadedFavorites([
        entry(beyonce, '2026-11-20T00:00:00.000Z'),
        entry(taylor, '2026-11-21T00:00:00.000Z'),
      ]),
    });

    await user.type(screen.getByLabelText('Search'), 'beyonce');

    expect(titlesIn('Top albums')).toEqual([beyonce.title]);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 2 favorites');
  });

  it('shows a placeholder, not "no favorites", until storage has been read', () => {
    window.history.replaceState(null, '', '/?favorites=1');
    const { store } = renderWithProviders(<AlbumBrowser albums={albumSet} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading top albums…');
    expect(screen.queryByText('No favorites yet')).not.toBeInTheDocument();
    // The count is unknown before hydration, so the toggle doesn't claim 0.
    expect(screen.getByRole('button', { name: 'Favorites' })).toBeInTheDocument();

    act(() => {
      store.dispatch(favoritesLoaded([entry(clay, '2026-11-20T00:00:00.000Z')]));
    });
    expect(titlesIn('Top albums')).toEqual([clay.title]);
  });

  it('explains how to add favorites when there are none', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    window.history.replaceState(null, '', '/?favorites=1');
    renderWithProviders(<AlbumBrowser albums={albumSet} />, { preloadedState: loadedFavorites([]) });

    expect(screen.getByRole('heading', { name: 'No favorites yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Browse all albums' }));

    expect(titlesIn('Top albums')).toHaveLength(albumSet.length);
  });

  it('lists favorites that left the chart in their own section, without a stale rank', () => {
    window.history.replaceState(null, '', '/?favorites=1');
    renderWithProviders(<AlbumBrowser albums={albumSet} />, {
      preloadedState: loadedFavorites([
        entry(dropped, '2026-11-01T00:00:00.000Z'),
        entry(taylor, '2026-11-02T00:00:00.000Z'),
      ]),
    });

    expect(titlesIn('Top albums')).toEqual([taylor.title]);

    const section = screen.getByRole('region', { name: 'No longer in the chart' });
    expect(within(section).getByRole('heading', { level: 3, name: dropped.title })).toBeInTheDocument();
    expect(section).not.toHaveTextContent(/Rank/);
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 2 favorites');
  });

  it('applies search to off-chart favorites too', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    window.history.replaceState(null, '', '/?favorites=1');
    renderWithProviders(<AlbumBrowser albums={albumSet} />, {
      preloadedState: loadedFavorites([
        entry(dropped, '2026-11-01T00:00:00.000Z'),
        entry(taylor, '2026-11-02T00:00:00.000Z'),
      ]),
    });

    await user.type(screen.getByLabelText('Search'), 'old band');

    expect(screen.queryByRole('list', { name: 'Top albums' })).not.toBeInTheDocument();
    expect(titlesIn('Favorites no longer in the chart', 3)).toEqual([dropped.title]);
    expect(screen.queryByRole('heading', { name: 'No albums match' })).not.toBeInTheDocument();
  });

  it('uses fresh chart data rather than the saved snapshot for albums still charting', () => {
    window.history.replaceState(null, '', '/?favorites=1');
    const staleSnapshot = { ...clay, title: 'Old Title', rank: 40 };
    renderWithProviders(<AlbumBrowser albums={albumSet} />, {
      preloadedState: loadedFavorites([entry(staleSnapshot, '2026-11-01T00:00:00.000Z')]),
    });

    expect(titlesIn('Top albums')).toEqual([clay.title]);
    expect(screen.queryByRole('region', { name: 'No longer in the chart' })).not.toBeInTheDocument();
  });
});
