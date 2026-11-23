import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Top Albums' })).toBeInTheDocument();
  });
});
