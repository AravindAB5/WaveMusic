import { screen } from '@testing-library/react';
import { getTopAlbums } from '@/lib/itunes/fetchTopAlbums';
import { sampleFeed } from '@/lib/itunes/__fixtures__/feed';
import { parseTopAlbumsFeed } from '@/lib/itunes/mapFeed';
import { renderWithProviders } from '@/test/render';
import HomePage from './page';

jest.mock('next/server', () => ({ connection: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/itunes/fetchTopAlbums', () => ({ getTopAlbums: jest.fn() }));

const getTopAlbumsMock = jest.mocked(getTopAlbums);

describe('HomePage (server component)', () => {
  it('renders the heading, album count and grid from the feed', async () => {
    const feed = parseTopAlbumsFeed(sampleFeed);
    getTopAlbumsMock.mockResolvedValue(feed);

    renderWithProviders(await HomePage());

    expect(screen.getByRole('heading', { level: 1, name: 'Top Albums' })).toBeInTheDocument();
    expect(screen.getByText('The 3 most popular albums on iTunes right now.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the empty state when the feed has no albums', async () => {
    getTopAlbumsMock.mockResolvedValue({ albums: [], updatedAt: null, skipped: [] });

    renderWithProviders(await HomePage());

    expect(screen.getByRole('heading', { name: 'No albums right now' })).toBeInTheDocument();
  });

  it('lets feed errors propagate to the error boundary', async () => {
    getTopAlbumsMock.mockRejectedValue(new Error('feed down'));
    await expect(HomePage()).rejects.toThrow('feed down');
  });
});
