import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { COLOR_SCHEME_STORAGE_KEY } from '@/styles/colorScheme';
import { renderWithProviders } from '@/test/render';
import { ThemeToggle } from './ThemeToggle';

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('starts from the stored scheme and offers the opposite', async () => {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    renderWithProviders(<ThemeToggle />);
    expect(await screen.findByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });

  it('toggles data-theme and persists the choice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(await screen.findByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('light');
  });
});
