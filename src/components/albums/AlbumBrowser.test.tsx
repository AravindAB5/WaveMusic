import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { selectFilters } from '@/features/filters/filtersSlice';
import { URL_WRITE_DELAY_MS } from '@/features/filters/useFiltersUrlSync';
import { albumSet } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import { AlbumBrowser } from './AlbumBrowser';

// Mirror the real address bar: Next's useSearchParams follows history.replaceState.
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const setUrl = (url: string) => window.history.replaceState(null, '', url);
const visibleTitles = () =>
  within(screen.getByRole('list', { name: 'Top albums' }))
    .getAllByRole('heading', { level: 2 })
    .map((h) => h.textContent);
const flushUrlWrite = () => act(() => jest.advanceTimersByTime(URL_WRITE_DELAY_MS));

beforeEach(() => {
  jest.useFakeTimers();
  setUrl('/');
});

afterEach(() => {
  jest.useRealTimers();
});

const setup = () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const view = renderWithProviders(<AlbumBrowser albums={albumSet} />);
  return { user, ...view };
};

describe('AlbumBrowser', () => {
  it('shows every album and the total count by default', () => {
    setup();
    expect(visibleTitles()).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent('Showing all 5 albums');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('restores filters from the URL on the first render (shareable links)', () => {
    setUrl('/?genre=Country&sort=oldest');
    const { store } = setup();

    expect(selectFilters(store.getState())).toEqual({ query: '', genre: 'Country', sort: 'oldest', favoritesOnly: false });
    expect(screen.getByLabelText('Genre')).toHaveValue('Country');
    expect(screen.getByLabelText('Sort by')).toHaveValue('oldest');
    expect(visibleTitles()).toEqual(['Cowboy Carter', 'Grateful']);
    expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 5 albums');
  });

  it('filters as you type and writes the URL after a short debounce', async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText('Search'), 'beyonce');
    expect(visibleTitles()).toEqual(['Cowboy Carter']);
    expect(window.location.search).toBe(''); // not yet: debounced

    flushUrlWrite();
    expect(window.location.search).toBe('?q=beyonce');
  });

  it('batches rapid changes into a single history write', async () => {
    const replaceState = jest.spyOn(window.history, 'replaceState');
    const { user } = setup();

    await user.type(screen.getByLabelText('Search'), 'swift');
    flushUrlWrite();

    expect(replaceState).toHaveBeenCalledTimes(1);
    replaceState.mockRestore();
  });

  it('syncs genre and sort to the URL', async () => {
    const { user } = setup();

    await user.selectOptions(screen.getByLabelText('Genre'), 'R&B/Soul');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'newest');
    flushUrlWrite();

    expect(window.location.search).toBe('?genre=R%26B%2FSoul&sort=newest');
  });

  it('lists genres with counts', () => {
    setup();
    const options = within(screen.getByLabelText('Genre')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['All genres (5)', 'Country (2)', 'Pop (1)', 'R&B/Soul (1)', 'Rock (1)']);
  });

  it('canonicalizes a messy URL (invalid sort, empty query)', () => {
    setUrl('/?q=&sort=bogus&genre=Rock');
    setup();
    flushUrlWrite();
    expect(window.location.search).toBe('?genre=Rock');
  });

  it('follows URL changes made from outside, e.g. a link back to "/"', () => {
    setUrl('/?genre=Rock');
    const { rerender, store } = setup();
    expect(visibleTitles()).toEqual(['abbey road']);

    act(() => setUrl('/'));
    rerender(<AlbumBrowser albums={albumSet} />);

    expect(selectFilters(store.getState()).genre).toBeNull();
    expect(visibleTitles()).toHaveLength(5);
    flushUrlWrite();
    expect(window.location.search).toBe(''); // no echo back to the old URL
  });

  it('shows a no-results state that clears all filters', async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText('Search'), 'zzz');
    expect(screen.queryByRole('list', { name: 'Top albums' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 0 of 5 albums');

    const panel = screen.getByRole('region', { name: 'No albums match' });
    await user.click(within(panel).getByRole('button', { name: 'Clear filters' }));

    expect(visibleTitles()).toHaveLength(5);
    expect(screen.getByLabelText('Search')).toHaveValue('');
    flushUrlWrite();
    expect(window.location.search).toBe('');
  });

  it('keeps a stale genre from the URL selectable and offers to clear it', () => {
    setUrl('/?genre=Polka');
    setup();
    expect(screen.getByLabelText('Genre')).toHaveValue('Polka');
    expect(screen.getByRole('option', { name: 'Polka (0)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No albums match' })).toBeInTheDocument();
  });

  it('renders only the empty-chart state when the feed is empty', () => {
    renderWithProviders(<AlbumBrowser albums={[]} />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No albums right now' })).toBeInTheDocument();
  });
});
