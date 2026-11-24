import { screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { getTopAlbums } from '@/lib/itunes/fetchTopAlbums';
import { useGetAlbumLookupQuery } from '@/store/itunesApi';
import { albumSet } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import AlbumPage, { generateMetadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
jest.mock('@/lib/itunes/fetchTopAlbums', () => ({ getTopAlbums: jest.fn() }));
jest.mock('@/store/itunesApi', () => ({
  ...jest.requireActual('@/store/itunesApi'),
  useGetAlbumLookupQuery: jest.fn(),
}));

const getTopAlbumsMock = jest.mocked(getTopAlbums);
const [charting] = albumSet;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.mocked(useGetAlbumLookupQuery).mockReturnValue({
    data: undefined,
    error: undefined,
    isFetching: true,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useGetAlbumLookupQuery>);
  getTopAlbumsMock.mockResolvedValue({ albums: albumSet, updatedAt: null, skipped: [] });
});

describe('album page (server component)', () => {
  it.each(['abc', '12a', '../etc', ''])('404s for a non-numeric id %p', async (id) => {
    await expect(AlbumPage(params(id))).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('renders the chart entry in the server HTML while tracks load', async () => {
    renderWithProviders(await AlbumPage(params(charting!.id)));
    expect(screen.getByRole('heading', { level: 1, name: charting!.title })).toBeInTheDocument();
  });

  it('still renders (from the lookup) when the chart feed is down', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    getTopAlbumsMock.mockRejectedValue(new Error('feed down'));

    renderWithProviders(await AlbumPage(params(charting!.id)));

    expect(screen.getByRole('status')).toHaveTextContent('Loading album…');
    warn.mockRestore();
  });

  it('titles the page from the chart entry', async () => {
    const metadata = await generateMetadata(params(charting!.id));
    expect(metadata.title).toBe(`${charting!.title} — ${charting!.artist} | WaveMusic`);
  });

  it('uses a generic title for albums not in the chart', async () => {
    expect((await generateMetadata(params('42'))).title).toBe('Album — WaveMusic');
  });
});
