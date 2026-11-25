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
/** Genre chips are toggle buttons named "<genre> <count>". */
const genreChips = () => within(screen.getByRole('group', { name: 'Genre' })).getAllByRole('button');
const genreChip = (genre: string) => {
  const chip = genreChips().find((button) => button.textContent?.replace(/ \d+$/, '') === genre);
  if (!chip) throw new Error(`No genre chip for ${genre}`);
  return chip;
};

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
    // Nothing to clear yet, so no "Clear filters" control.
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(genreChip('All')).toHaveAttribute('aria-pressed', 'true');
  });

  it('restores filters from the URL on the first render (shareable links)', () => {
    setUrl('/?genre=Country&sort=oldest');
    const { store } = setup();

    expect(selectFilters(store.getState())).toEqual({ query: '', genre: 'Country', sort: 'oldest', favoritesOnly: false });
    expect(genreChip('Country')).toHaveAttribute('aria-pressed', 'true');
    expect(genreChip('All')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveTextContent('Oldest first');
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

    await user.click(genreChip('R&B/Soul'));
    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(screen.getByRole('option', { name: 'Newest first' }));
    flushUrlWrite();

    expect(window.location.search).toBe('?genre=R%26B%2FSoul&sort=newest');
  });

  it('lists genres as chips with counts', () => {
    setup();
    expect(genreChips().map((chip) => chip.textContent)).toEqual(['All 5', 'Country 2', 'Pop 1', 'R&B/Soul 1', 'Rock 1']);
  });

  it('toggles a genre chip off again, back to all genres', async () => {
    const { user, store } = setup();
    await user.click(genreChip('Rock'));
    expect(selectFilters(store.getState()).genre).toBe('Rock');
    await user.click(genreChip('Rock'));
    expect(selectFilters(store.getState()).genre).toBeNull();
    expect(genreChip('All')).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers "Clear filters" once something is filtered', async () => {
    const { user } = setup();
    await user.click(genreChip('Pop'));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(visibleTitles()).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
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
    expect(genreChip('Polka')).toHaveAttribute('aria-pressed', 'true');
    expect(genreChip('Polka')).toHaveTextContent('Polka 0');
    expect(screen.getByRole('heading', { name: 'No albums match' })).toBeInTheDocument();
  });

  it('renders only the empty-chart state when the feed is empty', () => {
    renderWithProviders(<AlbumBrowser albums={[]} />);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No albums right now' })).toBeInTheDocument();
  });
});
