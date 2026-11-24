import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useSearchParams } from 'next/navigation';
import { favoritesLoaded, favoritesSlice } from '@/features/favorites/favoritesSlice';
import { albumSet } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import { AppShell } from './AppShell';
import { PageContainer } from './PageContainer';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const setRoute = (pathname: string, search = '') => {
  jest.mocked(usePathname).mockReturnValue(pathname);
  jest.mocked(useSearchParams).mockReturnValue(new URLSearchParams(search) as ReturnType<typeof useSearchParams>);
};

const renderShell = (preloadedState = {}) =>
  renderWithProviders(
    <AppShell>
      <PageContainer>
        <h1>Page</h1>
      </PageContainer>
    </AppShell>,
    { preloadedState },
  );

afterEach(() => {
  setRoute('/');
  window.localStorage.clear();
});

describe('AppShell', () => {
  it('starts with a skip link that moves focus to the main content', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main');

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    // Focusable programmatically (so the skip link moves focus), not in the tab order.
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('has one labelled main navigation with home, favorites and a theme switch', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Top Albums' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: /^Favorites/ })).toHaveAttribute('href', '/?favorites=1');
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Switch to (dark|light) theme/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WaveMusic home' })).toHaveAttribute('href', '/');
  });

  it.each([
    ['/', '', 'Top Albums'],
    ['/', 'favorites=1', /^Favorites/],
  ] as const)('marks the current section for %s?%s', (pathname, search, current) => {
    setRoute(pathname, search);
    renderShell();
    expect(screen.getByRole('link', { name: current })).toHaveAttribute('aria-current', 'page');
  });

  it('marks nothing current on an album page', () => {
    setRoute('/album/123');
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    within(nav)
      .getAllByRole('link')
      .forEach((link) => expect(link).not.toHaveAttribute('aria-current'));
  });

  it('shows how many favorites are saved, once loaded', () => {
    renderShell({
      favorites: favoritesSlice.reducer(
        undefined,
        favoritesLoaded(albumSet.slice(0, 2).map((album) => ({ album, addedAt: '2026-11-24T00:00:00.000Z' }))),
      ),
    });
    expect(screen.getByLabelText('2 saved')).toHaveTextContent('2');
  });
});
